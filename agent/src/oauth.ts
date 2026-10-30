/**
 * OAuth sign-in for clients that cannot send a header, such as grok.com's custom
 * connectors. The gateway is its own authorization server (OAuth 2.1, authorization code
 * with PKCE): on the consent page the owner proves who they are once, with MCP_TOKEN, and
 * the client receives short-lived tokens instead of it.
 *
 * Codes and tokens are HMAC-signed with a key derived from MCP_TOKEN, so a restart keeps a
 * client connected and a new MCP_TOKEN disconnects every client at once. Only two things
 * live in memory and are lost on a restart: which codes were used, and the wrong-key count.
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { bearer, digest, json, readText } from "./http.js";
import { log } from "./log.js";

/** Where grok.com's custom connectors receive the code. xAI does not document it; several server operators report this exact string. */
export const GROK_REDIRECT = "https://grok.com/connectors-oauth-exchange-code/";

const SCOPE = "mcp";
const CODE_TTL_S = 2 * 60;
const ACCESS_TTL_S = 60 * 60;
const REFRESH_TTL_S = 30 * 24 * 60 * 60;
/** However often a client refreshes, the owner signs in again this long after consenting. */
const GRANT_TTL_S = 90 * 24 * 60 * 60;
const MAX_FORM = 16_384;
const MAX_TOKEN = 4096;
const MAX_CLIENT_ID = 200;
/** Measured percent-encoded, so that a state of any script fits back into the consent form. */
const MAX_STATE = 4096;
const MAX_FAILURES = 10;
const LOCKOUT_MS = 15 * 60_000;
const LOCAL = /^(localhost|127\.0\.0\.1)(:\d{1,5})?$/i;
const HOST = /^[a-z0-9.-]+(:\d{1,5})?$/i;
const VERIFIER = /^[A-Za-z0-9._~-]{43,128}$/;
/** A client_id the consent page shows as a name; anything else is free text from whoever made the link. */
const PLAIN_NAME = /^[A-Za-z0-9._-]{1,64}$/;
const METADATA = new Set(["/.well-known/oauth-authorization-server", "/.well-known/oauth-protected-resource", "/.well-known/oauth-protected-resource/mcp"]);

export type OAuthConfig = {
  /** MCP_TOKEN: the owner types it on the consent page, and the signing key is derived from it */
  secret: string;
  /** the exact addresses a code may be sent to; grok.com's when absent */
  redirectUris?: readonly string[];
  /** the gateway's public origin; without it, https on the request's Host */
  publicUrl?: string;
  /** test seam, in milliseconds */
  now?: () => number;
};

export type OAuth = {
  /** Answers the metadata and /oauth/* routes; false for any other path. */
  handle(req: IncomingMessage, res: ServerResponse, url: URL): Promise<boolean>;
  /** True for an unexpired access token this gateway signed. */
  accepts(header: string | undefined): boolean;
  /** The WWW-Authenticate value of a 401, pointing the client at the metadata. */
  wwwAuthenticate(req: IncomingMessage, presented: boolean): string;
};

type Kind = "code" | "access" | "refresh";
/** What a token carries: `at` is when the owner consented; `ru` and `cc` are in codes only. Times are in seconds. */
type Claims = { k: Kind; exp: number; at: number; cid: string; jti: string; ru?: string; cc?: string };
/** A checked authorization request. Its scope and resource are not kept: every token opens the same tools as MCP_TOKEN. */
type AuthRequest = { clientId: string; redirectUri: string; challenge: string; state: string };

/** https, or http on this machine, which only tests use. */
const secureOrLocal = (u: URL) => u.protocol === "https:" || (u.protocol === "http:" && LOCAL.test(u.host));

/** OAUTH_REDIRECT_URIS (comma-separated), or grok.com's address when unset. */
export function redirectUrisFrom(value: string | undefined): string[] {
  const list = value?.trim() ? value.split(",").map((s) => s.trim()).filter(Boolean) : [GROK_REDIRECT];
  for (const uri of list) {
    let u: URL;
    try {
      u = new URL(uri);
    } catch {
      throw new Error(`OAUTH_REDIRECT_URIS has something that is not an address: ${uri}`);
    }
    if (!secureOrLocal(u) || u.hash || u.username || u.password) throw new Error(`OAUTH_REDIRECT_URIS takes https addresses without a fragment or a login: ${uri}`);
    // the redirect re-parses the address, so "/a/../b" or an upper-case host would send codes somewhere the list does not say
    if (u.href !== uri) throw new Error(`OAUTH_REDIRECT_URIS takes addresses written the way a browser writes them; this one reads as ${u.href}: ${uri}`);
  }
  return list;
}

/** PUBLIC_URL: the gateway's own origin, for a proxy that does not pass the Host on. */
export function publicUrlFrom(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  let u: URL;
  try {
    u = new URL(value.trim());
  } catch {
    throw new Error(`PUBLIC_URL is not an address: ${value}`);
  }
  if (!secureOrLocal(u)) throw new Error("PUBLIC_URL must be an https address");
  if (u.pathname !== "/" || u.search || u.hash) throw new Error("PUBLIC_URL must be an origin only, like https://example.com");
  return u.origin;
}

const nonce = () => randomBytes(12).toString("base64url");
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Signs claims, and reads back only what it signed, of the kind asked for, before it expires. */
function signer(secret: string) {
  // a key of its own, so a signature never doubles as anything MCP_TOKEN itself is used for
  const key = createHmac("sha256", secret).update("aipulse-oauth-v1").digest();
  const mac = (body: string) => createHmac("sha256", key).update(body).digest("base64url");
  return {
    sign(claims: Claims): string {
      const body = Buffer.from(JSON.stringify(claims)).toString("base64url");
      return `${body}.${mac(body)}`;
    },
    verify(token: string, kind: Kind, nowSec: number): Claims | null {
      if (token.length > MAX_TOKEN) return null;
      const [body, sig, extra] = token.split(".");
      if (!body || !sig || extra !== undefined) return null;
      // compared as text: decoding base64 first would let several spellings pass for one signature
      const want = Buffer.from(mac(body));
      const got = Buffer.from(sig);
      if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
      let c: Partial<Claims> | null;
      try {
        c = JSON.parse(Buffer.from(body, "base64url").toString("utf-8")) as Partial<Claims> | null;
      } catch {
        return null;
      }
      if (c?.k !== kind || typeof c.exp !== "number" || c.exp <= nowSec || typeof c.at !== "number" || typeof c.cid !== "string" || typeof c.jti !== "string") return null;
      return c as Claims;
    },
  };
}

function pkceMatches(verifier: string, challenge: string): boolean {
  if (!VERIFIER.test(verifier)) return false;
  const got = Buffer.from(createHash("sha256").update(verifier).digest("base64url"));
  const want = Buffer.from(challenge);
  return got.length === want.length && timingSafeEqual(got, want);
}

/** Refuses every attempt for `ms` once `limit` attempts failed within `ms`. One count for everyone: a client's address can be forged. */
function lockout(limit: number, ms: number, now: () => number) {
  let failures: number[] = [];
  let until = 0;
  return {
    locked: () => now() < until,
    fail(): void {
      const t = now();
      failures = [...failures.filter((f) => t - f < ms), t];
      if (failures.length >= limit) {
        until = t + ms;
        failures = [];
      }
    },
    succeed(): void {
      failures = [];
    },
  };
}

/** The checks of an authorization request. The first two decide whether a code may be sent anywhere at all. */
function authRequest(p: URLSearchParams, allowed: readonly string[]): AuthRequest | { error: string } {
  const clientId = p.get("client_id") ?? "";
  const redirectUri = p.get("redirect_uri") ?? "";
  if (!clientId || clientId.length > MAX_CLIENT_ID) return { error: `client_id is missing or longer than ${MAX_CLIENT_ID} characters` };
  // the refused address is not repeated: anyone can put text there and send the owner the link
  if (!allowed.includes(redirectUri)) return { error: "redirect_uri is not on this gateway's list" };
  if (p.get("response_type") !== "code") return { error: "response_type must be code" };
  const challenge = p.get("code_challenge") ?? "";
  if (p.get("code_challenge_method") !== "S256" || !/^[A-Za-z0-9_-]{43}$/.test(challenge)) return { error: "a PKCE code_challenge with method S256 is required" };
  const state = p.get("state") ?? "";
  if (encodeURIComponent(state).length > MAX_STATE) return { error: "state is too long" };
  return { clientId, redirectUri, challenge, state };
}

const oauthError = (res: ServerResponse, error: string, description: string, status = 400) => json(res, status, { error, error_description: description }, { "cache-control": "no-store" });

/** The gateway's public origin: PUBLIC_URL, or https on the Host the request came to (http only on this machine). */
function originOf(req: IncomingMessage, publicUrl: string | undefined): string | null {
  if (publicUrl) return publicUrl;
  const host = (req.headers.host ?? "").toLowerCase();
  if (!HOST.test(host)) return null;
  try {
    // the pattern lets "name:99999" through, and only a parse sees that it is no address
    return new URL(`${LOCAL.test(host) ? "http" : "https"}://${host}`).origin;
  } catch {
    return null;
  }
}

/** RFC 8414: where to sign in, and how. */
const serverMetadata = (origin: string) => ({
  issuer: origin,
  authorization_endpoint: `${origin}/oauth/authorize`,
  token_endpoint: `${origin}/oauth/token`,
  response_types_supported: ["code"],
  grant_types_supported: ["authorization_code", "refresh_token"],
  code_challenge_methods_supported: ["S256"],
  token_endpoint_auth_methods_supported: ["none"],
  scopes_supported: [SCOPE],
  // RFC 9207: the answer names its sender, so a client with several connectors can tell them apart
  authorization_response_iss_parameter_supported: true,
});

/** RFC 9728: which server guards /mcp. */
const resourceMetadata = (origin: string) => ({
  resource: `${origin}/mcp`,
  authorization_servers: [origin],
  scopes_supported: [SCOPE],
  bearer_methods_supported: ["header"],
  resource_name: "AI Pulse Georgia agent",
});

const CSS = `:root{color-scheme:light dark;--bg:#f4f6f9;--fg:#1c2330;--muted:#596476;--card:#fff;--line:#d8dde5;--accent:#1f5fbf;--on-accent:#fff;--bad:#b3261e}
@media (prefers-color-scheme:dark){:root{--bg:#11151b;--fg:#e7eaf0;--muted:#a2abb9;--card:#1a1f28;--line:#2d3441;--accent:#7fb0ff;--on-accent:#0f141b;--bad:#ff8a80}}
body{margin:0;padding:0 16px;background:var(--bg);color:var(--fg);font:16px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:30rem;margin:8vh auto;padding:24px;background:var(--card);border:1px solid var(--line);border-radius:12px}
h1{font-size:1.3rem;margin:0 0 12px;text-wrap:balance}p{margin:8px 0}.note{color:var(--muted);font-size:.9rem}.problem{color:var(--bad);font-weight:600;overflow-wrap:anywhere}
label{display:block;margin-top:16px;font-weight:600}
input[type=password]{box-sizing:border-box;width:100%;padding:10px;margin:6px 0 14px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--fg);font:inherit}
button{padding:10px 20px;border:0;border-radius:8px;background:var(--accent);color:var(--on-accent);font:inherit;font-weight:600;cursor:pointer}`;

function consent(ask: AuthRequest, gateway: string, problem = ""): string {
  const fields: Array<[string, string]> = [
    ["response_type", "code"],
    ["client_id", ask.clientId],
    ["redirect_uri", ask.redirectUri],
    ["code_challenge", ask.challenge],
    ["code_challenge_method", "S256"],
    ["state", ask.state],
  ];
  const hidden = fields.map(([n, v]) => `<input type="hidden" name="${n}" value="${esc(v)}">`).join("");
  return `<h1>Grok-ის დაკავშირება აგენტთან</h1>
<p><b>${esc(PLAIN_NAME.test(ask.clientId) ? ask.clientId : "უცნობი კლიენტი")}</b> ითხოვს წვდომას AI Pulse Georgia-ს აგენტზე (<b>${esc(gateway)}</b>). დაკავშირების შემდეგ მას იგივე უფლებები ექნება, რაც MCP_TOKEN-ს: კოლექციაში ძებნა, შეთავაზებების ნახვა, დამტკიცება და უარყოფა, შენი შეთავაზების შეტანა, სკანის გაშვება და რეპოს ფაილების კითხვა.</p>
<p>გააგრძელე მხოლოდ მაშინ, თუ Connect-ს ახლა შენ დააჭირე. თუ ეს ბმული ვინმემ გამოგიგზავნა, დახურე გვერდი. პასუხი აქ გაიგზავნება: <b>${esc(new URL(ask.redirectUri).host)}</b></p>
${problem ? `<p class="problem">${esc(problem)}</p>` : ""}<form method="post" action="/oauth/authorize">${hidden}
<label for="token">MCP_TOKEN</label>
<input id="token" name="token" type="password" autocomplete="current-password" required autofocus>
<button type="submit">დაკავშირება</button>
</form>
<p class="note">MCP_TOKEN-ს Deploy ON-ში, სერვისის Environment-ის გვერდზე ნახავ. Grok თვითონ ამ გასაღებს ვერ დაინახავს: ის მხოლოდ დროებით გასაღებს მიიღებს.</p>`;
}

function refusal(problem: string): string {
  return `<h1>დაკავშირება ვერ მოხერხდა</h1>
<p>მოთხოვნა არასწორია, ამიტომ კოდი არსად გაიგზავნა. მიზეზი:</p>
<p class="problem">${esc(problem)}</p>
<p class="note">ამ გვერდის გამო თავად არაფერი შეცვალო. თუ ის Grok-ში Connect-ზე შენი დაჭერისთანავე გამოჩნდა, ამ გვერდის მისამართი იმას გაუგზავნე, ვინც კარიბჭეს უვლის. თუ ბმულით გაიხსნა, უბრალოდ დახურე.</p>`;
}

export function createOAuth(cfg: OAuthConfig): OAuth {
  const now = cfg.now ?? Date.now;
  const seconds = () => Math.floor(now() / 1000);
  const redirectUris = cfg.redirectUris ?? [GROK_REDIRECT];
  const { sign, verify } = signer(cfg.secret);
  const ownerKey = digest(cfg.secret);
  const lock = lockout(MAX_FAILURES, LOCKOUT_MS, now);
  const used = new Map<string, number>(); // code id → expiry
  // a browser checks form-action on the redirect that answers the form too, so the clients' origins belong in it
  const formAction = [...new Set(redirectUris.map((u) => new URL(u).origin))].join(" ");

  function page(res: ServerResponse, status: number, title: string, inner: string, headers: Record<string, string> = {}): void {
    res.writeHead(status, {
      ...headers,
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "content-security-policy": `default-src 'none'; style-src 'unsafe-inline'; form-action 'self' ${formAction}; frame-ancestors 'none'; base-uri 'none'`,
      "x-frame-options": "DENY",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
    });
    res.end(`<!doctype html><html lang="ka"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title><style>${CSS}</style></head><body><main>${inner}</main></body></html>`);
  }

  /** The submitted form, or null once `refuse` has answered a body over 16 KB. The connection closes, so no client reuses a half-read socket. */
  async function readForm(req: IncomingMessage, res: ServerResponse, refuse: () => void): Promise<URLSearchParams | null> {
    try {
      return new URLSearchParams(await readText(req, MAX_FORM));
    } catch (err) {
      if ((err as { status?: number }).status !== 413) throw err;
      res.setHeader("connection", "close");
      refuse();
      return null;
    }
  }

  async function authorize(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
    const failed = (status: number, problem: string) => page(res, status, "დაკავშირება ვერ მოხერხდა", refusal(problem));
    const origin = originOf(req, cfg.publicUrl);
    if (!origin) return failed(400, "unexpected Host header");
    const post = req.method === "POST";
    // the form posts every field back, so a submitted request is checked again from scratch
    const params = post ? await readForm(req, res, () => failed(413, `the form is larger than ${MAX_FORM / 1024} KB`)) : url.searchParams;
    if (!params) return;
    const ask = authRequest(params, redirectUris);
    if ("error" in ask) return failed(400, ask.error);
    const gateway = new URL(origin).host;
    if (!post) return page(res, 200, "Grok-ის დაკავშირება", consent(ask, gateway));
    if (lock.locked())
      return page(res, 429, "Grok-ის დაკავშირება", consent(ask, gateway, `ძალიან ბევრი არასწორი ცდა იყო, ამიტომ გვერდი ${LOCKOUT_MS / 60_000} წუთით დაიკეტა. სცადე მოგვიანებით.`), { "retry-after": String(LOCKOUT_MS / 1000) });
    if (!timingSafeEqual(digest((params.get("token") ?? "").trim()), ownerKey)) {
      lock.fail();
      log.warn("oauth key refused");
      return page(res, 401, "Grok-ის დაკავშირება", consent(ask, gateway, "გასაღები არ ემთხვევა. ჩასვი MCP_TOKEN ზუსტად ისე, როგორც Deploy ON-შია."));
    }
    lock.succeed();
    const at = seconds();
    const code = sign({ k: "code", exp: at + CODE_TTL_S, at, cid: ask.clientId, jti: nonce(), ru: ask.redirectUri, cc: ask.challenge });
    const to = new URL(ask.redirectUri);
    to.searchParams.set("code", code);
    if (ask.state) to.searchParams.set("state", ask.state);
    to.searchParams.set("iss", origin);
    log.info("oauth client approved", { client: ask.clientId });
    res.writeHead(302, { location: to.href, "cache-control": "no-store", "referrer-policy": "no-referrer" });
    res.end();
  }

  /** A fresh pair; neither outlives the owner's consent by more than GRANT_TTL_S. */
  function issue(res: ServerResponse, grant: string, from: Claims, nowSec: number): void {
    const end = from.at + GRANT_TTL_S;
    const accessExp = Math.min(nowSec + ACCESS_TTL_S, end);
    const mint = (k: Kind, exp: number) => sign({ k, exp, at: from.at, cid: from.cid, jti: nonce() });
    log.info("oauth tokens issued", { grant, client: from.cid });
    json(
      res,
      200,
      { access_token: mint("access", accessExp), token_type: "Bearer", expires_in: accessExp - nowSec, refresh_token: mint("refresh", Math.min(nowSec + REFRESH_TTL_S, end)), scope: SCOPE },
      { "cache-control": "no-store", pragma: "no-cache" },
    );
  }

  async function token(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const p = await readForm(req, res, () => oauthError(res, "invalid_request", `the form is larger than ${MAX_FORM / 1024} KB`, 413));
    if (!p) return;
    const nowSec = seconds();
    const grant = p.get("grant_type") ?? "";
    const clientId = p.get("client_id") ?? "";
    if (grant === "authorization_code") {
      const c = verify(p.get("code") ?? "", "code", nowSec);
      if (!c || used.has(c.jti)) return oauthError(res, "invalid_grant", "the code is unknown, already used or expired");
      // OAuth 2.1 lets a client leave redirect_uri out here, since PKCE binds the code; when sent, it must match
      const ru = p.get("redirect_uri");
      if (clientId !== c.cid || (ru !== null && ru !== c.ru)) return oauthError(res, "invalid_grant", "client_id or redirect_uri is not the one the code was issued for");
      if (!pkceMatches(p.get("code_verifier") ?? "", c.cc ?? "")) return oauthError(res, "invalid_grant", "the code_verifier does not match the code_challenge");
      for (const [jti, exp] of used) if (exp <= nowSec) used.delete(jti);
      used.set(c.jti, c.exp);
      return issue(res, grant, c, nowSec);
    }
    if (grant === "refresh_token") {
      const r = verify(p.get("refresh_token") ?? "", "refresh", nowSec);
      if (!r || (clientId !== "" && clientId !== r.cid)) return oauthError(res, "invalid_grant", "the refresh token is unknown or expired");
      return issue(res, grant, r, nowSec);
    }
    return oauthError(res, "unsupported_grant_type", "use authorization_code or refresh_token");
  }

  return {
    async handle(req, res, url) {
      const path = url.pathname;
      if (path === "/oauth/token") {
        if (req.method === "POST") await token(req, res);
        else json(res, 405, { error: "use POST" }, { allow: "POST" });
        return true;
      }
      if (path === "/oauth/authorize") {
        if (req.method === "GET" || req.method === "POST") await authorize(req, res, url);
        else json(res, 405, { error: "use GET or POST" }, { allow: "GET, POST" });
        return true;
      }
      if (!METADATA.has(path)) return false;
      if (req.method !== "GET") {
        json(res, 405, { error: "use GET" }, { allow: "GET" });
        return true;
      }
      const origin = originOf(req, cfg.publicUrl);
      // built from the Host header, so no copy may be kept and handed to a request that came to another name
      if (!origin) json(res, 400, { error: "invalid_request", error_description: "unexpected Host header" });
      else json(res, 200, path === "/.well-known/oauth-authorization-server" ? serverMetadata(origin) : resourceMetadata(origin), { "cache-control": "no-store" });
      return true;
    },

    accepts(header) {
      const token = bearer(header);
      return token !== null && verify(token, "access", seconds()) !== null;
    },

    wwwAuthenticate(req, presented) {
      const origin = originOf(req, cfg.publicUrl);
      const parts = ['Bearer realm="aipulse-agent"'];
      if (presented) parts.push('error="invalid_token"');
      if (origin) parts.push(`resource_metadata="${origin}/.well-known/oauth-protected-resource/mcp"`);
      return parts.join(", ");
    },
  };
}

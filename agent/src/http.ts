/** The few HTTP helpers that the gateway and its OAuth sign-in (oauth.ts) share. */
import { createHash } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

export function digest(s: string): Buffer {
  return createHash("sha256").update(s).digest();
}

/** The token of an `Authorization: Bearer …` header, or null for any other header. */
export function bearer(header: string | undefined): string | null {
  return header?.startsWith("Bearer ") ? header.slice(7).trim() : null;
}

export function json(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}): void {
  res.writeHead(status, { "content-type": "application/json", ...headers });
  res.end(JSON.stringify(body));
}

/** The request body as text; past `max` bytes it throws an error with status 413, before reading when the length is declared. */
export async function readText(req: IncomingMessage, max: number): Promise<string> {
  const tooLarge = () => Object.assign(new Error("request body too large"), { status: 413 });
  if (Number(req.headers["content-length"] ?? "0") > max) throw tooLarge();
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > max) throw tooLarge();
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

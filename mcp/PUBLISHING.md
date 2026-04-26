# Publishing checklist

Three one-time manual steps to take the MCP server from "merged to main" to "globally installable via `npx`". After this, every README update auto-publishes a patch version through GitHub Actions.

---

## 1. Create your npm account (one-time, ~3 minutes)

Run this in your terminal — opens a browser for login:

```bash
npm adduser
```

You'll be prompted for username, email, and password (or you can sign in with GitHub on the browser page). After it succeeds, verify:

```bash
npm whoami
```

Should print your username. If not, repeat `npm adduser`.

---

## 2. Publish the first version manually (one-time, ~2 minutes)

From the repo root:

```bash
cd mcp
npm install
npm run build
npm publish --access public
```

The `--access public` flag is required for scoped packages on the free plan. `npm publish` will:

1. Run `prepublishOnly` (build + smoke test)
2. Pack `dist/`, `data/`, `README.md`, `LICENSE` into a tarball
3. Upload to npm under `@aipulsegeorgia/mcp-server`
4. Create the `@aipulsegeorgia` scope under your account automatically (first publish)

Verify it worked from any other directory:

```bash
npx -y @aipulsegeorgia/mcp-server < /dev/null
```

This boots the server briefly. You should see no errors. (The `< /dev/null` closes stdin so the server exits cleanly.)

---

## 3. Add NPM_TOKEN secret to GitHub (one-time, ~2 minutes)

The `mcp-publish.yml` GitHub Action needs an npm access token to auto-publish on README updates.

**Create the token:**

1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Click **Generate New Token** → **Granular Access Token**
3. Name: `awesome-ai-pulse-georgia-publish`
4. Expiration: 1 year (recommended)
5. Packages: select `@aipulsegeorgia/mcp-server` only (or whole `@aipulsegeorgia` scope)
6. Permissions: **Read and write**
7. Copy the token (starts with `npm_...`) — you won't see it again

**Add it to GitHub:**

1. Go to https://github.com/tornikebolokadze1-cyber/awesome-ai-pulse-georgia/settings/secrets/actions
2. Click **New repository secret**
3. Name: `NPM_TOKEN`
4. Value: paste the npm token
5. **Add secret**

---

## What happens after these 3 steps

From now on, every time you update `README.md` on `main` (add a repo, refresh stars, etc.):

1. **`mcp-data-sync.yml`** runs → re-parses README → if `mcp/data/repos.json` differs, bumps patch version (e.g., `0.1.1` → `0.1.2`) and commits both back
2. **`mcp-publish.yml`** triggers on the version bump → builds, runs smoke test, publishes new version to npm
3. Within ~2 minutes, `npx @aipulsegeorgia/mcp-server` serves the updated catalog

Manual `src/` changes still need a manual `npm version minor && git push` to flow.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `npm publish` fails with `403 Forbidden` | Re-run `npm adduser`. Token may have expired. |
| `npm publish` fails with `402 Payment Required` | You forgot `--access public` for the scoped package. |
| GitHub Action fails: `npm error 401 Unauthorized` | `NPM_TOKEN` secret is missing or expired. Re-create per Step 3. |
| `npm view` says scope is taken | Someone else owns `@aipulsegeorgia` — fall back to `aipulsegeorgia-mcp` (unscoped). Update `name` in package.json. |
| Action loops infinitely | The `[skip ci]` guard should prevent this. If it triggers, manually disable the workflow and check that the auto-commit message contains `[skip ci]`. |

---

## Smithery.ai listing (after first publish)

Once `npm view @aipulsegeorgia/mcp-server` returns metadata:

1. Go to https://smithery.ai/new
2. Enter the GitHub repo URL: `https://github.com/tornikebolokadze1-cyber/awesome-ai-pulse-georgia`
3. Smithery auto-detects `mcp/smithery.yaml` and creates the listing
4. Review takes 24-48 hours typically

After approval, the package appears in Smithery's marketplace at `https://smithery.ai/server/@aipulsegeorgia/mcp-server`.

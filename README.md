# UAE Sourcing

One-page marketing site with a content manager the client can use herself.

- **Site**: Eleventy 3 + Nunjucks, vanilla CSS/JS, no framework.
- **Content**: everything editable lives in [`src/_data/site.json`](src/_data/site.json).
- **Admin**: Decap CMS at `/admin`, commits straight to this repo.

## Local development

```bash
npm install
npm start          # http://localhost:4789
```

To work on the content manager, run the local proxy in a second terminal —
no GitHub login is needed in this mode:

```bash
npm run cms        # file-system proxy on port 8082
```

Then open http://localhost:4789/admin/.

## Going live

The site is a static build (`npm run build` → `_site/`). Two things must be set
up once, in this order.

### 1. GitHub OAuth App

Needed so the client can log into `/admin` on the live site.

1. https://github.com/settings/developers → **New OAuth App**
   (a classic OAuth App — *not* a GitHub App, they are not interchangeable).
2. Homepage URL: the live site URL.
3. **Authorization callback URL**: `https://<worker-url>/callback`
   — the worker from step 2, not the site.
4. Keep the Client ID and generate a Client Secret.

### 2. OAuth worker

Deploy [`sveltia/sveltia-cms-auth`](https://github.com/sveltia/sveltia-cms-auth)
to Cloudflare Workers (one click from its README). It speaks the same protocol
Decap expects. Set these variables on the worker:

| Variable | Value |
| --- | --- |
| `GITHUB_CLIENT_ID` | from step 1 |
| `GITHUB_CLIENT_SECRET` | from step 1 — tick *Encrypt* |
| `ALLOWED_DOMAINS` | `uaesourcing.pages.dev, *.uaesourcing.pages.dev` |

`ALLOWED_DOMAINS` takes bare hostnames, comma-separated, no `https://`.
Add the custom domain here too once there is one.

### 3. Cloudflare Pages

Connect the repo with:

- Build command: `npm run build`
- Output directory: `_site`

### 4. Point the CMS at the worker

In [`src/admin/config.yml`](src/admin/config.yml), set `base_url` to the worker
origin — no trailing slash, no path, or the login popup fails silently:

```yaml
base_url: https://uaesourcing-auth.your-subdomain.workers.dev
```

Finally, invite the client to the repo (Settings → Collaborators) with **Write**
access. She needs a free GitHub account; after that, logging in is one click.

## How editing works

The client opens `/admin`, changes a field, clicks *Publish*. That writes a
commit to `main`, Cloudflare rebuilds, and the change is live in about a minute.
Every edit is a commit, so anything can be rolled back with `git revert`.

## Notes

- The illustrations in `src/assets/img/` are placeholders pending real photography.
- The quote form validates in the browser but does not submit anywhere yet —
  see the `TODO` in `src/assets/js/main.js`.
- The brand logos are trademarked. Confirm the client is entitled to display
  them before the site is promoted publicly.

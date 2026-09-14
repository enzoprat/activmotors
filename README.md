# Activmotors

Bilingual marketing site for an automotive sourcing and export business, with a
content manager the client uses herself.

- **Site**: Eleventy 3 + Nunjucks, vanilla CSS/JS, no framework.
- **Languages**: `/en/` and `/fr/`, with French slugs translated rather than
  prefixed so the French pages carry French keywords.
- **Content**: everything editable lives in [`src/_data/`](src/_data) — company
  details in `site.json`, page copy per language in `i18n/`, the four category
  pages in `categories.json`, the privacy pages in `legal.json`.
- **Admin**: Sveltia CMS at `/admin`, committing straight to this repo.
- **Quote form**: posted to Web3Forms, which mails the request to the client.

## Local development

```bash
npm install
npm start
```

Then http://localhost:4789. The content manager is at
http://localhost:4789/admin/ — Sveltia reads the working copy through the
browser, so there is no proxy server to start alongside it.

## Going live

The site is live at https://www.activamotors.com, deployed by Vercel on every
push to `main`. A second copy is published to GitHub Pages by
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) as a preview;
it is marked `noindex` so it does not compete with the real domain in search.

Builds default to production. The Pages workflow overrides `PATH_PREFIX` and
`SITE_ORIGIN` because a project site lives under a sub-path.

## Content manager login

The client edits the site at https://www.activamotors.com/admin/, which runs
[Sveltia CMS](https://github.com/sveltia/sveltia-cms) — a rewrite of
Netlify/Decap CMS, same configuration format, actively maintained. Its
interface follows the browser's language, so the client gets it in French.

Signing in needs a token from GitHub, and getting one needs a client secret,
which cannot live in a browser — so [`api/auth.js`](api/auth.js) and
[`api/callback.js`](api/callback.js) do that exchange on Vercel.

Two things have to be set up once.

### 1. A GitHub OAuth App

1. https://github.com/settings/developers → **New OAuth App**.
   It must be a classic OAuth App; a GitHub App does not work here.
2. Application name: anything the client will recognise.
3. Homepage URL: `https://www.activamotors.com`
4. **Authorization callback URL**: `https://www.activamotors.com/callback`
5. Keep the Client ID, then generate a Client Secret.

### 2. Two environment variables on Vercel

Project → Settings → Environment Variables:

| Name | Value |
| --- | --- |
| `GITHUB_CLIENT_ID` | from step 1 |
| `GITHUB_CLIENT_SECRET` | from step 1 |

Redeploy after adding them — Vercel only picks up new variables on a fresh
build. Visiting `/auth` says plainly if the id is missing.

Finally, invite the client to the repository (Settings → Collaborators) with
**Write** access. They need a free GitHub account; after that it is one click.

## How editing works

The client opens `/admin`, changes a field, clicks *Publish*. That writes a
commit to `main`, the workflow rebuilds, and the change is live in about a
minute. Every edit is a commit, so anything can be rolled back with `git revert`.

## Notes

- The illustrations in `src/assets/img/` are placeholders pending real photography.
- The quote form validates in the browser but does not submit anywhere yet —
  see the `TODO` in `src/assets/js/main.js`.
- The brand logos are trademarked. Confirm the client is entitled to display
  them before the site is promoted publicly.

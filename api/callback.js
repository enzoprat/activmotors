/**
 * Step two: swap the code GitHub handed back for a token, then pass it to the
 * content manager in the window that opened this pop-up.
 *
 * The handshake is Netlify's, which Decap still speaks: the pop-up announces
 * itself, the opener answers, and only then is the token sent — addressed to
 * this exact origin rather than to anyone listening.
 */
const escapeForScript = (value) =>
  JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");

function handshakePage(status, payload, origin) {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Signing you in…</title></head>
<body>
<p>Signing you in…</p>
<script>
  (function () {
    var message = 'authorization:github:${status}:' + ${escapeForScript(JSON.stringify(payload))};
    function receive(e) {
      if (e.origin !== ${escapeForScript(origin)}) return;
      window.opener.postMessage(message, e.origin);
      window.removeEventListener('message', receive, false);
    }
    window.addEventListener('message', receive, false);
    window.opener.postMessage('authorizing:github', ${escapeForScript(origin)});
  })();
</script>
</body>
</html>`;
}

const readCookie = (header, name) =>
  (header || "")
    .split(";")
    .map((part) => part.trim().split("="))
    .find(([key]) => key === name)?.[1];

export default async function handler(req, res) {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const origin = `https://${host}`;
  const { code, state } = req.query;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  // The token passes through this page; it must not sit in a shared cache.
  res.setHeader("Set-Cookie", "cms_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0");

  const expected = readCookie(req.headers.cookie, "cms_oauth_state");
  if (!code || !state || !expected || state !== expected) {
    res.status(400).send(handshakePage("error", { message: "Invalid or expired sign-in attempt. Close this window and try again." }, origin));
    return;
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    res.status(500).send(handshakePage("error", { message: "The deployment is missing its GitHub credentials." }, origin));
    return;
  }

  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    const data = await response.json();

    if (!response.ok || data.error || !data.access_token) {
      res.status(401).send(handshakePage("error", { message: data.error_description || "GitHub refused the sign-in." }, origin));
      return;
    }

    res.status(200).send(handshakePage("success", { token: data.access_token, provider: "github" }, origin));
  } catch (err) {
    res.status(502).send(handshakePage("error", { message: "Could not reach GitHub." }, origin));
  }
}

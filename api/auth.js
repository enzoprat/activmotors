import crypto from "node:crypto";

/**
 * Step one of the GitHub sign-in for the content manager.
 *
 * Decap opens this in a pop-up, we bounce the editor to GitHub, and GitHub
 * sends them back to /callback. The exchange needs the client secret, which is
 * why it cannot happen in the browser and needs this function at all.
 */
export default function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    res
      .status(500)
      .send("GITHUB_CLIENT_ID is not set on this deployment. See README, 'Content manager login'.");
    return;
  }

  // Tied to the browser through a cookie and checked on the way back, so a
  // third party cannot feed us a code obtained somewhere else.
  const state = crypto.randomBytes(16).toString("hex");
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const scope = typeof req.query.scope === "string" && req.query.scope ? req.query.scope : "repo,user";

  res.setHeader(
    "Set-Cookie",
    `cms_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
  );

  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", `https://${host}/callback`);
  url.searchParams.set("scope", scope);
  url.searchParams.set("state", state);

  res.redirect(302, url.toString());
}

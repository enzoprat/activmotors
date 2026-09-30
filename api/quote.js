import fr from "../src/_data/i18n/fr.json" with { type: "json" };
import en from "../src/_data/i18n/en.json" with { type: "json" };
import site from "../src/_data/site.json" with { type: "json" };

/**
 * Receives a quote request and sends two e-mails: the request to Activmotors,
 * and an acknowledgement to whoever sent it.
 *
 * This replaced a third-party form service. The reason is visibility: that
 * service accepted every submission and reported success, while nothing
 * arrived, and there was no way to see which step had failed. Here the send is
 * ours, so a refusal from the mail provider is logged and surfaced.
 */

const LOCALES = { fr, en };
const ORIGIN = "https://www.activamotors.com";

// Fields copied into the e-mails, in the order they are shown. The label for
// each comes from the same locale file the form is built from, so a label
// renamed in the content manager follows through to the mail.
const FIELDS = [
  ["company", "f_company"],
  ["person", "f_person"],
  ["email", "f_email"],
  ["phone", "f_phone"],
  ["country", "f_country"],
  ["city", "f_city"],
  ["category", "f_category"],
  ["product", "f_product"],
  ["oem", "f_oem"],
  ["brand", "f_brand"],
  ["packaging", "f_packaging"],
  ["qty", "f_qty"],
  ["dest_country", "f_dest_country"],
  ["dest_port", "f_dest_port"],
  ["shipping", "f_shipping"],
  ["date", "f_date"],
  ["incoterm", "f_incoterm"],
  ["notes", "f_notes"],
];

const REQUIRED = ["company", "person", "email", "phone", "product", "qty", "category", "dest_country"];

const escape = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || "").trim());

/** Shipping arrives as an internal key; the reader wants the visible name. */
const shippingLabel = (t, key) => {
  const option = (t.delivery.options || []).find((o) => o.key === key);
  return option ? option.title : key;
};

const recapRows = (t, data) => {
  // The packaging slot asks a different question for vehicles, and the mail has
  // to name it the way the sender saw it on the form.
  const isVehicle = data.category === t.quote.vehicle_category;

  return FIELDS.map(([name, labelKey]) => {
    const value = name === "shipping" ? shippingLabel(t, data[name]) : data[name];
    if (!value) return null;
    const key = name === "packaging" && isVehicle ? "f_vehicle_shipping" : labelKey;
    return { label: t.quote[key] || name, value };
  }).filter(Boolean);
};

const rowsHtml = (rows) =>
  rows
    .map(
      (r) => `<tr>
        <td style="padding:7px 14px 7px 0;color:#6b7a8c;font-size:13px;vertical-align:top;white-space:nowrap">${escape(r.label)}</td>
        <td style="padding:7px 0;color:#1b2430;font-size:13px;font-weight:600">${escape(r.value)}</td>
      </tr>`
    )
    .join("");

const rowsText = (rows) => rows.map((r) => `${r.label} : ${r.value}`).join("\n");

const shell = (inner) => `<!doctype html>
<html><body style="margin:0;padding:24px 12px;background:#eceff3;font-family:'Helvetica Neue',Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:10px;overflow:hidden">
  <tr><td style="background:#0d2b4c;padding:22px 28px">
    <img src="${ORIGIN}/assets/img/activmotors-logo.jpg" width="200" alt="Activmotors" style="display:block;border:0;width:200px;height:auto;border-radius:4px">
  </td></tr>
  <tr><td style="padding:28px">${inner}</td></tr>
  <tr><td style="background:#f7f9fc;padding:16px 28px;border-top:1px solid #e3e8ef">
    <p style="margin:0;font-size:11px;line-height:1.6;color:#6b7a8c">
      ${escape(site.company.address)}<br>
      <a href="tel:${escape(site.company.phone).replace(/[^\d+]/g, "")}" style="color:#6b7a8c">${escape(site.company.phone)}</a> ·
      <a href="mailto:${escape(site.company.email)}" style="color:#6b7a8c">${escape(site.company.email)}</a>
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

function confirmationEmail(t, data, rows) {
  const paragraphs = t.email.body
    .map((p) => `<p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#3d4b5c">${escape(p)}</p>`)
    .join("");

  const html = shell(`
    <p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#3d4b5c">${escape(t.email.greeting)} ${escape(data.person)},</p>
    ${paragraphs}
    <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#0d2b4c">${escape(t.email.signature)}</p>
    <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#0d2b4c">${escape(t.email.company)}</p>
    <p style="margin:0 0 24px;font-size:11px;letter-spacing:.12em;color:#c8891a;font-weight:700">${escape(t.email.tagline)}</p>
    <div style="border-top:1px solid #e3e8ef;padding-top:18px">
      <p style="margin:0 0 10px;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#6b7a8c;font-weight:700">${escape(t.email.recap_title)}</p>
      <table role="presentation" cellpadding="0" cellspacing="0">${rowsHtml(rows)}</table>
      <p style="margin:18px 0 0;font-size:11.5px;line-height:1.6;color:#6b7a8c">${escape(t.email.footer_note)}</p>
    </div>`);

  const text = [
    `${t.email.greeting} ${data.person},`,
    "",
    ...t.email.body,
    "",
    t.email.signature,
    t.email.company,
    t.email.tagline,
    "",
    `— ${t.email.recap_title} —`,
    rowsText(rows),
    "",
    t.email.footer_note,
  ].join("\n");

  return { subject: t.email.confirm_subject, html, text };
}

function notificationEmail(t, data, rows) {
  const html = shell(`
    <p style="margin:0 0 18px;font-size:13px;line-height:1.7;color:#6b7a8c">${escape(t.email.notify_intro)}</p>
    <table role="presentation" cellpadding="0" cellspacing="0">${rowsHtml(rows)}</table>`);

  const text = [t.email.notify_intro, "", rowsText(rows)].join("\n");

  return {
    subject: `${t.email.notify_subject} — ${data.company} (${data.dest_country})`,
    html,
    text,
  };
}

async function send(payload) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || `mail provider returned ${response.status}`);
  }
  return body;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ success: false, message: "Method not allowed" });
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set on this deployment");
    res.status(500).json({ success: false, message: "Mail is not configured on this deployment." });
    return;
  }

  const data = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

  // Bots fill the hidden field; people never see it. Answer as if it worked so
  // the sender learns nothing from the difference.
  if (data.botcheck) {
    res.status(200).json({ success: true });
    return;
  }

  const missing = REQUIRED.filter((name) => !String(data[name] || "").trim());
  if (missing.length || !isEmail(data.email)) {
    res.status(400).json({ success: false, message: "Some required details are missing." });
    return;
  }

  const t = LOCALES[data.locale] || LOCALES.en;
  const rows = recapRows(t, data);
  const from = process.env.MAIL_FROM || `Activmotors <no-reply@activamotors.com>`;
  const to = process.env.MAIL_TO || site.company.email;

  try {
    // The request itself matters most: if the acknowledgement fails, the lead
    // is still delivered rather than lost with it.
    const notify = notificationEmail(t, data, rows);
    await send({
      from,
      to: [to],
      reply_to: [data.email],
      subject: notify.subject,
      html: notify.html,
      text: notify.text,
    });

    const confirm = confirmationEmail(t, data, rows);
    try {
      await send({
        from,
        to: [data.email],
        reply_to: [to],
        subject: confirm.subject,
        html: confirm.html,
        text: confirm.text,
      });
    } catch (err) {
      console.error("acknowledgement not sent:", err.message);
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("quote request not delivered:", err.message);
    res.status(502).json({ success: false, message: "Could not send the request." });
  }
}

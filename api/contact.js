// Vercel Serverless Function — POST /api/contact
// Sends the booking / contact request to the salon by email via Resend (https://resend.com).
//
// Set these in Vercel → Project → Settings → Environment Variables:
//   RESEND_API_KEY      your Resend API key
//   CONTACT_TO_EMAIL    where requests should go (the salon's inbox)
//   CONTACT_FROM_EMAIL  optional, a sender on a domain verified in Resend
//                       (defaults to Resend's test sender onboarding@resend.dev)

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body = req.body || {};
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const { name = "", phone = "", email = "", service = "", times = "", message = "", company = "" } = body;

  // Honeypot — bots fill the hidden "company" field
  if (company) return res.status(200).json({ ok: true });

  if (!name.trim() || (!phone.trim() && !email.trim())) {
    return res.status(400).json({ error: "Name and a phone number or email are required." });
  }
  if ([name, phone, email, service, times].some((v) => String(v).length > 200) || String(message).length > 4000) {
    return res.status(400).json({ error: "Input too long." });
  }

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!key || !to) {
    return res.status(503).json({ error: "Contact form is not configured yet." });
  }

  const rows = [
    ["Name", name],
    ["Phone", phone],
    ["Email", email],
    ["Interested in", service],
    ["Best times", times],
    ["Message", message],
  ]
    .filter(([, v]) => String(v).trim())
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 14px 8px 0;color:#9c4470;font:600 12px Arial;letter-spacing:.08em;text-transform:uppercase;vertical-align:top">${k}</td><td style="padding:8px 0;font:15px Arial;color:#241d22;white-space:pre-wrap">${esc(v)}</td></tr>`
    )
    .join("");

  const html = `<div style="max-width:560px;margin:auto;font-family:Arial">
    <div style="background:#0b0a0c;color:#c9578b;padding:22px 26px;border-radius:14px 14px 0 0;font:24px Georgia">Paris Lash · New request</div>
    <div style="border:1px solid #f3d3e4;border-top:0;padding:20px 26px;border-radius:0 0 14px 14px"><table>${rows}</table></div>
  </div>`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL || "Paris Lash Website <onboarding@resend.dev>",
        to: to.split(",").map((s) => s.trim()),
        reply_to: email || undefined,
        subject: `New request: ${service || "General"} — ${name}`,
        html,
      }),
    });
    if (!r.ok) {
      console.error("Resend error", r.status, await r.text());
      return res.status(502).json({ error: "Email service error." });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error." });
  }
};

const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatValue(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object") return Object.entries(value).map(([key, val]) => `${key}: ${formatValue(val)}`).join("\n");
  return value || "-";
}

function renderTable(title, data) {
  if (!data || typeof data !== "object") return "";

  const rows = Object.entries(data).map(([key, value]) => `
    <tr>
      <th style="text-align:left;padding:8px 12px;border-bottom:1px solid #e5e7eb;background:#f8fafc;width:180px;">${escapeHtml(key)}</th>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;white-space:pre-line;">${escapeHtml(formatValue(value))}</td>
    </tr>
  `).join("");

  return `
    <h3 style="margin:24px 0 8px;">${escapeHtml(title)}</h3>
    <table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:14px;">${rows}</table>
  `;
}

function getProviderRecipients(providerId) {
  try {
    const recipients = JSON.parse(process.env.PROVIDER_RECIPIENTS || "{}");
    const recipient = recipients[providerId];
    return recipient ? [recipient] : [];
  } catch {
    return [];
  }
}

function getContact(lead) {
  return lead.contact || lead;
}

async function sendEmail(payload) {
  const { data, error } = await resend.emails.send(payload);
  if (error) throw error;
  return data;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL || !process.env.LEAD_NOTIFICATION_EMAIL) {
    return res.status(500).json({ error: "Resend environment variables are missing." });
  }

  const lead = req.body || {};
  const contact = getContact(lead);

  if (!contact.name || !contact.email || !contact.phone) {
    return res.status(400).json({ error: "Name, email and phone are required." });
  }

  const providerName = lead.provider || "Anbieter offen";
  const providerId = lead.providerId || "";
  const createdAt = new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" });
  const subject = `Neue Anfrage: ${providerName}`;

  const html = `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5;">
      <h2 style="margin:0 0 8px;">Neue Anfrage ueber finde-dein-bestes-angebot.de</h2>
      <p style="margin:0 0 16px;color:#4b5563;">Eingegangen am ${escapeHtml(createdAt)}</p>
      ${renderTable("Kontaktdaten", contact)}
      ${renderTable("Ausgewaehlter Anbieter", { provider: providerName, providerId })}
      ${renderTable("Projektangaben", lead.quiz || lead)}
    </div>
  `;

  const recipients = [
    process.env.LEAD_NOTIFICATION_EMAIL,
    ...getProviderRecipients(providerId)
  ].filter(Boolean);

  try {
    const sent = [];

    sent.push(await sendEmail({
      from: process.env.RESEND_FROM_EMAIL,
      to: recipients,
      replyTo: contact.email,
      subject,
      html
    }));

    if (process.env.SEND_CUSTOMER_CONFIRMATION !== "false") {
      sent.push(await sendEmail({
        from: process.env.RESEND_FROM_EMAIL,
        to: [contact.email],
        subject: "Deine Anfrage ist eingegangen",
        html: `
          <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5;">
            <h2>Danke fuer deine Anfrage, ${escapeHtml(contact.name)}.</h2>
            <p>Wir haben deine Anfrage an ${escapeHtml(providerName)} erhalten. Der Anbieter oder unser Team meldet sich in Kuerze bei dir.</p>
            <p style="color:#4b5563;">Falls du noch etwas ergaenzen moechtest, antworte einfach auf diese E-Mail.</p>
          </div>
        `
      }));
    }

    return res.status(200).json({ ok: true, sent: sent.map((item) => item.id) });
  } catch (error) {
    console.error("Resend error:", error);
    return res.status(502).json({ error: "Email could not be sent." });
  }
};

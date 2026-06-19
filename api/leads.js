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

function normalizePhoneNumber(value) {
  return String(value || "").replace(/[^\d+]/g, "");
}

function toWhatsAppNumber(value) {
  const normalized = normalizePhoneNumber(value);
  if (!normalized) return "";
  if (normalized.startsWith("+")) return normalized.slice(1);
  if (normalized.startsWith("00")) return normalized.slice(2);
  if (normalized.startsWith("0")) return `49${normalized.slice(1)}`;
  return normalized;
}

function isLikelyMobileNumber(value) {
  const normalized = normalizePhoneNumber(value);
  return /^(\+49|0049|0)1[5-7]\d{7,12}$/.test(normalized);
}

function getContactValue(contact, keys) {
  const foundKey = Object.keys(contact || {}).find((key) => keys.includes(key.toLowerCase()));
  return foundKey ? contact[foundKey] : "";
}

function getActionLinks(contact) {
  const phone = getContactValue(contact, ["phone", "telefon", "tel", "rufnummer"]);
  const mobile = getContactValue(contact, ["mobile", "mobil", "handy", "handynummer", "whatsapp"]);
  const email = getContactValue(contact, ["email", "e-mail", "mail"]);
  const whatsappSource = mobile || (isLikelyMobileNumber(phone) ? phone : "");

  return {
    phone,
    mobile,
    email,
    whatsappNumber: toWhatsAppNumber(whatsappSource)
  };
}

function renderButton(label, href, background, color = "#ffffff") {
  if (!href) return "";

  return `
    <a href="${escapeHtml(href)}" style="display:inline-block;margin:6px 8px 6px 0;padding:12px 18px;border-radius:8px;background:${background};color:${color};font-family:Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;">
      ${escapeHtml(label)}
    </a>
  `;
}

function renderActionButtons(contact) {
  const actions = getActionLinks(contact);
  const phoneHref = actions.phone ? `tel:${normalizePhoneNumber(actions.phone)}` : "";
  const whatsappHref = actions.whatsappNumber ? `https://wa.me/${actions.whatsappNumber}` : "";
  const emailHref = actions.email ? `mailto:${actions.email}` : "";

  if (!phoneHref && !whatsappHref && !emailHref) return "";

  return `
    <div style="margin:22px 0 8px;padding:18px;border-radius:12px;background:#f8fafc;border:1px solid #e5e7eb;">
      <p style="margin:0 0 10px;color:#475569;font-family:Arial,sans-serif;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;">Direkt kontaktieren</p>
      ${renderButton("Anrufen", phoneHref, "#2563eb")}
      ${renderButton("WhatsApp", whatsappHref, "#16a34a")}
      ${renderButton("E-Mail schreiben", emailHref, "#111827")}
    </div>
  `;
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

function renderLeadEmail({ contact, lead, providerName, providerId, createdAt }) {
  return `
    <div style="margin:0;padding:0;background:#eef2f7;">
      <div style="max-width:680px;margin:0 auto;padding:28px 14px;font-family:Arial,sans-serif;color:#111827;line-height:1.5;">
        <div style="overflow:hidden;border-radius:16px;background:#ffffff;border:1px solid #dbe3ef;box-shadow:0 14px 36px rgba(15,23,42,.10);">
          <div style="padding:26px 28px;background:#0f172a;color:#ffffff;">
            <p style="margin:0 0 8px;color:#93c5fd;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Neue Anfrage</p>
            <h1 style="margin:0;font-size:26px;line-height:1.2;">${escapeHtml(providerName)}</h1>
            <p style="margin:10px 0 0;color:#cbd5e1;font-size:14px;">Eingegangen am ${escapeHtml(createdAt)}</p>
          </div>

          <div style="padding:26px 28px;">
            <div style="padding:18px;border-radius:12px;background:#eff6ff;border:1px solid #bfdbfe;">
              <p style="margin:0;color:#1e3a8a;font-size:14px;">Ein neuer Lead wurde ueber finde-dein-bestes-angebot.de erfasst.</p>
            </div>

            ${renderActionButtons(contact)}
            ${renderTable("Kontaktdaten", contact)}
            ${renderTable("Ausgewaehlter Anbieter", { provider: providerName, providerId })}
            ${renderTable("Projektangaben", lead.quiz || lead)}

            <p style="margin:26px 0 0;color:#64748b;font-size:12px;">Diese E-Mail wurde automatisch durch das Anfrageformular erstellt.</p>
          </div>
        </div>
      </div>
    </div>
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
  const html = renderLeadEmail({ contact, lead, providerName, providerId, createdAt });

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

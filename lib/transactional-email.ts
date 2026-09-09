function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const getAdminEmail = () => process.env.ADMIN_EMAIL || "info@onekey.co.uk";

export function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeZone: "Europe/London",
  }).format(new Date(`${date}T12:00:00Z`));
}

export function emailShell(content: string) {
  return `
    <div style="margin:0;padding:40px 16px;background:#f5f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:#1c3053;padding:28px 32px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">OneKey<span style="color:#ae884e;">.</span></div>
          <div style="margin-top:5px;font-size:12px;color:#d1d5db;letter-spacing:1px;">ESTATE AGENCY</div>
        </div>
        <div style="padding:32px;">${content}</div>
        <div style="padding:20px 32px;background:#f9fafb;border-top:1px solid #eef0f2;text-align:center;color:#6b7280;font-size:12px;line-height:1.6;">
          OneKey Estate Agency<br />
          This is an automated email. Please reply if you need assistance.
        </div>
      </div>
    </div>
  `;
}

// Master v2 - Madde 23: Fail-closed configuration. API key yoksa işlemi reddet.
export async function sendTransactionalEmail({
  to,
  subject,
  html,
  replyTo,
  idempotencyKey,
}: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  idempotencyKey?: string;
}) {
  const apiKey = requiredEnv("RESEND_API_KEY");
  const from = process.env.EMAIL_FROM || "notifications@onekey.co.uk";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message || data?.error || `Email provider returned ${response.status}`
    );
  }

  return data;
}

/* ==============================================================================
   AŞAĞIDAKİLER ESKİ email.ts'DEN TAŞINAN VE YENİ SİSTEME UYARLANAN ŞABLONLARDIR
   ============================================================================== */

export function bookingReceivedEmail({
  customerName,
  customerEmail,
  propertyTitle,
  propertyRef,
  viewingDate,
  startTime,
}: {
  customerName: string;
  customerEmail: string;
  propertyTitle: string;
  propertyRef?: string | null;
  viewingDate: string;
  startTime: string;
}) {
  return {
    to: customerEmail,
    subject: `Viewing Request Received – ${propertyTitle}`,
    html: emailShell(`
        <h1 style="margin:0 0 12px;color:#1c3053;font-size:25px;">Viewing Request Received</h1>
        <p style="font-size:16px;line-height:1.6;">Dear ${escapeHtml(customerName)},</p>
        <p style="font-size:15px;line-height:1.7;color:#4b5563;">
          Thank you for requesting a viewing with OneKey Estate Agency.
          Your request has been received and is currently awaiting confirmation.
        </p>
        <div style="background:#f8f6f1;border-left:4px solid #ae884e;padding:18px;margin:25px 0;">
          <strong style="color:#1c3053;">${escapeHtml(propertyTitle)}</strong>
          ${propertyRef ? `<div style="margin-top:6px;color:#6b7280;">Reference: ${escapeHtml(propertyRef)}</div>` : ""}
          <div style="margin-top:12px;color:#4b5563;"><strong>Date:</strong> ${escapeHtml(viewingDate)}</div>
          <div style="margin-top:6px;color:#4b5563;"><strong>Requested time:</strong> ${escapeHtml(startTime)}</div>
        </div>
        <p style="font-size:15px;line-height:1.7;color:#4b5563;">We will contact you once your viewing has been confirmed.</p>
        <p style="margin-top:28px;font-size:15px;">Kind regards,<br /><strong style="color:#1c3053;">OneKey Estate Agency</strong></p>
    `),
  };
}

export function bookingStatusEmail({
  customerName,
  customerEmail,
  propertyTitle,
  propertyRef,
  viewingDate,
  startTime,
  status,
}: {
  customerName: string;
  customerEmail: string;
  propertyTitle: string;
  propertyRef?: string | null;
  viewingDate: string;
  startTime: string;
  status: "confirmed" | "rejected" | "cancelled" | "completed" | "no-show";
}) {
  const config = {
    confirmed: { title: "Viewing Confirmed", message: "Your viewing has been confirmed. We look forward to seeing you.", colour: "#15803d" },
    rejected: { title: "Viewing Request Update", message: "Unfortunately, we are unable to confirm this viewing request at the requested time.", colour: "#b91c1c" },
    cancelled: { title: "Viewing Cancelled", message: "This viewing has been cancelled. Please contact us if you would like to arrange another time.", colour: "#6b7280" },
    completed: { title: "Viewing Completed", message: "Thank you for attending the viewing. Please let us know if you have any further questions.", colour: "#1c3053" },
    "no-show": { title: "Viewing Missed", message: "We missed you at your scheduled viewing. If you wish to re-book, please contact us.", colour: "#ea580c" },
  }[status] || { title: "Viewing Update", message: "There is an update regarding your viewing.", colour: "#ae884e" };

  return {
    to: customerEmail,
    subject: `${config.title} – ${propertyTitle}`,
    html: emailShell(`
        <h1 style="margin:0 0 12px;color:#1c3053;font-size:25px;">${config.title}</h1>
        <p style="font-size:16px;line-height:1.6;">Dear ${escapeHtml(customerName)},</p>
        <p style="font-size:15px;line-height:1.7;color:#4b5563;">${config.message}</p>
        <div style="background:#f8f8f8;border-left:4px solid ${config.colour};padding:18px;margin:25px 0;">
          <strong style="color:#1c3053;">${escapeHtml(propertyTitle)}</strong>
          ${propertyRef ? `<div style="margin-top:6px;color:#6b7280;">Reference: ${escapeHtml(propertyRef)}</div>` : ""}
          <div style="margin-top:12px;color:#4b5563;"><strong>Date:</strong> ${escapeHtml(viewingDate)}</div>
          <div style="margin-top:6px;color:#4b5563;"><strong>Time:</strong> ${escapeHtml(startTime)}</div>
        </div>
        <p style="font-size:15px;line-height:1.7;color:#4b5563;">If you have any questions, please reply to this email or contact our team.</p>
        <p style="margin-top:28px;font-size:15px;">Kind regards,<br /><strong style="color:#1c3053;">OneKey Estate Agency</strong></p>
    `),
  };
}

export function agentNewBookingEmail({
  agentName,
  agentEmail,
  customerName,
  customerEmail,
  customerPhone,
  propertyTitle,
  propertyRef,
  viewingDate,
  startTime,
}: {
  agentName: string;
  agentEmail: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
  propertyTitle: string;
  propertyRef?: string | null;
  viewingDate: string;
  startTime: string;
}) {
  return {
    to: agentEmail,
    subject: `New Viewing Request – ${propertyTitle}`,
    html: emailShell(`
      <h1 style="margin:0 0 12px;color:#1c3053;font-size:25px;">New Viewing Request</h1>
      <p style="font-size:16px;line-height:1.6;">Hello ${escapeHtml(agentName)},</p>
      <p style="font-size:15px;line-height:1.7;color:#4b5563;">A new viewing request has been submitted for one of your properties.</p>
      <div style="background:#f8f6f1;border-left:4px solid #ae884e;padding:18px;margin:25px 0;">
        <strong style="color:#1c3053;">${escapeHtml(propertyTitle)}</strong>
        ${propertyRef ? `<div style="margin-top:6px;color:#6b7280;">Reference: ${escapeHtml(propertyRef)}</div>` : ""}
        <div style="margin-top:12px;color:#4b5563;"><strong>Date:</strong> ${escapeHtml(viewingDate)}</div>
        <div style="margin-top:6px;color:#4b5563;"><strong>Time:</strong> ${escapeHtml(startTime)}</div>
      </div>
      <h3 style="color:#1c3053;">Customer Details</h3>
      <p style="font-size:14px;line-height:1.8;color:#4b5563;">
        <strong>Name:</strong> ${escapeHtml(customerName)}<br />
        ${customerEmail ? `<strong>Email:</strong> ${escapeHtml(customerEmail)}<br />` : ""}
        <strong>Phone:</strong> ${escapeHtml(customerPhone)}
      </p>
      <p style="margin-top:28px;font-size:14px;color:#6b7280;">Please log in to the OneKey admin portal to manage this viewing request.</p>
    `),
  };
}

export function newMessageEmail({
  senderName,
  senderEmail,
  senderPhone,
  message,
  propertyTitle,
  propertyRef,
}: {
  senderName: string;
  senderEmail: string;
  senderPhone?: string | null;
  message: string;
  propertyTitle?: string | null;
  propertyRef?: string | null;
}) {
  return {
    to: getAdminEmail(),
    subject: `New Property Enquiry – ${propertyTitle || "OneKey Estate Agency"}`,
    html: emailShell(`
      <h1 style="margin:0 0 12px;color:#1c3053;font-size:25px;">New Enquiry Received</h1>
      <div style="background:#f8f6f1;border-left:4px solid #ae884e;padding:18px;margin:25px 0;">
        <strong style="color:#1c3053;">${escapeHtml(senderName)}</strong>
        <div style="margin-top:10px;color:#4b5563;"><strong>Email:</strong> ${escapeHtml(senderEmail)}</div>
        ${senderPhone ? `<div style="margin-top:6px;color:#4b5563;"><strong>Phone:</strong> ${escapeHtml(senderPhone)}</div>` : ""}
        ${propertyTitle ? `<div style="margin-top:10px;color:#4b5563;"><strong>Property:</strong> ${escapeHtml(propertyTitle)}</div>` : ""}
        ${propertyRef ? `<div style="margin-top:6px;color:#6b7280;"><strong>Reference:</strong> ${escapeHtml(propertyRef)}</div>` : ""}
      </div>
      <h3 style="color:#1c3053;">Message</h3>
      <div style="background:#f8f8f8;padding:18px;border-radius:10px;color:#4b5563;line-height:1.7;white-space:pre-wrap;">${escapeHtml(message)}</div>
    `),
    replyTo: senderEmail,
  };
}
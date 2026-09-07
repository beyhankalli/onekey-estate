function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

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
  const from = requiredEnv("EMAIL_FROM");

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

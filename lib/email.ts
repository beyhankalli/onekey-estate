const RESEND_API_URL = "https://api.resend.com/emails";

const FROM_EMAIL =
  process.env.EMAIL_FROM ||
  "OneKey Estate Agency <noreply@onekey.co.uk>";

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL ||
  "info@onekey.co.uk";

type SendEmailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
};

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: SendEmailOptions) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const recipients = Array.isArray(to) ? to : [to];

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: recipients,
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("Resend email error:", data);

    throw new Error(
      data?.message ||
        data?.error ||
        `Email provider returned HTTP ${response.status}`
    );
  }

  return data;
}

export function getAdminEmail() {
  return ADMIN_EMAIL;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function emailLayout(content: string, previewText?: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>OneKey Estate Agency</title>
</head>
<body style="margin:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  ${
    previewText
      ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">
          ${escapeHtml(previewText)}
        </div>`
      : ""
  }

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 15px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;">

          <tr>
            <td style="background:#1c3053;padding:28px 32px;text-align:center;">
              <div style="font-size:27px;font-weight:700;color:#ffffff;">
                OneKey<span style="color:#ae884e;">.</span>
              </div>
              <div style="margin-top:5px;color:#d1d5db;font-size:12px;letter-spacing:1px;">
                ESTATE AGENCY
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 32px;">
              ${content}
            </td>
          </tr>

          <tr>
            <td style="background:#f8f8f8;padding:24px 32px;text-align:center;border-top:1px solid #eeeeee;">
              <div style="font-size:13px;color:#6b7280;">
                OneKey Estate Agency
              </div>
              <div style="font-size:12px;color:#9ca3af;margin-top:6px;">
                info@onekey.co.uk
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

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
    html: emailLayout(
      `
        <h1 style="margin:0 0 12px;color:#1c3053;font-size:25px;">
          Viewing Request Received
        </h1>

        <p style="font-size:16px;line-height:1.6;">
          Dear ${escapeHtml(customerName)},
        </p>

        <p style="font-size:15px;line-height:1.7;color:#4b5563;">
          Thank you for requesting a viewing with OneKey Estate Agency.
          Your request has been received and is currently awaiting confirmation.
        </p>

        <div style="background:#f8f6f1;border-left:4px solid #ae884e;padding:18px;margin:25px 0;">
          <strong style="color:#1c3053;">${escapeHtml(propertyTitle)}</strong>
          ${
            propertyRef
              ? `<div style="margin-top:6px;color:#6b7280;">Reference: ${escapeHtml(propertyRef)}</div>`
              : ""
          }
          <div style="margin-top:12px;color:#4b5563;">
            <strong>Date:</strong> ${escapeHtml(viewingDate)}
          </div>
          <div style="margin-top:6px;color:#4b5563;">
            <strong>Requested time:</strong> ${escapeHtml(startTime)}
          </div>
        </div>

        <p style="font-size:15px;line-height:1.7;color:#4b5563;">
          We will contact you once your viewing has been confirmed.
        </p>

        <p style="margin-top:28px;font-size:15px;">
          Kind regards,<br />
          <strong style="color:#1c3053;">OneKey Estate Agency</strong>
        </p>
      `,
      `Your viewing request for ${propertyTitle} has been received.`
    ),
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
  status: "confirmed" | "rejected" | "cancelled";
}) {
  const config = {
    confirmed: {
      title: "Viewing Confirmed",
      message:
        "Your viewing has been confirmed. We look forward to seeing you.",
      colour: "#15803d",
    },
    rejected: {
      title: "Viewing Request Update",
      message:
        "Unfortunately, we are unable to confirm this viewing request at the requested time.",
      colour: "#b91c1c",
    },
    cancelled: {
      title: "Viewing Cancelled",
      message:
        "This viewing has been cancelled. Please contact us if you would like to arrange another time.",
      colour: "#6b7280",
    },
  }[status];

  return {
    to: customerEmail,
    subject: `${config.title} – ${propertyTitle}`,
    html: emailLayout(
      `
        <h1 style="margin:0 0 12px;color:#1c3053;font-size:25px;">
          ${config.title}
        </h1>

        <p style="font-size:16px;line-height:1.6;">
          Dear ${escapeHtml(customerName)},
        </p>

        <p style="font-size:15px;line-height:1.7;color:#4b5563;">
          ${config.message}
        </p>

        <div style="background:#f8f8f8;border-left:4px solid ${config.colour};padding:18px;margin:25px 0;">
          <strong style="color:#1c3053;">${escapeHtml(propertyTitle)}</strong>

          ${
            propertyRef
              ? `<div style="margin-top:6px;color:#6b7280;">Reference: ${escapeHtml(propertyRef)}</div>`
              : ""
          }

          <div style="margin-top:12px;color:#4b5563;">
            <strong>Date:</strong> ${escapeHtml(viewingDate)}
          </div>

          <div style="margin-top:6px;color:#4b5563;">
            <strong>Time:</strong> ${escapeHtml(startTime)}
          </div>
        </div>

        <p style="font-size:15px;line-height:1.7;color:#4b5563;">
          If you have any questions, please reply to this email or contact our team.
        </p>

        <p style="margin-top:28px;font-size:15px;">
          Kind regards,<br />
          <strong style="color:#1c3053;">OneKey Estate Agency</strong>
        </p>
      `,
      `${config.title} for ${propertyTitle}.`
    ),
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
    html: emailLayout(`
      <h1 style="margin:0 0 12px;color:#1c3053;font-size:25px;">
        New Viewing Request
      </h1>

      <p style="font-size:16px;line-height:1.6;">
        Hello ${escapeHtml(agentName)},
      </p>

      <p style="font-size:15px;line-height:1.7;color:#4b5563;">
        A new viewing request has been submitted for one of your properties.
      </p>

      <div style="background:#f8f6f1;border-left:4px solid #ae884e;padding:18px;margin:25px 0;">
        <strong style="color:#1c3053;">${escapeHtml(propertyTitle)}</strong>

        ${
          propertyRef
            ? `<div style="margin-top:6px;color:#6b7280;">Reference: ${escapeHtml(propertyRef)}</div>`
            : ""
        }

        <div style="margin-top:12px;color:#4b5563;">
          <strong>Date:</strong> ${escapeHtml(viewingDate)}
        </div>

        <div style="margin-top:6px;color:#4b5563;">
          <strong>Time:</strong> ${escapeHtml(startTime)}
        </div>
      </div>

      <h3 style="color:#1c3053;">Customer</h3>

      <p style="font-size:14px;line-height:1.8;color:#4b5563;">
        <strong>Name:</strong> ${escapeHtml(customerName)}<br />
        ${
          customerEmail
            ? `<strong>Email:</strong> ${escapeHtml(customerEmail)}<br />`
            : ""
        }
        <strong>Phone:</strong> ${escapeHtml(customerPhone)}
      </p>

      <p style="margin-top:28px;font-size:14px;color:#6b7280;">
        Please log in to the OneKey admin portal to manage this viewing request.
      </p>
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
    to: ADMIN_EMAIL,
    subject: `New Property Enquiry – ${propertyTitle || "OneKey Estate Agency"}`,
    html: emailLayout(`
      <h1 style="margin:0 0 12px;color:#1c3053;font-size:25px;">
        New Property Enquiry
      </h1>

      <div style="background:#f8f6f1;border-left:4px solid #ae884e;padding:18px;margin:25px 0;">
        <strong style="color:#1c3053;">
          ${escapeHtml(senderName)}
        </strong>

        <div style="margin-top:10px;color:#4b5563;">
          <strong>Email:</strong> ${escapeHtml(senderEmail)}
        </div>

        ${
          senderPhone
            ? `<div style="margin-top:6px;color:#4b5563;"><strong>Phone:</strong> ${escapeHtml(senderPhone)}</div>`
            : ""
        }

        ${
          propertyTitle
            ? `<div style="margin-top:10px;color:#4b5563;"><strong>Property:</strong> ${escapeHtml(propertyTitle)}</div>`
            : ""
        }

        ${
          propertyRef
            ? `<div style="margin-top:6px;color:#6b7280;"><strong>Reference:</strong> ${escapeHtml(propertyRef)}</div>`
            : ""
        }
      </div>

      <h3 style="color:#1c3053;">Message</h3>

      <div style="background:#f8f8f8;padding:18px;border-radius:10px;color:#4b5563;line-height:1.7;white-space:pre-wrap;">
        ${escapeHtml(message)}
      </div>
    `),
    replyTo: senderEmail,
  };
}
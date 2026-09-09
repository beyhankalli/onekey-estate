import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  emailShell,
  escapeHtml,
  formatDate,
  sendTransactionalEmail,
} from "@/lib/transactional-email";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getLondonDateParts() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const map = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
  };
}

function getTomorrowLondonDate() {
  const { year, month, day } = getLondonDateParts();
  const tomorrow = new Date(Date.UTC(year, month - 1, day + 1));

  return tomorrow.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;

    // Fail closed: the cron endpoint must never be accessible
    // when CRON_SECRET is missing or the request secret is invalid.
    if (!cronSecret) {
      console.error("CRON_SECRET is not configured.");

      return NextResponse.json(
        {
          success: false,
          error: "Cron authentication is not configured.",
        },
        { status: 500 }
      );
    }

    const authorization = request.headers.get("authorization");

    if (authorization !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const tomorrow = getTomorrowLondonDate();
    const supabase = getAdminClient();

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        id,
        viewing_date,
        start_time,
        end_time,
        customer_name,
        customer_email,
        customer_phone,
        status,
        property:properties(title, property_ref, full_address),
        agent:agents(name, email)
      `)
      .eq("viewing_date", tomorrow)
      .in("status", ["pending", "confirmed"]);

    if (error) {
      throw error;
    }

    let sent = 0;

    for (const booking of bookings || []) {
      const property = Array.isArray(booking.property)
        ? booking.property[0]
        : booking.property;

      const agent = Array.isArray(booking.agent)
        ? booking.agent[0]
        : booking.agent;

      const propertyTitle = property?.title || "Property viewing";

      const date = formatDate(booking.viewing_date);

      const time = `${String(booking.start_time).slice(0, 5)} - ${String(
        booking.end_time
      ).slice(0, 5)}`;

      if (booking.customer_email) {
        await sendTransactionalEmail({
          to: booking.customer_email,
          subject: `Viewing reminder for tomorrow | ${propertyTitle}`,
          replyTo: agent?.email || process.env.EMAIL_TO,
          idempotencyKey: `viewing-reminder-customer/${booking.id}/${tomorrow}`,
          html: emailShell(`
            <h1 style="margin:0 0 12px;color:#1c3053;font-size:26px;">
              Viewing reminder
            </h1>

            <p style="margin:0 0 24px;color:#4b5563;line-height:1.7;">
              Dear ${escapeHtml(
                booking.customer_name
              )}, this is a reminder that your property viewing is scheduled for tomorrow.
            </p>

            <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;padding:20px;line-height:1.8;">
              <strong>${escapeHtml(propertyTitle)}</strong><br />
              Reference: ${escapeHtml(property?.property_ref || "N/A")}<br />
              Date: ${escapeHtml(date)}<br />
              Time: ${escapeHtml(time)}<br />
              Address: ${escapeHtml(
                property?.full_address ||
                  "Please contact OneKey for the address"
              )}
            </div>
          `),
        });

        sent += 1;
      }

      if (agent?.email) {
        await sendTransactionalEmail({
          to: agent.email,
          subject: `Viewing reminder for tomorrow | ${propertyTitle}`,
          replyTo: booking.customer_email || undefined,
          idempotencyKey: `viewing-reminder-agent/${booking.id}/${tomorrow}`,
          html: emailShell(`
            <h1 style="margin:0 0 12px;color:#1c3053;font-size:26px;">
              Viewing reminder
            </h1>

            <p style="margin:0 0 24px;color:#4b5563;line-height:1.7;">
              Reminder for your property viewing tomorrow.
            </p>

            <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;padding:20px;line-height:1.8;">
              <strong>${escapeHtml(propertyTitle)}</strong><br />
              Reference: ${escapeHtml(property?.property_ref || "N/A")}<br />
              Date: ${escapeHtml(date)}<br />
              Time: ${escapeHtml(time)}<br /><br />

              Customer: ${escapeHtml(booking.customer_name)}<br />
              Email: ${escapeHtml(
                booking.customer_email || "Not provided"
              )}<br />
              Phone: ${escapeHtml(
                booking.customer_phone || "Not provided"
              )}
            </div>
          `),
        });

        sent += 1;
      }
    }

    return NextResponse.json({
      success: true,
      date: tomorrow,
      bookings: bookings?.length || 0,
      sent,
    });
  } catch (error) {
    console.error("Viewing reminder cron error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to send viewing reminders.",
      },
      { status: 500 }
    );
  }
}
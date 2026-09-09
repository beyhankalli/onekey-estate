import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  emailShell,
  escapeHtml,
  formatDate,
  sendTransactionalEmail,
} from "@/lib/transactional-email";

// Service role client: Used here specifically to read booking data securely.
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

type BookingProperty = {
  title: string | null;
  property_ref: string | null;
  full_address: string | null;
};

type BookingAgent = {
  name: string | null;
  email: string | null;
  phone: string | null;
};

type Booking = {
  id: string;
  viewing_date: string;
  start_time: string;
  end_time: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  status: string;
  created_at: string;
  property: BookingProperty | BookingProperty[] | null;
  agent: BookingAgent | BookingAgent[] | null;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId || typeof bookingId !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Booking ID is required.",
        },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    const { data, error } = await supabase
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
        created_at,
        property:properties(
          title,
          property_ref,
          full_address
        ),
        agent:agents(
          name,
          email,
          phone
        )
      `)
      .eq("id", bookingId)
      .single();

    if (error || !data) {
      console.error("Booking lookup error:", error);

      return NextResponse.json(
        {
          success: false,
          error: "Booking not found.",
        },
        { status: 404 }
      );
    }

    const booking = data as unknown as Booking;

    // Güvenlik Ekstra: Randevunun çok eski (örneğin 10 dakikadan önce oluşturulmuş) olmamasını denetle.
    // Bu sayede eski booking ID'leri ile tekrar tekrar bildirim tetiklenmesi önlenir.
    const createdAtTime = new Date(booking.created_at).getTime();
    const nowTime = Date.now();
    const tenMinutesInMs = 10 * 60 * 1000;

    if (isNaN(createdAtTime) || nowTime - createdAtTime > tenMinutesInMs) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized or expired notification request.",
        },
        { status: 403 }
      );
    }

    const property = Array.isArray(booking.property)
      ? booking.property[0]
      : booking.property;

    const agent = Array.isArray(booking.agent)
      ? booking.agent[0]
      : booking.agent;

    const date = formatDate(booking.viewing_date);

    const time = `${String(booking.start_time).slice(0, 5)} - ${String(
      booking.end_time
    ).slice(0, 5)}`;

    const propertyTitle = property?.title || "Property viewing";
    const reference = property?.property_ref || "N/A";

    const results: string[] = [];

    // Send confirmation to customer
    if (booking.customer_email) {
      await sendTransactionalEmail({
        to: booking.customer_email,
        subject: `Viewing request received | ${propertyTitle}`,
        replyTo: agent?.email || process.env.EMAIL_TO,
        idempotencyKey: `booking-created-customer/${booking.id}`,
        html: emailShell(`
          <h1 style="margin:0 0 12px;color:#1c3053;font-size:26px;">
            Viewing request received
          </h1>

          <p style="margin:0 0 24px;color:#4b5563;line-height:1.7;">
            Dear ${escapeHtml(booking.customer_name)}, your viewing request
            has been received. We will contact you once the appointment has
            been reviewed.
          </p>

          <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;padding:20px;line-height:1.8;">
            <strong>${escapeHtml(propertyTitle)}</strong><br />
            Reference: ${escapeHtml(reference)}<br />
            Date: ${escapeHtml(date)}<br />
            Time: ${escapeHtml(time)}<br />
            Status: <strong>Pending</strong>
          </div>
        `),
      });

      results.push("customer");
    }

    // Notify assigned agent
    if (agent?.email) {
      await sendTransactionalEmail({
        to: agent.email,
        subject: `New viewing request | ${propertyTitle}`,
        replyTo: booking.customer_email || undefined,
        idempotencyKey: `booking-created-agent/${booking.id}`,
        html: emailShell(`
          <h1 style="margin:0 0 12px;color:#1c3053;font-size:26px;">
            New viewing request
          </h1>

          <p style="margin:0 0 24px;color:#4b5563;line-height:1.7;">
            A new viewing request has been submitted for one of your
            properties.
          </p>

          <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;padding:20px;line-height:1.8;">
            <strong>${escapeHtml(propertyTitle)}</strong><br />
            Reference: ${escapeHtml(reference)}<br />
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

      results.push("agent");
    }

    // Notify main admin address
    const adminEmail = process.env.EMAIL_TO;

    if (adminEmail) {
      await sendTransactionalEmail({
        to: adminEmail,
        subject: `New viewing booking | ${propertyTitle}`,
        replyTo: booking.customer_email || undefined,
        idempotencyKey: `booking-created-admin/${booking.id}`,
        html: emailShell(`
          <h1 style="margin:0 0 12px;color:#1c3053;font-size:26px;">
            New viewing booking
          </h1>

          <p style="margin:0 0 24px;color:#4b5563;line-height:1.7;">
            A new viewing booking has been created on the OneKey website.
          </p>

          <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;padding:20px;line-height:1.8;">
            <strong>${escapeHtml(propertyTitle)}</strong><br />
            Reference: ${escapeHtml(reference)}<br />
            Date: ${escapeHtml(date)}<br />
            Time: ${escapeHtml(time)}<br /><br />

            Customer: ${escapeHtml(booking.customer_name)}<br />
            Email: ${escapeHtml(
              booking.customer_email || "Not provided"
            )}<br />
            Phone: ${escapeHtml(
              booking.customer_phone || "Not provided"
            )}<br />
            Agent: ${escapeHtml(agent?.name || "Unassigned")}
          </div>
        `),
      });

      results.push("admin");
    }

    return NextResponse.json({
      success: true,
      sent: results,
    });
  } catch (error) {
    console.error("Booking notification error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to send booking notifications.",
      },
      { status: 500 }
    );
  }
}
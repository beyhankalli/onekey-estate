import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
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

async function isAuthenticatedAdmin(request: Request): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase server environment variables.");
  }

  const cookieHeader = request.headers.get("cookie") ?? "";

  const cookies = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separatorIndex = part.indexOf("=");

      if (separatorIndex === -1) {
        return null;
      }

      return {
        name: part.slice(0, separatorIndex),
        value: part.slice(separatorIndex + 1),
      };
    })
    .filter(
      (cookie): cookie is { name: string; value: string } =>
        cookie !== null && cookie.name.length > 0
    );

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookies;
        },
        setAll() {
          // No auth-cookie updates are required by this API route.
        },
      },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return false;
  }

  const { data: isAdmin, error: adminError } =
    await supabase.rpc("is_admin_user");

  if (adminError) {
    console.error("Admin authorization check failed:", adminError);
    return false;
  }

  return isAdmin === true;
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
  property: BookingProperty | BookingProperty[] | null;
  agent: BookingAgent | BookingAgent[] | null;
};

export async function POST(request: Request) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Administrator access required.",
        },
        { status: 403 }
      );
    }

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

    if (error) {
      console.error("Booking lookup error:", error);

      return NextResponse.json(
        {
          success: false,
          error: "Booking not found.",
        },
        { status: 404 }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "Booking not found.",
        },
        { status: 404 }
      );
    }

    const booking = data as unknown as Booking;

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
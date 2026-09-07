import { cookies } from "next/headers";
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

  if (!url || !serviceRoleKey) throw new Error("Missing Supabase server environment variables.");

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function isAuthenticatedAdmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data } = await supabase.auth.getUser();
  return Boolean(data.user);
}

export async function POST(request: Request) {
  try {
    if (!(await isAuthenticatedAdmin())) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { bookingId, status } = await request.json();

    if (!bookingId || !status) {
      return NextResponse.json({ success: false, error: "Booking ID and status are required." }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(`
        id,
        viewing_date,
        start_time,
        end_time,
        customer_name,
        customer_email,
        customer_phone,
        property:properties(title, property_ref, full_address),
        agent:agents(name, email)
      `)
      .eq("id", bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json({ success: false, error: "Booking not found." }, { status: 404 });
    }

    if (!booking.customer_email) {
      return NextResponse.json({ success: true, skipped: true, reason: "Customer has no email address." });
    }

    const property = Array.isArray(booking.property) ? booking.property[0] : booking.property;
    const agent = Array.isArray(booking.agent) ? booking.agent[0] : booking.agent;
    const propertyTitle = property?.title || "Property viewing";
    const date = formatDate(booking.viewing_date);
    const time = `${String(booking.start_time).slice(0, 5)} - ${String(booking.end_time).slice(0, 5)}`;

    const statusCopy: Record<string, { title: string; message: string; color: string }> = {
      confirmed: {
        title: "Viewing confirmed",
        message: "Your viewing has been confirmed by our team.",
        color: "#15803d",
      },
      rejected: {
        title: "Viewing request update",
        message: "Unfortunately, we are unable to confirm this viewing request.",
        color: "#b91c1c",
      },
      cancelled: {
        title: "Viewing cancelled",
        message: "This viewing has been cancelled. Please contact us if you would like to arrange another time.",
        color: "#4b5563",
      },
      pending: {
        title: "Viewing request pending",
        message: "Your viewing request is currently pending review.",
        color: "#1d4ed8",
      },
    };

    const copy = statusCopy[status] || {
      title: "Viewing status updated",
      message: `Your viewing status has been updated to ${status}.`,
      color: "#1c3053",
    };

    await sendTransactionalEmail({
      to: booking.customer_email,
      subject: `${copy.title} | ${propertyTitle}`,
      replyTo: agent?.email || process.env.EMAIL_TO,
      idempotencyKey: `booking-status/${booking.id}/${status}`,
      html: emailShell(`
        <h1 style="margin:0 0 12px;color:#1c3053;font-size:26px;">${escapeHtml(copy.title)}</h1>
        <p style="margin:0 0 24px;color:#4b5563;line-height:1.7;">Dear ${escapeHtml(booking.customer_name)}, ${escapeHtml(copy.message)}</p>
        <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;padding:20px;line-height:1.8;">
          <strong>${escapeHtml(propertyTitle)}</strong><br />
          Reference: ${escapeHtml(property?.property_ref || "N/A")}<br />
          Date: ${escapeHtml(date)}<br />
          Time: ${escapeHtml(time)}<br />
          Status: <strong style="color:${copy.color};">${escapeHtml(status)}</strong>
        </div>
      `),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Booking status email error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to send the booking status email." },
      { status: 500 }
    );
  }
}

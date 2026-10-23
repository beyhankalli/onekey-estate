
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function getUKDate(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function isValidTime(value: string): boolean {
  if (!/^\d{2}:\d{2}:\d{2}$/.test(value)) return false;

  const [hours, minutes, seconds] = value.split(":").map(Number);

  return (
    hours >= 0 &&
    hours <= 23 &&
    minutes >= 0 &&
    minutes <= 59 &&
    seconds >= 0 &&
    seconds <= 59
  );
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid request body.", 400);
    }

    const {
      propertyId,
      customerName,
      customerEmail,
      customerPhone,
      viewingDate,
      startTime,
      endTime,
    } = body;

    if (
      typeof propertyId !== "string" ||
      !UUID_REGEX.test(propertyId) ||
      typeof customerName !== "string" ||
      !customerName.trim() ||
      customerName.trim().length > 150 ||
      typeof customerEmail !== "string" ||
      !EMAIL_REGEX.test(customerEmail.trim()) ||
      customerEmail.trim().length > 254 ||
      typeof customerPhone !== "string" ||
      !customerPhone.trim() ||
      customerPhone.trim().length > 40 ||
      typeof viewingDate !== "string" ||
      !isValidCalendarDate(viewingDate) ||
      typeof startTime !== "string" ||
      !isValidTime(startTime) ||
      typeof endTime !== "string" ||
      !isValidTime(endTime)
    ) {
      return errorResponse("Please provide valid booking details.", 400);
    }

    if (viewingDate < getUKDate()) {
      return errorResponse(
        "You cannot schedule a viewing for a past date.",
        400
      );
    }

    if (endTime <= startTime) {
      return errorResponse(
        "The end time must be after the start time.",
        400
      );
    }

    const supabase = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      return errorResponse("Unable to verify your session.", 401);
    }

    let customerId: string | null = null;

    if (user) {
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (customerError) {
        console.error("Customer lookup failed:", customerError);
        return errorResponse("Unable to verify customer details.", 500);
      }

      if (!customer) {
        return errorResponse(
          "Your account is not linked to a customer record. Please contact support.",
          403
        );
      }

      customerId = customer.id;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing server-side Supabase configuration.");
      return errorResponse("Server configuration error.", 500);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: bookingId, error } = await admin.rpc("create_booking", {
      p_property_id: propertyId,
      p_customer_id: customerId,
      p_customer_name: customerName.trim(),
      p_customer_email: customerEmail.trim(),
      p_customer_phone: customerPhone.trim(),
      p_viewing_date: viewingDate,
      p_start_time: startTime,
      p_end_time: endTime,
    });

    if (error || !bookingId) {
      console.error("Booking creation failed:", error);

      const message = error?.message ?? "";

      if (/already booked|not available|past date|past/i.test(message)) {
        return errorResponse(
          "This viewing time is no longer available. Please select another slot.",
          409
        );
      }

      return errorResponse(
        "Unable to create the booking. Please try again.",
        500
      );
    }

    const notificationSecret = process.env.BOOKING_NOTIFICATION_SECRET;

    const configuredUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL;

    const appUrl = configuredUrl
      ? configuredUrl
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : null;

    if (!notificationSecret || !appUrl) {
      console.error(
        "Booking created, but notification configuration is missing."
      );

      return NextResponse.json(
        {
          success: true,
          bookingId,
          notificationSent: false,
        },
        { status: 201 }
      );
    }

    try {
      const baseUrl = appUrl.replace(/\/+$/, "");

      const notificationResponse = await fetch(
        `${baseUrl}/api/bookings/notify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${notificationSecret}`,
          },
          body: JSON.stringify({ bookingId }),
          cache: "no-store",
        }
      );

      if (!notificationResponse.ok) {
        console.error(
          "Booking notification failed with status:",
          notificationResponse.status
        );
      }

      return NextResponse.json(
        {
          success: true,
          bookingId,
          notificationSent: notificationResponse.ok,
        },
        { status: 201 }
      );
    } catch (notificationError) {
      console.error(
        "Booking notification request failed:",
        notificationError
      );

      return NextResponse.json(
        {
          success: true,
          bookingId,
          notificationSent: false,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Booking API error:", error);

    return errorResponse("An unexpected server error occurred.", 500);
  }
}

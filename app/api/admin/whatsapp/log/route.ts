import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function normalizePhone(phone: string) {
  let value = phone.replace(/[^\d+]/g, "");

  if (value.startsWith("+")) {
    value = value.slice(1);
  }

  if (value.startsWith("00")) {
    value = value.slice(2);
  }

  if (value.startsWith("07")) {
    value = `44${value.slice(1)}`;
  }

  if (value.startsWith("7") && value.length === 10) {
    value = `44${value}`;
  }

  return value;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminError) {
      console.error("Admin verification error:", adminError);

      return NextResponse.json(
        {
          success: false,
          error: "Unable to verify admin access.",
        },
        { status: 500 }
      );
    }

    if (!adminUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin access required.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const customerId =
      typeof body.customerId === "string" && body.customerId.trim()
        ? body.customerId.trim()
        : null;

    const agentId =
      typeof body.agentId === "string" && body.agentId.trim()
        ? body.agentId.trim()
        : null;

    const propertyId =
      typeof body.propertyId === "string" && body.propertyId.trim()
        ? body.propertyId.trim()
        : null;

    const rawPhone =
      typeof body.phoneNumber === "string"
        ? body.phoneNumber.trim()
        : "";

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    const templateKey =
      typeof body.templateKey === "string" && body.templateKey.trim()
        ? body.templateKey.trim()
        : null;

    if (!rawPhone) {
      return NextResponse.json(
        {
          success: false,
          error: "WhatsApp phone number is required.",
        },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: "Message is required.",
        },
        { status: 400 }
      );
    }

    const phoneNumber = normalizePhone(rawPhone);

    if (phoneNumber.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid WhatsApp phone number.",
        },
        { status: 400 }
      );
    }

    const { data: log, error: logError } = await supabase
      .from("whatsapp_message_logs")
      .insert({
        customer_id: customerId,
        agent_id: agentId,
        property_id: propertyId,
        phone_number: phoneNumber,
        message,
        template_key: templateKey,
        status: "opened",
        created_by: user.id,
      })
      .select()
      .single();

    if (logError) {
      console.error("WhatsApp log error:", logError);

      return NextResponse.json(
        {
          success: false,
          error: logError.message,
        },
        { status: 500 }
      );
    }

    if (customerId) {
      const { error: activityError } = await supabase
        .from("lead_activities")
        .insert({
          customer_id: customerId,
          agent_id: agentId,
          activity_type: "whatsapp",
          subject: templateKey
            ? `WhatsApp: ${templateKey}`
            : "WhatsApp conversation",
          description: message,
          outcome: "WhatsApp conversation opened",
          created_by: user.id,
        });

      if (activityError) {
        console.error(
          "WhatsApp lead activity error:",
          activityError
        );
      }
    }

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;

    return NextResponse.json({
      success: true,
      log,
      phoneNumber,
      whatsappUrl,
    });
  } catch (error: unknown) {
    console.error("WhatsApp integration error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "WhatsApp integration failed.",
      },
      { status: 500 }
    );
  }
}
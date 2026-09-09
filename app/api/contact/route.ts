import { NextResponse } from "next/server";
import { getAdminEmail, newMessageEmail, sendEmail } from "@/lib/email";

// In-memory rate limiter to prevent spam/abuse on the public contact form
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

function applyRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting Check
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    if (!applyRateLimit(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many requests. Please wait a minute before submitting another message.",
        },
        { status: 429 }
      );
    }

    const body = await request.json();

    const {
      name,
      email,
      phone,
      message,
      propertyTitle,
      propertyRef,
    } = body;

    // En az bir iletişim yöntemi (email veya phone) ve name ile message zorunlu kılındı
    if (!name?.trim() || !message?.trim() || (!email?.trim() && !phone?.trim())) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, message, and at least one contact method (email or phone) are required.",
        },
        { status: 400 }
      );
    }

    // Eğer kullanıcı email girmediyse, transactional mail fonksiyonu için fallback email tanımlanır
    const contactEmail = email?.trim() || "no-email@onekey.co.uk";

    const emailData = newMessageEmail({
      senderName: name.trim(),
      senderEmail: contactEmail,
      senderPhone: phone?.trim() || null,
      message: message.trim(),
      propertyTitle: propertyTitle?.trim() || null,
      propertyRef: propertyRef?.trim() || null,
    });

    const result = await sendEmail(emailData);

    console.log("Contact email sent:", {
      id: result?.id,
      to: getAdminEmail(),
    });

    return NextResponse.json({
      success: true,
      message: "Your message has been sent successfully.",
    });
  } catch (error) {
    console.error("Contact email error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to send your message right now.",
      },
      { status: 500 }
    );
  }
}
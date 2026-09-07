import { NextResponse } from "next/server";
import { getAdminEmail, newMessageEmail, sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      name,
      email,
      phone,
      message,
      propertyTitle,
      propertyRef,
    } = body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, email and message are required.",
        },
        { status: 400 }
      );
    }

    const emailData = newMessageEmail({
      senderName: name.trim(),
      senderEmail: email.trim(),
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

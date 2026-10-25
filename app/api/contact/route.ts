import { NextResponse } from "next/server";
import {
  newMessageEmail,
  sendTransactionalEmail,
} from "@/lib/transactional-email";
import { createClient } from "@/lib/supabase/server";

const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_BODY_SIZE_BYTES = 10 * 1024;

const rateLimitMap = new Map<
  string,
  { count: number; resetTime: number }
>();

const MAX_LENGTHS = {
  name: 100,
  email: 255,
  phone: 50,
  message: 2000,
  propertyTitle: 200,
  propertyRef: 100,
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class PayloadTooLargeError extends Error {
  constructor() {
    super("Request payload exceeds maximum allowed size.");
    this.name = "PayloadTooLargeError";
  }
}

/**
 * Reads the request body while enforcing a byte limit.
 * The body is cancelled immediately when the limit is exceeded.
 */
async function readRequestBodyLimited(
  request: Request,
  maxBytes: number,
): Promise<string> {
  const contentLength = request.headers.get("content-length");

  if (contentLength !== null && /^\d+$/.test(contentLength)) {
    if (Number(contentLength) > maxBytes) {
      throw new PayloadTooLargeError();
    }
  }

  if (!request.body) {
    return "";
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;
      if (!value) continue;

      totalBytes += value.byteLength;

      if (totalBytes > maxBytes) {
        try {
          await reader.cancel("Request body exceeds size limit.");
        } catch {
          // The request is already rejected; cancellation can fail if closed.
        }

        throw new PayloadTooLargeError();
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bodyBytes = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    bodyBytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder("utf-8", { fatal: true }).decode(bodyBytes);
}

function cleanupRateLimitMap() {
  const now = Date.now();

  for (const [ip, record] of rateLimitMap.entries()) {
    if (now >= record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}

function applyRateLimit(ip: string): boolean {
  const now = Date.now();
  cleanupRateLimitMap();

  const record = rateLimitMap.get(ip);

  if (!record || now >= record.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

function isOptionalString(
  value: unknown,
): value is string | null | undefined {
  return value === undefined || value === null || typeof value === "string";
}

export async function POST(request: Request) {
  let rawText: string;

  try {
    rawText = await readRequestBodyLimited(request, MAX_BODY_SIZE_BYTES);
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return jsonError(
        "Request payload exceeds maximum allowed size.",
        413,
      );
    }

    if (error instanceof TypeError) {
      // TextDecoder throws TypeError for invalid UTF-8 when fatal is enabled.
      return jsonError("Request body must be valid UTF-8.", 400);
    }

    console.error("Failed to read contact request body:", error);
    return jsonError("Unable to read the request body.", 400);
  }

  // This Map is local to one server instance; it is not distributed protection.
  // Trust x-forwarded-for only when the hosting platform sets it securely.
  const forwardedHeader = request.headers.get("x-forwarded-for");
  const ip = forwardedHeader?.split(",")[0]?.trim() || "127.0.0.1";

  if (!applyRateLimit(ip)) {
    return jsonError(
      "Too many requests. Please wait a minute before submitting another message.",
      429,
    );
  }

  let body: unknown;

  try {
    body = JSON.parse(rawText);
  } catch {
    return jsonError("Invalid or malformed JSON payload.", 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonError("Request body must be a JSON object.", 400);
  }

  const data = body as Record<string, unknown>;
  const {
    name,
    email,
    phone,
    message,
    propertyTitle,
    propertyRef,
  } = data;

  if (
    typeof name !== "string" ||
    typeof message !== "string" ||
    !isOptionalString(email) ||
    !isOptionalString(phone) ||
    !isOptionalString(propertyTitle) ||
    !isOptionalString(propertyRef)
  ) {
    return jsonError("Invalid field data types provided.", 400);
  }

  const trimmedName = name.trim();
  const trimmedEmail = typeof email === "string" ? email.trim() : "";
  const trimmedPhone = typeof phone === "string" ? phone.trim() : "";
  const trimmedMessage = message.trim();
  const trimmedPropertyTitle =
    typeof propertyTitle === "string" ? propertyTitle.trim() || null : null;
  const trimmedPropertyRef =
    typeof propertyRef === "string" ? propertyRef.trim() || null : null;

  if (!trimmedName || !trimmedMessage || (!trimmedEmail && !trimmedPhone)) {
    return jsonError(
      "Name, message, and at least one contact method (email or phone) are required.",
      400,
    );
  }

  if (
    trimmedName.length > MAX_LENGTHS.name ||
    trimmedMessage.length > MAX_LENGTHS.message ||
    trimmedEmail.length > MAX_LENGTHS.email ||
    trimmedPhone.length > MAX_LENGTHS.phone ||
    (trimmedPropertyTitle?.length ?? 0) > MAX_LENGTHS.propertyTitle ||
    (trimmedPropertyRef?.length ?? 0) > MAX_LENGTHS.propertyRef
  ) {
    return jsonError(
      "One or more fields exceed the maximum allowed length.",
      400,
    );
  }

  if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
    return jsonError("Please provide a valid email address.", 400);
  }

  try {
    const supabase = await createClient();

    const { error: dbError } = await supabase
      .from("contact_messages")
      .insert({
        name: trimmedName,
        email: trimmedEmail || null,
        phone: trimmedPhone || null,
        message: trimmedMessage,
        property_title: trimmedPropertyTitle,
        property_ref: trimmedPropertyRef,
        status: "unread",
      });

    if (dbError) {
      console.error("Contact message database insert failed:", dbError);
      return jsonError(
        "Unable to record your message at this time. Please try again later.",
        500,
      );
    }

    try {
      const emailData = newMessageEmail({
        senderName: trimmedName,
        senderEmail: trimmedEmail || "",
        senderPhone: trimmedPhone || "",
        message: trimmedMessage,
        propertyTitle: trimmedPropertyTitle,
        propertyRef: trimmedPropertyRef,
      });

      await sendTransactionalEmail(emailData);
    } catch (emailError) {
      // The enquiry is already stored. This log is not a retry mechanism.
      console.error(
        "Contact enquiry stored, but notification email failed:",
        emailError,
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your message has been sent successfully.",
    });
  } catch (error) {
    console.error("Unexpected contact API error:", error);
    return jsonError(
      "An unexpected error occurred while processing your request.",
      500,
    );
  }
}
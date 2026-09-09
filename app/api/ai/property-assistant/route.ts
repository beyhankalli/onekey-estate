import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Simple in-memory rate limiter to protect Gemini API quota.
// Note: In serverless (Vercel), this memory is isolated per-instance and clears 
// on cold starts, but it's enough to stop a basic single-instance spam loop.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX_REQUESTS = 10;
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

type Property = {
  id: string;
  title: string | null;
  property_ref: string | null;
  short_location: string | null;
  // full_address and postcode purposely omitted from the AI context to protect privacy
  monthly_rent: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  availability_status: string | null;
  pets_allowed: boolean | null;
  garden: boolean | null;
  parking: boolean | null;
  student_friendly: boolean | null;
  families_allowed: boolean | null;
  dss_lha_covers_rent: boolean | null;
  council_tax_band: string | null;
  heating_type: string | null;
  tenure: string | null;
  minimum_tenancy: string | null;
  model_3d_url: string | null;
  virtual_tour_url: string | null;
  description: string | null;
  property_images?: {
    url: string;
    image_type?: string | null;
  }[];
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function cleanText(value: unknown, maxLength = 500): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function formatProperty(property: Property) {
  return {
    id: property.id,
    title: property.title,
    reference: property.property_ref,
    location: property.short_location,
    // explicitly NOT sending full_address or postcode to the LLM
    rent_pcm: property.monthly_rent,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    availability: property.availability_status,
    pets_allowed: property.pets_allowed,
    garden: property.garden,
    parking: property.parking,
    student_friendly: property.student_friendly,
    families_allowed: property.families_allowed,
    dss_lha_covers_rent: property.dss_lha_covers_rent,
    council_tax_band: property.council_tax_band,
    heating_type: property.heating_type,
    tenure: property.tenure,
    minimum_tenancy: property.minimum_tenancy,
    has_3d_model: Boolean(property.model_3d_url),
    has_virtual_tour: Boolean(property.virtual_tour_url),
    description: cleanText(property.description, 700),
    image:
      property.property_images?.find(
        (image) => image.image_type === "main"
      )?.url ??
      property.property_images?.[0]?.url ??
      null,
  };
}

function extractPropertyIds(text: string): string[] {
  const match = text.match(/PROPERTY_IDS:\s*([^\n\r]+)/i);

  if (!match) return [];

  return match[1]
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function removePropertyMarker(text: string): string {
  return text
    .replace(/PROPERTY_IDS:\s*[^\n\r]*/gi, "")
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    // 1. Rate Limiting Check
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    if (!applyRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a minute before sending another message." },
        { status: 429 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Gemini API is not configured. Add GEMINI_API_KEY to the environment.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const message = cleanText(body?.message, 1200);

    if (!message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    const history: ChatMessage[] = Array.isArray(body?.history)
      ? body.history
          .filter(
            (item: unknown): item is ChatMessage =>
              typeof item === "object" &&
              item !== null &&
              "role" in item &&
              "content" in item &&
              ((item as ChatMessage).role === "user" ||
                (item as ChatMessage).role === "assistant") &&
              typeof (item as ChatMessage).content === "string"
          )
          .slice(-8)
          .map((item: ChatMessage) => ({
            role: item.role,
            content: cleanText(item.content, 1200),
          }))
      : [];

    const currentPropertyId =
      typeof body?.currentPropertyId === "string"
        ? body.currentPropertyId
        : null;

    const supabase = await createClient();

    // 2. Fetch properties but exclude full_address and postcode at the query level
    const { data: properties, error: propertiesError } = await supabase
      .from("properties")
      .select(
        `
        id,
        title,
        property_ref,
        short_location,
        monthly_rent,
        bedrooms,
        bathrooms,
        availability_status,
        pets_allowed,
        garden,
        parking,
        student_friendly,
        families_allowed,
        dss_lha_covers_rent,
        council_tax_band,
        heating_type,
        tenure,
        minimum_tenancy,
        model_3d_url,
        virtual_tour_url,
        description,
        property_images(url, image_type)
      `
      )
      .order("created_at", { ascending: false })
      .limit(100); // Reduced limit from 150 to 100 to save AI token cost and stay within reliable context windows

    if (propertiesError) {
      console.error("Property catalogue error:", propertiesError);
      return NextResponse.json(
        { error: "Unable to load property catalogue." },
        { status: 500 }
      );
    }

    const allProperties = (properties ?? []) as Property[];

    const availableProperties = allProperties.filter(
      (property) =>
        property.availability_status?.toLowerCase() === "available"
    );

    const currentProperty = currentPropertyId
      ? allProperties.find(
          (property) => String(property.id) === currentPropertyId
        )
      : null;

    const catalogue = availableProperties.map(formatProperty);

    const currentContext = currentProperty
      ? `
CURRENT PROPERTY PAGE

The user is currently viewing this property:

${JSON.stringify(formatProperty(currentProperty), null, 2)}

When answering questions about "this property", "this house", "this one", etc., use this property as the primary context.
`
      : "";

    const systemInstruction = `
You are OneKey AI, the property assistant for OneKey Estate Agency in Norwich, UK.

Your job is to help users find and understand properties listed by OneKey Estate Agency.

CRITICAL RULES:

1. ONLY use property information contained in the PROPERTY CATALOGUE below.
2. Never invent a property, price, location, feature, availability status, or other fact.
3. If the catalogue does not contain the requested information, clearly say that you do not have that information.
4. Never claim that a property is available unless its catalogue availability says "Available".
5. Prices are monthly rent in GBP unless explicitly stated otherwise.
6. Use UK English.
7. Be concise, natural and helpful.
8. If the user asks for recommendations, identify the best matching properties from the catalogue.
9. If the user gives requirements such as budget, bedrooms, pets, students, parking, garden or location, use those requirements to filter the catalogue.
10. Do not expose internal database details.
11. Do not mention PROPERTY_IDS unless specifically asked.
12. You are an assistant for OneKey Estate Agency, not a general-purpose chatbot.
13. You may answer general questions about the property-search process, but property-specific facts must come from the catalogue.
14. If no property matches the user's requirements, say so and suggest relaxing one requirement.
15. At the end of every response involving property recommendations, add:
PROPERTY_IDS: id1,id2,id3

Only include IDs that actually exist in the catalogue and that you genuinely recommended.

PROPERTY CATALOGUE:

${JSON.stringify(catalogue, null, 2)}

${currentContext}
`;

    const contents = [
      ...history.map((item) => ({
        role: item.role === "assistant" ? "model" : "user",
        parts: [{ text: item.content }],
      })),
      {
        role: "user",
        parts: [{ text: message }],
      },
    ];

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemInstruction }],
          },
          contents,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 700,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);

      return NextResponse.json(
        {
          error:
            "The AI assistant is temporarily unavailable. Please try again.",
        },
        { status: 502 }
      );
    }

    const data = await response.json();

    const generatedText =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text ?? "")
        .join("")
        .trim() ?? "";

    if (!generatedText) {
      return NextResponse.json(
        {
          error:
            "The AI assistant could not generate a response. Please try again.",
        },
        { status: 502 }
      );
    }

    const recommendedIds = extractPropertyIds(generatedText);
    const answer = removePropertyMarker(generatedText);

    // Filter server-side to ensure the AI didn't hallucinate an ID of an unavailable property
    const recommendedProperties = recommendedIds
      .map((id) =>
        availableProperties.find((property) => String(property.id) === String(id))
      )
      .filter(Boolean)
      .map((property) => formatProperty(property as Property));

    return NextResponse.json({
      answer,
      recommendations: recommendedProperties,
    });
  } catch (error) {
    console.error("Property assistant error:", error);

    return NextResponse.json(
      {
        error:
          "Something went wrong with the property assistant. Please try again.",
      },
      { status: 500 }
    );
  }
}
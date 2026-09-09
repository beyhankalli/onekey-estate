import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ==========================================
// MASTER V2 - MADDE 21: RATE LIMITER
// ==========================================
// Not: Upstash (Redis) entegrasyonu olmadığı için Vercel ortamında en güvenilir 
// memory tabanlı Token Bucket algoritması kullanılmıştır.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX_REQUESTS = 7; // Dakikada maksimum 7 mesaj
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 dakika

function applyRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  // Süresi dolmuş kayıtları temizle (Memory leak önlemi)
  if (rateLimitMap.size > 1000) {
    rateLimitMap.clear();
  }

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
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
    rent_pcm: property.monthly_rent,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    availability: property.availability_status,
    pets_allowed: property.pets_allowed,
    garden: property.garden,
    parking: property.parking,
    student_friendly: property.student_friendly,
    families_allowed: property.families_allowed,
    has_3d_model: Boolean(property.model_3d_url),
    has_virtual_tour: Boolean(property.virtual_tour_url),
    description: cleanText(property.description, 400), // Token optimizasyonu için açıklama kısaltıldı
  };
}

// ==========================================
// MASTER V2 - MADDE 25: AI RETRIEVAL & FILTERING
// ==========================================
// 100 ilanı birden LLM'e göndermek yerine, kullanıcının mesajına göre
// en alakalı 12 ilanı seçen akıllı puanlama (heuristic scoring) sistemi.
function getRelevantProperties(properties: Property[], userMessage: string, currentPropertyId: string | null): Property[] {
  const msg = userMessage.toLowerCase();
  
  // Basit niyet çıkarımı
  const bedMatch = msg.match(/(\d+)\s*(bed|bedroom)/);
  const targetBeds = bedMatch ? parseInt(bedMatch[1], 10) : null;
  
  const budgetMatch = msg.match(/(under|max|budget)[^\d]*£?(\d+)/);
  const targetBudget = budgetMatch ? parseInt(budgetMatch[2], 10) : null;
  
  const wantsGarden = msg.includes("garden") || msg.includes("yard");
  const wantsParking = msg.includes("parking") || msg.includes("garage") || msg.includes("driveway");
  const wantsPets = msg.includes("pet") || msg.includes("dog") || msg.includes("cat");

  const searchTerms = msg.split(/\s+/).filter(w => w.length > 3);

  const scored = properties.map(p => {
    let score = 0;
    
    // Açık olan sayfanın ilanı her zaman en yüksek puanı alır
    if (currentPropertyId === p.id) score += 100;
    
    // Niyet Eşleşmeleri
    if (targetBeds && p.bedrooms && p.bedrooms >= targetBeds) score += 20;
    if (targetBudget && p.monthly_rent && p.monthly_rent <= targetBudget) score += 20;
    if (wantsGarden && p.garden) score += 10;
    if (wantsParking && p.parking) score += 10;
    if (wantsPets && p.pets_allowed) score += 15;

    // Kelime Eşleşmeleri
    searchTerms.forEach(term => {
      if (p.short_location?.toLowerCase().includes(term)) score += 15;
      if (p.title?.toLowerCase().includes(term)) score += 5;
    });

    return { property: p, score };
  });

  // Puana göre sırala ve en yüksek puanlı 12 tanesini al
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map(s => s.property);
}

function extractPropertyIds(text: string): string[] {
  const match = text.match(/PROPERTY_IDS:\s*([^\n\r]+)/i);
  if (!match) return [];
  return match[1].split(",").map((id) => id.trim()).filter(Boolean).slice(0, 6);
}

function removePropertyMarker(text: string): string {
  return text.replace(/PROPERTY_IDS:\s*[^\n\r]*/gi, "").trim();
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Güvenilir IP veya User ID tanımlaması
    const clientIp = 
      request.headers.get("x-real-ip") ?? 
      request.headers.get("x-forwarded-for")?.split(",")[0] ?? 
      "127.0.0.1";
      
    const rateLimitIdentifier = user?.id || clientIp;

    if (!applyRateLimit(rateLimitIdentifier)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a minute before sending another message." },
        { status: 429 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API is not configured. Add GEMINI_API_KEY to the environment." },
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
          .slice(-6) // Token tasarrufu için geçmiş mesaj sayısını 6'ya düşürdük
          .map((item: ChatMessage) => ({
            role: item.role,
            content: cleanText(item.content, 1200),
          }))
      : [];

    const currentPropertyId = typeof body?.currentPropertyId === "string" ? body.currentPropertyId : null;

    // Sadece yayında olanları çekiyoruz
    const { data: properties, error: propertiesError } = await supabase
      .from("properties")
      .select(`
        id, title, property_ref, short_location, monthly_rent, bedrooms, bathrooms,
        availability_status, pets_allowed, garden, parking, student_friendly,
        families_allowed, dss_lha_covers_rent, council_tax_band, heating_type,
        tenure, minimum_tenancy, model_3d_url, virtual_tour_url, description
      `)
      .eq("status", "Published")
      .order("created_at", { ascending: false })
      .limit(100); // 100 tane çekiyoruz ama LLM'e hepsini yollamayacağız

    if (propertiesError) {
      console.error("Property catalogue error:", propertiesError);
      return NextResponse.json({ error: "Unable to load property catalogue." }, { status: 500 });
    }

    const allProperties = (properties ?? []) as Property[];
    const availableProperties = allProperties.filter(
      (property) => property.availability_status?.toLowerCase() === "available"
    );

    // Madde 25: 100 ilanı 12 ilana düşürüyoruz!
    const filteredProperties = getRelevantProperties(availableProperties, message, currentPropertyId);
    const catalogue = filteredProperties.map(formatProperty);

    const currentProperty = currentPropertyId
      ? allProperties.find((property) => String(property.id) === currentPropertyId)
      : null;

    const currentContext = currentProperty
      ? `\nCURRENT PROPERTY THE USER IS LOOKING AT:\n${JSON.stringify(formatProperty(currentProperty), null, 2)}\nWhen answering questions about "this property", use this specific property as the primary context.`
      : "";

    const systemInstruction = `
You are OneKey AI, the property assistant for OneKey Estate Agency in Norwich, UK.

CRITICAL RULES:
1. ONLY use property information contained in the PROPERTY CATALOGUE below.
2. Never invent a property, price, location, or feature.
3. If the catalogue does not contain the requested information, clearly say that you do not have that information.
4. Use UK English. Be concise, natural and helpful.
5. If the user gives requirements (budget, beds, pets), use them to recommend the best matching properties from the catalogue.
6. Do not mention PROPERTY_IDS unless specifically asked.
7. At the end of every response involving property recommendations, MUST add exactly:
PROPERTY_IDS: id1,id2,id3

Only include IDs that actually exist in the catalogue and that you genuinely recommended.

PROPERTY CATALOGUE (TOP RELEVANT MATCHES):
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

    // ==========================================
    // MASTER V2 - MADDE 24: AI TIMEOUT & ABORT CONTROLLER
    // ==========================================
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 saniye maksimum süre

    let response;
    try {
      response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents,
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 600,
            },
          }),
          signal: controller.signal, // Timeout Sinyali
        }
      );
    } catch (fetchError: any) {
      if (fetchError.name === "AbortError") {
        return NextResponse.json(
          { error: "The AI assistant took too long to respond. Please try again." },
          { status: 504 } // Gateway Timeout
        );
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId); // İşlem bittiyse zamanlayıcıyı temizle
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      return NextResponse.json(
        { error: "The AI assistant is temporarily unavailable. Please try again." },
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
        { error: "The AI assistant could not generate a response. Please try again." },
        { status: 502 }
      );
    }

    const recommendedIds = extractPropertyIds(generatedText);
    const answer = removePropertyMarker(generatedText);

    // AI'ın halüsinasyon görüp görmediğini backend tarafında tekrar doğruluyoruz
    const recommendedProperties = recommendedIds
      .map((id) =>
        filteredProperties.find((property) => String(property.id) === String(id))
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
      { error: "Something went wrong with the property assistant. Please try again." },
      { status: 500 }
    );
  }
}
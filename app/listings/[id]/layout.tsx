import type { Metadata } from "next";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

type PropertyImage = {
  url: string;
  image_type: string | null;
};

type PropertySeoData = {
  title: string | null;
  description: string | null;
  full_address: string | null;
  short_location: string | null;
  monthly_rent: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  property_ref: string | null;
  availability_status: string | null;
  property_images: PropertyImage[] | null;
};

async function getPropertyForSeo(id: string): Promise<PropertySeoData | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  // status = Published filtresi eklendi (Güvenlik Master v2 - Madde 5)
  const query = new URLSearchParams({
    id: `eq.${id}`,
    status: "eq.Published",
    select:
      "title,description,full_address,short_location,monthly_rent,bedrooms,bathrooms,property_ref,availability_status,property_images(url,image_type)",
    limit: "1",
  });

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/properties?${query.toString()}`,
      {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as PropertySeoData[];

    return data[0] ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: LayoutProps): Promise<Metadata> {
  const { id } = await params;
  const property = await getPropertyForSeo(id);

  if (!property) {
    return {
      title: "Property | OneKey Estate Agency",
      description:
        "View property details, photos, availability and book a viewing with OneKey Estate Agency.",
    };
  }

  const title = property.title?.trim() || "Property";
  const location =
    property.short_location?.trim() ||
    property.full_address?.trim() ||
    "United Kingdom";

  const cleanDescription = property.description
    ?.replace(/\s+/g, " ")
    .trim();

  const description =
    cleanDescription ||
    `${title} available in ${location}. View photos, property details, pricing and viewing information with OneKey Estate Agency.`;

  const image =
    property.property_images?.find(
      (item) => item.image_type === "interior" && item.url
    )?.url ||
    property.property_images?.find((item) => Boolean(item.url))?.url;

  const metadataTitle = `${title} | OneKey Estate Agency`;

  return {
    title: metadataTitle,
    description: description.slice(0, 160),
    openGraph: {
      title: metadataTitle,
      description: description.slice(0, 160),
      type: "website",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: metadataTitle,
      description: description.slice(0, 160),
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default function PropertyDetailsLayout({
  children,
}: LayoutProps) {
  return children;
}
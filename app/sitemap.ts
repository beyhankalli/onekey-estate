import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://onekey-estate.vercel.app";

type Property = {
  id: string;
  created_at: string | null;
  updated_at?: string | null;
};

async function getProperties(): Promise<Property[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return [];
  }

  const query = new URLSearchParams({
    select: "id,created_at,updated_at",
    availability_status: "neq.let_agreed",
    order: "created_at.desc",
  });

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/properties?${query.toString()}`,
      {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        next: {
          revalidate: 300,
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as Property[];

    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const properties = await getProperties();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/listings`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/reviews`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const propertyPages: MetadataRoute.Sitemap =
    properties.map((property) => ({
      url: `${siteUrl}/listings/${property.id}`,
      lastModified: property.updated_at
        ? new Date(property.updated_at)
        : property.created_at
          ? new Date(property.created_at)
          : new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    }));

  return [...staticPages, ...propertyPages];
}
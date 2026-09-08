import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseHostname = supabaseUrl
  ? (() => {
      try {
        return new URL(supabaseUrl).hostname;
      } catch {
        return null;
      }
    })()
  : null;

const remotePatterns = [
  {
    protocol: "https" as const,
    hostname: "images.unsplash.com",
  },
  ...(supabaseHostname
    ? [
        {
          protocol: "https" as const,
          hostname: supabaseHostname,
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24,
  },
};

export default nextConfig;
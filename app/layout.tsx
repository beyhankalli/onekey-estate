import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { WishlistProvider } from "@/context/WishlistContext";
import { CompareProvider } from "@/context/CompareContext";
import SiteChrome from "@/components/SiteChrome";

const inter = Inter({ subsets: ["latin"] });

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://onekey-estate.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "OneKey Estate Agency | Premium Properties in the UK",
    template: "%s | OneKey Estate Agency",
  },

  description:
    "Find your perfect rental home with OneKey Estate Agency. Explore UK properties, view photos and details, and book property viewings online.",

  keywords: [
    "OneKey Estate Agency",
    "estate agency",
    "UK estate agents",
    "UK property",
    "property to rent",
    "rental properties UK",
    "houses to rent",
    "flats to rent",
    "online property viewings",
  ],

  applicationName: "OneKey Estate Agency",

  authors: [
    {
      name: "OneKey Estate Agency",
    },
  ],

  creator: "OneKey Estate Agency",
  publisher: "OneKey Estate Agency",

  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "/",
    siteName: "OneKey Estate Agency",
    title: "OneKey Estate Agency | Premium Properties in the UK",
    description:
      "Find your perfect rental home with OneKey Estate Agency. Explore UK properties and book viewings online.",
    images: [
      {
        url: "/onekey-logo.png",
        width: 1200,
        height: 630,
        alt: "OneKey Estate Agency",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "OneKey Estate Agency | Premium Properties in the UK",
    description:
      "Find your perfect rental home with OneKey Estate Agency. Explore UK properties and book viewings online.",
    images: ["/onekey-logo.png"],
  },

  icons: {
    icon: "/onekey-logo.png",
    apple: "/onekey-logo.png",
  },

  category: "real estate",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB">
      <head>
        <Script
          type="module"
          src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js"
          strategy="lazyOnload"
        />
      </head>

      <body
        className={`${inter.className} bg-white text-gray-900 antialiased flex flex-col min-h-screen`}
      >
        <WishlistProvider>
          <CompareProvider>
            <SiteChrome>{children}</SiteChrome>
          </CompareProvider>
        </WishlistProvider>
      </body>
    </html>
  );
}
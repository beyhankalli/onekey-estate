import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { WishlistProvider } from "@/context/WishlistContext";
import SiteChrome from "@/components/SiteChrome";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OneKey Estate Agency | Premium Properties in UK",
  description:
    "Find your perfect rental home. Book viewings online, explore 3D floor plans, and connect with our expert agents.",
  keywords:
    "estate agency, uk property, rent a house, online booking, onekey estate",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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
          <SiteChrome>{children}</SiteChrome>
        </WishlistProvider>
      </body>
    </html>
  );
}
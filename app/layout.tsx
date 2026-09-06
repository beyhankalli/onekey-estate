import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer"; // Footer bileşenini içe aktardık

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OneKey Estate Agency | Premium Properties in UK",
  description: "Find your perfect rental home. Book viewings online, explore 3D floor plans, and connect with our expert agents.",
  keywords: "estate agency, uk property, rent a house, online booking, onekey estate",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* flex ve min-h-screen kullanarak içeriğin az olduğu sayfalarda bile Footer'ın en altta kalmasını sağlıyoruz */}
      <body className={`${inter.className} bg-white text-gray-900 antialiased flex flex-col min-h-screen`}>
        <Navbar />
        
        {/* flex-grow sınıfı, aradaki ana içeriğin tüm boşluğu doldurmasını sağlar */}
        <main className="flex-grow pt-20">
          {children}
        </main>
        
        <Footer />
      </body>
    </html>
  );
}
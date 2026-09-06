import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AllListingsPage() {
  return (
    <div className="bg-gray-50 min-h-screen pt-32 pb-20 px-4 text-center">
      <h1 className="text-4xl font-semibold text-gray-900 mb-6">All Properties</h1>
      <p className="text-gray-500 mb-10">This page will show the full list of properties soon.</p>
      
      <Link href="/" className="inline-flex items-center bg-[#1c3053] text-white px-6 py-3 rounded-full font-medium hover:bg-[#ae884e] transition-colors">
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Home
      </Link>
    </div>
  );
}
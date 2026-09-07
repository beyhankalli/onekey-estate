"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pt-24">
      <div className="max-w-lg w-full bg-white rounded-[2rem] border border-gray-100 shadow-sm p-10 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-2xl font-semibold">
          !
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-3">Something went wrong</h1>
        <p className="text-gray-500 font-light leading-relaxed mb-8">
          We were unable to load this page. Please try again or return to the homepage.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="px-6 py-3 rounded-xl bg-[#1c3053] text-white font-medium hover:bg-[#ae884e] transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

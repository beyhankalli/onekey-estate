"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("OneKey application error:", error);
  }, [error]);

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-xl text-center">
        <Image
          src="/onekey-logo.png"
          alt="OneKey Estate Agency"
          width={240}
          height={80}
          className="mx-auto mb-10 h-auto w-[180px] opacity-90"
        />

        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#ae884e] mb-3">
          Something went wrong
        </p>

        <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-4">
          We couldn't load this page
        </h1>

        <p className="text-gray-500 font-light leading-relaxed mb-8">
          Something unexpected happened while loading the page. Please try
          again, or return to the homepage.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto rounded-xl bg-[#1c3053] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#263f68]"
          >
            Try Again
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-[#ae884e] hover:text-[#ae884e]"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
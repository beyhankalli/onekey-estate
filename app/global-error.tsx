"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error("OneKey global application error:", error);
  }, [error]);

  return (
    <html lang="en-GB">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <main className="min-h-screen flex items-center justify-center px-6 py-20">
          <div className="w-full max-w-xl text-center">
            <div className="mb-10">
              <img
                src="/onekey-logo.png"
                alt="OneKey Estate Agency"
                className="mx-auto h-auto w-[180px]"
              />
            </div>

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#ae884e] mb-3">
              Something went wrong
            </p>

            <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-4">
              We couldn't load OneKey
            </h1>

            <p className="text-gray-500 font-light leading-relaxed mb-8">
              Something unexpected happened while loading the application.
              Please reload the page and try again.
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl bg-[#1c3053] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#263f68]"
            >
              Reload Page
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
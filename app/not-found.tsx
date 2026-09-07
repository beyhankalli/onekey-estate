import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pt-24">
      <div className="max-w-lg w-full bg-white rounded-[2rem] border border-gray-100 shadow-sm p-10 text-center">
        <div className="text-6xl font-semibold text-[#1c3053] mb-4">404</div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-3">Page not found</h1>
        <p className="text-gray-500 font-light leading-relaxed mb-8">
          The page you are looking for may have been moved, removed, or is no longer available.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href="/listings"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#1c3053] text-white font-medium hover:bg-[#ae884e] transition-colors"
          >
            Browse Properties
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
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

        <p className="text-6xl sm:text-7xl font-semibold text-[#1c3053] mb-4">
          404
        </p>

        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-4">
          Page Not Found
        </h1>

        <p className="text-gray-500 font-light leading-relaxed mb-8">
          The page or property you are looking for could not be found.
          It may have been moved, removed, or the link may be incorrect.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto rounded-xl bg-[#1c3053] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#263f68]"
          >
            Back to Home
          </Link>

          <Link
            href="/listings"
            className="w-full sm:w-auto rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-[#ae884e] hover:text-[#ae884e]"
          >
            Browse Properties
          </Link>
        </div>
      </div>
    </main>
  );
}
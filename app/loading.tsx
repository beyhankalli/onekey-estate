import Image from "next/image";

export default function Loading() {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
      role="status"
      aria-label="Loading"
    >
      <div className="relative w-[220px] sm:w-[280px] aspect-[3/1]">
        {/* Grey base logo */}
        <Image
          src="/onekey-logo.png"
          alt="OneKey Estate Agency"
          fill
          priority
          sizes="280px"
          className="object-contain grayscale opacity-35"
        />

        {/* Colour fills from bottom to top */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 animate-logo-fill">
            <Image
              src="/onekey-logo.png"
              alt=""
              fill
              priority
              sizes="280px"
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
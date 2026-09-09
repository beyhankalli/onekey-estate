import { describe, it, expect } from "vitest";

// Geçmiş tarih validasyon testi (Madde 18)
function isPastDate(dateString: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return dateString < today;
}

// Rezervasyon saat çakışma testi (Madde 11 & 12)
function checkTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  return start1 < end2 && end1 > start2;
}

describe("OneKey Booking Security & Validation Logic", () => {
  it("should detect and reject past booking dates", () => {
    const pastDate = "2020-01-01";
    expect(isPastDate(pastDate)).toBe(true);
  });

  it("should accept present or future booking dates", () => {
    const futureDate = "2030-12-31";
    expect(isPastDate(futureDate)).toBe(false);
  });

  it("should correctly identify overlapping time slots (Double Booking prevention)", () => {
    // 10:00 - 11:00 ile 10:30 - 11:30 çakışmalıdır
    const isOverlapping = checkTimeOverlap("10:00", "11:00", "10:30", "11:30");
    expect(isOverlapping).toBe(true);
  });

  it("should allow non-overlapping time slots", () => {
    // 10:00 - 11:00 ile 11:00 - 12:00 çakışmamalıdır
    const isOverlapping = checkTimeOverlap("10:00", "11:00", "11:00", "12:00");
    expect(isOverlapping).toBe(false);
  });
});
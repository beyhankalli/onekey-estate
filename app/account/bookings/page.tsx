"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  ArrowLeft,
  Home,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface BookingProperty {
  title?: string | null;
  short_location?: string | null;
  property_ref?: string | null;
  images?: string[] | null;
}

interface CustomerBooking {
  id: string;
  customer_email?: string | null;
  viewing_date: string;
  start_time?: string | null;
  end_time?: string | null;
  status: string;
  property?: BookingProperty | BookingProperty[] | null;
}

export default function CustomerBookingsPage() {
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");

  const router = useRouter();

  useEffect(() => {
    async function loadBookings() {
      const supabase = createClient();

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push("/login");
          return;
        }

        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select(
            "*, property:properties(title, short_location, property_ref, images)"
          )
          .eq("customer_email", user.email)
          .order("viewing_date", { ascending: true });

        if (bookingsError) throw bookingsError;

        if (bookingsData) {
          setBookings(bookingsData as CustomerBooking[]);
        }
      } catch (err) {
        console.error("Error loading bookings:", err);
      } finally {
        setLoading(false);
      }
    }

    loadBookings();
  }, [router]);

  const today = new Date().toISOString().split("T")[0];

  const filteredBookings = bookings.filter((booking) => {
    if (filter === "upcoming") return booking.viewing_date >= today;
    if (filter === "past") return booking.viewing_date < today;

    return true;
  });

  const upcomingCount = bookings.filter(
    (booking) => booking.viewing_date >= today
  ).length;

  const pastCount = bookings.filter(
    (booking) => booking.viewing_date < today
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
        Loading your viewings...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-[#1c3053] text-white py-12 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <Link
              href="/account"
              className="inline-flex items-center gap-1.5 text-xs text-[#ae884e] font-semibold uppercase tracking-wider mb-2 hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>

            <h1 className="text-3xl font-semibold">Your Property Viewings</h1>

            <p className="text-gray-300 text-sm font-light mt-1">
              Track all your scheduled and past viewing appointments.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 -mt-6">
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-6 sm:p-8">
          <div className="flex gap-2 border-b border-gray-100 pb-6 mb-6">
            {(["all", "upcoming", "past"] as const).map((tab) => {
              const count =
                tab === "upcoming"
                  ? upcomingCount
                  : tab === "past"
                    ? pastCount
                    : bookings.length;

              return (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    filter === tab
                      ? "bg-[#1c3053] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)} ({count})
                </button>
              );
            })}
          </div>

          {filteredBookings.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>No viewings found in this category.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => {
                const property = Array.isArray(booking.property)
                  ? booking.property[0]
                  : booking.property;

                const images = property?.images;

                const coverImage =
                  Array.isArray(images) && images.length > 0
                    ? images[0]
                    : null;

                return (
                  <div
                    key={booking.id}
                    className="p-6 rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                  >
                    <div className="flex items-start gap-4">
                      {coverImage ? (
                        <div className="relative w-20 h-20 shrink-0">
                          <Image
                            src={coverImage}
                            alt={property?.title || "Property"}
                            fill
                            sizes="80px"
                            className="rounded-xl object-cover border border-gray-100"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                          <Home className="w-8 h-8 text-gray-400" />
                        </div>
                      )}

                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {property?.title || "Property Viewing"}
                        </h3>

                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />{" "}
                          {property?.short_location || "Location N/A"}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs font-medium text-gray-600">
                          <span className="flex items-center gap-1 text-[#ae884e]">
                            <Calendar className="w-3.5 h-3.5" />{" "}
                            {booking.viewing_date}
                          </span>

                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />{" "}
                            {booking.start_time?.slice(0, 5)} -{" "}
                            {booking.end_time?.slice(0, 5)}
                          </span>

                          {property?.property_ref && (
                            <span className="text-gray-400">
                              Ref: {property.property_ref}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold ${
                          booking.status === "confirmed"
                            ? "bg-green-100 text-green-700"
                            : booking.status === "rejected" ||
                                booking.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {booking.status === "confirmed" && (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}

                        {(booking.status === "rejected" ||
                          booking.status === "cancelled") && (
                          <XCircle className="w-3.5 h-3.5" />
                        )}

                        {booking.status === "pending" && (
                          <AlertCircle className="w-3.5 h-3.5" />
                        )}

                        {booking.status.charAt(0).toUpperCase() +
                          booking.status.slice(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Home,
  Users,
  CalendarCheck,
  MessageSquare,
  Star,
  ArrowRight,
  Plus,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type DashboardStats = {
  properties: number;
  available: number;
  agents: number;
  pendingBookings: number;
  todayBookings: number;
  messages: number;
  pendingReviews: number;
};

type TodayBooking = {
  id: string;
  start_time: string;
  end_time: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  property_id: string | null;
  properties:
    | {
        title: string | null;
        short_location: string | null;
      }[]
    | null;
};

type PropertyStatus = {
  name: string;
  count: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    properties: 0,
    available: 0,
    agents: 0,
    pendingBookings: 0,
    todayBookings: 0,
    messages: 0,
    pendingReviews: 0,
  });

  const [todayBookings, setTodayBookings] = useState<TodayBooking[]>([]);
  const [propertyStatuses, setPropertyStatuses] = useState<PropertyStatus[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDashboardData() {
      const supabase = createClient();

      setLoading(true);
      setError("");

      try {
        const today = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Europe/London",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date());

        const [
          propertiesResult,
          availableResult,
          agentsResult,
          pendingBookingsResult,
          todayBookingsResult,
          messagesResult,
          reviewsResult,
          statusResult,
        ] = await Promise.all([
          supabase
            .from("properties")
            .select("*", { count: "exact", head: true }),

          supabase
            .from("properties")
            .select("*", { count: "exact", head: true })
            .eq("availability_status", "Available"),

          supabase
            .from("agents")
            .select("*", { count: "exact", head: true }),

          supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending"),

          supabase
            .from("bookings")
            .select(
              `
                id,
                start_time,
                end_time,
                customer_name,
                customer_phone,
                status,
                property_id,
                properties (
                  title,
                  short_location
                )
              `
            )
            .eq("viewing_date", today)
            .order("start_time", { ascending: true }),

          supabase
            .from("messages")
            .select("*", { count: "exact", head: true }),

          supabase
            .from("reviews")
            .select("*", { count: "exact", head: true })
            .eq("approved", false),

          supabase
            .from("properties")
            .select("availability_status"),
        ]);

        const firstError =
          propertiesResult.error ||
          availableResult.error ||
          agentsResult.error ||
          pendingBookingsResult.error ||
          todayBookingsResult.error ||
          messagesResult.error ||
          reviewsResult.error ||
          statusResult.error;

        if (firstError) {
          console.error("Dashboard error:", firstError);
          setError("Some dashboard data could not be loaded.");
        }

        const bookings: TodayBooking[] =
          (todayBookingsResult.data as TodayBooking[] | null) || [];

        const statusCounts: Record<string, number> = {};

        (statusResult.data || []).forEach((property) => {
          const status = property.availability_status || "Unknown";
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        const formattedStatuses = Object.entries(statusCounts)
          .map(([name, count]) => ({
            name,
            count,
          }))
          .sort((a, b) => b.count - a.count);

        setStats({
          properties: propertiesResult.count || 0,
          available: availableResult.count || 0,
          agents: agentsResult.count || 0,
          pendingBookings: pendingBookingsResult.count || 0,
          todayBookings: bookings.length,
          messages: messagesResult.count || 0,
          pendingReviews: reviewsResult.count || 0,
        });

        setTodayBookings(bookings);
        setPropertyStatuses(formattedStatuses);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse space-y-8">
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded-lg" />
            <div className="h-4 w-96 bg-gray-100 rounded mt-3" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 bg-white border border-gray-100 rounded-2xl"
              />
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 h-96 bg-white border border-gray-100 rounded-2xl" />
            <div className="h-96 bg-white border border-gray-100 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Properties",
      value: stats.properties,
      icon: Home,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      href: "/admin/properties",
    },
    {
      title: "Available to Let",
      value: stats.available,
      icon: CheckCircle2,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
      href: "/admin/properties",
    },
    {
      title: "Pending Viewings",
      value: stats.pendingBookings,
      icon: CalendarCheck,
      iconBg: "bg-amber-50",
      iconColor: "text-[#ae884e]",
      href: "/admin/bookings",
    },
    {
      title: "Active Agents",
      value: stats.agents,
      icon: Users,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
      href: "/admin/agents",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-8">
        <div>
          <p className="text-sm font-medium text-[#ae884e] mb-2">
            OneKey Estate Agency
          </p>

          <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 tracking-tight">
            Dashboard Overview
          </h1>

          <p className="text-gray-500 font-light mt-2">
            Monitor your properties, viewings and customer activity.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/properties/new"
            className="inline-flex items-center gap-2 bg-[#ae884e] hover:bg-[#8f6e3c] text-white px-5 py-3 rounded-xl text-sm font-medium transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Property
          </Link>

          <Link
            href="/admin/bookings"
            className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-[#ae884e] text-gray-700 px-5 py-3 rounded-xl text-sm font-medium transition-all"
          >
            <CalendarCheck className="w-4 h-4" />
            Viewings
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Main statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.title}
              href={card.href}
              className="group bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`w-12 h-12 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center`}
                >
                  <Icon className="w-6 h-6" />
                </div>

                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#ae884e] group-hover:translate-x-1 transition-all" />
              </div>

              <div className="mt-5">
                <p className="text-sm text-gray-500 font-medium">
                  {card.title}
                </p>

                <p className="text-3xl font-semibold text-gray-900 mt-1">
                  {card.value}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Secondary statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <Link
          href="/admin/bookings"
          className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-center gap-4 hover:border-[#ae884e]/30 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600">
            <Clock className="w-5 h-5" />
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              Today&apos;s Viewings
            </p>

            <p className="text-xl font-semibold text-gray-900">
              {stats.todayBookings}
            </p>
          </div>
        </Link>

        <Link
          href="/admin/messages"
          className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-center gap-4 hover:border-[#ae884e]/30 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600">
            <MessageSquare className="w-5 h-5" />
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              Customer Messages
            </p>

            <p className="text-xl font-semibold text-gray-900">
              {stats.messages}
            </p>
          </div>
        </Link>

        <Link
          href="/admin/reviews"
          className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-center gap-4 hover:border-[#ae884e]/30 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-[#ae884e]">
            <Star className="w-5 h-5" />
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              Pending Reviews
            </p>

            <p className="text-xl font-semibold text-gray-900">
              {stats.pendingReviews}
            </p>
          </div>
        </Link>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Today's viewings */}
        <div className="xl:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Today&apos;s Viewings
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Your scheduled property appointments for today.
              </p>
            </div>

            <Link
              href="/admin/bookings"
              className="text-sm font-medium text-[#ae884e] hover:text-[#8f6e3c] inline-flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {todayBookings.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 mx-auto flex items-center justify-center text-gray-400 mb-4">
                <CalendarCheck className="w-7 h-7" />
              </div>

              <h3 className="font-medium text-gray-900">
                No viewings scheduled today
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Your schedule is currently clear.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {todayBookings.map((booking) => {
                const property = booking.properties?.[0];

                return (
                  <div
                    key={booking.id}
                    className="px-6 py-5 flex flex-col md:flex-row md:items-center gap-4 md:gap-6 hover:bg-gray-50/70 transition-colors"
                  >
                    <div className="md:w-24 shrink-0">
                      <div className="text-lg font-semibold text-gray-900">
                        {booking.start_time?.slice(0, 5)}
                      </div>

                      <div className="text-xs text-gray-400 mt-1">
                        {booking.end_time?.slice(0, 5)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {booking.customer_name}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <Home className="w-3.5 h-3.5" />
                          {property?.title || "Property"}
                        </span>

                        {property?.short_location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {property.short_location}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                          booking.status === "confirmed"
                            ? "bg-green-50 text-green-700"
                            : booking.status === "cancelled"
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
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

        {/* Property overview */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#ae884e]" />

              <h2 className="text-lg font-semibold text-gray-900">
                Property Overview
              </h2>
            </div>

            <p className="text-sm text-gray-500 mt-1">
              Current property availability.
            </p>
          </div>

          <div className="p-6">
            {propertyStatuses.length === 0 ? (
              <div className="text-center py-10 text-sm text-gray-500">
                No property data available.
              </div>
            ) : (
              <div className="space-y-5">
                {propertyStatuses.map((status) => {
                  const percentage =
                    stats.properties > 0
                      ? Math.round((status.count / stats.properties) * 100)
                      : 0;

                  return (
                    <div key={status.name}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {status.name}
                        </span>

                        <span className="text-sm font-semibold text-gray-900">
                          {status.count}
                        </span>
                      </div>

                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#ae884e] rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <p className="text-xs text-gray-400 mt-1">
                        {percentage}% of all properties
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            <Link
              href="/admin/properties"
              className="mt-7 w-full inline-flex items-center justify-center gap-2 border border-gray-200 hover:border-[#ae884e] hover:text-[#ae884e] text-gray-700 rounded-xl py-3 text-sm font-medium transition-all"
            >
              Manage Properties
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 bg-[#1c3053] rounded-2xl p-6 md:p-7 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#ae884e] font-semibold">
              Quick Actions
            </p>

            <h2 className="text-xl font-semibold mt-2">
              Manage OneKey efficiently
            </h2>

            <p className="text-sm text-gray-300 mt-1 font-light">
              Access the tools you use most frequently.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/properties/new"
              className="inline-flex items-center gap-2 bg-[#ae884e] hover:bg-[#8f6e3c] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              New Property
            </Link>

            <Link
              href="/admin/agents"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            >
              <Users className="w-4 h-4" />
              Agents
            </Link>

            <Link
              href="/admin/messages"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              Messages
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
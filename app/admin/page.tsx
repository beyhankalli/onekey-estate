"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Home,
  Calendar,
  Users,
  MessageSquare,
  ArrowRight,
  Clock,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  Plus,
  Building2,
  BarChart3,
  Inbox,
  CalendarDays,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

type DashboardStats = {
  activeProperties: number;
  pendingViewings: number;
  newLeads: number;
  newMessages: number;
  confirmedViewings: number;
  completedViewings: number;
  unreadMessages: number;
};

type Viewing = {
  id: string;
  viewing_date: string;
  start_time: string;
  end_time: string;
  status: string;
  customer_name?: string | null;
  customer_email?: string | null;
  property?: {
    title?: string | null;
    property_ref?: string | null;
  } | null;
  customer?: {
    name?: string | null;
    email?: string | null;
  } | null;
};

type Enquiry = {
  id: string;
  message?: string | null;
  created_at: string;
  is_read?: boolean | null;
  sender_name?: string | null;
  sender_email?: string | null;
  customer?: {
    name?: string | null;
    email?: string | null;
  } | null;
};

export default function AdminDashboardPage() {
  const [adminUser, setAdminUser] = useState<any>(null);

  const [stats, setStats] = useState<DashboardStats>({
    activeProperties: 0,
    pendingViewings: 0,
    newLeads: 0,
    newMessages: 0,
    confirmedViewings: 0,
    completedViewings: 0,
    unreadMessages: 0,
  });

  const [todaysViewings, setTodaysViewings] = useState<Viewing[]>([]);
  const [recentEnquiries, setRecentEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [specialGreeting, setSpecialGreeting] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const supabase = createClient();

  const today = useMemo(() => new Date(), []);

  const todayString = useMemo(() => {
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }, [today]);

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 22) return "Good evening";

    return "Good night";
  };

  const getSpecialGreeting = () => {
    const currentDate = new Date();
    const dayOfWeek = currentDate.getDay();
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();

    if (dayOfWeek === 5) {
      return "Blessed Friday / Jummah Mubarak";
    }

    if (
      (month === 2 && day >= 17 && day <= 19) ||
      (month === 3 && day <= 20)
    ) {
      return "Blessed Ramadan";
    }

    if (month === 3 && (day === 20 || day === 21)) {
      return "Eid Mubarak";
    }

    return null;
  };

  const getCustomer = (viewing: Viewing) => {
    if (Array.isArray(viewing.customer)) {
      return viewing.customer[0] || null;
    }

    return viewing.customer || null;
  };

  const getEnquiryCustomer = (message: Enquiry) => {
    if (Array.isArray(message.customer)) {
      return message.customer[0] || null;
    }

    return message.customer || null;
  };

  const formatTime = (time?: string | null) => {
    if (!time) return "--:--";

    return time.slice(0, 5);
  };

  const formatRelativeTime = (dateString?: string | null) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const now = new Date();

    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);

    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);

    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
  };

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (user) {
        const { data: agentData } = await supabase
          .from("agents")
          .select("*")
          .eq("email", user.email)
          .maybeSingle();

        setAdminUser(
          agentData || {
            email: user.email,
            name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split("@")[0] ||
              "Admin",
          }
        );
      }

      setSpecialGreeting(getSpecialGreeting());

      const [
        activePropertiesResult,
        pendingViewingsResult,
        newLeadsResult,
        messageCountResult,
        confirmedViewingsResult,
        completedViewingsResult,
        unreadMessagesResult,
        viewingsResult,
        enquiriesResult,
      ] = await Promise.all([
        supabase
          .from("properties")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),

        supabase
          .from("customers")
          .select("id", { count: "exact", head: true })
          .in("lead_status", ["New", "new"]),

        supabase
          .from("messages")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("status", "confirmed"),

        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("status", "completed"),

        supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("is_read", false),

        supabase
          .from("bookings")
          .select(
            "id, viewing_date, start_time, end_time, status, customer_name, customer_email, property_id, customer_id"
          )
          .eq("viewing_date", todayString)
          .order("start_time", { ascending: true }),

        supabase
          .from("messages")
          .select(
            "id, message, created_at, is_read, sender_name, sender_email, customer_id"
          )
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const queryErrors = [
        activePropertiesResult.error,
        pendingViewingsResult.error,
        newLeadsResult.error,
        messageCountResult.error,
        confirmedViewingsResult.error,
        completedViewingsResult.error,
        unreadMessagesResult.error,
        viewingsResult.error,
        enquiriesResult.error,
      ].filter(Boolean);

      if (queryErrors.length > 0) {
        console.error("Dashboard query errors:", queryErrors);
      }

      const viewingRows = (viewingsResult.data || []) as Array<{
        id: string;
        viewing_date: string;
        start_time: string;
        end_time: string;
        status: string;
        customer_name?: string | null;
        customer_email?: string | null;
        property_id?: string | null;
        customer_id?: string | null;
      }>;

      const enquiryRows = (enquiriesResult.data || []) as Array<{
        id: string;
        message?: string | null;
        created_at: string;
        is_read?: boolean | null;
        sender_name?: string | null;
        sender_email?: string | null;
        customer_id?: string | null;
      }>;

      const propertyIds = Array.from(
        new Set(
          viewingRows
            .map((booking) => booking.property_id)
            .filter((id): id is string => Boolean(id))
        )
      );

      const customerIds = Array.from(
        new Set(
          [
            ...viewingRows.map((booking) => booking.customer_id),
            ...enquiryRows.map((message) => message.customer_id),
          ].filter((id): id is string => Boolean(id))
        )
      );

      const [propertiesLookupResult, customersLookupResult] =
        await Promise.all([
          propertyIds.length > 0
            ? supabase
                .from("properties")
                .select("id, title, property_ref")
                .in("id", propertyIds)
            : Promise.resolve({ data: [], error: null }),

          customerIds.length > 0
            ? supabase
                .from("customers")
                .select("id, name, email")
                .in("id", customerIds)
            : Promise.resolve({ data: [], error: null }),
        ]);

      if (propertiesLookupResult.error) {
        console.error(
          "Dashboard property lookup error:",
          propertiesLookupResult.error
        );
      }

      if (customersLookupResult.error) {
        console.error(
          "Dashboard customer lookup error:",
          customersLookupResult.error
        );
      }

      const propertyMap = new Map(
        ((propertiesLookupResult.data || []) as Array<{
          id: string;
          title?: string | null;
          property_ref?: string | null;
        }>).map((property) => [property.id, property])
      );

      const customerMap = new Map(
        ((customersLookupResult.data || []) as Array<{
          id: string;
          name?: string | null;
          email?: string | null;
        }>).map((customer) => [customer.id, customer])
      );

      const mappedViewings: Viewing[] = viewingRows.map((booking) => ({
        id: booking.id,
        viewing_date: booking.viewing_date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        status: booking.status,
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        property: booking.property_id
          ? propertyMap.get(booking.property_id) || null
          : null,
        customer: booking.customer_id
          ? customerMap.get(booking.customer_id) || null
          : null,
      }));

      const mappedEnquiries: Enquiry[] = enquiryRows.map((message) => ({
        id: message.id,
        message: message.message,
        created_at: message.created_at,
        is_read: message.is_read,
        sender_name: message.sender_name,
        sender_email: message.sender_email,
        customer: message.customer_id
          ? customerMap.get(message.customer_id) || null
          : null,
      }));

      setStats({
        activeProperties: activePropertiesResult.count || 0,
        pendingViewings: pendingViewingsResult.count || 0,
        newLeads: newLeadsResult.count || 0,
        newMessages: messageCountResult.count || 0,
        confirmedViewings: confirmedViewingsResult.count || 0,
        completedViewings: completedViewingsResult.count || 0,
        unreadMessages: unreadMessagesResult.count || 0,
      });

      setTodaysViewings(mappedViewings);
      setRecentEnquiries(mappedEnquiries);

      if (queryErrors.length > 0) {
        const firstError = queryErrors[0] as {
          message?: string;
          code?: string;
        };

        setErrorMessage(
          `${firstError?.message || "Some dashboard data could not be loaded."}${
            firstError?.code ? ` | code=${firstError.code}` : ""
          }`
        );
      }
    } catch (error: any) {
      console.error("Error loading dashboard:", error);
      setErrorMessage(
        error?.message || "Unable to load dashboard information."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const name = adminUser?.name || "Admin";

  const todayLabel = today.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const viewingCompletionRate =
    stats.confirmedViewings + stats.completedViewings > 0
      ? Math.round(
          (stats.completedViewings /
            (stats.confirmedViewings + stats.completedViewings)) *
            100
        )
      : 0;

  const operationalItems = [
    {
      label: "Properties",
      value: stats.activeProperties,
      icon: Building2,
      href: "/admin/properties",
      description: "Currently listed",
    },
    {
      label: "Pending Viewings",
      value: stats.pendingViewings,
      icon: CalendarDays,
      href: "/admin/bookings",
      description: "Awaiting action",
    },
    {
      label: "New Leads",
      value: stats.newLeads,
      icon: UserPlus,
      href: "/admin/customers",
      description: "Recently registered",
    },
    {
      label: "Unread Messages",
      value: stats.unreadMessages,
      icon: Inbox,
      href: "/admin/messages",
      description: "Need attention",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#1c3053] flex items-center justify-center shadow-lg">
            <RefreshCw className="w-6 h-6 text-white animate-spin" />
          </div>

          <p className="mt-4 text-sm font-medium text-gray-600">
            Loading professional dashboard...
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Preparing your operational overview
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto pb-16 space-y-8">
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />

          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">
              Dashboard data could not be fully loaded
            </p>

            <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
          </div>

          <button
            type="button"
            onClick={() => fetchDashboardData(true)}
            className="text-xs font-semibold text-red-700 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-[#1c3053] text-white shadow-xl">
        <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-[#ae884e]/20 blur-3xl" />
        <div className="absolute -left-32 -bottom-32 w-80 h-80 rounded-full bg-white/5 blur-3xl" />

        <div className="relative p-7 sm:p-9 lg:p-10">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#d5b37b]">
                  <span className="w-2 h-2 rounded-full bg-[#ae884e]" />
                  Operational Overview
                </span>

                {specialGreeting && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/10 border border-white/10 px-3 py-1.5 rounded-full">
                    <Sparkles className="w-3.5 h-3.5 text-[#d5b37b]" />
                    {specialGreeting}
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                {getGreeting()}, {name}
              </h1>

              <p className="text-sm text-white/65 mt-2 max-w-2xl">
                Here is your OneKey Estate operational overview for today.
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-5">
                <span className="text-xs text-white/60">{todayLabel}</span>

                <span className="w-1 h-1 rounded-full bg-white/30" />

                <span className="inline-flex items-center gap-1.5 text-xs text-white/70">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#d5b37b]" />
                  Secure admin session
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/properties"
                className="inline-flex items-center gap-2 bg-white text-[#1c3053] px-5 py-3 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Add Property
              </Link>

              <Link
                href="/admin/bookings"
                className="inline-flex items-center gap-2 bg-[#ae884e] text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-[#c09a63] transition-colors shadow-lg"
              >
                <Calendar className="w-4 h-4" />
                Manage Viewings
              </Link>

              <button
                type="button"
                onClick={() => fetchDashboardData(true)}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/10 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:bg-white/15 transition-colors disabled:opacity-60"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* KPI GRID */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ae884e]">
              Key Metrics
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-1">
              Business at a glance
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {operationalItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-[#ae884e]/30 transition-all duration-200 p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      {item.label}
                    </p>

                    <p className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">
                      {item.value}
                    </p>

                    <p className="text-xs text-gray-400 mt-2">
                      {item.description}
                    </p>
                  </div>

                  <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-[#1c3053] group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5 text-[#1c3053] group-hover:text-white" />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                  <span className="text-xs font-semibold text-gray-400 group-hover:text-[#ae884e] transition-colors">
                    Open management
                  </span>

                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#ae884e] group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* OPERATIONAL HEALTH */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                Performance
              </p>

              <h2 className="text-lg font-bold text-gray-900 mt-1">
                Viewing activity
              </h2>
            </div>

            <div className="w-10 h-10 rounded-xl bg-[#ae884e]/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#ae884e]" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-5">
              <p className="text-xs text-gray-500 font-medium">Pending</p>

              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.pendingViewings}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Awaiting confirmation
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 border border-gray-100 p-5">
              <p className="text-xs text-gray-500 font-medium">Confirmed</p>

              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.confirmedViewings}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Scheduled successfully
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 border border-gray-100 p-5 col-span-2 md:col-span-1">
              <p className="text-xs text-gray-500 font-medium">Completed</p>

              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.completedViewings}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Completed viewings
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600">
                Completion indicator
              </span>

              <span className="text-xs font-bold text-[#1c3053]">
                {viewingCompletionRate}%
              </span>
            </div>

            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#ae884e] rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(viewingCompletionRate, 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#f8f5ef] to-white rounded-2xl border border-[#eadfce] shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#ae884e]">
                Attention
              </p>

              <h2 className="text-lg font-bold text-gray-900 mt-1">
                Priority items
              </h2>
            </div>

            <AlertCircle className="w-5 h-5 text-[#ae884e]" />
          </div>

          <div className="space-y-3 mt-6">
            <Link
              href="/admin/bookings"
              className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-gray-100 hover:border-[#ae884e]/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-[#ae884e]" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Pending viewings
                  </p>

                  <p className="text-xs text-gray-400">
                    Require attention
                  </p>
                </div>
              </div>

              <span className="text-sm font-bold text-[#ae884e]">
                {stats.pendingViewings}
              </span>
            </Link>

            <Link
              href="/admin/customers"
              className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-gray-100 hover:border-[#ae884e]/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-green-600" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    New leads
                  </p>

                  <p className="text-xs text-gray-400">
                    Recently added customers
                  </p>
                </div>
              </div>

              <span className="text-sm font-bold text-green-600">
                {stats.newLeads}
              </span>
            </Link>

            <Link
              href="/admin/messages"
              className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-gray-100 hover:border-[#ae884e]/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Unread messages
                  </p>

                  <p className="text-xs text-gray-400">
                    Customer enquiries
                  </p>
                </div>
              </div>

              <span className="text-sm font-bold text-purple-600">
                {stats.unreadMessages}
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* TODAY + ENQUIRIES */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* TODAY'S VIEWINGS */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#ae884e]" />

                <h2 className="text-lg font-bold text-gray-900">
                  Today&apos;s Viewings
                </h2>
              </div>

              <p className="text-xs text-gray-400 mt-1">
                Your scheduled property appointments
              </p>
            </div>

            <Link
              href="/admin/bookings"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#ae884e] hover:underline"
            >
              View all
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-6">
            {todaysViewings.length === 0 ? (
              <div className="py-10 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-50 flex items-center justify-center">
                  <Clock className="w-7 h-7 text-gray-300" />
                </div>

                <p className="text-sm font-medium text-gray-600 mt-4">
                  No viewings scheduled for today.
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  Your calendar is currently clear.
                </p>

                <Link
                  href="/admin/bookings"
                  className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-[#ae884e] hover:underline"
                >
                  Open booking management
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {todaysViewings.map((booking) => {
                  const customer = getCustomer(booking);

                  const customerName =
                    customer?.name ||
                    booking.customer_name ||
                    customer?.email ||
                    booking.customer_email ||
                    "Guest Client";

                  const propertyTitle =
                    booking.property?.title ||
                    booking.property?.property_ref ||
                    "Property Viewing";

                  return (
                    <div
                      key={booking.id}
                      className="group flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-[#ae884e]/30 hover:shadow-sm transition-all"
                    >
                      <div className="w-14 h-14 rounded-xl bg-[#1c3053] text-white flex flex-col items-center justify-center shrink-0">
                        <span className="text-sm font-bold">
                          {formatTime(booking.start_time)}
                        </span>

                        <span className="text-[9px] text-white/60 uppercase tracking-wider mt-0.5">
                          Start
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {customerName}
                        </p>

                        <p className="text-xs text-gray-500 truncate mt-1">
                          {propertyTitle}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                            {formatTime(booking.start_time)} –{" "}
                            {formatTime(booking.end_time)}
                          </span>

                          <span className="w-1 h-1 rounded-full bg-gray-300" />

                          <span className="text-[10px] font-semibold text-[#ae884e] capitalize">
                            {booking.status || "pending"}
                          </span>
                        </div>
                      </div>

                      <Link
                        href="/admin/bookings"
                        className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        aria-label="Open bookings"
                      >
                        <ArrowRight className="w-4 h-4 text-gray-500" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RECENT ENQUIRIES */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#ae884e]" />

                <h2 className="text-lg font-bold text-gray-900">
                  Recent Enquiries
                </h2>
              </div>

              <p className="text-xs text-gray-400 mt-1">
                Latest customer and website enquiries
              </p>
            </div>

            <Link
              href="/admin/messages"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#ae884e] hover:underline"
            >
              View all
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-6">
            {recentEnquiries.length === 0 ? (
              <div className="py-10 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-50 flex items-center justify-center">
                  <MessageSquare className="w-7 h-7 text-gray-300" />
                </div>

                <p className="text-sm font-medium text-gray-600 mt-4">
                  No recent enquiries found.
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  New customer messages will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEnquiries.map((message) => {
                  const customer = getEnquiryCustomer(message);

                  const senderName =
                    customer?.name ||
                    message.sender_name ||
                    customer?.email ||
                    message.sender_email ||
                    "Website Visitor";

                  return (
                    <Link
                      href="/admin/messages"
                      key={message.id}
                      className={`block p-4 rounded-xl border transition-all hover:shadow-sm ${
                        message.is_read === false
                          ? "border-[#ae884e]/30 bg-[#ae884e]/5"
                          : "border-gray-100 bg-gray-50/50 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#1c3053]/10 flex items-center justify-center shrink-0">
                          <MessageSquare className="w-4 h-4 text-[#1c3053]" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {senderName}
                            </p>

                            <span className="text-[10px] font-medium text-gray-400 shrink-0">
                              {formatRelativeTime(message.created_at)}
                            </span>
                          </div>

                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                            {message.message || "No message content."}
                          </p>

                          {message.is_read === false && (
                            <div className="flex items-center gap-1.5 mt-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#ae884e]" />

                              <span className="text-[10px] font-bold text-[#ae884e] uppercase tracking-wide">
                                Unread
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ae884e]">
              Shortcuts
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-1">
              Quick Actions
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin/properties"
            className="group bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#ae884e]/30 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
              <Home className="w-5 h-5 text-blue-600" />
            </div>

            <p className="text-sm font-bold text-gray-900">Properties</p>

            <p className="text-xs text-gray-400 mt-1">Manage listings</p>

            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#ae884e] group-hover:translate-x-1 transition-all mt-4" />
          </Link>

          <Link
            href="/admin/customers"
            className="group bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#ae884e]/30 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-green-600" />
            </div>

            <p className="text-sm font-bold text-gray-900">Customers</p>

            <p className="text-xs text-gray-400 mt-1">Manage your CRM</p>

            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#ae884e] group-hover:translate-x-1 transition-all mt-4" />
          </Link>

          <Link
            href="/admin/messages"
            className="group bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#ae884e]/30 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-4">
              <MessageSquare className="w-5 h-5 text-purple-600" />
            </div>

            <p className="text-sm font-bold text-gray-900">Messages</p>

            <p className="text-xs text-gray-400 mt-1">
              Customer conversations
            </p>

            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#ae884e] group-hover:translate-x-1 transition-all mt-4" />
          </Link>

          <Link
            href="/admin/reports"
            className="group bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#ae884e]/30 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5 text-[#ae884e]" />
            </div>

            <p className="text-sm font-bold text-gray-900">Reports</p>

            <p className="text-xs text-gray-400 mt-1">
              Business insights
            </p>

            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#ae884e] group-hover:translate-x-1 transition-all mt-4" />
          </Link>
        </div>
      </section>

      {/* FOOTER STATUS */}
      <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span>OneKey Estate administration portal</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <ShieldCheck className="w-4 h-4 text-[#1c3053]" />
          <span>{adminUser?.email || "Authenticated administrator"}</span>
        </div>
      </section>
    </div>
  );
}
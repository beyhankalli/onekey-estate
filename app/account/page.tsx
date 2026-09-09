"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Heart,
  Calendar,
  MessageSquare,
  FileText,
  User,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Hash,
  CreditCard,
  Loader2,
} from "lucide-react";

type ActiveTab =
  | "overview"
  | "saved"
  | "bookings"
  | "messages"
  | "applications"
  | "payments"
  | "profile";

interface Customer {
  id: string;
  auth_user_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  account_number: string | null;
  is_active: boolean | null;
}

interface Property {
  id: string;
  title: string | null;
  short_location: string | null;
  monthly_rent: number | string | null;
}

interface SavedProperty {
  id: string;
  property: Property | null;
}

interface Booking {
  id: string;
  viewing_date: string | null;
  start_time: string | null;
  status: string | null;
  property: {
    title: string | null;
  } | null;
}

interface Message {
  id: string;
  created_at: string;
  message: string;
}

interface Application {
  id: string;
  created_at: string;
  status: string | null;
  property: {
    title: string | null;
  } | null;
}

interface PaymentRecord {
  id: string;
  payment_month: string | null;
  amount: number | string | null;
  status: string | null;
}

interface AccountTab {
  id: ActiveTab;
  label: string;
  icon: typeof User;
}

export default function CustomerAccountDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  
  // Lazy Loading State'leri (Sadece sekme açıldığında dolacak)
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  // Sekme bazlı yüklenme göstergeleri (Loading flags)
  const [tabLoading, setTabLoading] = useState(false);
  const [loadedTabs, setLoadedTabs] = useState<Record<string, boolean>>({});

  // 1. Adım: Sadece müşteri temel bilgilerini ve özet sayaçları hızlıca yükle
  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function loadInitialData() {
      try {
        setLoading(true);

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace("/login");
          return;
        }

        const { data: custData, error: customerError } = await supabase
          .from("customers")
          .select("*")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (customerError) throw customerError;

        if (!custData) {
          await supabase.auth.signOut();
          if (active) {
            setCustomer(null);
            setLoading(false);
          }
          router.replace("/login?error=account-not-linked");
          return;
        }

        if (custData.is_active === false) {
          await supabase.auth.signOut();
          if (active) {
            setCustomer(null);
            setLoading(false);
          }
          router.replace("/login?error=account-disabled");
          return;
        }

        if (!active) return;
        setCustomer(custData as Customer);

        // Overview ekranı için hızlıca sayaçları çekelim
        const customerId = custData.id;
        const robustIdFilter = `customer_id.eq.${customerId},customer_id.eq.${user.id}`;

        const [
          { count: savedCount },
          { count: bookCount },
          { count: payCount },
        ] = await Promise.all([
          supabase.from("saved_properties").select("*", { count: "exact", head: true }).or(robustIdFilter),
          supabase.from("bookings").select("*", { count: "exact", head: true }).or(`customer_id.eq.${customerId},customer_id.eq.${user.id},customer_email.eq.${user.email}`),
          supabase.from("customer_payment_records").select("*", { count: "exact", head: true }).or(robustIdFilter),
        ]);

        // Geçici olarak overview sayılarını mock/state üzerinden tutabiliriz ya da lazy yükletebiliriz
        setLoadedTabs(prev => ({ ...prev, overview: true }));
      } catch (err) {
        console.error("Error loading account hub:", err);
        if (active) setCustomer(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadInitialData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session?.user) {
        if (active) router.replace("/login");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  // 2. Adım: Master v2 - Madde 27 (Lazy Loading): Kullanıcı sekmeye tıkladığında veriyi on-demand çek
  const fetchTabData = useCallback(async (tab: ActiveTab) => {
    if (!customer) return;
    
    // Eğer sekme zaten yüklendiyse tekrar tekrar istek atmaya gerek yok
    if (loadedTabs[tab] && tab !== "overview") return;

    const supabase = createClient();
    const customerId = customer.id;
    const robustIdFilter = `customer_id.eq.${customerId},customer_id.eq.${customer.auth_user_id}`;

    setTabLoading(true);

    try {
      if (tab === "saved") {
        const { data } = await supabase
          .from("saved_properties")
          .select("id, property:properties(*)")
          .or(robustIdFilter);

        if (data) {
          setSavedProperties(
            data.map((item) => ({
              id: item.id,
              property: Array.isArray(item.property)
                ? item.property[0] ?? null
                : item.property,
            })) as SavedProperty[]
          );
        }
      } else if (tab === "bookings") {
        const { data } = await supabase
          .from("bookings")
          .select("*, property:properties(title)")
          .or(`customer_id.eq.${customerId},customer_id.eq.${customer.auth_user_id},customer_email.eq.${customer.email}`)
          .order("viewing_date", { ascending: false });

        if (data) setBookings(data as Booking[]);
      } else if (tab === "messages") {
        const { data } = await supabase
          .from("messages")
          .select("*")
          .or(robustIdFilter)
          .order("created_at", { ascending: false });

        if (data) setMessages(data as Message[]);
      } else if (tab === "applications") {
        const { data } = await supabase
          .from("applications")
          .select("*, property:properties(title)")
          .or(robustIdFilter);

        if (data) setApplications(data as Application[]);
      } else if (tab === "payments") {
        const { data } = await supabase
          .from("customer_payment_records")
          .select("*")
          .or(robustIdFilter)
          .order("payment_month", { ascending: false });

        if (data) setPayments(data as PaymentRecord[]);
      }

      setLoadedTabs((prev) => ({ ...prev, [tab]: true }));
    } catch (err) {
      console.error(`Error loading tab data for ${tab}:`, err);
    } finally {
      setTabLoading(false);
    }
  }, [customer, loadedTabs]);

  // Sekme değiştiğinde lazy load tetikleyicisi
  useEffect(() => {
    if (customer && activeTab !== "overview" && activeTab !== "profile") {
      void fetchTabData(activeTab);
    }
  }, [activeTab, customer, fetchTabData]);

  const handleSignOut = async () => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Sign out failed:", error);
      setLoading(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  };

  const tabs: AccountTab[] = [
    { id: "overview", label: "Overview", icon: User },
    { id: "saved", label: `Saved Properties (${savedProperties.length})`, icon: Heart },
    { id: "bookings", label: `Viewings (${bookings.length})`, icon: Calendar },
    { id: "messages", label: `Notifications & Messages (${messages.length})`, icon: MessageSquare },
    { id: "applications", label: `Applications (${applications.length})`, icon: FileText },
    { id: "payments", label: `Payments (${payments.length})`, icon: CreditCard },
    { id: "profile", label: "Profile & Settings", icon: User },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500 font-medium">
        Loading My OneKey Portal...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="bg-[#1c3053] text-white pt-32 pb-12 px-4 sm:px-8 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-[#ae884e] mb-3 border border-white/5">
              <ShieldCheck className="w-3.5 h-3.5" /> My OneKey Client Portal
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Welcome back, {customer?.name}
            </h1>

            <p className="text-gray-300 text-sm font-light mt-2">
              Manage your saved properties, viewing schedule, and payments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/account/documents"
              className="px-5 py-2.5 bg-[#ae884e] hover:bg-[#9a7641] text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
            >
              Verification Documents
            </Link>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-red-500/20 text-red-100 hover:text-red-100 rounded-xl text-xs font-semibold transition-colors border border-white/5"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-8">
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 border-b border-gray-200 custom-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold shrink-0 transition-all ${
                  activeTab === tab.id
                    ? "bg-[#1c3053] text-white shadow-md ring-1 ring-[#1c3053]"
                    : "bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-gray-200"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    activeTab === tab.id ? "text-white" : "text-[#ae884e]"
                  }`}
                />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Sekme Yükleniyor Durumu */}
        {tabLoading && (
          <div className="py-12 flex items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
            <Loader2 className="w-6 h-6 animate-spin text-[#ae884e] mr-2" />
            <span className="text-sm text-gray-500 font-medium">Loading section data...</span>
          </div>
        )}

        {!tabLoading && activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900">Saved Properties</h3>
                <div className="p-2.5 bg-red-50 rounded-xl group-hover:scale-110 transition-transform">
                  <Heart className="w-5 h-5 text-red-500" />
                </div>
              </div>

              <p className="text-4xl font-extrabold text-gray-900 tracking-tight">
                {savedProperties.length}
              </p>

              <button
                onClick={() => setActiveTab("saved")}
                className="mt-6 text-sm font-semibold text-[#ae884e] hover:text-[#8f6e3c] flex items-center gap-1"
              >
                View saved listings &rarr;
              </button>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900">Viewing Bookings</h3>
                <div className="p-2.5 bg-amber-50 rounded-xl group-hover:scale-110 transition-transform">
                  <Calendar className="w-5 h-5 text-[#ae884e]" />
                </div>
              </div>

              <p className="text-4xl font-extrabold text-gray-900 tracking-tight">
                {bookings.length}
              </p>

              <button
                onClick={() => setActiveTab("bookings")}
                className="mt-6 text-sm font-semibold text-[#ae884e] hover:text-[#8f6e3c] flex items-center gap-1"
              >
                View scheduled viewings &rarr;
              </button>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900">Payments & Billing</h3>
                <div className="p-2.5 bg-blue-50 rounded-xl group-hover:scale-110 transition-transform">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
              </div>

              <p className="text-4xl font-extrabold text-gray-900 tracking-tight">
                {payments.length}
              </p>

              <button
                onClick={() => setActiveTab("payments")}
                className="mt-6 text-sm font-semibold text-[#ae884e] hover:text-[#8f6e3c] flex items-center gap-1"
              >
                Manage billing &rarr;
              </button>
            </div>
          </div>
        )}

        {!tabLoading && activeTab === "saved" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Your Saved Properties
            </h2>

            {savedProperties.length === 0 ? (
              <p className="text-sm text-gray-500 bg-gray-50 p-6 rounded-xl border border-gray-100 text-center">
                You haven't saved any properties yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedProperties.map((item) => {
                  const prop = item.property;
                  if (!prop) return null;

                  return (
                    <div
                      key={item.id}
                      className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="p-5 space-y-2">
                        <h3 className="font-bold text-gray-900 text-base line-clamp-1">
                          {prop.title}
                        </h3>

                        <p className="text-xs text-gray-500 font-medium">
                          {prop.short_location}
                        </p>

                        <p className="text-sm font-bold text-[#1c3053] mt-2">
                          £{prop.monthly_rent} PCM
                        </p>

                        <Link
                          href={`/listings/${prop.id}`}
                          className="inline-flex items-center justify-center w-full gap-1.5 px-4 py-2 mt-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs text-[#1c3053] font-semibold rounded-lg transition-colors"
                        >
                          View Property{" "}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!tabLoading && activeTab === "bookings" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Your Viewing Bookings
            </h2>

            {bookings.length === 0 ? (
              <p className="text-sm text-gray-500 bg-gray-50 p-6 rounded-xl border border-gray-100 text-center">
                No viewings booked yet.
              </p>
            ) : (
              <div className="space-y-4">
                {bookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-5 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors flex justify-between items-center shadow-sm"
                  >
                    <div>
                      <p className="font-bold text-sm text-gray-900">
                        {b.property?.title || "Viewing Appointment"}
                      </p>

                      <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-[#ae884e]" />
                        {b.viewing_date} at {b.start_time?.slice(0, 5)}
                      </p>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        b.status === "confirmed"
                          ? "bg-green-100 text-green-700"
                          : b.status === "rejected" || b.status === "cancelled"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!tabLoading && activeTab === "messages" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Your Notifications & Messages
            </h2>

            {messages.length === 0 ? (
              <p className="text-sm text-gray-500 bg-gray-50 p-6 rounded-xl border border-gray-100 text-center">
                No notifications or messages found.
              </p>
            ) : (
              <div className="space-y-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className="p-5 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <p className="text-xs font-bold text-[#ae884e] mb-2 uppercase tracking-wider">
                      {new Date(m.created_at).toLocaleString("en-GB")}
                    </p>

                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {m.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!tabLoading && activeTab === "applications" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Your Rental Applications
            </h2>

            {applications.length === 0 ? (
              <p className="text-sm text-gray-500 bg-gray-50 p-6 rounded-xl border border-gray-100 text-center">
                No active applications found.
              </p>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="p-5 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors flex justify-between items-center shadow-sm"
                  >
                    <div>
                      <p className="font-bold text-sm text-gray-900">
                        {app.property?.title || "Property Application"}
                      </p>

                      <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5 font-medium">
                        <FileText className="w-3.5 h-3.5 text-[#ae884e]" />{" "}
                        Submitted:{" "}
                        {new Date(app.created_at).toLocaleDateString("en-GB")}
                      </p>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        app.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : app.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {app.status || "Submitted"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!tabLoading && activeTab === "payments" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 animate-in fade-in duration-300 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Payments & Billing Portal
                </h2>

                <p className="text-xs text-gray-500 mt-1">
                  View your outstanding balances and payment records securely.
                </p>
              </div>

              <Link
                href="/account/payments"
                className="px-5 py-2.5 bg-[#1c3053] hover:bg-[#ae884e] text-white text-xs font-semibold rounded-xl transition-colors shadow-sm inline-flex items-center gap-2"
              >
                Open Full Billing Dashboard
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">
                Your Payment Records
              </h3>

              {payments.length === 0 ? (
                <p className="text-sm text-gray-500 bg-gray-50 p-6 rounded-xl border border-gray-100 text-center">
                  No payment records found.
                </p>
              ) : (
                <div className="space-y-3">
                  {payments.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 border border-gray-200 rounded-xl bg-white flex justify-between items-center shadow-sm"
                    >
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          Month: {p.payment_month?.slice(0, 7)}
                        </p>

                        <p className="text-xs text-gray-500 mt-0.5">
                          Amount: £{p.amount || "0.00"}
                        </p>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          p.status === "paid"
                            ? "bg-green-100 text-green-800"
                            : p.status === "overdue"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {!tabLoading && activeTab === "profile" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 max-w-xl animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Client Profile Information
            </h2>

            <div className="space-y-4">
              <div className="p-5 bg-amber-50/40 rounded-xl border border-amber-200/60">
                <label className="block text-xs font-bold text-[#ae884e] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5" /> Account Number
                </label>

                <p className="text-base font-extrabold text-[#1c3053] tracking-widest">
                  {customer?.account_number || "Not assigned"}
                </p>
              </div>

              <div className="p-5 bg-gray-50 rounded-xl border border-gray-100">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <p className="text-sm font-semibold text-gray-900">
                  {customer?.name || "Not specified"}
                </p>
              </div>

              <div className="p-5 bg-gray-50 rounded-xl border border-gray-100">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <p className="text-sm font-semibold text-gray-900">
                  {customer?.email}
                </p>
              </div>

              <div className="p-5 bg-gray-50 rounded-xl border border-gray-100">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <p className="text-sm font-semibold text-gray-900">
                  {customer?.phone || "Not specified"}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 leading-relaxed text-center">
                  Need to update your details? Please visit our{" "}
                  <Link
                    href="/contact"
                    className="text-[#ae884e] font-semibold underline"
                  >
                    Contact Us
                  </Link>{" "}
                  page.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
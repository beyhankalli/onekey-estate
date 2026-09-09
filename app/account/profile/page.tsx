"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Phone,
  Mail,
  ArrowLeft,
  Info,
  Hash,
} from "lucide-react";

interface ProfileData {
  accountNumber: string;
  name: string;
  email: string;
  phone: string;
}

export default function CustomerProfilePage() {
  const [loading, setLoading] = useState(true);

  const [profileData, setProfileData] = useState<ProfileData>({
    accountNumber: "",
    name: "",
    email: "",
    phone: "",
  });

  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const supabase = createClient();

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace("/login");
          return;
        }

        const { data: customer, error: customerError } = await supabase
          .from("customers")
          .select("name, email, phone, account_number, is_active")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (customerError) {
          throw customerError;
        }

        if (!customer || customer.is_active === false) {
          await supabase.auth.signOut();
          router.replace("/login?error=account-disabled");
          return;
        }

        if (!customer.account_number) {
          console.warn("Customer account number is not assigned yet.");
        }

        if (!active) {
          return;
        }

        setProfileData({
          accountNumber: customer.account_number || "Pending...",
          name:
            customer.name ||
            user.user_metadata?.full_name ||
            "Not specified",
          email: customer.email || user.email || "",
          phone: customer.phone || "Not specified",
        });
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Unknown error occurred.";

        console.error("Failed to load profile details:", message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session?.user) {
        if (active) {
          router.replace("/login");
        }
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-[#1c3053] text-white pt-32 pb-12 px-4 sm:px-8 shadow-md">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <Link
              href="/account"
              className="inline-flex items-center gap-1.5 text-xs text-[#ae884e] font-semibold uppercase tracking-wider mb-3 hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>

            <h1 className="text-3xl font-semibold">Account Profile</h1>

            <p className="text-gray-300 text-sm font-light mt-2">
              View your personal contact information and account ID.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-8 -mt-6">
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-6 sm:p-8 animate-in fade-in duration-300">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#1c3053] mb-2 uppercase tracking-wide">
                Account Number
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#ae884e]">
                  <Hash className="w-5 h-5" />
                </div>

                <input
                  type="text"
                  disabled
                  value={profileData.accountNumber}
                  className="w-full pl-10 pr-4 py-3.5 text-base font-bold tracking-[0.1em] border border-[#ae884e]/30 rounded-xl bg-amber-50/30 text-[#1c3053] cursor-default"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                Full Name
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>

                <input
                  type="text"
                  disabled
                  value={profileData.name}
                  className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-800 font-medium cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                Email Address
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>

                <input
                  type="email"
                  disabled
                  value={profileData.email}
                  className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-800 font-medium cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                Phone Number
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Phone className="w-4 h-4" />
                </div>

                <input
                  type="text"
                  disabled
                  value={profileData.phone}
                  className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-800 font-medium cursor-not-allowed"
                />
              </div>
            </div>

            <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-5 flex gap-4 items-start">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />

              <div>
                <h4 className="text-sm font-bold text-blue-900 mb-1">
                  Need to update your details?
                </h4>

                <p className="text-xs text-blue-800 leading-relaxed mb-3">
                  For security reasons, your profile information cannot be
                  changed directly from this panel. If you need to update your
                  name, email, or phone number, please contact our support
                  team.
                </p>

                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Sifre görünürlük kontrolü
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const accountError = searchParams.get("error");
    if (accountError === "account-disabled") {
      setError("This customer account is currently suspended. Please contact OneKey support.");
    } else if (accountError === "account-not-linked") {
      setError("Your customer account is not linked. Please contact OneKey support.");
    }

    let active = true;

    async function checkExistingSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (active && session?.user) {
        router.replace("/account");
      }
    }

    checkExistingSession();

    return () => {
      active = false;
    };
  }, [router, searchParams, supabase]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Your session could not be established. Please try again.");

      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("id, is_active")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (customerError) throw customerError;

      if (!customer) {
        await supabase.auth.signOut();
        throw new Error("Your customer account is not linked. Please contact OneKey support.");
      }

      if (customer.is_active === false) {
        await supabase.auth.signOut();
        throw new Error("This customer account is currently suspended. Please contact OneKey support.");
      }

      router.replace("/account");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Yazi kaldirildi; projenin logosu eklendi */}
        <Link href="/" className="flex justify-center items-center">
          <Image
            src="/onekey-logo.png"
            alt="OneKey Estate Agency"
            width={200}
            height={70}
            className="h-16 w-auto object-contain"
            priority
          />
        </Link>
        <h2 className="mt-6 text-center text-3xl font-semibold tracking-tight text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{" "}
          <Link href="/register" className="font-medium text-[#ae884e] hover:underline">
            create a new customer account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 sm:rounded-2xl sm:px-10">
          {error && (
            <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e] text-gray-900 placeholder-gray-400 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e] text-gray-900 placeholder-gray-400 bg-white"
                />
                {/* Sifreyi Göster / Gizle Butonu */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <Link href="/forgot-password" className="font-medium text-[#ae884e] hover:underline">
                Forgot your password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#1c3053] hover:bg-[#ae884e] text-white py-3.5 px-4 rounded-xl font-medium transition-colors shadow-sm disabled:bg-gray-400"
            >
              {loading ? "Signing in..." : "Sign in"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

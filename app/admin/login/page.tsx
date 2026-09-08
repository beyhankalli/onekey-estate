"use client";

import Image from "next/image";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (!data.session) {
        setError("Login failed. No active session was created.");
        setLoading(false);
        return;
      }

      // Confirm that the authenticated session is available
      // before navigating to the protected admin area.
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Login succeeded, but the session could not be established.");
        setLoading(false);
        return;
      }

      window.location.assign("/admin");
    } catch (err) {
      console.error("Login error:", err);

      setError(
        "Unable to sign in. Please check your email and password and try again."
      );

      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1c3053] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/onekey-logo.png"
            alt="OneKey Estate Agency Logo"
            width={200}
            height={48}
            sizes="200px"
            className="h-12 w-auto mx-auto mb-6"
          />

          <h1 className="text-2xl font-semibold text-gray-900">
            Admin Portal
          </h1>

          <p className="text-sm text-gray-500 mt-2">
            Sign in to manage OneKey Estate Agency
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>

            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 focus:border-[#ae884e] focus:ring-1 focus:ring-[#ae884e] outline-none text-gray-900 font-medium"
                placeholder="admin@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>

            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />

              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 focus:border-[#ae884e] focus:ring-1 focus:ring-[#ae884e] outline-none text-gray-900 font-medium"
                placeholder="••••••••"
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#ae884e] transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ae884e] text-white py-3 rounded-xl font-medium hover:bg-[#8f6e3c] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
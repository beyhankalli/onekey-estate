"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Lock, Mail } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/admin");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#1c3053] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/onekey-logo.png" alt="Logo" className="h-12 mx-auto mb-6" />
          <h1 className="text-2xl font-semibold text-gray-900">Admin Portal</h1>
        </div>
        
        {error && <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm mb-6">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-10 p-3 rounded-xl border border-gray-200 focus:border-[#ae884e] outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full pl-10 p-3 rounded-xl border border-gray-200 focus:border-[#ae884e] outline-none" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-[#ae884e] text-white py-3 rounded-xl font-medium hover:bg-[#8f6e3c] transition-all">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
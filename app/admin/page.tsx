"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Home, Users, CheckCircle } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ properties: 0, available: 0, agents: 0 });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchDashboardStats() {
      // Toplam ilan sayısı
      const { count: propCount } = await supabase
        .from("properties")
        .select("*", { count: "exact", head: true });
        
      // Müsait olan ilan sayısı
      const { count: availCount } = await supabase
        .from("properties")
        .select("*", { count: "exact", head: true })
        .eq("availability_status", "Available");
        
      // Toplam ajan sayısı
      const { count: agentCount } = await supabase
        .from("agents")
        .select("*", { count: "exact", head: true });

      setStats({
        properties: propCount || 0,
        available: availCount || 0,
        agents: agentCount || 0
      });
      setLoading(false);
    }

    fetchDashboardStats();
  }, []);

  if (loading) {
    return <div className="flex h-full items-center justify-center text-gray-500">Loading dashboard data...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 font-light mt-1">Welcome to OneKey Estate Agency management panel.</p>
      </div>
      
      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex items-center gap-5">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <Home className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Properties</p>
            <p className="text-3xl font-semibold text-gray-900">{stats.properties}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex items-center gap-5">
          <div className="p-4 bg-green-50 text-green-600 rounded-xl">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Available to Let</p>
            <p className="text-3xl font-semibold text-gray-900">{stats.available}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex items-center gap-5">
          <div className="p-4 bg-purple-50 text-[#ae884e] rounded-xl">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Agents</p>
            <p className="text-3xl font-semibold text-gray-900">{stats.agents}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, Plus } from "lucide-react";

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchAgents() {
      const { data } = await supabase.from("agents").select("*");
      if (data) setAgents(data);
      setLoading(false);
    }
    fetchAgents();
  }, []);

  if (loading) return <div className="text-gray-500">Loading agents...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Agent Management</h1>
          <p className="text-gray-500 font-light mt-1">Manage your agency brokers and staff.</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {agents.map((agent) => (
            <div key={agent.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl bg-gray-50/50">
              <img src={agent.photo || "https://via.placeholder.com/150"} alt={agent.name} className="w-16 h-16 rounded-full object-cover" />
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{agent.name}</h3>
                <p className="text-sm text-gray-500">{agent.email}</p>
                <p className="text-sm text-[#ae884e] font-medium">{agent.phone}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
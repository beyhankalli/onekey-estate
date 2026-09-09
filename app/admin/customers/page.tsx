"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  User,
  Search,
  Mail,
  Phone,
  ArrowRight,
  Filter,
  Hash,
} from "lucide-react";

interface Customer {
  id: string;
  account_number?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  lead_status?: string | null;
  is_active?: boolean | null;
  created_at: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function fetchCustomers() {
      const supabase = createClient();

      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("customers")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data) {
          setCustomers(data as Customer[]);
        }
      } catch (err: unknown) {
        console.error("Error fetching customers:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCustomers();
  }, []);

  const handleLeadStatusChange = async (
    customerId: string,
    newStatus: string
  ) => {
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("customers")
        .update({ lead_status: newStatus })
        .eq("id", customerId);

      if (error) throw error;

      setCustomers((currentCustomers) =>
        currentCustomers.map((customer) =>
          customer.id === customerId
            ? { ...customer, lead_status: newStatus }
            : customer
        )
      );
    } catch (err: unknown) {
      console.error("Error updating lead status:", err);
      alert("Failed to update lead status.");
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      customer.account_number?.toLowerCase().includes(query) ||
      customer.name?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query) ||
      customer.phone?.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "all" || customer.lead_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading customers & leads...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Customer Lead Pipeline
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and track customer journeys from initial contact to
            completion.
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Account No, Name, Email, Phone..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e] text-gray-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />

          {[
            "all",
            "New",
            "Contacted",
            "Viewing Booked",
            "Application",
            "Offer",
            "Completed",
            "Lost",
          ].map((status) => (
            <button
              type="button"
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                statusFilter === status
                  ? "bg-[#1c3053] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>No customers found matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Customer</th>
                  <th className="py-4 px-6">Contact</th>
                  <th className="py-4 px-6">Lead Status</th>
                  <th className="py-4 px-6">Joined</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredCustomers.map((customer) => {
                  const isInactive = customer.is_active === false;

                  return (
                    <tr
                      key={customer.id}
                      className={`hover:bg-gray-50/50 transition-colors ${
                        isInactive
                          ? "bg-red-50/30 opacity-75"
                          : ""
                      }`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">
                            {customer.name}
                          </span>

                          {customer.account_number && (
                            <span className="flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md">
                              <Hash className="w-3.5 h-3.5" />{" "}
                              {customer.account_number}
                            </span>
                          )}

                          {isInactive && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                              INACTIVE
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="text-gray-900 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          {customer.email}
                        </div>

                        <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {customer.phone || "N/A"}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <select
                          value={customer.lead_status || "New"}
                          onChange={(e) =>
                            handleLeadStatusChange(
                              customer.id,
                              e.target.value
                            )
                          }
                          className="text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e]"
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Viewing Booked">
                            Viewing Booked
                          </option>
                          <option value="Viewing Completed">
                            Viewing Completed
                          </option>
                          <option value="Application">Application</option>
                          <option value="Offer">Offer</option>
                          <option value="Completed">Completed</option>
                          <option value="Lost">Lost</option>
                        </select>
                      </td>

                      <td className="py-4 px-6 text-gray-500 text-xs">
                        {new Date(customer.created_at).toLocaleDateString(
                          "en-GB"
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#1c3053] hover:bg-[#ae884e] text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
                        >
                          View Profile{" "}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CalendarCheck, Check, X, Ban } from "lucide-react";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchBookings = async () => {
    setLoading(true);
    // İlan (properties) ve Ajan (agents) bilgileriyle birlikte tüm randevuları çekiyoruz
    const { data, error } = await supabase
      .from("bookings")
      .select("*, property:properties(title, property_ref), agent:agents(name)")
      .order("viewing_date", { ascending: false })
      .order("start_time", { ascending: true });
      
    if (data) setBookings(data);
    if (error) console.error("Error fetching bookings:", error);
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, [supabase]);

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("bookings").update({ status: newStatus }).eq("id", id);
    if (error) {
      alert("Error updating status: " + error.message);
    } else {
      fetchBookings();
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      pending: "bg-blue-100 text-blue-800",
      confirmed: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800"
    };
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${styles[status] || styles.pending}`}>{status}</span>;
  };

  if (loading) return <div className="text-gray-500">Loading bookings...</div>;

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Viewing Bookings</h1>
        <p className="text-gray-500 font-light mt-1">Manage property viewings and agent schedules.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden">
        {bookings.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <CalendarCheck className="w-12 h-12 text-gray-300 mb-4" />
            <p>No bookings found.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="p-5">Date & Time</th>
                <th className="p-5">Property & Agent</th>
                <th className="p-5">Customer Details</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="p-5">
                    <p className="font-semibold text-gray-900">{b.viewing_date}</p>
                    <p className="text-gray-500">{b.start_time.substring(0, 5)} - {b.end_time.substring(0, 5)}</p>
                  </td>
                  <td className="p-5">
                    <p className="font-medium text-[#1c3053] line-clamp-1">{b.property?.title || "Property Deleted"}</p>
                    <p className="text-xs text-gray-400">Agent: {b.agent?.name || "Unassigned"}</p>
                  </td>
                  <td className="p-5">
                    <p className="font-medium text-gray-900">{b.customer_name}</p>
                    <p className="text-xs text-gray-500">{b.customer_phone}</p>
                    {b.customer_email && <p className="text-xs text-gray-500">{b.customer_email}</p>}
                  </td>
                  <td className="p-5">{getStatusBadge(b.status)}</td>
                  <td className="p-5 text-right space-x-2">
                    {b.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(b.id, 'confirmed')} className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg" title="Confirm"><Check className="w-4 h-4" /></button>
                        <button onClick={() => updateStatus(b.id, 'rejected')} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg" title="Reject"><X className="w-4 h-4" /></button>
                      </>
                    )}
                    {b.status === 'confirmed' && (
                      <button onClick={() => updateStatus(b.id, 'cancelled')} className="p-2 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg" title="Cancel Booking"><Ban className="w-4 h-4" /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
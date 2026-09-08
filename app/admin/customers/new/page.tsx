"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Save, User, ClipboardList, AlertCircle } from "lucide-react";

export default function NewCustomerPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form verilerini tutacağımız state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    lead_status: "New",
    notes: "",
    // Tercihler (Preferences) JSON içine kaydedilecek
    budget: "",
    propertyType: "",
    area: "",
    bedrooms: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // JSON formatına dönüştürülecek tercihler
      const preferences_json = {
        budget: formData.budget,
        propertyType: formData.propertyType,
        area: formData.area,
        bedrooms: formData.bedrooms,
      };

      const { error: insertError } = await supabase.from("customers").insert([
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          lead_status: formData.lead_status,
          notes: formData.notes,
          preferences_json: preferences_json,
        },
      ]);

      if (insertError) {
        // Eğer e-posta adresi zaten varsa Supabase hata döndürür
        if (insertError.code === "23505") {
          throw new Error("A customer with this email address already exists.");
        }
        throw insertError;
      }

      // Başarılı olursa listeye geri dön ve sayfayı yenile
      router.push("/admin/customers");
      router.refresh();
    } catch (err: any) {
      console.error("Error adding customer:", err);
      setError(err.message || "Failed to add customer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/customers"
          className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Customer</h1>
          <p className="text-sm text-gray-500">Create a new CRM record manually.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Kişisel Bilgiler Kartı */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 border-b pb-3">
              <User className="w-5 h-5 text-[#ae884e]" />
              Personal Details
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e] text-gray-900 placeholder-gray-400"
                placeholder="e.g. John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e] text-gray-900 placeholder-gray-400"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e] text-gray-900 placeholder-gray-400"
                placeholder="+44 7700 900000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lead Status</label>
              <select
                name="lead_status"
                value={formData.lead_status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e] text-gray-900"
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Viewing Booked">Viewing Booked</option>
                <option value="Viewing Completed">Viewing Completed</option>
                <option value="Application">Application</option>
                <option value="Offer">Offer</option>
                <option value="Completed">Completed</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
          </div>

          {/* Tercihler Kartı */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 border-b pb-3">
              <ClipboardList className="w-5 h-5 text-[#ae884e]" />
              Preferences & Notes
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                <input
                  type="text"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e] text-gray-900 placeholder-gray-400"
                  placeholder="e.g. £1500 pcm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                <input
                  type="text"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e] text-gray-900 placeholder-gray-400"
                  placeholder="e.g. 2-3"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
              <input
                type="text"
                name="propertyType"
                value={formData.propertyType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e] text-gray-900 placeholder-gray-400"
                placeholder="e.g. Apartment, House"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Area</label>
              <input
                type="text"
                name="area"
                value={formData.area}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e] text-gray-900 placeholder-gray-400"
                placeholder="e.g. Halesowen"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e] resize-none text-gray-900 placeholder-gray-400"
                placeholder="Any additional requirements or background..."
              />
            </div>
          </div>
        </div>

        {/* Kaydet Butonu */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-[#1c3053] text-white px-6 py-2.5 rounded-lg hover:bg-[#ae884e] transition-colors font-medium disabled:opacity-50"
          >
            {loading ? (
              "Saving..."
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Customer
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
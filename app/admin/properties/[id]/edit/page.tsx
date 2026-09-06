"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    property_ref: "",
    title: "",
    full_address: "",
    short_location: "",
    postcode: "",
    monthly_rent: "",
    bedrooms: "1",
    bathrooms: "1",
    availability_status: "Available",
    description: "",
    is_featured: false,
  });

  // Sayfa açıldığında düzenlenecek ilanın verilerini veritabanından çekiyoruz
  useEffect(() => {
    async function fetchProperty() {
      if (!propertyId) return;

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", propertyId)
        .single();

      if (data) {
        setFormData({
          property_ref: data.property_ref || "",
          title: data.title || "",
          full_address: data.full_address || "",
          short_location: data.short_location || "",
          postcode: data.postcode || "",
          monthly_rent: data.monthly_rent?.toString() || "",
          bedrooms: data.bedrooms?.toString() || "1",
          bathrooms: data.bathrooms?.toString() || "1",
          availability_status: data.availability_status || "Available",
          description: data.description || "",
          is_featured: data.is_featured || false,
        });
      } else if (error) {
        alert("Property not found!");
        router.push("/admin/properties");
      }
      setLoading(false);
    }

    fetchProperty();
  }, [propertyId, router, supabase]);

  // Form gönderildiğinde verileri güncelleyen fonksiyon
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("properties")
      .update({
        property_ref: formData.property_ref,
        title: formData.title,
        full_address: formData.full_address,
        short_location: formData.short_location,
        postcode: formData.postcode,
        monthly_rent: parseFloat(formData.monthly_rent) || 0,
        bedrooms: parseInt(formData.bedrooms) || 1,
        bathrooms: parseInt(formData.bathrooms) || 1,
        availability_status: formData.availability_status,
        description: formData.description,
        is_featured: formData.is_featured,
      })
      .eq("id", propertyId);

    if (error) {
      alert("Error updating property: " + error.message);
      setSaving(false);
    } else {
      router.push("/admin/properties");
      router.refresh();
    }
  };

  if (loading) {
    return <div className="text-gray-500 p-8">Loading property details for editing...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/properties" className="p-2 rounded-xl bg-white border border-gray-100 text-gray-600 hover:bg-gray-50">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Edit Property</h1>
          <p className="text-gray-500 font-light mt-1">Update listing details, pricing, and availability status.</p>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Property Reference *</label>
            <input type="text" required value={formData.property_ref} onChange={(e) => setFormData({...formData, property_ref: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 text-gray-900 outline-none focus:border-[#ae884e]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Property Title *</label>
            <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 text-gray-900 outline-none focus:border-[#ae884e]" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Address *</label>
          <input type="text" required value={formData.full_address} onChange={(e) => setFormData({...formData, full_address: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 text-gray-900 outline-none focus:border-[#ae884e]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Short Location (Area) *</label>
            <input type="text" required value={formData.short_location} onChange={(e) => setFormData({...formData, short_location: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 text-gray-900 outline-none focus:border-[#ae884e]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Postcode *</label>
            <input type="text" required value={formData.postcode} onChange={(e) => setFormData({...formData, postcode: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 text-gray-900 outline-none focus:border-[#ae884e]" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Rent (£) *</label>
            <input type="number" required value={formData.monthly_rent} onChange={(e) => setFormData({...formData, monthly_rent: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 text-gray-900 outline-none focus:border-[#ae884e]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms *</label>
            <input type="number" required value={formData.bedrooms} onChange={(e) => setFormData({...formData, bedrooms: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 text-gray-900 outline-none focus:border-[#ae884e]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms *</label>
            <input type="number" required value={formData.bathrooms} onChange={(e) => setFormData({...formData, bathrooms: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 text-gray-900 outline-none focus:border-[#ae884e]" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Availability Status</label>
            <select value={formData.availability_status} onChange={(e) => setFormData({...formData, availability_status: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 text-gray-900 outline-none focus:border-[#ae884e] bg-white">
              <option value="Available">Available</option>
              <option value="Let Agreed">Let Agreed</option>
            </select>
          </div>
          <div className="flex items-center pt-8">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={formData.is_featured} onChange={(e) => setFormData({...formData, is_featured: e.target.checked})} className="w-5 h-5 accent-[#ae884e] rounded" />
              <span className="text-sm font-medium text-gray-700">Mark as Featured Property (Show on Homepage)</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 text-gray-900 outline-none focus:border-[#ae884e]"></textarea>
        </div>

        <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 bg-[#1c3053] text-white py-4 rounded-xl font-medium hover:bg-[#ae884e] transition-all shadow-lg">
          <Save className="w-5 h-5" /> {saving ? "Updating Property..." : "Update Property"}
        </button>
      </form>
    </div>
  );
}
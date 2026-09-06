"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Save, Image as ImageIcon, Box, FileText, Upload } from "lucide-react";
import Link from "next/link";

export default function NewPropertyPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

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

  const [interiorFiles, setInteriorFiles] = useState<FileList | null>(null);
  const [exteriorFiles, setExteriorFiles] = useState<FileList | null>(null);
  const [floorPlanFile, setFloorPlanFile] = useState<File | null>(null);
  const [model3dFile, setModel3dFile] = useState<File | null>(null);

  // Dosya adını güvenli ve benzersiz yapan düzeltilmiş fonksiyon
  const uploadFileToSupabase = async (file: File, folder: string) => {
    const fileExt = file.name.split(".").pop();
    const randomString = Math.random().toString(36).substring(2);
    const fileName = `${randomString}-${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("property-files")
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from("property-files").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      setUploadStatus("Saving property details...");

      const { data: propData, error: propError } = await supabase.from("properties").insert([
        {
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
        },
      ]).select().single();

      if (propError) throw propError;
      const propertyId = propData.id;

      let floorPlanUrl = null;
      if (floorPlanFile) {
        setUploadStatus("Uploading 2D floor plan...");
        floorPlanUrl = await uploadFileToSupabase(floorPlanFile, "floor-plans");
      }

      let model3dUrl = null;
      let has3d = false;
      if (model3dFile) {
        setUploadStatus("Uploading 3D model...");
        model3dUrl = await uploadFileToSupabase(model3dFile, "models-3d");
        has3d = true;
      }

      if (floorPlanUrl || model3dUrl) {
        await supabase.from("properties").update({
          floor_plan_2d: floorPlanUrl,
          model_3d_url: model3dUrl,
          has_3d_model: has3d
        }).eq("id", propertyId);
      }

      if (interiorFiles && interiorFiles.length > 0) {
        setUploadStatus("Uploading interior photos...");
        for (let i = 0; i < interiorFiles.length; i++) {
          const file = interiorFiles[i];
          const publicUrl = await uploadFileToSupabase(file, "interior");
          await supabase.from("property_images").insert([
            { property_id: propertyId, url: publicUrl, image_type: 'interior', display_order: i }
          ]);
        }
      }

      if (exteriorFiles && exteriorFiles.length > 0) {
        setUploadStatus("Uploading exterior photos...");
        for (let i = 0; i < exteriorFiles.length; i++) {
          const file = exteriorFiles[i];
          const publicUrl = await uploadFileToSupabase(file, "exterior");
          await supabase.from("property_images").insert([
            { property_id: propertyId, url: publicUrl, image_type: 'exterior', display_order: i }
          ]);
        }
      }

      setLoading(false);
      router.push("/admin/properties");
      router.refresh();

    } catch (error: any) {
      alert("Error: " + error.message);
      setLoading(false);
      setUploadStatus("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/properties" className="p-2 rounded-xl bg-white border border-gray-100 text-gray-600 hover:bg-gray-50">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Add New Property</h1>
          <p className="text-gray-500 font-light mt-1">Upload photos, floor plans and 3D models directly from your device.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Property Reference *</label>
            <input type="text" required placeholder="e.g. 3015769" value={formData.property_ref} onChange={(e) => setFormData({...formData, property_ref: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 text-gray-900 outline-none focus:border-[#ae884e]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Property Title *</label>
            <input type="text" required placeholder="e.g. Modern Luxury Apartment" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 text-gray-900 outline-none focus:border-[#ae884e]" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Address *</label>
          <input type="text" required placeholder="e.g. 15 Riverside Way, London" value={formData.full_address} onChange={(e) => setFormData({...formData, full_address: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 text-gray-900 outline-none focus:border-[#ae884e]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Short Location (Area) *</label>
            <input type="text" required placeholder="e.g. Canary Wharf" value={formData.short_location} onChange={(e) => setFormData({...formData, short_location: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 text-gray-900 outline-none focus:border-[#ae884e]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Postcode *</label>
            <input type="text" required placeholder="e.g. E14 9AA" value={formData.postcode} onChange={(e) => setFormData({...formData, postcode: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 text-gray-900 outline-none focus:border-[#ae884e]" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Rent (£) *</label>
            <input type="number" required placeholder="e.g. 2500" value={formData.monthly_rent} onChange={(e) => setFormData({...formData, monthly_rent: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 text-gray-900 outline-none focus:border-[#ae884e]" />
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

        <div className="border-t border-gray-100 pt-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#ae884e]" /> Device Uploads (Photos, Floor Plan & 3D Model)
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Interior Photos (Multiple files can be selected)</label>
            <input type="file" multiple accept="image/*" onChange={(e) => setInteriorFiles(e.target.files)} className="w-full p-3 rounded-xl border border-gray-200 text-gray-500 bg-gray-50 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#ae884e] file:text-white hover:file:bg-[#8f6e3c]" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exterior Photos (Multiple files can be selected)</label>
            <input type="file" multiple accept="image/*" onChange={(e) => setExteriorFiles(e.target.files)} className="w-full p-3 rounded-xl border border-gray-200 text-gray-500 bg-gray-50 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#ae884e] file:text-white hover:file:bg-[#8f6e3c]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#ae884e]" /> 2D Floor Plan (Image/PDF)
              </label>
              <input type="file" accept="image/*,application/pdf" onChange={(e) => setFloorPlanFile(e.target.files?.[0] || null)} className="w-full p-3 rounded-xl border border-gray-200 text-gray-500 bg-gray-50 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#1c3053] file:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <Box className="w-4 h-4 text-[#ae884e]" /> 3D Model File (.glb / .gltf)
              </label>
              <input type="file" accept=".glb,.gltf" onChange={(e) => setModel3dFile(e.target.files?.[0] || null)} className="w-full p-3 rounded-xl border border-gray-200 text-gray-500 bg-gray-50 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#1c3053] file:text-white" />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea rows={4} placeholder="Enter property description..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 text-gray-900 outline-none focus:border-[#ae884e]"></textarea>
        </div>

        <div className="flex items-center">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={formData.is_featured} onChange={(e) => setFormData({...formData, is_featured: e.target.checked})} className="w-5 h-5 accent-[#ae884e] rounded" />
            <span className="text-sm font-medium text-gray-700">Mark as Featured Property (Show on Homepage)</span>
          </label>
        </div>

        <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-[#1c3053] text-white py-4 rounded-xl font-medium hover:bg-[#ae884e] transition-all shadow-lg">
          <Save className="w-5 h-5" /> {loading ? (uploadStatus || "Uploading Files...") : "Save Property"}
        </button>
      </form>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Save, Upload, FileText, Box, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

export default function NewPropertyPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [agents, setAgents] = useState<any[]>([]);

  const [newInteriorFiles, setNewInteriorFiles] = useState<FileList | null>(null);
  const [newExteriorFiles, setNewExteriorFiles] = useState<FileList | null>(null);
  const [newFloorPlan, setNewFloorPlan] = useState<File | null>(null);
  const [new3DModel, setNew3DModel] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    property_ref: "", title: "", full_address: "", short_location: "", postcode: "",
    monthly_rent: "", deposit: "", bedrooms: "1", bathrooms: "1",
    availability_status: "Available", available_from: "", preferred_min_tenancy: "",
    description: "", is_featured: false, agent_id: "", epc_rating: "", furnishing_status: "Unfurnished",
    broadband_info: "", bills_included: false, dss_lha_covers_rent: false,
    pets_allowed: false, smokers_allowed: false, student_friendly: false, families_allowed: false,
    garden: false, parking: false, fireplace: false, online_viewings: false
  });

  useEffect(() => {
    async function fetchAgents() {
      const { data } = await supabase.from("agents").select("id, name");
      if (data) setAgents(data);
    }
    fetchAgents();
  }, [supabase]);

  const uploadFileToSupabase = async (file: File, folder: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;
    const { error } = await supabase.storage.from("property-files").upload(filePath, file);
    if (error) throw error;
    const { data } = supabase.storage.from("property-files").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUploadStatus("Saving property details...");

    try {
      const { data: propData, error: propError } = await supabase.from("properties").insert([
        {
          property_ref: formData.property_ref, title: formData.title, full_address: formData.full_address,
          short_location: formData.short_location, postcode: formData.postcode, 
          monthly_rent: parseFloat(formData.monthly_rent) || 0, deposit: parseFloat(formData.deposit) || 0,
          bedrooms: parseInt(formData.bedrooms) || 1, bathrooms: parseInt(formData.bathrooms) || 1,
          availability_status: formData.availability_status, available_from: formData.available_from,
          preferred_min_tenancy: formData.preferred_min_tenancy, description: formData.description,
          is_featured: formData.is_featured, agent_id: formData.agent_id || null, epc_rating: formData.epc_rating,
          furnishing_status: formData.furnishing_status, broadband_info: formData.broadband_info,
          bills_included: formData.bills_included, dss_lha_covers_rent: formData.dss_lha_covers_rent,
          pets_allowed: formData.pets_allowed, smokers_allowed: formData.smokers_allowed,
          student_friendly: formData.student_friendly, families_allowed: formData.families_allowed,
          garden: formData.garden, parking: formData.parking, fireplace: formData.fireplace,
          online_viewings: formData.online_viewings
        }
      ]).select().single();

      if (propError) throw propError;
      const propertyId = propData.id;

      let floorPlanUrl = null;
      let model3dUrl = null;
      let has3d = false;

      if (newFloorPlan) {
        setUploadStatus("Uploading 2D Floor Plan...");
        floorPlanUrl = await uploadFileToSupabase(newFloorPlan, "floor-plans");
      }
      if (new3DModel) {
        setUploadStatus("Uploading 3D Model...");
        model3dUrl = await uploadFileToSupabase(new3DModel, "models-3d");
        has3d = true;
      }

      if (floorPlanUrl || model3dUrl) {
        await supabase.from("properties").update({
          floor_plan_2d: floorPlanUrl, model_3d_url: model3dUrl, has_3d_model: has3d
        }).eq("id", propertyId);
      }

      if (newInteriorFiles && newInteriorFiles.length > 0) {
        setUploadStatus("Uploading interior media...");
        for (let i = 0; i < newInteriorFiles.length; i++) {
          const url = await uploadFileToSupabase(newInteriorFiles[i], "interior");
          await supabase.from("property_images").insert([{ property_id: propertyId, url, image_type: 'interior', display_order: i }]);
        }
      }

      if (newExteriorFiles && newExteriorFiles.length > 0) {
        setUploadStatus("Uploading exterior media...");
        for (let i = 0; i < newExteriorFiles.length; i++) {
          const url = await uploadFileToSupabase(newExteriorFiles[i], "exterior");
          await supabase.from("property_images").insert([{ property_id: propertyId, url, image_type: 'exterior', display_order: i }]);
        }
      }

      setLoading(false);
      setUploadStatus("");
      alert("Property successfully created!"); // GERİ BİLDİRİM
      router.push("/admin/properties");
      router.refresh();
    } catch (error: any) {
      alert("Error saving property: " + error.message);
      setLoading(false);
      setUploadStatus("");
    }
  };

  const CheckboxField = ({ label, keyName }: { label: string, keyName: keyof typeof formData }) => (
    <label className="flex items-center gap-3 cursor-pointer">
      <input type="checkbox" checked={formData[keyName] as boolean} onChange={(e) => setFormData({...formData, [keyName]: e.target.checked})} className="w-5 h-5 accent-[#ae884e] rounded" />
      <span className="text-sm font-medium text-gray-900">{label}</span>
    </label>
  );

  // Genel input stili: Koyu metin, belirgin arka plan ve çerçeve
  const inputClass = "w-full p-3 rounded-xl border border-gray-300 text-gray-900 font-medium bg-white outline-none focus:border-[#ae884e] placeholder:text-gray-400";

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/properties" className="p-2 rounded-xl bg-white border border-gray-100 text-gray-600 hover:bg-gray-50">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Add New Property</h1>
          <p className="text-gray-500 font-light mt-1">Create a new listing and upload all media files.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 space-y-6">
          <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-100 pb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Property Reference *</label>
              <input type="text" required value={formData.property_ref} onChange={(e) => setFormData({...formData, property_ref: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Property Title *</label>
              <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Address *</label>
              <input type="text" required value={formData.full_address} onChange={(e) => setFormData({...formData, full_address: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Short Location *</label>
              <input type="text" required value={formData.short_location} onChange={(e) => setFormData({...formData, short_location: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Postcode *</label>
              <input type="text" required value={formData.postcode} onChange={(e) => setFormData({...formData, postcode: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assign Agent</label>
              <select value={formData.agent_id} onChange={(e) => setFormData({...formData, agent_id: e.target.value})} className={inputClass}>
                <option value="">-- Select an Agent --</option>
                {agents.map((agent) => (<option key={agent.id} value={agent.id}>{agent.name}</option>))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 space-y-6">
          <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-100 pb-4">Price, Bills & Availability</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rent PCM (£) *</label>
              <input type="number" required value={formData.monthly_rent} onChange={(e) => setFormData({...formData, monthly_rent: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Deposit (£)</label>
              <input type="number" value={formData.deposit} onChange={(e) => setFormData({...formData, deposit: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Broadband Info</label>
              <input type="text" placeholder="e.g. Fibre Optic" value={formData.broadband_info} onChange={(e) => setFormData({...formData, broadband_info: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select value={formData.availability_status} onChange={(e) => setFormData({...formData, availability_status: e.target.value})} className={inputClass}>
                <option value="Available">Available</option>
                <option value="Let Agreed">Let Agreed</option>
                <option value="Unavailable">Unavailable</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Available From</label>
              <input type="date" value={formData.available_from} onChange={(e) => setFormData({...formData, available_from: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Min Tenancy</label>
              <input type="text" placeholder="e.g. 6 Months" value={formData.preferred_min_tenancy} onChange={(e) => setFormData({...formData, preferred_min_tenancy: e.target.value})} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <CheckboxField label="Bills Included" keyName="bills_included" />
            <CheckboxField label="DSS/LHA Covers Rent" keyName="dss_lha_covers_rent" />
            <CheckboxField label="Online Viewings" keyName="online_viewings" />
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 space-y-6">
          <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-100 pb-4">Features & Tenant Preferences</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
              <input type="number" required value={formData.bedrooms} onChange={(e) => setFormData({...formData, bedrooms: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
              <input type="number" required value={formData.bathrooms} onChange={(e) => setFormData({...formData, bathrooms: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Furnishing</label>
              <select value={formData.furnishing_status} onChange={(e) => setFormData({...formData, furnishing_status: e.target.value})} className={inputClass}>
                <option value="Furnished">Furnished</option>
                <option value="Part-furnished">Part-furnished</option>
                <option value="Unfurnished">Unfurnished</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">EPC Rating</label>
              <input type="text" placeholder="e.g. D" value={formData.epc_rating} onChange={(e) => setFormData({...formData, epc_rating: e.target.value})} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <CheckboxField label="Student Friendly" keyName="student_friendly" />
            <CheckboxField label="Families Allowed" keyName="families_allowed" />
            <CheckboxField label="Pets Allowed" keyName="pets_allowed" />
            <CheckboxField label="Smokers Allowed" keyName="smokers_allowed" />
            <CheckboxField label="Garden" keyName="garden" />
            <CheckboxField label="Parking" keyName="parking" />
            <CheckboxField label="Fireplace" keyName="fireplace" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea rows={5} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className={inputClass}></textarea>
          </div>
          <CheckboxField label="Mark as Featured Property (Show on Homepage)" keyName="is_featured" />
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 space-y-6">
          <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-100 pb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#ae884e]" /> Upload Media Files
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interior (Photos & Videos)</label>
              <input type="file" multiple accept="image/*,video/*" onChange={(e) => setNewInteriorFiles(e.target.files)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exterior (Photos & Videos)</label>
              <input type="file" multiple accept="image/*,video/*" onChange={(e) => setNewExteriorFiles(e.target.files)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><FileText className="w-4 h-4 text-[#ae884e]" /> 2D Floor Plan</label>
              <input type="file" accept="image/*,application/pdf" onChange={(e) => setNewFloorPlan(e.target.files?.[0] || null)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Box className="w-4 h-4 text-[#ae884e]" /> 3D Model (.glb/.gltf)</label>
              <input type="file" accept=".glb,.gltf" onChange={(e) => setNew3DModel(e.target.files?.[0] || null)} className={inputClass} />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-[#1c3053] text-white py-4 rounded-xl font-medium hover:bg-[#ae884e] transition-all shadow-lg">
          <Save className="w-5 h-5" /> {loading ? (uploadStatus || "Saving...") : "Save Property"}
        </button>
      </form>
    </div>
  );
}
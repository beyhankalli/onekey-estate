"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Save, Trash2, Upload, FileText, Box, Video, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [uploadStatus, setUploadStatus] = useState("");

  const [existingImages, setExistingImages] = useState<any[]>([]);
  
  const [newInteriorFiles, setNewInteriorFiles] = useState<FileList | null>(null);
  const [newExteriorFiles, setNewExteriorFiles] = useState<FileList | null>(null);
  const [newFloorPlan, setNewFloorPlan] = useState<File | null>(null);
  const [new3DModel, setNew3DModel] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    property_ref: "", title: "", full_address: "", short_location: "", postcode: "",
    monthly_rent: "", deposit: "", bedrooms: "1", bathrooms: "1",
    availability_status: "Available", available_from: "", preferred_min_tenancy: "",
    description: "", is_featured: false, agent_id: "", epc_rating: "", furnishing_status: "",
    broadband_info: "", bills_included: false, dss_lha_covers_rent: false,
    pets_allowed: false, smokers_allowed: false, student_friendly: false, families_allowed: false,
    garden: false, parking: false, fireplace: false, online_viewings: false,
    floor_plan_2d: "", model_3d_url: ""
  });

  useEffect(() => {
    async function fetchData() {
      const { data: agentsData } = await supabase.from("agents").select("id, name");
      if (agentsData) setAgents(agentsData);

      const { data: propData } = await supabase.from("properties").select("*").eq("id", propertyId).single();
      const { data: imagesData } = await supabase.from("property_images").select("*").eq("property_id", propertyId).order('display_order', { ascending: true });

      if (propData) {
        setFormData({
          property_ref: propData.property_ref || "", title: propData.title || "",
          full_address: propData.full_address || "", short_location: propData.short_location || "",
          postcode: propData.postcode || "", monthly_rent: propData.monthly_rent?.toString() || "",
          deposit: propData.deposit?.toString() || "", bedrooms: propData.bedrooms?.toString() || "1",
          bathrooms: propData.bathrooms?.toString() || "1", availability_status: propData.availability_status || "Available",
          available_from: propData.available_from || "", preferred_min_tenancy: propData.preferred_min_tenancy || "",
          description: propData.description || "", is_featured: propData.is_featured || false,
          agent_id: propData.agent_id || "", epc_rating: propData.epc_rating || "",
          furnishing_status: propData.furnishing_status || "", broadband_info: propData.broadband_info || "",
          bills_included: propData.bills_included || false, dss_lha_covers_rent: propData.dss_lha_covers_rent || false,
          pets_allowed: propData.pets_allowed || false, smokers_allowed: propData.smokers_allowed || false,
          student_friendly: propData.student_friendly || false, families_allowed: propData.families_allowed || false,
          garden: propData.garden || false, parking: propData.parking || false,
          fireplace: propData.fireplace || false, online_viewings: propData.online_viewings || false,
          floor_plan_2d: propData.floor_plan_2d || "", model_3d_url: propData.model_3d_url || ""
        });
      }

      if (imagesData) setExistingImages(imagesData);
      setLoading(false);
    }
    if (propertyId) fetchData();
  }, [propertyId, supabase]);

  const handleDeleteMedia = async (mediaId: string, url: string, type: 'image' | 'floor_plan' | '3d_model') => {
    if (!window.confirm("Are you sure you want to delete this file? This action cannot be undone.")) return;
    
    try {
      setUploadStatus("Deleting file...");
      const filePathPathMatch = url.match(/property-files\/(.+)$/);
      if (filePathPathMatch) {
        await supabase.storage.from('property-files').remove([filePathPathMatch[1]]);
      }

      if (type === 'image') {
        await supabase.from("property_images").delete().eq("id", mediaId);
        setExistingImages(prev => prev.filter(img => img.id !== mediaId));
      } else if (type === 'floor_plan') {
        await supabase.from("properties").update({ floor_plan_2d: null }).eq("id", propertyId);
        setFormData(prev => ({ ...prev, floor_plan_2d: "" }));
      } else if (type === '3d_model') {
        await supabase.from("properties").update({ model_3d_url: null, has_3d_model: false }).eq("id", propertyId);
        setFormData(prev => ({ ...prev, model_3d_url: "" }));
      }
      setUploadStatus("");
      alert("Media successfully deleted!"); 
    } catch (error) {
      alert("Error deleting file.");
      setUploadStatus("");
    }
  };

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
    setSaving(true);
    setUploadStatus("Saving details...");

    try {
      const { error } = await supabase.from("properties").update({
        property_ref: formData.property_ref, title: formData.title, full_address: formData.full_address,
        short_location: formData.short_location, postcode: formData.postcode, 
        monthly_rent: parseFloat(formData.monthly_rent) || 0, deposit: parseFloat(formData.deposit) || 0,
        bedrooms: parseInt(formData.bedrooms) || 1, bathrooms: parseInt(formData.bathrooms) || 1,
        availability_status: formData.availability_status, available_from: formData.available_from,
        preferred_min_tenancy: formData.preferred_min_tenancy, description: formData.description,
        is_featured: formData.is_featured, 
        agent_id: formData.agent_id === "" ? null : formData.agent_id, 
        epc_rating: formData.epc_rating,
        furnishing_status: formData.furnishing_status, broadband_info: formData.broadband_info,
        bills_included: formData.bills_included, dss_lha_covers_rent: formData.dss_lha_covers_rent,
        pets_allowed: formData.pets_allowed, smokers_allowed: formData.smokers_allowed,
        student_friendly: formData.student_friendly, families_allowed: formData.families_allowed,
        garden: formData.garden, parking: formData.parking, fireplace: formData.fireplace,
        online_viewings: formData.online_viewings
      }).eq("id", propertyId);

      if (error) throw error;

      // HATA YAKALAMA (ERROR THROWING) BLOKLARI EKLENDİ
      if (newFloorPlan) {
        setUploadStatus("Uploading 2D Floor Plan...");
        const url = await uploadFileToSupabase(newFloorPlan, "floor-plans");
        const { error: fpError } = await supabase.from("properties").update({ floor_plan_2d: url }).eq("id", propertyId);
        if (fpError) throw fpError;
      }
      if (new3DModel) {
        setUploadStatus("Uploading 3D Model...");
        const url = await uploadFileToSupabase(new3DModel, "models-3d");
        const { error: m3dError } = await supabase.from("properties").update({ model_3d_url: url, has_3d_model: true }).eq("id", propertyId);
        if (m3dError) throw m3dError;
      }
      if (newInteriorFiles && newInteriorFiles.length > 0) {
        setUploadStatus("Uploading interior media...");
        for (let i = 0; i < newInteriorFiles.length; i++) {
          const url = await uploadFileToSupabase(newInteriorFiles[i], "interior");
          const { error: intError } = await supabase.from("property_images").insert([{ property_id: propertyId, url, image_type: 'interior' }]);
          if (intError) throw intError;
        }
      }
      if (newExteriorFiles && newExteriorFiles.length > 0) {
        setUploadStatus("Uploading exterior media...");
        for (let i = 0; i < newExteriorFiles.length; i++) {
          const url = await uploadFileToSupabase(newExteriorFiles[i], "exterior");
          const { error: extError } = await supabase.from("property_images").insert([{ property_id: propertyId, url, image_type: 'exterior' }]);
          if (extError) throw extError;
        }
      }

      setSaving(false);
      setUploadStatus("");
      alert("Property successfully updated!"); 
      router.push("/admin/properties");
      router.refresh();
    } catch (error: any) {
      alert("Error updating property: " + error.message);
      setSaving(false);
      setUploadStatus("");
    }
  };

  const CheckboxField = ({ label, keyName }: { label: string, keyName: keyof typeof formData }) => (
    <label className="flex items-center gap-3 cursor-pointer">
      <input type="checkbox" checked={formData[keyName] as boolean} onChange={(e) => setFormData({...formData, [keyName]: e.target.checked})} className="w-5 h-5 accent-[#ae884e] rounded" />
      <span className="text-sm font-medium text-gray-900">{label}</span>
    </label>
  );

  // Normal kutular için CSS
  const inputClass = "w-full p-3 rounded-xl border border-gray-300 text-gray-900 font-medium bg-white outline-none focus:border-[#ae884e] placeholder:text-gray-400";
  
  // YENİ: Dosya Yükleme kutuları için o taşıp bozulan görüntüyü tamamen çözen özel CSS
  const fileInputClass = "w-full p-2 rounded-xl border border-gray-300 text-gray-900 font-medium bg-white outline-none focus:border-[#ae884e] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#1c3053]/10 file:text-[#1c3053] hover:file:bg-[#1c3053]/20 cursor-pointer transition-all";

  if (loading) return <div className="max-w-4xl mx-auto p-8 text-gray-500">Loading property details...</div>;

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/properties" className="p-2 rounded-xl bg-white border border-gray-100 text-gray-600 hover:bg-gray-50">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Edit Property</h1>
          <p className="text-gray-500 font-light mt-1">Update property details, preferences, and media.</p>
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

        <div className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 space-y-8">
          <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-100 pb-4">Media Management</h3>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Existing Media (Click trash to delete)</h4>
            <div className="flex flex-wrap gap-4">
              {existingImages.map((media) => (
                <div key={media.id} className="relative w-32 h-32 rounded-xl overflow-hidden border border-gray-200 group">
                  {media.url.match(/\.(mp4|webm|mov)$/i) ? (
                     <video src={media.url} className="w-full h-full object-cover" />
                  ) : (
                     <img src={media.url} alt="property" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-2 py-1 rounded">{media.image_type}</div>
                  <button type="button" onClick={() => handleDeleteMedia(media.id, media.url, 'image')} className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-6 h-6 text-white" />
                  </button>
                </div>
              ))}
              
              {formData.floor_plan_2d && (
                <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex flex-col items-center justify-center group">
                  <FileText className="w-8 h-8 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">2D Plan</span>
                  <button type="button" onClick={() => handleDeleteMedia('2d', formData.floor_plan_2d, 'floor_plan')} className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-6 h-6 text-white" />
                  </button>
                </div>
              )}

              {formData.model_3d_url && (
                <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex flex-col items-center justify-center group">
                  <Box className="w-8 h-8 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">3D Model</span>
                  <button type="button" onClick={() => handleDeleteMedia('3d', formData.model_3d_url, '3d_model')} className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-6 h-6 text-white" />
                  </button>
                </div>
              )}
            </div>
            {existingImages.length === 0 && !formData.floor_plan_2d && !formData.model_3d_url && (
              <p className="text-sm text-gray-400 italic">No media uploaded yet.</p>
            )}
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><Upload className="w-4 h-4" /> Upload New Media</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Interior (Photos & Videos)</label>
                <input type="file" multiple accept="image/*,video/*" onChange={(e) => setNewInteriorFiles(e.target.files)} className={fileInputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exterior (Photos & Videos)</label>
                <input type="file" multiple accept="image/*,video/*" onChange={(e) => setNewExteriorFiles(e.target.files)} className={fileInputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><FileText className="w-4 h-4 text-[#ae884e]" /> 2D Floor Plan</label>
                <input type="file" accept="image/*,application/pdf" onChange={(e) => setNewFloorPlan(e.target.files?.[0] || null)} className={fileInputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Box className="w-4 h-4 text-[#ae884e]" /> 3D Model (.glb/.gltf)</label>
                <input type="file" accept=".glb,.gltf" onChange={(e) => setNew3DModel(e.target.files?.[0] || null)} className={fileInputClass} />
              </div>
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 bg-[#1c3053] text-white py-4 rounded-xl font-medium hover:bg-[#ae884e] transition-all shadow-lg disabled:bg-gray-400">
          <Save className="w-5 h-5" /> {saving ? (uploadStatus || "Updating...") : "Update Property"}
        </button>
      </form>
    </div>
  );
}
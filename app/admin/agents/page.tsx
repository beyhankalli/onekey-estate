"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, Plus, Save, X, Image as ImageIcon, Edit, Trash2 } from "lucide-react";

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // YENİ EKLENEN STATE'LER: setSaving hatasını çözen kısım
  const [saving, setSaving] = useState(false); 
  const [uploadStatus, setUploadStatus] = useState("");
  
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", whatsapp: "", bio: "", photoUrl: ""
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const supabase = createClient();

  const fetchAgents = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("agents").select("*").order("created_at", { ascending: false });
    if (data) setAgents(data);
    if (error) console.error("Error fetching agents:", error);
    setLoading(false);
  };

  useEffect(() => {
    fetchAgents();
  }, [supabase]);

  const uploadPhotoToSupabase = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `agent-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `agents/${fileName}`;
    const { error: uploadError } = await supabase.storage.from("property-files").upload(filePath, file);
    if (uploadError) throw new Error(uploadError.message);
    const { data } = supabase.storage.from("property-files").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleOpenForm = (agent?: any) => {
    if (agent) {
      setEditingId(agent.id);
      setFormData({
        name: agent.name || "", email: agent.email || "", phone: agent.phone || "",
        whatsapp: agent.whatsapp || "", bio: agent.bio || "", photoUrl: agent.photo || ""
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", email: "", phone: "", whatsapp: "", bio: "", photoUrl: "" });
    }
    setPhotoFile(null);
    setIsFormOpen(true);
    setUploadStatus("");
    setSaving(false);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  // DÜZELTİLEN KISIM: Ajan kaydetme fonksiyonu olması gerektiği gibi yazıldı.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setUploadStatus("Saving agent details...");

    try {
      let finalPhotoUrl = formData.photoUrl;

      // Eğer yeni bir fotoğraf seçildiyse önce onu Supabase Storage'a yükle
      if (photoFile) {
        setUploadStatus("Uploading photo...");
        finalPhotoUrl = await uploadPhotoToSupabase(photoFile);
      }

      // Veritabanına gönderilecek sadece ajan verilerini hazırlıyoruz
      const payload = {
        name: formData.name,
        email: formData.email === "" ? null : formData.email,
        phone: formData.phone === "" ? null : formData.phone,
        whatsapp: formData.whatsapp === "" ? null : formData.whatsapp,
        bio: formData.bio === "" ? null : formData.bio,
        photo: finalPhotoUrl === "" ? null : finalPhotoUrl
      };

      if (editingId) {
        // Mevcut ajanı güncelle (Update)
        const { error } = await supabase.from("agents").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        // Yeni ajan ekle (Insert)
        const { error } = await supabase.from("agents").insert([payload]);
        if (error) throw error;
      }

      alert(`Agent successfully ${editingId ? "updated" : "added"}!`);
      handleCloseForm();
      fetchAgents(); // Listeyi yenile
    } catch (error: any) {
      alert("Error saving agent: " + error.message);
    } finally {
      setSaving(false);
      setUploadStatus("");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this agent? This will also remove them from any assigned properties.")) return;
    
    try {
      const { error } = await supabase.from("agents").delete().eq("id", id);
      if (error) throw error;
      
      alert("Agent successfully deleted!");
      fetchAgents();
    } catch (error: any) {
      alert("Error deleting agent: " + error.message);
    }
  };

  if (loading && agents.length === 0) return <div className="text-gray-500">Loading agents...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Agent Management</h1>
          <p className="text-gray-500 font-light mt-1">Manage your agency brokers and staff.</p>
        </div>
        {!isFormOpen && (
          <button onClick={() => handleOpenForm()} className="flex items-center gap-2 bg-[#ae884e] text-white px-5 py-3 rounded-xl font-medium hover:bg-[#8f6e3c] transition-all shadow-md">
            <Plus className="w-5 h-5" /> Add Agent
          </button>
        )}
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 mb-8 space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-900">{editingId ? "Edit Agent Details" : "New Agent Details"}</h2>
            <button type="button" onClick={handleCloseForm} className="text-gray-400 hover:text-red-500 transition-colors"><X className="w-6 h-6" /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-3 rounded-xl border border-gray-300 text-gray-900 font-medium bg-white outline-none focus:border-[#ae884e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-3 rounded-xl border border-gray-300 text-gray-900 font-medium bg-white outline-none focus:border-[#ae884e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full p-3 rounded-xl border border-gray-300 text-gray-900 font-medium bg-white outline-none focus:border-[#ae884e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Number</label>
              <input type="text" value={formData.whatsapp} onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} className="w-full p-3 rounded-xl border border-gray-300 text-gray-900 font-medium bg-white outline-none focus:border-[#ae884e]" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Biography</label>
            <textarea rows={3} value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="w-full p-3 rounded-xl border border-gray-300 text-gray-900 font-medium bg-white outline-none focus:border-[#ae884e]"></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-[#ae884e]" /> Profile Photo</label>
            {formData.photoUrl && !photoFile && (
               <div className="mb-3"><img src={formData.photoUrl} alt="Current" className="w-16 h-16 rounded-full object-cover shadow-sm border border-gray-100" /></div>
            )}
            <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} className="w-full p-3 rounded-xl border border-gray-300 text-gray-900 font-medium bg-white outline-none focus:border-[#ae884e]" />
          </div>

          <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 bg-[#1c3053] text-white py-4 rounded-xl font-medium hover:bg-[#ae884e] transition-all shadow-lg disabled:bg-gray-400">
            <Save className="w-5 h-5" /> {uploadStatus || (editingId ? "Update Agent" : "Save Agent")}
          </button>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-8">
        {agents.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <Users className="w-12 h-12 text-gray-300 mb-4" />
            <p>No agents found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden border border-white shadow-sm">
                    {agent.photo ? <img src={agent.photo} alt={agent.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-[#1c3053]/10 text-[#1c3053] font-semibold text-xl">{agent.name.charAt(0)}</div>}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{agent.name}</h3>
                    {agent.email && <p className="text-sm text-gray-500">{agent.email}</p>}
                    {agent.phone ? <p className="text-sm text-[#ae884e] font-medium">{agent.phone}</p> : <p className="text-xs text-gray-400 font-light italic">No contact info</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenForm(agent)} className="p-2 rounded-lg bg-white border border-gray-100 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(agent.id)} className="p-2 rounded-lg bg-white border border-gray-100 text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
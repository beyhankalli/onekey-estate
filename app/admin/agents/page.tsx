"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Users,
  UserPlus,
  Phone,
  Mail,
  MessageSquare,
  Trash2,
  Edit,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  X,
  Lock,
  Upload,
} from "lucide-react";

interface Agent {
  id: string;
  auth_user_id?: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  created_at?: string;
}

export default function AdminAgentsPage() {
  const supabase = createClient();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadAgents = async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error: dbError } = await supabase
        .from("agents")
        .select("*")
        .order("name", { ascending: true });

      if (dbError) throw dbError;

      setAgents(data || []);
    } catch (err: any) {
      console.error("Failed to load agents:", err);
      setError("Unable to load agents catalogue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setWhatsapp("");
    setBio("");
    setAvatarFile(null);
    setEditingAgent(null);
  };

  const handleOpenEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setName(agent.name || "");
    setEmail(agent.email || "");
    setPassword("");
    setPhone(agent.phone || "");
    setWhatsapp(agent.whatsapp || "");
    setBio(agent.bio || "");
    setAvatarFile(null);
    setShowAddModal(true);
  };

  const handleSaveAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Agent name is required.");
      return;
    }

    setSubmitting(true);

    try {
      let finalAvatarUrl = editingAgent?.avatar_url || null;

      // Eğer yeni bir fotoğraf seçildiyse Supabase Storage'a yükle
      if (avatarFile) {
        setUploadingImage(true);
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `agent_${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("customer-documents") // Veya projenizdeki genel bir bucket (örn: public-files / avatars)
          .upload(filePath, avatarFile);

        if (uploadError) {
          throw new Error("Failed to upload profile image: " + uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from("customer-documents")
          .getPublicUrl(filePath);

        finalAvatarUrl = publicUrlData.publicUrl;
        setUploadingImage(false);
      }

      if (editingAgent) {
        // --- EDIT MODE ---
        const updatePayload: any = {
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          whatsapp: whatsapp.trim() || null,
          avatar_url: finalAvatarUrl,
          bio: bio.trim() || null,
        };

        const { error: updateError } = await supabase
          .from("agents")
          .update(updatePayload)
          .eq("id", editingAgent.id);

        if (updateError) throw updateError;

        setAgents((prev) =>
          prev.map((a) => (a.id === editingAgent.id ? { ...a, ...updatePayload } : a))
        );
        setSuccess("Agent profile updated successfully.");
      } else {
        // --- CREATE MODE ---
        if (!email.trim() || !password.trim()) {
          setError("Email and Password are required to create an agent login account.");
          setSubmitting(false);
          return;
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              full_name: name.trim(),
              role: "agent",
            },
          },
        });

        if (authError) throw authError;

        const authUserId = authData.user?.id || null;

        const { data: newAgent, error: insertError } = await supabase
          .from("agents")
          .insert([
            {
              auth_user_id: authUserId,
              name: name.trim(),
              email: email.trim() || null,
              phone: phone.trim() || null,
              whatsapp: whatsapp.trim() || null,
              avatar_url: finalAvatarUrl,
              bio: bio.trim() || null,
            },
          ])
          .select()
          .single();

        if (insertError) throw insertError;

        setAgents((prev) => [...prev, newAgent].sort((a, b) => a.name.localeCompare(b.name)));
        setSuccess("Agent account created successfully with login credentials.");
      }

      setShowAddModal(false);
      resetForm();
    } catch (err: any) {
      console.error("Failed to save agent:", err);
      setError(err?.message || "Failed to save agent.");
    } finally {
      setSubmitting(false);
      setUploadingImage(false);
    }
  };

  const handleDeleteAgent = async (id: string, agentName: string) => {
    if (!confirm(`Are you sure you want to delete agent "${agentName}"?`)) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from("agents")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      setAgents((prev) => prev.filter((agent) => agent.id !== id));
      setSuccess("Agent removed successfully.");
    } catch (err: any) {
      console.error("Failed to delete agent:", err);
      alert(err?.message || "Unable to delete agent.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-7 h-7 text-[#1c3053] animate-spin mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Loading advanced agents portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-full text-xs font-semibold text-[#ae884e] mb-2 border border-amber-200/50">
            <ShieldCheck className="w-3.5 h-3.5" /> Advanced Staff & Portal Management
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
            Estate Agents Portal
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage login credentials, public contact emails, profile photos, and agent biographies.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1c3053] hover:bg-[#ae884e] text-white font-medium text-sm transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" /> Add New Agent & Login
        </button>
      </div>

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-green-800 text-sm flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess("")} className="text-green-600 hover:text-green-900 font-bold">×</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {agents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900">No agents found</h3>
          <p className="text-sm text-gray-500 mt-1">
            Get started by adding your first estate agent with login access.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    {agent.avatar_url ? (
                      <img
                        src={agent.avatar_url}
                        alt={agent.name}
                        className="w-12 h-12 rounded-xl object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#1c3053]/5 text-[#1c3053] font-bold text-lg flex items-center justify-center shrink-0">
                        {agent.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base">
                        {agent.name}
                      </h3>
                      <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                        Active Agent
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(agent)}
                      className="p-2 text-gray-400 hover:text-[#1c3053] hover:bg-gray-50 rounded-lg transition-colors"
                      title="Edit agent"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAgent(agent.id, agent.name)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete agent"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {agent.bio && (
                  <p className="text-xs text-gray-600 line-clamp-2 mb-4 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    "{agent.bio}"
                  </p>
                )}

                <div className="space-y-2 text-xs text-gray-600 border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-[#ae884e] shrink-0" />
                    <a href={`mailto:${agent.email}`} className="truncate hover:underline text-[#1c3053] font-medium">
                      {agent.email || "No email specified"}
                    </a>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-[#ae884e] shrink-0" />
                    <span>{agent.phone || "No phone specified"}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="w-4 h-4 text-green-600 shrink-0" />
                    <span>{agent.whatsapp || "No WhatsApp number specified"}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Agent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingAgent ? "Edit Agent Profile" : "Add New Agent & Credentials"}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAgent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Full Name <span className="text-[#ae884e]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Haci Beyhan Kalli"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#ae884e]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Email Address (Login & Public Contact) <span className="text-[#ae884e]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="agent@onekey.co.uk"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#ae884e]"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Used for portal login and receives direct client enquiries from property listings.
                </p>
              </div>

              {!editingAgent && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Login Password <span className="text-[#ae884e]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#ae884e]"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+44 7123 456789"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#ae884e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+44 7123 456789"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#ae884e]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Profile Photo (PNG, JPG, JPEG)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 text-sm text-gray-600 transition-colors">
                    <Upload className="w-4 h-4 text-[#ae884e]" />
                    <span className="truncate">
                      {avatarFile ? avatarFile.name : "Choose image file..."}
                    </span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      className="hidden"
                      onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  {editingAgent?.avatar_url && !avatarFile && (
                    <img
                      src={editingAgent.avatar_url}
                      alt="Current"
                      className="w-11 h-11 rounded-xl object-cover border border-gray-200 shrink-0"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Bio / Introduction
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Senior property consultant with over 5 years experience..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#ae884e] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="px-5 py-2.5 rounded-xl bg-[#1c3053] text-white text-sm font-medium hover:bg-[#ae884e] transition-colors disabled:opacity-50"
                >
                  {submitting || uploadingImage ? "Saving..." : editingAgent ? "Update Profile" : "Create Agent & Login"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
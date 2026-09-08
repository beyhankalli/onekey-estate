"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Users,
  Plus,
  Save,
  X,
  Image as ImageIcon,
  Edit,
  Trash2,
  Home,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  UserRound,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Loader2,
  TrendingUp,
} from "lucide-react";

type BookingProperty = {
  id: string;
  title: string;
  property_ref: string;
};

type BookingQueryRow = {
  id: string;
  agent_id: string | null;
  property_id: string | null;
  viewing_date: string;
  start_time: string;
  end_time: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  status: string;
  property:
    | BookingProperty
    | BookingProperty[]
    | null;
};

type Booking = {
  id: string;
  agent_id: string | null;
  property_id: string | null;
  viewing_date: string;
  start_time: string;
  end_time: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  status: string;
  property: BookingProperty | null;
};

type AgentRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  bio: string | null;
  photo: string | null;
  created_at: string;
};

type Agent = AgentRow & {
  propertyCount: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShowBookings: number;
  upcomingBookings: Booking[];
};

type AgentFormData = {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  bio: string;
  photoUrl: string;
  password: string;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "An unexpected error occurred.";
}

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const [formData, setFormData] = useState<AgentFormData>({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    bio: "",
    photoUrl: "",
    password: "",
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const fetchAgents = async () => {
    setLoading(true);

    try {
      const supabase = createClient();

      const { data: agentsData, error: agentsError } = await supabase
        .from("agents")
        .select(
          "id, name, email, phone, whatsapp, bio, photo, created_at"
        )
        .order("created_at", { ascending: false });

      if (agentsError) {
        console.error("Error fetching agents:", agentsError);
        setAgents([]);
        return;
      }

      if (!agentsData) {
        setAgents([]);
        return;
      }

      const today = new Date().toISOString().split("T")[0];

      const agentsWithStats = await Promise.all(
        (agentsData as AgentRow[]).map(async (agent) => {
          const [propertyResult, bookingResult] = await Promise.all([
            supabase
              .from("properties")
              .select("*", { count: "exact", head: true })
              .eq("agent_id", agent.id),

            supabase
              .from("bookings")
              .select(
                `
                  id,
                  agent_id,
                  property_id,
                  viewing_date,
                  start_time,
                  end_time,
                  customer_name,
                  customer_email,
                  customer_phone,
                  status,
                  property:properties (
                    id,
                    title,
                    property_ref
                  )
                `
              )
              .eq("agent_id", agent.id)
              .order("viewing_date", { ascending: true })
              .order("start_time", { ascending: true }),
          ]);

          if (propertyResult.error) {
            console.error(
              `Error fetching properties for agent ${agent.id}:`,
              propertyResult.error
            );
          }

          if (bookingResult.error) {
            console.error(
              `Error fetching bookings for agent ${agent.id}:`,
              bookingResult.error
            );
          }

          const bookingRows = (bookingResult.data || []) as BookingQueryRow[];

          const bookings: Booking[] = bookingRows.map((booking) => ({
            id: booking.id,
            agent_id: booking.agent_id,
            property_id: booking.property_id,
            viewing_date: booking.viewing_date,
            start_time: booking.start_time,
            end_time: booking.end_time,
            customer_name: booking.customer_name,
            customer_email: booking.customer_email,
            customer_phone: booking.customer_phone,
            status: booking.status,
            property: Array.isArray(booking.property)
              ? booking.property[0] || null
              : booking.property || null,
          }));

          const propertyCount = propertyResult.count || 0;

          const pendingBookings = bookings.filter(
            (booking) => booking.status === "pending"
          ).length;

          const confirmedBookings = bookings.filter(
            (booking) => booking.status === "confirmed"
          ).length;

          const completedBookings = bookings.filter(
            (booking) => booking.status === "completed"
          ).length;

          const cancelledBookings = bookings.filter(
            (booking) => booking.status === "cancelled"
          ).length;

          const noShowBookings = bookings.filter(
            (booking) => booking.status === "no_show"
          ).length;

          const upcomingBookings = bookings
            .filter(
              (booking) =>
                booking.viewing_date >= today &&
                booking.status !== "cancelled" &&
                booking.status !== "completed" &&
                booking.status !== "no_show"
            )
            .slice(0, 5);

          return {
            ...agent,
            propertyCount,
            totalBookings: bookings.length,
            pendingBookings,
            confirmedBookings,
            completedBookings,
            cancelledBookings,
            noShowBookings,
            upcomingBookings,
          };
        })
      );

      setAgents(agentsWithStats);
    } catch (error: unknown) {
      console.error("Error loading agents:", error);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAgents();
  }, []);

  const uploadPhotoToSupabase = async (file: File): Promise<string> => {
    const supabase = createClient();

    const extension = file.name.includes(".")
      ? file.name.split(".").pop()?.toLowerCase() || "jpg"
      : "jpg";

    const fileName = `agent-${Math.random()
      .toString(36)
      .substring(2)}-${Date.now()}.${extension}`;

    const filePath = `agents/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("property-files")
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage
      .from("property-files")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleOpenForm = (agent?: Agent) => {
    if (agent) {
      setEditingId(agent.id);

      setFormData({
        name: agent.name || "",
        email: agent.email || "",
        phone: agent.phone || "",
        whatsapp: agent.whatsapp || "",
        bio: agent.bio || "",
        photoUrl: agent.photo || "",
        password: "",
      });
    } else {
      setEditingId(null);

      setFormData({
        name: "",
        email: "",
        phone: "",
        whatsapp: "",
        bio: "",
        photoUrl: "",
        password: "",
      });
    }

    setPhotoFile(null);
    setIsFormOpen(true);
    setUploadStatus("");
    setSaving(false);
  };

  const handleCloseForm = () => {
    if (saving) return;

    setIsFormOpen(false);
    setEditingId(null);
    setPhotoFile(null);
    setUploadStatus("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setSaving(true);
    setUploadStatus("Saving agent details...");

    try {
      const supabase = createClient();

      let finalPhotoUrl = formData.photoUrl;

      if (photoFile) {
        setUploadStatus("Uploading photo...");
        finalPhotoUrl = await uploadPhotoToSupabase(photoFile);
      }

      const payload = {
        name: formData.name.trim(),
        email:
          formData.email.trim() === ""
            ? null
            : formData.email.trim(),
        phone:
          formData.phone.trim() === ""
            ? null
            : formData.phone.trim(),
        whatsapp:
          formData.whatsapp.trim() === ""
            ? null
            : formData.whatsapp.trim(),
        bio:
          formData.bio.trim() === ""
            ? null
            : formData.bio.trim(),
        photo:
          finalPhotoUrl.trim() === ""
            ? null
            : finalPhotoUrl.trim(),
      };

      if (editingId) {
        const { error } = await supabase
          .from("agents")
          .update(payload)
          .eq("id", editingId);

        if (error) {
          throw error;
        }
      } else {
        if (!payload.email) {
          throw new Error(
            "Email address is required for a new agent."
          );
        }

        if (formData.password.length < 6) {
          throw new Error(
            "Password must be at least 6 characters long."
          );
        }

        setUploadStatus("Creating secure agent account...");

        const response = await fetch("/api/admin/agents/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
            whatsapp: payload.whatsapp,
            bio: payload.bio,
            photo: payload.photo,
            password: formData.password,
          }),
        });

        const result: {
          success?: boolean;
          error?: string;
        } = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.error || "Failed to create agent account."
          );
        }
      }

      alert(
        `Agent successfully ${
          editingId ? "updated" : "added"
        }!`
      );

      setIsFormOpen(false);
      setEditingId(null);
      setPhotoFile(null);

      await fetchAgents();
    } catch (error: unknown) {
      alert(
        "Error saving agent: " + getErrorMessage(error)
      );
    } finally {
      setSaving(false);
      setUploadStatus("");
    }
  };

  const handleDelete = async (
    id: string,
    propertyCount: number
  ) => {
    const agent = agents.find((item) => item.id === id);

    if (!agent) return;

    const hasBookings = agent.totalBookings > 0;

    let confirmationMessage =
      "Are you sure you want to delete this agent?";

    if (propertyCount > 0 || hasBookings) {
      const warnings: string[] = [];

      if (propertyCount > 0) {
        warnings.push(
          `${propertyCount} assigned ${
            propertyCount === 1
              ? "property"
              : "properties"
          }`
        );
      }

      if (hasBookings) {
        warnings.push(
          `${agent.totalBookings} ${
            agent.totalBookings === 1
              ? "booking"
              : "bookings"
          }`
        );
      }

      confirmationMessage =
        `WARNING: This agent has ${warnings.join(
          " and "
        )} associated with them.\n\nDeleting the agent may leave related records without an assigned agent.\n\nAre you sure you want to continue?`;
    }

    if (!window.confirm(confirmationMessage)) return;

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("agents")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      if (expandedAgentId === id) {
        setExpandedAgentId(null);
      }

      alert("Agent successfully deleted!");

      await fetchAgents();
    } catch (error: unknown) {
      alert(
        "Error deleting agent: " + getErrorMessage(error)
      );
    }
  };

  const formatDate = (date: string) => {
    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatTime = (time: string) => {
    if (!time) return "";

    const [hours, minutes] = time.split(":");

    const date = new Date();
    date.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    );

    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "confirmed":
        return "Confirmed";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      case "no_show":
        return "No-show";
      default:
        return status;
    }
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "confirmed":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "completed":
        return "bg-green-50 text-green-700 border-green-100";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-100";
      case "no_show":
        return "bg-gray-100 text-gray-600 border-gray-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-100";
    }
  };

  const totalProperties = useMemo(
    () =>
      agents.reduce(
        (sum, agent) => sum + agent.propertyCount,
        0
      ),
    [agents]
  );

  const totalPending = useMemo(
    () =>
      agents.reduce(
        (sum, agent) => sum + agent.pendingBookings,
        0
      ),
    [agents]
  );

  const totalConfirmed = useMemo(
    () =>
      agents.reduce(
        (sum, agent) => sum + agent.confirmedBookings,
        0
      ),
    [agents]
  );

  const totalCompleted = useMemo(
    () =>
      agents.reduce(
        (sum, agent) => sum + agent.completedBookings,
        0
      ),
    [agents]
  );

  const inputClass =
    "w-full p-3 rounded-xl border border-gray-300 text-gray-900 font-medium bg-white outline-none focus:border-[#ae884e] focus:ring-1 focus:ring-[#ae884e]/20 placeholder-gray-400";

  if (loading && agents.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading agent dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12 p-4 sm:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Agent Dashboard
          </h1>

          <p className="text-gray-500 font-light mt-1">
            Manage your agency team and monitor agent activity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void fetchAgents()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                loading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>

          {!isFormOpen && (
            <button
              type="button"
              onClick={() => handleOpenForm()}
              className="flex items-center gap-2 bg-[#1c3053] text-white px-5 py-3 rounded-xl font-medium hover:bg-[#ae884e] transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Add Agent
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Total Agents
          </p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {agents.length}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <div className="w-10 h-10 rounded-xl bg-gray-50 text-[#1c3053] flex items-center justify-center">
            <Home className="w-5 h-5" />
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Assigned Properties
          </p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {totalProperties}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Pending Viewings
          </p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {totalPending}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CalendarCheck className="w-5 h-5" />
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Confirmed Viewings
          </p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {totalConfirmed}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Completed Viewings
          </p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {totalCompleted}
          </p>
        </div>
      </div>

      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 mb-8 space-y-6"
        >
          <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingId
                ? "Edit Agent Details"
                : "New Agent Details"}
            </h2>

            <button
              type="button"
              onClick={handleCloseForm}
              disabled={saving}
              className="text-gray-400 hover:text-red-500 transition-colors p-1 disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>

              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData((current) => ({
                    ...current,
                    name: e.target.value,
                  }))
                }
                className={inputClass}
                placeholder="e.g. Sarah Jenkins"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>

              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((current) => ({
                    ...current,
                    email: e.target.value,
                  }))
                }
                className={inputClass}
                placeholder="sarah@onekey.co.uk"
              />
            </div>

            {!editingId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Portal Password *
                </label>

                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((current) => ({
                      ...current,
                      password: e.target.value,
                    }))
                  }
                  className={inputClass}
                  placeholder="Set the agent's portal password"
                  autoComplete="new-password"
                />

                <p className="text-xs text-gray-400 mt-1.5">
                  This password is used by the agent to sign in to
                  the portal.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>

              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((current) => ({
                    ...current,
                    phone: e.target.value,
                  }))
                }
                className={inputClass}
                placeholder="+44 7000 000000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Number
              </label>

              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) =>
                  setFormData((current) => ({
                    ...current,
                    whatsapp: e.target.value,
                  }))
                }
                className={inputClass}
                placeholder="+44 7000 000000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Biography (Optional)
            </label>

            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) =>
                setFormData((current) => ({
                  ...current,
                  bio: e.target.value,
                }))
              }
              className={inputClass}
              placeholder="A short description about the agent's experience..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#ae884e]" />
              Profile Photo
            </label>

            {formData.photoUrl && !photoFile && (
              <div className="mb-3">
                <img
                  src={formData.photoUrl}
                  alt="Current agent profile"
                  className="w-16 h-16 rounded-full object-cover shadow-sm border border-gray-100"
                />
              </div>
            )}

            {photoFile && (
              <div className="mb-3 text-sm text-gray-500">
                Selected:{" "}
                <span className="font-medium text-gray-700">
                  {photoFile.name}
                </span>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setPhotoFile(e.target.files?.[0] || null)
              }
              className="w-full p-2 rounded-xl border border-gray-300 text-gray-900 font-medium bg-white outline-none focus:border-[#ae884e] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#1c3053]/10 file:text-[#1c3053] hover:file:bg-[#1c3053]/20 cursor-pointer transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-[#1c3053] text-white py-4 rounded-xl font-medium hover:bg-[#ae884e] transition-colors shadow-md disabled:bg-gray-400"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}

            {uploadStatus ||
              (editingId ? "Update Agent" : "Save Agent")}
          </button>
        </form>
      )}

      {agents.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-12 text-center text-gray-500 flex flex-col items-center">
          <Users className="w-12 h-12 text-gray-300 mb-4" />

          <p>No agents found in your agency yet.</p>

          <button
            type="button"
            onClick={() => handleOpenForm()}
            className="mt-5 inline-flex items-center gap-2 bg-[#1c3053] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#ae884e] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add your first agent
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {agents.map((agent) => {
            const isExpanded = expandedAgentId === agent.id;

            const completionRate =
              agent.totalBookings > 0
                ? Math.round(
                    (agent.completedBookings /
                      agent.totalBookings) *
                      100
                  )
                : 0;

            return (
              <div
                key={agent.id}
                className="bg-white border border-gray-100 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                        {agent.photo ? (
                          <img
                            src={agent.photo}
                            alt={agent.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#1c3053]/10 text-[#1c3053] font-semibold text-xl">
                            {agent.name
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {agent.name}
                        </h3>

                        {agent.email && (
                          <p className="text-sm text-gray-500 truncate max-w-[280px] flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3.5 h-3.5 shrink-0" />
                            {agent.email}
                          </p>
                        )}

                        {agent.phone && (
                          <p className="text-sm text-[#ae884e] font-medium mt-0.5 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 shrink-0" />
                            {agent.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 xl:flex gap-2">
                      <div className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 min-w-[105px]">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Home className="w-3.5 h-3.5 text-[#1c3053]" />
                          Properties
                        </div>

                        <p className="font-semibold text-gray-900 mt-1">
                          {agent.propertyCount}
                        </p>
                      </div>

                      <div className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 min-w-[105px]">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Calendar className="w-3.5 h-3.5 text-[#ae884e]" />
                          Total
                        </div>

                        <p className="font-semibold text-gray-900 mt-1">
                          {agent.totalBookings}
                        </p>
                      </div>

                      <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-100 min-w-[105px]">
                        <div className="flex items-center gap-1.5 text-xs text-amber-700">
                          <Clock className="w-3.5 h-3.5" />
                          Pending
                        </div>

                        <p className="font-semibold text-amber-800 mt-1">
                          {agent.pendingBookings}
                        </p>
                      </div>

                      <div className="px-3 py-2 rounded-xl bg-green-50 border border-green-100 min-w-[105px]">
                        <div className="flex items-center gap-1.5 text-xs text-green-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Completed
                        </div>

                        <p className="font-semibold text-green-800 mt-1">
                          {agent.completedBookings}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenForm(agent)}
                        className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                        title="Edit Agent"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void handleDelete(
                            agent.id,
                            agent.propertyCount
                          )
                        }
                        className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                        title="Delete Agent"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedAgentId(
                            isExpanded ? null : agent.id
                          )
                        }
                        className="p-2.5 rounded-lg bg-[#1c3053] text-white hover:bg-[#ae884e] transition-colors"
                        title={
                          isExpanded
                            ? "Hide Dashboard"
                            : "View Dashboard"
                        }
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/70 p-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                      <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <p className="text-xs text-gray-500">
                          Confirmed
                        </p>

                        <p className="text-xl font-semibold text-blue-700 mt-1">
                          {agent.confirmedBookings}
                        </p>
                      </div>

                      <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <p className="text-xs text-gray-500">
                          Completed
                        </p>

                        <p className="text-xl font-semibold text-green-700 mt-1">
                          {agent.completedBookings}
                        </p>
                      </div>

                      <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <p className="text-xs text-gray-500">
                          Cancelled
                        </p>

                        <p className="text-xl font-semibold text-red-700 mt-1">
                          {agent.cancelledBookings}
                        </p>
                      </div>

                      <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <p className="text-xs text-gray-500">
                          No-show
                        </p>

                        <p className="text-xl font-semibold text-gray-700 mt-1">
                          {agent.noShowBookings}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                      <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 p-5">
                        <div className="flex items-center gap-2 mb-5">
                          <TrendingUp className="w-5 h-5 text-[#ae884e]" />

                          <h4 className="font-semibold text-gray-900">
                            Performance
                          </h4>
                        </div>

                        <div className="mb-5">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-500">
                              Completion rate
                            </span>

                            <span className="font-semibold text-gray-900">
                              {completionRate}%
                            </span>
                          </div>

                          <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#ae884e] transition-all"
                              style={{
                                width: `${Math.min(
                                  completionRate,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Properties
                            </span>

                            <span className="font-medium text-gray-900">
                              {agent.propertyCount}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Total viewings
                            </span>

                            <span className="font-medium text-gray-900">
                              {agent.totalBookings}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Confirmed
                            </span>

                            <span className="font-medium text-blue-700">
                              {agent.confirmedBookings}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Completed
                            </span>

                            <span className="font-medium text-green-700">
                              {agent.completedBookings}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              Upcoming Viewings
                            </h4>

                            <p className="text-xs text-gray-400 mt-1">
                              Next scheduled appointments for this
                              agent.
                            </p>
                          </div>

                          <CalendarCheck className="w-5 h-5 text-[#1c3053]" />
                        </div>

                        {agent.upcomingBookings.length === 0 ? (
                          <div className="p-10 text-center">
                            <Calendar className="w-8 h-8 mx-auto text-gray-300 mb-3" />

                            <p className="text-sm font-medium text-gray-600">
                              No upcoming viewings
                            </p>

                            <p className="text-xs text-gray-400 mt-1">
                              New appointments will appear here.
                            </p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {agent.upcomingBookings.map(
                              (booking) => (
                                <div
                                  key={booking.id}
                                  className="p-4 hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <UserRound className="w-4 h-4 text-gray-400 shrink-0" />

                                        <p className="font-medium text-gray-900 truncate">
                                          {booking.customer_name}
                                        </p>
                                      </div>

                                      <p className="text-xs text-gray-500 mt-1">
                                        {booking.property?.title ||
                                          "Property not available"}

                                        {booking.property
                                          ?.property_ref
                                          ? ` · ${booking.property.property_ref}`
                                          : ""}
                                      </p>

                                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                                        {booking.customer_phone && (
                                          <span className="flex items-center gap-1">
                                            <Phone className="w-3 h-3" />
                                            {booking.customer_phone}
                                          </span>
                                        )}

                                        {booking.customer_email && (
                                          <span className="flex items-center gap-1">
                                            <Mail className="w-3 h-3" />
                                            {booking.customer_email}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                      <div className="text-right">
                                        <p className="text-sm font-semibold text-gray-900">
                                          {formatDate(
                                            booking.viewing_date
                                          )}
                                        </p>

                                        <p className="text-xs text-[#ae884e] font-medium mt-0.5">
                                          {formatTime(
                                            booking.start_time
                                          )}{" "}
                                          –{" "}
                                          {formatTime(
                                            booking.end_time
                                          )}
                                        </p>
                                      </div>

                                      <span
                                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium ${getStatusClasses(
                                          booking.status
                                        )}`}
                                      >
                                        {getStatusLabel(
                                          booking.status
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      {agent.phone && (
                        <a
                          href={`tel:${agent.phone}`}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1c3053] text-white text-sm font-medium hover:bg-[#ae884e] transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          Call Agent
                        </a>
                      )}

                      {agent.email && (
                        <a
                          href={`mailto:${agent.email}`}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          Email Agent
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
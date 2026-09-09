"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CalendarCheck,
  Check,
  X,
  Ban,
  CheckCircle2,
  UserX,
  Pencil,
  Save,
  XCircle,
  UserRound,
  Mail,
  Phone,
  StickyNote,
  CalendarDays,
  Clock,
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
}

interface BookingProperty {
  title: string;
  property_ref: string;
}

interface BookingAgent {
  name: string;
}

interface RawBooking {
  id?: unknown;
  property_id?: unknown;
  agent_id?: unknown;
  viewing_date?: unknown;
  start_time?: unknown;
  end_time?: unknown;
  customer_name?: unknown;
  customer_email?: unknown;
  customer_phone?: unknown;
  message?: unknown;
  internal_notes?: unknown;
  status?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
  property?: BookingProperty | BookingProperty[] | null;
  agent?: BookingAgent | BookingAgent[] | null;
}

interface Booking {
  id: string;
  property_id: string | null;
  agent_id: string | null;
  viewing_date: string;
  start_time: string;
  end_time: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  message: string | null;
  internal_notes: string | null;
  status: BookingStatus;
  created_at: string;
  updated_at: string | null;
  property?: BookingProperty | null;
  agent?: BookingAgent | null;
}

type BookingStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "completed"
  | "no-show";

const VALID_STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "rejected",
  "cancelled",
  "completed",
  "no-show",
];

function isBookingStatus(value: unknown): value is BookingStatus {
  return (
    typeof value === "string" &&
    VALID_STATUSES.includes(value as BookingStatus)
  );
}

function getNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function normalizeBooking(raw: RawBooking): Booking {
  const status = isBookingStatus(raw.status)
    ? raw.status
    : "pending";

  const property = Array.isArray(raw.property)
    ? raw.property[0] ?? null
    : raw.property ?? null;

  const agent = Array.isArray(raw.agent)
    ? raw.agent[0] ?? null
    : raw.agent ?? null;

  return {
    id: String(raw.id ?? ""),
    property_id: getNullableString(raw.property_id),
    agent_id: getNullableString(raw.agent_id),
    viewing_date: String(raw.viewing_date ?? ""),
    start_time: String(raw.start_time ?? ""),
    end_time: String(raw.end_time ?? ""),
    customer_name: String(raw.customer_name ?? ""),
    customer_email: getNullableString(raw.customer_email),
    customer_phone: String(raw.customer_phone ?? ""),
    message: getNullableString(raw.message),
    internal_notes: getNullableString(raw.internal_notes),
    status,
    created_at: String(raw.created_at ?? ""),
    updated_at: getNullableString(raw.updated_at),
    property,
    agent,
  };
}

interface BookingsData {
  bookings: Booking[];
  agents: Agent[];
}

const loadBookingsData = async (): Promise<BookingsData> => {
  const supabase = createClient();

  const [bookingsResult, agentsResult] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "id, property_id, agent_id, viewing_date, start_time, end_time, customer_name, customer_email, customer_phone, message, internal_notes, status, created_at, updated_at, property:properties(title, property_ref), agent:agents(name)"
      )
      .order("viewing_date", { ascending: false })
      .order("start_time", { ascending: true }),

    supabase
      .from("agents")
      .select("id, name")
      .order("name", { ascending: true }),
  ]);

  if (bookingsResult.error) {
    throw bookingsResult.error;
  }

  if (agentsResult.error) {
    throw agentsResult.error;
  }

  return {
    bookings: (bookingsResult.data ?? []).map((booking) =>
      normalizeBooking(booking as RawBooking)
    ),
    agents: (agentsResult.data ?? []).map((agent) => ({
      id: String(agent.id),
      name: String(agent.name),
    })),
  };
};

const getErrorMessage = (error: unknown): string => {
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
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [editingBooking, setEditingBooking] =
    useState<Booking | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editAgentId, setEditAgentId] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchData = async () => {
    setLoading(true);

    try {
      const data = await loadBookingsData();

      setBookings(data.bookings);
      setAgents(data.agents);
    } catch (err: unknown) {
      console.error("Error fetching bookings data:", err);
      alert("Error loading bookings: " + getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const data = await loadBookingsData();

        if (!isMounted) {
          return;
        }

        setBookings(data.bookings);
        setAgents(data.agents);
      } catch (err: unknown) {
        if (!isMounted) {
          return;
        }

        console.error("Error fetching bookings data:", err);
        alert("Error loading bookings: " + getErrorMessage(err));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateStatus = async (
    id: string,
    newStatus: BookingStatus
  ) => {
    setUpdatingId(id);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("bookings")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        alert("Error updating status: " + error.message);
        return;
      }

      try {
        const notificationResponse = await fetch(
          "/api/bookings/status-email",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              bookingId: id,
              status: newStatus,
            }),
          }
        );

        if (!notificationResponse.ok) {
          console.error(
            "Booking status email failed:",
            await notificationResponse.text()
          );
        }
      } catch (emailError: unknown) {
        console.error(
          "Booking status email request failed:",
          emailError
        );
      }

      await fetchData();
    } finally {
      setUpdatingId(null);
    }
  };

  const openEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setEditDate(booking.viewing_date || "");
    setEditStartTime(booking.start_time?.substring(0, 5) || "");
    setEditEndTime(booking.end_time?.substring(0, 5) || "");
    setEditAgentId(booking.agent_id || "");
    setEditNotes(booking.internal_notes || "");
  };

  const closeEditBooking = () => {
    if (savingEdit) {
      return;
    }

    setEditingBooking(null);
    setEditDate("");
    setEditStartTime("");
    setEditEndTime("");
    setEditAgentId("");
    setEditNotes("");
  };

  const saveBookingChanges = async () => {
    if (!editingBooking) {
      return;
    }

    if (!editDate || !editStartTime || !editEndTime) {
      alert("Date, start time and end time are required.");
      return;
    }

    if (editEndTime <= editStartTime) {
      alert("End time must be later than start time.");
      return;
    }

    setSavingEdit(true);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("bookings")
        .update({
          viewing_date: editDate,
          start_time: editStartTime,
          end_time: editEndTime,
          agent_id: editAgentId || null,
          internal_notes: editNotes.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingBooking.id);

      if (error) {
        alert("Error updating booking: " + error.message);
        return;
      }

      closeEditBooking();
      await fetchData();
    } finally {
      setSavingEdit(false);
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    const styles: Record<BookingStatus, string> = {
      pending: "bg-blue-100 text-blue-800",
      confirmed: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
      completed: "bg-purple-100 text-purple-800",
      "no-show": "bg-orange-100 text-orange-800",
    };

    const labels: Record<BookingStatus, string> = {
      pending: "Pending",
      confirmed: "Confirmed",
      rejected: "Rejected",
      cancelled: "Cancelled",
      completed: "Completed",
      "no-show": "No-Show",
    };

    return (
      <span
        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold uppercase ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  const bookingSummary = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter((b) => b.status === "pending").length,
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      completed: bookings.filter((b) => b.status === "completed").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
      noShow: bookings.filter((b) => b.status === "no-show").length,
    };
  }, [bookings]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto pb-12">
        <div className="mb-8">
          <div className="h-8 w-64 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-4 w-96 max-w-full bg-gray-100 rounded-lg animate-pulse mt-3" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-8 space-y-4">
            <div className="h-12 bg-gray-50 rounded-xl animate-pulse" />
            <div className="h-16 bg-gray-50 rounded-xl animate-pulse" />
            <div className="h-16 bg-gray-50 rounded-xl animate-pulse" />
            <div className="h-16 bg-gray-50 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">
          Viewing Bookings
        </h1>

        <p className="text-gray-500 font-light mt-1">
          Manage property viewings, agent schedules, and viewing statuses.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Total
          </p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {bookingSummary.total}
          </p>
        </div>

        <div className="bg-white border border-blue-100 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">
            Pending
          </p>
          <p className="text-2xl font-semibold text-blue-700 mt-1">
            {bookingSummary.pending}
          </p>
        </div>

        <div className="bg-white border border-green-100 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-green-500">
            Confirmed
          </p>
          <p className="text-2xl font-semibold text-green-700 mt-1">
            {bookingSummary.confirmed}
          </p>
        </div>

        <div className="bg-white border border-purple-100 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-500">
            Completed
          </p>
          <p className="text-2xl font-semibold text-purple-700 mt-1">
            {bookingSummary.completed}
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Cancelled
          </p>
          <p className="text-2xl font-semibold text-gray-700 mt-1">
            {bookingSummary.cancelled}
          </p>
        </div>

        <div className="bg-white border border-orange-100 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-500">
            No-Show
          </p>
          <p className="text-2xl font-semibold text-orange-700 mt-1">
            {bookingSummary.noShow}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden">
        {bookings.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <CalendarCheck className="w-12 h-12 text-gray-300 mb-4" />
            <p>No bookings found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                {bookings.map((b) => {
                  const isUpdating = updatingId === b.id;

                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="p-5 align-top">
                        <p className="font-semibold text-gray-900">
                          {b.viewing_date}
                        </p>

                        <p className="text-gray-500">
                          {b.start_time?.substring(0, 5)} -{" "}
                          {b.end_time?.substring(0, 5)}
                        </p>
                      </td>

                      <td className="p-5 align-top">
                        <p className="font-medium text-[#1c3053] line-clamp-1">
                          {b.property?.title || "Property Deleted"}
                        </p>

                        {b.property?.property_ref && (
                          <p className="text-xs text-gray-400">
                            Ref: {b.property.property_ref}
                          </p>
                        )}

                        <p className="text-xs text-gray-400 mt-0.5">
                          Agent: {b.agent?.name || "Unassigned"}
                        </p>
                      </td>

                      <td className="p-5 align-top">
                        <p className="font-medium text-gray-900">
                          {b.customer_name}
                        </p>

                        {b.customer_phone && (
                          <a
                            href={`tel:${b.customer_phone}`}
                            className="text-xs text-gray-500 flex items-center gap-1 mt-1 hover:text-[#1c3053]"
                          >
                            <Phone className="w-3 h-3" />
                            {b.customer_phone}
                          </a>
                        )}

                        {b.customer_email && (
                          <a
                            href={`mailto:${b.customer_email}`}
                            className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 hover:text-[#1c3053]"
                          >
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-[220px]">
                              {b.customer_email}
                            </span>
                          </a>
                        )}

                        {b.message && (
                          <p
                            className="text-xs text-gray-400 mt-1.5 max-w-xs truncate"
                            title={b.message}
                          >
                            Message: {b.message}
                          </p>
                        )}

                        {b.internal_notes && (
                          <p
                            className="text-xs text-[#ae884e] mt-1.5 max-w-xs truncate flex items-center gap-1"
                            title={b.internal_notes}
                          >
                            <StickyNote className="w-3 h-3 shrink-0" />
                            Note: {b.internal_notes}
                          </p>
                        )}
                      </td>

                      <td className="p-5 align-top">
                        {getStatusBadge(b.status)}
                      </td>

                      <td className="p-5 text-right align-top">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => openEditBooking(b)}
                            disabled={isUpdating}
                            className="p-2 bg-[#1c3053]/5 text-[#1c3053] hover:bg-[#1c3053]/10 rounded-lg disabled:opacity-50 transition-colors"
                            title="Edit / Reschedule / Assign Agent"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {b.status === "pending" && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  void updateStatus(b.id, "confirmed")
                                }
                                disabled={isUpdating}
                                className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg disabled:opacity-50 transition-colors"
                                title="Confirm Viewing"
                              >
                                {isUpdating ? (
                                  <span className="block w-4 h-4 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void updateStatus(b.id, "rejected")
                                }
                                disabled={isUpdating}
                                className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg disabled:opacity-50 transition-colors"
                                title="Reject Viewing"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {b.status === "confirmed" && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  void updateStatus(b.id, "completed")
                                }
                                disabled={isUpdating}
                                className="p-2 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg disabled:opacity-50 transition-colors"
                                title="Mark as Completed"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void updateStatus(b.id, "no-show")
                                }
                                disabled={isUpdating}
                                className="p-2 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg disabled:opacity-50 transition-colors"
                                title="Mark as No-Show"
                              >
                                <UserX className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void updateStatus(b.id, "cancelled")
                                }
                                disabled={isUpdating}
                                className="p-2 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
                                title="Cancel Booking"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Manage Viewing
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {editingBooking.customer_name} ·{" "}
                  {editingBooking.property?.title || "Property Deleted"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditBooking}
                disabled={savingEdit}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-50"
                title="Close"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">
                    Viewing Date
                  </label>

                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />

                    <input
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      disabled={savingEdit}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e] disabled:bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">
                    Agent
                  </label>

                  <div className="relative">
                    <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />

                    <select
                      value={editAgentId}
                      onChange={(e) => setEditAgentId(e.target.value)}
                      disabled={savingEdit}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e] disabled:bg-gray-50"
                    >
                      <option value="">Unassigned</option>

                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">
                    Start Time
                  </label>

                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />

                    <input
                      type="time"
                      value={editStartTime}
                      onChange={(e) =>
                        setEditStartTime(e.target.value)
                      }
                      disabled={savingEdit}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e] disabled:bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">
                    End Time
                  </label>

                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />

                    <input
                      type="time"
                      value={editEndTime}
                      onChange={(e) =>
                        setEditEndTime(e.target.value)
                      }
                      disabled={savingEdit}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e] disabled:bg-gray-50"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-2">
                    Internal Viewing Notes
                  </label>

                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    disabled={savingEdit}
                    rows={5}
                    placeholder="Add private notes for the agency team..."
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e] disabled:bg-gray-50 resize-none"
                  />
                </div>
              </div>

              <div className="mt-6 bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-3">
                  <UserRound className="w-4 h-4 text-gray-400" />
                  Customer Contact
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400 text-xs">
                      Name
                    </span>

                    <p className="font-medium text-gray-900">
                      {editingBooking.customer_name}
                    </p>
                  </div>

                  <div>
                    <span className="text-gray-400 text-xs">
                      Phone
                    </span>

                    {editingBooking.customer_phone ? (
                      <a
                        href={`tel:${editingBooking.customer_phone}`}
                        className="font-medium text-[#1c3053] hover:text-[#ae884e] inline-flex items-center gap-1"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {editingBooking.customer_phone}
                      </a>
                    ) : (
                      <p className="font-medium text-gray-900">
                        Not provided
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <span className="text-gray-400 text-xs">
                      Email
                    </span>

                    {editingBooking.customer_email ? (
                      <a
                        href={`mailto:${editingBooking.customer_email}`}
                        className="font-medium text-[#1c3053] hover:text-[#ae884e] inline-flex items-center gap-1 break-all"
                      >
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        {editingBooking.customer_email}
                      </a>
                    ) : (
                      <p className="font-medium text-gray-900">
                        Not provided
                      </p>
                    )}
                  </div>

                  {editingBooking.message && (
                    <div className="md:col-span-2">
                      <span className="text-gray-400 text-xs">
                        Customer Message
                      </span>

                      <p className="mt-1 text-gray-700 whitespace-pre-wrap">
                        {editingBooking.message}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
              <button
                type="button"
                onClick={closeEditBooking}
                disabled={savingEdit}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void saveBookingChanges()}
                disabled={savingEdit}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#1c3053] hover:bg-[#ae884e] text-white transition-colors disabled:opacity-50"
              >
                {savingEdit ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
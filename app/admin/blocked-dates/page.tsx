"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CalendarOff,
  Plus,
  Save,
  Trash2,
  X,
  User,
  Clock,
  Building,
  Users,
  Calendar as CalendarIcon,
  CalendarRange,
} from "lucide-react";

interface Agent {
  id: string;
  name: string | null;
}

interface BlockedDate {
  id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  agent_id: string | null;
  start_time: string | null;
  end_time: string | null;
  agents?: {
    name: string | null;
  } | null;
}

interface FormData {
  start_date: string;
  end_date: string;
  reason: string;
  agent_id: string;
  start_time: string;
  end_time: string;
}

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

const loadBlockedDatesData = async (): Promise<{
  agents: Agent[];
  blocks: BlockedDate[];
}> => {
  const supabase = createClient();

  const [agentsResult, blocksResult] = await Promise.all([
    supabase.from("agents").select("id, name"),
    supabase
      .from("blocked_dates")
      .select(
        "id, start_date, end_date, reason, agent_id, start_time, end_time, agents(name)"
      )
      .order("start_date", { ascending: true }),
  ]);

  if (agentsResult.error) {
    throw agentsResult.error;
  }

  if (blocksResult.error) {
    throw blocksResult.error;
  }

  return {
    agents: (agentsResult.data ?? []) as Agent[],
    blocks: (blocksResult.data ?? []).map((block) => ({
      ...block,
      agents: Array.isArray(block.agents)
        ? block.agents[0] ?? null
        : block.agents,
    })) as BlockedDate[],
  };
};

export default function AdminBlockedDatesPage() {
  const [blocks, setBlocks] = useState<BlockedDate[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const [blockType, setBlockType] = useState<"office" | "agent">("office");
  const [dateMode, setDateMode] = useState<"single" | "multiple">("single");

  const [formData, setFormData] = useState<FormData>({
    start_date: "",
    end_date: "",
    reason: "",
    agent_id: "",
    start_time: "",
    end_time: "",
  });

  const fetchData = async () => {
    setLoading(true);

    try {
      const data = await loadBlockedDatesData();
      setAgents(data.agents);
      setBlocks(data.blocks);
    } catch (err: unknown) {
      console.error("Failed to load blocked dates:", err);
      alert("Error loading blocked dates: " + getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const data = await loadBlockedDatesData();

        if (!isMounted) {
          return;
        }

        setAgents(data.agents);
        setBlocks(data.blocks);
      } catch (err: unknown) {
        if (!isMounted) {
          return;
        }

        console.error("Failed to load blocked dates:", err);
        alert("Error loading blocked dates: " + getErrorMessage(err));
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

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.start_date) {
      alert("Please select a date.");
      return;
    }

    if (dateMode === "multiple" && !formData.end_date) {
      alert("Please select an end date.");
      return;
    }

    if (
      dateMode === "multiple" &&
      formData.end_date < formData.start_date
    ) {
      alert("End date cannot be earlier than start date.");
      return;
    }

    if (blockType === "agent" && !formData.agent_id) {
      alert("Please select an agent.");
      return;
    }

    if (
      (formData.start_time && !formData.end_time) ||
      (!formData.start_time && formData.end_time)
    ) {
      alert("Please provide both a start time and an end time.");
      return;
    }

    if (
      formData.start_time &&
      formData.end_time &&
      formData.start_time >= formData.end_time
    ) {
      alert("End time must be later than start time.");
      return;
    }

    const finalEndDate =
      dateMode === "single"
        ? formData.start_date
        : formData.end_date;

    const payload = {
      start_date: formData.start_date,
      end_date: finalEndDate,
      reason: formData.reason.trim() || null,
      agent_id:
        blockType === "office" ? null : formData.agent_id,
      start_time: formData.start_time
        ? `${formData.start_time}:00`
        : null,
      end_time: formData.end_time
        ? `${formData.end_time}:00`
        : null,
    };

    const supabase = createClient();

    const { error } = await supabase
      .from("blocked_dates")
      .insert([payload]);

    if (error) {
      alert("Error adding blocked dates: " + error.message);
      return;
    }

    setIsAdding(false);
    setFormData({
      start_date: "",
      end_date: "",
      reason: "",
      agent_id: "",
      start_time: "",
      end_time: "",
    });
    setBlockType("office");
    setDateMode("single");

    await fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this block?")) {
      return;
    }

    const supabase = createClient();

    const { error } = await supabase
      .from("blocked_dates")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Error removing blocked date: " + error.message);
      return;
    }

    await fetchData();
  };

  if (loading && blocks.length === 0) {
    return (
      <div className="text-gray-500">
        Loading blocked dates...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Blocked Dates & Times
          </h1>
          <p className="text-gray-500 font-light mt-1">
            Manage office closures or block specific times for individual
            agents.
          </p>
        </div>

        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-[#ae884e] text-white px-5 py-3 rounded-xl font-medium hover:bg-[#8f6e3c] shadow-md transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Block
          </button>
        )}
      </div>

      {isAdding && (
        <form
          onSubmit={handleAddBlock}
          className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 mb-8 space-y-6"
        >
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              New Blocked Period
            </h2>

            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-gray-400 hover:text-red-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Who is unavailable?
            </label>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => {
                  setBlockType("office");
                  setFormData((current) => ({
                    ...current,
                    agent_id: "",
                  }));
                }}
                className={`flex-1 py-4 px-4 rounded-xl border-2 font-medium flex items-center justify-center gap-3 transition-all ${
                  blockType === "office"
                    ? "bg-[#1c3053]/5 border-[#1c3053] text-[#1c3053]"
                    : "bg-white border-gray-100 text-gray-500 hover:border-gray-200"
                }`}
              >
                <Building className="w-5 h-5" />
                Entire Office
              </button>

              <button
                type="button"
                onClick={() => setBlockType("agent")}
                className={`flex-1 py-4 px-4 rounded-xl border-2 font-medium flex items-center justify-center gap-3 transition-all ${
                  blockType === "agent"
                    ? "bg-[#ae884e]/10 border-[#ae884e] text-[#ae884e]"
                    : "bg-white border-gray-100 text-gray-500 hover:border-gray-200"
                }`}
              >
                <Users className="w-5 h-5" />
                Specific Agent
              </button>
            </div>
          </div>

          {blockType === "agent" && (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Agent
              </label>

              <select
                value={formData.agent_id}
                onChange={(e) =>
                  setFormData((current) => ({
                    ...current,
                    agent_id: e.target.value,
                  }))
                }
                className="w-full p-3 rounded-xl border border-gray-300 text-gray-900 font-medium bg-white outline-none focus:border-[#ae884e]"
              >
                <option value="">-- Choose an Agent --</option>

                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="border-t border-gray-100 pt-6 mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Duration
            </label>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => setDateMode("single")}
                className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium flex items-center justify-center gap-2 transition-all ${
                  dateMode === "single"
                    ? "bg-[#1c3053]/5 border-[#1c3053] text-[#1c3053]"
                    : "bg-white border-gray-100 text-gray-500 hover:border-gray-200"
                }`}
              >
                <CalendarIcon className="w-4 h-4" />
                Single Day
              </button>

              <button
                type="button"
                onClick={() => setDateMode("multiple")}
                className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium flex items-center justify-center gap-2 transition-all ${
                  dateMode === "multiple"
                    ? "bg-[#ae884e]/10 border-[#ae884e] text-[#ae884e]"
                    : "bg-white border-gray-100 text-gray-500 hover:border-gray-200"
                }`}
              >
                <CalendarRange className="w-4 h-4" />
                Multiple Days
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            {dateMode === "single" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>

                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData((current) => ({
                      ...current,
                      start_date: e.target.value,
                    }))
                  }
                  className="w-full p-3 rounded-xl border border-gray-300 text-gray-900 font-medium bg-white outline-none focus:border-[#ae884e]"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>

                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData((current) => ({
                        ...current,
                        start_date: e.target.value,
                      }))
                    }
                    className="w-full p-3 rounded-xl border border-gray-300 text-gray-900 font-medium bg-white outline-none focus:border-[#ae884e]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>

                  <input
                    type="date"
                    min={
                      formData.start_date ||
                      new Date().toISOString().split("T")[0]
                    }
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData((current) => ({
                        ...current,
                        end_date: e.target.value,
                      }))
                    }
                    className="w-full p-3 rounded-xl border border-gray-300 text-gray-900 font-medium bg-white outline-none focus:border-[#ae884e]"
                  />
                </div>
              </>
            )}

            <div
              className={
                dateMode === "single" ? "md:col-span-2" : ""
              }
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (Optional)
              </label>

              <input
                type="text"
                placeholder="e.g. Doctor Appointment"
                value={formData.reason}
                onChange={(e) =>
                  setFormData((current) => ({
                    ...current,
                    reason: e.target.value,
                  }))
                }
                className="w-full p-3 rounded-xl border border-gray-300 text-gray-900 font-medium bg-white outline-none focus:border-[#ae884e] placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#ae884e]" />
              Specific Times (Optional)
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Start Time
                </label>

                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) =>
                    setFormData((current) => ({
                      ...current,
                      start_time: e.target.value,
                    }))
                  }
                  className="w-full p-3 rounded-xl border border-gray-300 text-gray-900 font-medium bg-white outline-none focus:border-[#ae884e]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  End Time
                </label>

                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) =>
                    setFormData((current) => ({
                      ...current,
                      end_time: e.target.value,
                    }))
                  }
                  className="w-full p-3 rounded-xl border border-gray-300 text-gray-900 font-medium bg-white outline-none focus:border-[#ae884e]"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-[#1c3053] text-white py-4 rounded-xl font-medium hover:bg-[#ae884e] shadow-lg transition-all"
          >
            <Save className="w-5 h-5" />
            Save Block
          </button>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-8">
        {blocks.length === 0 ? (
          <div className="text-center text-gray-500 flex flex-col items-center">
            <CalendarOff className="w-12 h-12 text-gray-300 mb-4" />
            <p>No blocked dates configured.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {blocks.map((block) => (
              <div
                key={block.id}
                className="flex items-center justify-between p-5 border border-gray-100 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {block.agent_id ? (
                      <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {block.agents?.name ?? "Unknown Agent"}
                      </span>
                    ) : (
                      <span className="bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        Global Block
                      </span>
                    )}

                    {block.start_time && block.end_time && (
                      <span className="bg-gray-200 text-gray-700 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {block.start_time.substring(0, 5)} -{" "}
                        {block.end_time.substring(0, 5)}
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-gray-900 mt-2">
                    {block.start_date === block.end_date ? (
                      block.start_date
                    ) : (
                      <>
                        {block.start_date}
                        <span className="text-gray-400 font-normal mx-1">
                          to
                        </span>
                        {block.end_date}
                      </>
                    )}
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    {block.reason || "No reason provided"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void handleDelete(block.id)}
                  className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all shadow-sm"
                  aria-label="Remove blocked date"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
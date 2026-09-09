"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Activity,
  ArrowRight,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Filter,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Search,
  User,
  UserCheck,
  Users,
  X,
  Zap,
} from "lucide-react";

type Customer = {
  id: string;
  account_number: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  lead_status: string | null;
  lead_source: string | null;
  lead_priority: string | null;
  assigned_agent_id: string | null;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
  lead_value: number | null;
  created_at: string;
};

type Agent = {
  id: string;
  name: string;
  email: string | null;
};

type LeadActivity = {
  id: string;
  customer_id: string;
  agent_id: string | null;
  activity_type: string;
  subject: string;
  description: string | null;
  outcome: string | null;
  follow_up_at: string | null;
  created_by: string | null;
  created_at: string;
};

type ActivityForm = {
  activity_type: string;
  subject: string;
  description: string;
  outcome: string;
  follow_up_at: string;
};

const STATUSES = [
  "New",
  "Contacted",
  "Viewing Booked",
  "Application",
  "Offer",
  "Completed",
  "Lost",
];

const SOURCES = [
  "Website",
  "Phone",
  "Email",
  "WhatsApp",
  "Rightmove",
  "Zoopla",
  "OnTheMarket",
  "Referral",
  "Walk-in",
  "Existing CRM",
  "Other",
];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const ACTIVITY_TYPES = [
  { value: "note", label: "Note", icon: Activity },
  { value: "call", label: "Phone Call", icon: Phone },
  { value: "email", label: "Email", icon: Mail },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { value: "viewing", label: "Viewing", icon: Calendar },
  { value: "application", label: "Application", icon: CheckCircle2 },
  { value: "offer", label: "Offer", icon: Zap },
  { value: "follow_up", label: "Follow-up", icon: Clock },
];

function getErrorMessage(error: unknown, fallback: string) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return fallback;
}

function statusClass(status: string | null) {
  switch (status) {
    case "New":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Contacted":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "Viewing Booked":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "Application":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Offer":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "Completed":
      return "bg-green-50 text-green-700 border-green-200";
    case "Lost":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-50 text-gray-600 border-gray-200";
  }
}

function priorityClass(priority: string | null) {
  switch (priority) {
    case "urgent":
      return "bg-red-100 text-red-700";
    case "high":
      return "bg-orange-100 text-orange-700";
    case "low":
      return "bg-gray-100 text-gray-600";
    default:
      return "bg-blue-50 text-blue-700";
  }
}

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isOverdue(value: string | null) {
  if (!value) return false;

  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return false;
  }

  return timestamp < Date.now();
}

async function loadLeadsData() {
  const supabase = createClient();

  const [customersResult, agentsResult, activitiesResult] =
    await Promise.all([
      supabase
        .from("customers")
        .select(
          "id, account_number, name, email, phone, lead_status, lead_source, lead_priority, assigned_agent_id, last_contacted_at, next_follow_up_at, lead_value, created_at"
        )
        .order("created_at", { ascending: false }),

      supabase
        .from("agents")
        .select("id, name, email")
        .order("name"),

      supabase
        .from("lead_activities")
        .select(
          "id, customer_id, agent_id, activity_type, subject, description, outcome, follow_up_at, created_by, created_at"
        )
        .order("created_at", { ascending: false }),
    ]);

  if (customersResult.error) {
    throw customersResult.error;
  }

  if (agentsResult.error) {
    throw agentsResult.error;
  }

  if (activitiesResult.error) {
    throw activitiesResult.error;
  }

  return {
    customers: (customersResult.data || []) as Customer[],
    agents: (agentsResult.data || []) as Agent[],
    activities: (activitiesResult.data || []) as LeadActivity[],
  };
}

export default function AdminLeadsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activities, setActivities] = useState<LeadActivity[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [followUpFilter, setFollowUpFilter] = useState<
    "all" | "overdue" | "today" | "upcoming"
  >("all");

  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const [showActivityModal, setShowActivityModal] = useState(false);

  const [activityForm, setActivityForm] = useState<ActivityForm>({
    activity_type: "note",
    subject: "",
    description: "",
    outcome: "",
    follow_up_at: "",
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await loadLeadsData();

        if (cancelled) {
          return;
        }

        setCustomers(data.customers);
        setAgents(data.agents);
        setActivities(data.activities);
      } catch (error: unknown) {
        if (!cancelled) {
          console.error("Lead tracking load error:", error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const searchable = [
        customer.name,
        customer.email,
        customer.phone,
        customer.account_number,
        customer.lead_source,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchable.includes(query);

      const matchesStatus =
        statusFilter === "all" || customer.lead_status === statusFilter;

      const matchesPriority =
        priorityFilter === "all" ||
        customer.lead_priority === priorityFilter;

      const matchesAgent =
        agentFilter === "all" ||
        customer.assigned_agent_id === agentFilter;

      const matchesSource =
        sourceFilter === "all" ||
        customer.lead_source === sourceFilter;

      let matchesFollowUp = true;

      if (followUpFilter === "overdue") {
        matchesFollowUp =
          !!customer.next_follow_up_at &&
          isOverdue(customer.next_follow_up_at);
      }

      if (followUpFilter === "today") {
        if (!customer.next_follow_up_at) {
          matchesFollowUp = false;
        } else {
          const today = new Date();
          const followUp = new Date(customer.next_follow_up_at);

          matchesFollowUp =
            !Number.isNaN(followUp.getTime()) &&
            today.getFullYear() === followUp.getFullYear() &&
            today.getMonth() === followUp.getMonth() &&
            today.getDate() === followUp.getDate();
        }
      }

      if (followUpFilter === "upcoming") {
        matchesFollowUp =
          !!customer.next_follow_up_at &&
          !isOverdue(customer.next_follow_up_at);
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesAgent &&
        matchesSource &&
        matchesFollowUp
      );
    });
  }, [
    customers,
    search,
    statusFilter,
    priorityFilter,
    agentFilter,
    sourceFilter,
    followUpFilter,
  ]);

  const stats = useMemo(() => {
    const active = customers.filter(
      (customer) =>
        customer.lead_status !== "Completed" &&
        customer.lead_status !== "Lost"
    );

    const overdue = customers.filter(
      (customer) =>
        !!customer.next_follow_up_at &&
        isOverdue(customer.next_follow_up_at)
    );

    const highPriority = customers.filter(
      (customer) =>
        customer.lead_priority === "high" ||
        customer.lead_priority === "urgent"
    );

    const newLeads = customers.filter(
      (customer) => customer.lead_status === "New"
    );

    return {
      total: customers.length,
      active: active.length,
      newLeads: newLeads.length,
      overdue: overdue.length,
      highPriority: highPriority.length,
    };
  }, [customers]);

  const getAgentName = (agentId: string | null) => {
    if (!agentId) return "Unassigned";

    return (
      agents.find((agent) => agent.id === agentId)?.name || "Unknown"
    );
  };

  const customerActivities = selectedCustomer
    ? activities.filter(
        (activity) => activity.customer_id === selectedCustomer.id
      )
    : [];

  const updateCustomer = async (
    customerId: string,
    patch: Partial<Customer>
  ) => {
    setSaving(true);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("customers")
        .update(patch)
        .eq("id", customerId);

      if (error) {
        throw error;
      }

      setCustomers((current) =>
        current.map((customer) =>
          customer.id === customerId
            ? { ...customer, ...patch }
            : customer
        )
      );

      setSelectedCustomer((current) =>
        current?.id === customerId
          ? { ...current, ...patch }
          : current
      );
    } catch (error: unknown) {
      alert(
        getErrorMessage(error, "Failed to update lead.")
      );
    } finally {
      setSaving(false);
    }
  };

  const openActivityModal = () => {
    setActivityForm({
      activity_type: "note",
      subject: "",
      description: "",
      outcome: "",
      follow_up_at: "",
    });

    setShowActivityModal(true);
  };

  const addActivity = async () => {
    if (!selectedCustomer) {
      return;
    }

    if (!activityForm.subject.trim()) {
      alert("Please enter an activity subject.");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const followUpAt = activityForm.follow_up_at
        ? new Date(activityForm.follow_up_at)
        : null;

      if (
        followUpAt &&
        Number.isNaN(followUpAt.getTime())
      ) {
        throw new Error("Invalid follow-up date.");
      }

      const { data, error } = await supabase
        .from("lead_activities")
        .insert({
          customer_id: selectedCustomer.id,
          agent_id: selectedCustomer.assigned_agent_id,
          activity_type: activityForm.activity_type,
          subject: activityForm.subject.trim(),
          description:
            activityForm.description.trim() || null,
          outcome: activityForm.outcome.trim() || null,
          follow_up_at: followUpAt
            ? followUpAt.toISOString()
            : null,
          created_by: user?.id || null,
        })
        .select(
          "id, customer_id, agent_id, activity_type, subject, description, outcome, follow_up_at, created_by, created_at"
        )
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setActivities((current) => [
          data as LeadActivity,
          ...current,
        ]);
      }

      if (followUpAt) {
        const nextFollowUpAt = followUpAt.toISOString();

        const { error: followUpError } = await supabase
          .from("customers")
          .update({
            next_follow_up_at: nextFollowUpAt,
          })
          .eq("id", selectedCustomer.id);

        if (followUpError) {
          throw followUpError;
        }

        setCustomers((current) =>
          current.map((customer) =>
            customer.id === selectedCustomer.id
              ? {
                  ...customer,
                  next_follow_up_at: nextFollowUpAt,
                }
              : customer
          )
        );

        setSelectedCustomer((current) =>
          current?.id === selectedCustomer.id
            ? {
                ...current,
                next_follow_up_at: nextFollowUpAt,
              }
            : current
        );
      }

      setShowActivityModal(false);
    } catch (error: unknown) {
      alert(
        getErrorMessage(error, "Failed to add activity.")
      );
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (
    customer: Customer,
    status: string
  ) => {
    await updateCustomer(customer.id, {
      lead_status: status,
    });
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-gray-200 border-t-[#1c3053] rounded-full animate-spin" />
          Loading lead pipeline...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#1c3053] text-white flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Lead Tracking
              </h1>

              <p className="text-sm text-gray-500 mt-0.5">
                Manage enquiries, follow-ups, agents and customer conversion.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/admin/customers/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1c3053] text-white text-sm font-semibold hover:bg-[#ae884e] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Lead
        </Link>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Leads"
          value={stats.total}
          icon={Users}
        />

        <StatCard
          label="Active Pipeline"
          value={stats.active}
          icon={Activity}
        />

        <StatCard
          label="New Leads"
          value={stats.newLeads}
          icon={Zap}
        />

        <StatCard
          label="Overdue Follow-ups"
          value={stats.overdue}
          icon={Bell}
          danger={stats.overdue > 0}
        />

        <StatCard
          label="High Priority"
          value={stats.highPriority}
          icon={Clock}
          danger={stats.highPriority > 0}
        />
      </div>

      {/* PIPELINE */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900">
              Lead Pipeline
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Current distribution by lead stage.
            </p>
          </div>

          <Filter className="w-4 h-4 text-gray-400" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
          {STATUSES.map((status) => {
            const count = customers.filter(
              (customer) => customer.lead_status === status
            ).length;

            return (
              <button
                key={status}
                type="button"
                onClick={() =>
                  setStatusFilter(
                    statusFilter === status ? "all" : status
                  )
                }
                className={`text-left rounded-xl border p-4 transition-all ${
                  statusFilter === status
                    ? "border-[#ae884e] ring-2 ring-[#ae884e]/10"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <p className="text-xs font-medium text-gray-500">
                  {status}
                </p>

                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {count}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col xl:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, phone or account number..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e] text-sm"
            />
          </div>

          <SelectFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "All statuses" },
              ...STATUSES.map((value) => ({
                value,
                label: value,
              })),
            ]}
          />

          <SelectFilter
            value={priorityFilter}
            onChange={setPriorityFilter}
            options={[
              { value: "all", label: "All priorities" },
              ...PRIORITIES.map((item) => ({
                value: item.value,
                label: item.label,
              })),
            ]}
          />

          <SelectFilter
            value={agentFilter}
            onChange={setAgentFilter}
            options={[
              { value: "all", label: "All agents" },
              ...agents.map((agent) => ({
                value: agent.id,
                label: agent.name,
              })),
            ]}
          />

          <SelectFilter
            value={sourceFilter}
            onChange={setSourceFilter}
            options={[
              { value: "all", label: "All sources" },
              ...SOURCES.map((source) => ({
                value: source,
                label: source,
              })),
            ]}
          />

          <SelectFilter
            value={followUpFilter}
            onChange={(value) =>
              setFollowUpFilter(
                value as
                  | "all"
                  | "overdue"
                  | "today"
                  | "upcoming"
              )
            }
            options={[
              { value: "all", label: "All follow-ups" },
              { value: "overdue", label: "Overdue" },
              { value: "today", label: "Due today" },
              { value: "upcoming", label: "Upcoming" },
            ]}
          />
        </div>
      </div>

      {/* LEADS TABLE */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">
              Leads
            </h2>

            <p className="text-xs text-gray-500 mt-1">
              Showing {filteredCustomers.length} of {customers.length}
            </p>
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="py-20 text-center">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-700">
              No leads found
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Try changing your filters or search query.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Lead</th>
                  <th className="px-6 py-4">Stage</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Assigned Agent</th>
                  <th className="px-6 py-4">Last Contact</th>
                  <th className="px-6 py-4">Next Follow-up</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map((customer) => {
                  const overdue =
                    !!customer.next_follow_up_at &&
                    isOverdue(customer.next_follow_up_at);

                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedCustomer(customer)
                          }
                          className="text-left group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                              <User className="w-4 h-4" />
                            </div>

                            <div>
                              <p className="font-semibold text-gray-900 group-hover:text-[#ae884e] transition-colors">
                                {customer.name}
                              </p>

                              <p className="text-xs text-gray-500 mt-0.5">
                                {customer.account_number
                                  ? `#${customer.account_number}`
                                  : customer.email || "No email"}
                              </p>
                            </div>
                          </div>
                        </button>
                      </td>

                      <td className="px-6 py-4">
                        <select
                          value={customer.lead_status || "New"}
                          onChange={(e) =>
                            updateStatus(customer, e.target.value)
                          }
                          className={`text-xs font-semibold rounded-lg px-2.5 py-1.5 border ${statusClass(
                            customer.lead_status
                          )} focus:outline-none`}
                        >
                          {STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-6 py-4">
                        <select
                          value={customer.lead_priority || "normal"}
                          onChange={(e) =>
                            updateCustomer(customer.id, {
                              lead_priority: e.target.value,
                            })
                          }
                          className={`text-xs font-semibold rounded-full px-2.5 py-1 border-0 ${priorityClass(
                            customer.lead_priority
                          )}`}
                        >
                          {PRIORITIES.map((priority) => (
                            <option
                              key={priority.value}
                              value={priority.value}
                            >
                              {priority.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-6 py-4">
                        <select
                          value={customer.lead_source || "Other"}
                          onChange={(e) =>
                            updateCustomer(customer.id, {
                              lead_source: e.target.value,
                            })
                          }
                          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700"
                        >
                          {SOURCES.map((source) => (
                            <option key={source} value={source}>
                              {source}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-6 py-4">
                        <select
                          value={customer.assigned_agent_id || ""}
                          onChange={(e) =>
                            updateCustomer(customer.id, {
                              assigned_agent_id:
                                e.target.value || null,
                            })
                          }
                          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 min-w-[140px]"
                        >
                          <option value="">Unassigned</option>

                          {agents.map((agent) => (
                            <option
                              key={agent.id}
                              value={agent.id}
                            >
                              {agent.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-xs text-gray-600">
                          {formatDate(customer.last_contacted_at)}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <div
                          className={`text-xs ${
                            overdue
                              ? "text-red-600 font-semibold"
                              : "text-gray-600"
                          }`}
                        >
                          {customer.next_follow_up_at
                            ? formatDateTime(
                                customer.next_follow_up_at
                              )
                            : "No follow-up"}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedCustomer(customer)
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-[#1c3053] hover:text-white hover:border-[#1c3053] transition-colors"
                        >
                          Open
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* LEAD DETAIL DRAWER */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedCustomer(null)}
          />

          <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-[#ae884e] font-bold">
                  Lead Profile
                </p>

                <h2 className="text-xl font-bold text-gray-900 mt-1">
                  {selectedCustomer.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                aria-label="Close lead profile"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact */}
              <div className="bg-gray-50 rounded-2xl p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ContactItem
                    icon={Mail}
                    label="Email"
                    value={selectedCustomer.email || "Not provided"}
                  />

                  <ContactItem
                    icon={Phone}
                    label="Phone"
                    value={selectedCustomer.phone || "Not provided"}
                  />

                  <ContactItem
                    icon={UserCheck}
                    label="Assigned Agent"
                    value={getAgentName(
                      selectedCustomer.assigned_agent_id
                    )}
                  />

                  <ContactItem
                    icon={Calendar}
                    label="Lead Created"
                    value={formatDate(
                      selectedCustomer.created_at
                    )}
                  />
                </div>
              </div>

              {/* Lead Controls */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Lead Management
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </span>

                    <select
                      value={selectedCustomer.lead_status || "New"}
                      onChange={(e) =>
                        updateStatus(
                          selectedCustomer,
                          e.target.value
                        )
                      }
                      className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Priority
                    </span>

                    <select
                      value={
                        selectedCustomer.lead_priority ||
                        "normal"
                      }
                      onChange={(e) =>
                        updateCustomer(selectedCustomer.id, {
                          lead_priority: e.target.value,
                        })
                      }
                      className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                    >
                      {PRIORITIES.map((priority) => (
                        <option
                          key={priority.value}
                          value={priority.value}
                        >
                          {priority.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Lead Source
                    </span>

                    <select
                      value={
                        selectedCustomer.lead_source ||
                        "Other"
                      }
                      onChange={(e) =>
                        updateCustomer(selectedCustomer.id, {
                          lead_source: e.target.value,
                        })
                      }
                      className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                    >
                      {SOURCES.map((source) => (
                        <option key={source} value={source}>
                          {source}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Assigned Agent
                    </span>

                    <select
                      value={
                        selectedCustomer.assigned_agent_id ||
                        ""
                      }
                      onChange={(e) =>
                        updateCustomer(selectedCustomer.id, {
                          assigned_agent_id:
                            e.target.value || null,
                        })
                      }
                      className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                    >
                      <option value="">Unassigned</option>

                      {agents.map((agent) => (
                        <option
                          key={agent.id}
                          value={agent.id}
                        >
                          {agent.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              {/* Follow-up */}
              <div className="bg-[#1c3053] rounded-2xl p-5 text-white">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-gray-300 uppercase tracking-wider font-semibold">
                      Next Follow-up
                    </p>

                    <p className="font-semibold mt-1">
                      {selectedCustomer.next_follow_up_at
                        ? formatDateTime(
                            selectedCustomer.next_follow_up_at
                          )
                        : "No follow-up scheduled"}
                    </p>
                  </div>

                  <Clock className="w-6 h-6 text-[#ae884e]" />
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={openActivityModal}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#ae884e] text-white text-sm font-semibold hover:bg-[#9a7641] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Activity
                  </button>

                  {selectedCustomer.email && (
                    <a
                      href={`mailto:${selectedCustomer.email}`}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                      aria-label="Email lead"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  )}

                  {selectedCustomer.phone && (
                    <a
                      href={`tel:${selectedCustomer.phone}`}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                      aria-label="Call lead"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Activity Timeline */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Activity Timeline
                    </h3>

                    <p className="text-xs text-gray-500 mt-1">
                      {customerActivities.length} recorded activities
                    </p>
                  </div>
                </div>

                {customerActivities.length === 0 ? (
                  <div className="border border-dashed border-gray-200 rounded-2xl py-12 text-center">
                    <Activity className="w-8 h-8 text-gray-300 mx-auto mb-3" />

                    <p className="text-sm font-medium text-gray-600">
                      No activity recorded yet
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      Add a call, note, email, viewing or follow-up.
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-5 top-3 bottom-3 w-px bg-gray-200" />

                    <div className="space-y-5">
                      {customerActivities.map((activity) => {
                        const activityMeta =
                          ACTIVITY_TYPES.find(
                            (item) =>
                              item.value ===
                              activity.activity_type
                          );

                        const ActivityIcon =
                          activityMeta?.icon || Activity;

                        return (
                          <div
                            key={activity.id}
                            className="relative flex gap-4"
                          >
                            <div className="relative z-10 w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#1c3053] shrink-0">
                              <ActivityIcon className="w-4 h-4" />
                            </div>

                            <div className="flex-1 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="font-semibold text-gray-900 text-sm">
                                    {activity.subject}
                                  </p>

                                  <p className="text-[11px] text-[#ae884e] font-semibold uppercase tracking-wider mt-1">
                                    {activityMeta?.label ||
                                      activity.activity_type}
                                  </p>
                                </div>

                                <p className="text-[11px] text-gray-400 whitespace-nowrap">
                                  {formatDateTime(
                                    activity.created_at
                                  )}
                                </p>
                              </div>

                              {activity.description && (
                                <p className="text-sm text-gray-600 mt-3 whitespace-pre-wrap">
                                  {activity.description}
                                </p>
                              )}

                              {activity.outcome && (
                                <div className="mt-3 text-xs bg-white border border-gray-200 rounded-lg px-3 py-2">
                                  <span className="font-semibold text-gray-500">
                                    Outcome:
                                  </span>{" "}
                                  <span className="text-gray-700">
                                    {activity.outcome}
                                  </span>
                                </div>
                              )}

                              {activity.follow_up_at && (
                                <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-700">
                                  <Clock className="w-3.5 h-3.5" />
                                  Follow-up:{" "}
                                  {formatDateTime(
                                    activity.follow_up_at
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD ACTIVITY MODAL */}
      {showActivityModal && selectedCustomer && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Add Lead Activity
                </h2>

                <p className="text-xs text-gray-500 mt-1">
                  {selectedCustomer.name}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowActivityModal(false)}
                className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                aria-label="Close activity modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Activity Type
                </span>

                <select
                  value={activityForm.activity_type}
                  onChange={(e) =>
                    setActivityForm((current) => ({
                      ...current,
                      activity_type: e.target.value,
                    }))
                  }
                  className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                >
                  {ACTIVITY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Subject
                </span>

                <input
                  value={activityForm.subject}
                  onChange={(e) =>
                    setActivityForm((current) => ({
                      ...current,
                      subject: e.target.value,
                    }))
                  }
                  placeholder="e.g. Called customer regarding 24 Rose Lane"
                  className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Description
                </span>

                <textarea
                  value={activityForm.description}
                  onChange={(e) =>
                    setActivityForm((current) => ({
                      ...current,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Record useful details about this interaction..."
                  className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Outcome
                </span>

                <input
                  value={activityForm.outcome}
                  onChange={(e) =>
                    setActivityForm((current) => ({
                      ...current,
                      outcome: e.target.value,
                    }))
                  }
                  placeholder="e.g. Customer interested and requested second viewing"
                  className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Schedule Follow-up
                </span>

                <input
                  type="datetime-local"
                  value={activityForm.follow_up_at}
                  onChange={(e) =>
                    setActivityForm((current) => ({
                      ...current,
                      follow_up_at: e.target.value,
                    }))
                  }
                  className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                />
              </label>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowActivityModal(false)}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={addActivity}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1c3053] text-white text-sm font-semibold hover:bg-[#ae884e] disabled:opacity-50"
              >
                {saving && (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                Save Activity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  danger = false,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  danger?: boolean;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500">
          {label}
        </p>

        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            danger
              ? "bg-red-50 text-red-600"
              : "bg-gray-50 text-[#1c3053]"
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <p className="text-2xl font-bold text-gray-900 mt-3">
        {value}
      </p>
    </div>
  );
}

function SelectFilter({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none w-full xl:w-auto min-w-[145px] pr-9 pl-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
    </div>
  );
}

function ContactItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-[#ae884e] shrink-0">
        <Icon className="w-4 h-4" />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
          {label}
        </p>

        <p className="text-sm text-gray-700 mt-1 truncate">
          {value}
        </p>
      </div>
    </div>
  );
}
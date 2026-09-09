"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type ApplicationStatus =
  | "submitted"
  | "under_review"
  | "documents_required"
  | "referencing"
  | "approved"
  | "rejected"
  | "withdrawn";

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
};

type Property = {
  id: string;
  title: string;
  property_ref: string | null;
  monthly_rent: number | null;
};

type Agent = {
  id: string;
  name: string;
  email: string | null;
};

type Application = {
  id: string;
  customer_id: string;
  property_id: string;
  agent_id: string | null;
  status: ApplicationStatus;
  move_in_date: string | null;
  monthly_rent: number | null;
  deposit_amount: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer | Customer[] | null;
  property?: Property | Property[] | null;
  agent?: Agent | Agent[] | null;
};

type RawApplication = {
  id: string;
  customer_id: string;
  property_id: string;
  agent_id: string | null;
  status: unknown;
  move_in_date: string | null;
  monthly_rent: number | string | null;
  deposit_amount: number | string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer | Customer[] | null;
  property?: Property | Property[] | null;
  agent?: Agent | Agent[] | null;
};

type StatusHistory = {
  id: string;
  application_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string | null;
  note: string | null;
  created_at: string;
};

const STATUS_OPTIONS: {
  value: ApplicationStatus;
  label: string;
}[] = [
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "documents_required", label: "Documents Required" },
  { value: "referencing", label: "Referencing" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

function normalizeStatus(value: unknown): ApplicationStatus {
  const allowed: ApplicationStatus[] = [
    "submitted",
    "under_review",
    "documents_required",
    "referencing",
    "approved",
    "rejected",
    "withdrawn",
  ];

  return allowed.includes(value as ApplicationStatus)
    ? (value as ApplicationStatus)
    : "submitted";
}

function getRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function formatStatus(status: ApplicationStatus) {
  return (
    STATUS_OPTIONS.find((item) => item.value === status)?.label ??
    status.replace(/_/g, " ")
  );
}

function statusClasses(status: ApplicationStatus) {
  switch (status) {
    case "submitted":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "under_review":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "documents_required":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "referencing":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "approved":
      return "bg-green-50 text-green-700 border-green-200";
    case "rejected":
      return "bg-red-50 text-red-700 border-red-200";
    case "withdrawn":
      return "bg-gray-100 text-gray-600 border-gray-200";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value: number | null) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2,
  }).format(value);
}

function normalizeApplication(raw: RawApplication): Application {
  const monthlyRent =
    raw.monthly_rent === null || raw.monthly_rent === undefined
      ? null
      : Number(raw.monthly_rent);

  const depositAmount =
    raw.deposit_amount === null || raw.deposit_amount === undefined
      ? null
      : Number(raw.deposit_amount);

  return {
    id: raw.id,
    customer_id: raw.customer_id,
    property_id: raw.property_id,
    agent_id: raw.agent_id ?? null,
    status: normalizeStatus(raw.status),
    move_in_date: raw.move_in_date ?? null,
    monthly_rent: Number.isFinite(monthlyRent) ? monthlyRent : null,
    deposit_amount: Number.isFinite(depositAmount) ? depositAmount : null,
    notes: raw.notes ?? null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    customer: getRelation(raw.customer),
    property: getRelation(raw.property),
    agent: getRelation(raw.agent),
  };
}

async function loadApplicationsData() {
  const supabase = createClient();

  const [
    applicationsResult,
    customersResult,
    propertiesResult,
    agentsResult,
  ] = await Promise.all([
    supabase
      .from("applications")
      .select(`
        id,
        customer_id,
        property_id,
        agent_id,
        status,
        move_in_date,
        monthly_rent,
        deposit_amount,
        notes,
        created_at,
        updated_at,
        customer:customers(
          id,
          name,
          email,
          phone
        ),
        property:properties(
          id,
          title,
          property_ref,
          monthly_rent
        ),
        agent:agents(
          id,
          name,
          email
        )
      `)
      .order("created_at", { ascending: false }),

    supabase
      .from("customers")
      .select("id, name, email, phone")
      .order("name"),

    supabase
      .from("properties")
      .select("id, title, property_ref, monthly_rent")
      .order("title"),

    supabase
      .from("agents")
      .select("id, name, email")
      .order("name"),
  ]);

  if (applicationsResult.error) {
    throw applicationsResult.error;
  }

  if (customersResult.error) {
    throw customersResult.error;
  }

  if (propertiesResult.error) {
    throw propertiesResult.error;
  }

  if (agentsResult.error) {
    throw agentsResult.error;
  }

  return {
    applications: (applicationsResult.data ?? []).map((item) =>
      normalizeApplication(item as unknown as RawApplication)
    ),
    customers: (customersResult.data ?? []) as Customer[],
    properties: (propertiesResult.data ?? []) as Property[],
    agents: (agentsResult.data ?? []) as Agent[],
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message || fallback;
  }

  return fallback;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);

  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [history, setHistory] = useState<StatusHistory[]>([]);

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | ApplicationStatus
  >("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const [showCreate, setShowCreate] = useState(false);

  const [newCustomerId, setNewCustomerId] = useState("");
  const [newPropertyId, setNewPropertyId] = useState("");
  const [newAgentId, setNewAgentId] = useState("");
  const [newMoveInDate, setNewMoveInDate] = useState("");
  const [newMonthlyRent, setNewMonthlyRent] = useState("");
  const [newDeposit, setNewDeposit] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const [newStatus, setNewStatus] =
    useState<ApplicationStatus>("submitted");
  const [statusNote, setStatusNote] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      try {
        const data = await loadApplicationsData();

        if (cancelled) return;

        setApplications(data.applications);
        setCustomers(data.customers);
        setProperties(data.properties);
        setAgents(data.agents);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            getErrorMessage(err, "Failed to load applications.")
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshData = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await loadApplicationsData();

      setApplications(data.applications);
      setCustomers(data.customers);
      setProperties(data.properties);
      setAgents(data.agents);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load applications."));
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = applications.filter((application) => {
      const customer = getRelation(application.customer);
      const property = getRelation(application.property);
      const agent = getRelation(application.agent);

      const searchable = [
        customer?.name,
        customer?.email,
        customer?.phone,
        property?.title,
        property?.property_ref,
        agent?.name,
        agent?.email,
        application.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchable.includes(query);

      const matchesStatus =
        statusFilter === "all" || application.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    return result.sort((a, b) => {
      const first = new Date(a.created_at).getTime();
      const second = new Date(b.created_at).getTime();

      return sortOrder === "newest" ? second - first : first - second;
    });
  }, [applications, search, statusFilter, sortOrder]);

  const counts = useMemo(() => {
    return {
      total: applications.length,
      submitted: applications.filter((a) => a.status === "submitted").length,
      review: applications.filter((a) => a.status === "under_review").length,
      documents: applications.filter(
        (a) => a.status === "documents_required"
      ).length,
      referencing: applications.filter(
        (a) => a.status === "referencing"
      ).length,
      approved: applications.filter((a) => a.status === "approved").length,
    };
  }, [applications]);

  const openApplication = async (application: Application) => {
    setSelectedApplication(application);
    setNewStatus(application.status);
    setStatusNote("");
    setDetailError("");
    setHistory([]);
    setDetailLoading(true);

    const supabase = createClient();

    try {
      const { data, error: historyError } = await supabase
        .from("application_status_history")
        .select(
          "id, application_id, old_status, new_status, changed_by, note, created_at"
        )
        .eq("application_id", application.id)
        .order("created_at", { ascending: false });

      if (historyError) {
        throw historyError;
      }

      setHistory((data ?? []) as StatusHistory[]);
    } catch (err: unknown) {
      setDetailError(
        getErrorMessage(err, "Failed to load application history.")
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const createApplication = async () => {
    if (!newCustomerId || !newPropertyId) {
      setError("Customer and property are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const supabase = createClient();

      const property = properties.find(
        (item) => item.id === newPropertyId
      );

      const monthlyRent =
        newMonthlyRent.trim() !== ""
          ? Number(newMonthlyRent)
          : property?.monthly_rent ?? null;

      const depositAmount =
        newDeposit.trim() !== "" ? Number(newDeposit) : null;

      if (
        monthlyRent !== null &&
        (Number.isNaN(monthlyRent) || monthlyRent < 0)
      ) {
        throw new Error("Monthly rent must be a valid amount.");
      }

      if (
        depositAmount !== null &&
        (Number.isNaN(depositAmount) || depositAmount < 0)
      ) {
        throw new Error("Deposit must be a valid amount.");
      }

      const { data, error: insertError } = await supabase
        .from("applications")
        .insert({
          customer_id: newCustomerId,
          property_id: newPropertyId,
          agent_id: newAgentId || null,
          status: "submitted",
          move_in_date: newMoveInDate || null,
          monthly_rent: monthlyRent,
          deposit_amount: depositAmount,
          notes: newNotes.trim() || null,
        })
        .select(`
          id,
          customer_id,
          property_id,
          agent_id,
          status,
          move_in_date,
          monthly_rent,
          deposit_amount,
          notes,
          created_at,
          updated_at,
          customer:customers(
            id,
            name,
            email,
            phone
          ),
          property:properties(
            id,
            title,
            property_ref,
            monthly_rent
          ),
          agent:agents(
            id,
            name,
            email
          )
        `)
        .single();

      if (insertError) {
        throw insertError;
      }

      const created = normalizeApplication(
        data as unknown as RawApplication
      );

      setApplications((current) => [created, ...current]);
      setShowCreate(false);

      setNewCustomerId("");
      setNewPropertyId("");
      setNewAgentId("");
      setNewMoveInDate("");
      setNewMonthlyRent("");
      setNewDeposit("");
      setNewNotes("");
    } catch (err: unknown) {
      setError(
        getErrorMessage(err, "Failed to create application.")
      );
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async () => {
    if (!selectedApplication) return;

    if (newStatus === selectedApplication.status && !statusNote.trim()) {
      return;
    }

    setSaving(true);
    setDetailError("");

    try {
      const supabase = createClient();
      const updatedAt = new Date().toISOString();

      const { error: updateError } = await supabase
        .from("applications")
        .update({
          status: newStatus,
          updated_at: updatedAt,
        })
        .eq("id", selectedApplication.id);

      if (updateError) {
        throw updateError;
      }

      if (statusNote.trim()) {
        const { data: currentUserData, error: currentUserError } =
          await supabase.auth.getUser();

        if (currentUserError) {
          throw currentUserError;
        }

        const { error: historyInsertError } = await supabase
          .from("application_status_history")
          .insert({
            application_id: selectedApplication.id,
            old_status: selectedApplication.status,
            new_status: newStatus,
            changed_by: currentUserData.user?.id ?? null,
            note: statusNote.trim(),
          });

        if (historyInsertError) {
          throw historyInsertError;
        }
      }

      const updatedApplication: Application = {
        ...selectedApplication,
        status: newStatus,
        updated_at: updatedAt,
      };

      setSelectedApplication(updatedApplication);

      setApplications((current) =>
        current.map((application) =>
          application.id === updatedApplication.id
            ? updatedApplication
            : application
        )
      );

      setStatusNote("");

      const {
        data: historyData,
        error: historyFetchError,
      } = await supabase
        .from("application_status_history")
        .select(
          "id, application_id, old_status, new_status, changed_by, note, created_at"
        )
        .eq("application_id", updatedApplication.id)
        .order("created_at", { ascending: false });

      if (historyFetchError) {
        throw historyFetchError;
      }

      setHistory((historyData ?? []) as StatusHistory[]);
    } catch (err: unknown) {
      setDetailError(
        getErrorMessage(err, "Failed to update application.")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                <Link
                  href="/admin"
                  className="transition hover:text-gray-900"
                >
                  Admin
                </Link>
                <span>/</span>
                <span>Applications</span>
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                Applications
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage property applications, applicants, referencing and
                application progress.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={refreshData}
                disabled={loading}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setShowCreate(true);
                }}
                className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                New Application
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[
            ["Total", counts.total, "all"],
            ["Submitted", counts.submitted, "submitted"],
            ["Under Review", counts.review, "under_review"],
            ["Documents", counts.documents, "documents_required"],
            ["Referencing", counts.referencing, "referencing"],
            ["Approved", counts.approved, "approved"],
          ].map(([label, count, filter]) => (
            <button
              type="button"
              key={String(label)}
              onClick={() =>
                setStatusFilter(filter as "all" | ApplicationStatus)
              }
              className={`rounded-xl border bg-white p-4 text-left shadow-sm transition hover:shadow ${
                statusFilter === filter
                  ? "border-gray-900 ring-1 ring-gray-900"
                  : "border-gray-200"
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {count}
              </p>
            </button>
          ))}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative flex-1">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search applicant, property, agent or application ID..."
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as "all" | ApplicationStatus
                    )
                  }
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                >
                  <option value="all">All statuses</option>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>

                <select
                  value={sortOrder}
                  onChange={(event) =>
                    setSortOrder(event.target.value as "newest" | "oldest")
                  }
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="text-sm text-gray-500">
                Loading applications...
              </div>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                #
              </div>
              <h2 className="text-base font-semibold text-gray-900">
                No applications found
              </h2>
              <p className="mt-1 max-w-md text-sm text-gray-500">
                No applications match the current filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Applicant
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Property
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Agent
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Move-in
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Created
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredApplications.map((application) => {
                    const customer = getRelation(application.customer);
                    const property = getRelation(application.property);
                    const agent = getRelation(application.agent);

                    return (
                      <tr
                        key={application.id}
                        onClick={() => void openApplication(application)}
                        className="cursor-pointer transition hover:bg-gray-50"
                      >
                        <td className="px-4 py-4">
                          <div className="font-medium text-gray-900">
                            {customer?.name || "Unknown customer"}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {customer?.email ||
                              customer?.phone ||
                              application.customer_id}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="max-w-xs font-medium text-gray-900">
                            {property?.title || "Unknown property"}
                          </div>
                          {property?.property_ref && (
                            <div className="mt-1 text-xs text-gray-500">
                              {property.property_ref}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-700">
                          {agent?.name || "Unassigned"}
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-700">
                          {formatDate(application.move_in_date)}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses(
                              application.status
                            )}`}
                          >
                            {formatStatus(application.status)}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-500">
                          {formatDateTime(application.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  New Application
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Create an application linked to an existing customer and
                  property.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    Customer *
                  </span>
                  <select
                    value={newCustomerId}
                    onChange={(event) =>
                      setNewCustomerId(event.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                  >
                    <option value="">Select customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                        {customer.email ? ` — ${customer.email}` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    Property *
                  </span>
                  <select
                    value={newPropertyId}
                    onChange={(event) =>
                      setNewPropertyId(event.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                  >
                    <option value="">Select property</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.title}
                        {property.property_ref
                          ? ` — ${property.property_ref}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    Assigned Agent
                  </span>
                  <select
                    value={newAgentId}
                    onChange={(event) => setNewAgentId(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                  >
                    <option value="">Unassigned</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    Preferred Move-in Date
                  </span>
                  <input
                    type="date"
                    value={newMoveInDate}
                    onChange={(event) =>
                      setNewMoveInDate(event.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    Monthly Rent
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newMonthlyRent}
                    onChange={(event) =>
                      setNewMonthlyRent(event.target.value)
                    }
                    placeholder="e.g. 950"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    Deposit Amount
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newDeposit}
                    onChange={(event) => setNewDeposit(event.target.value)}
                    placeholder="e.g. 1100"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Notes
                </span>
                <textarea
                  value={newNotes}
                  onChange={(event) => setNewNotes(event.target.value)}
                  rows={4}
                  placeholder="Internal application notes..."
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void createApplication()}
                disabled={saving}
                className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Application"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                  Application
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {getRelation(selectedApplication.customer)?.name ||
                    "Unknown customer"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {getRelation(selectedApplication.property)?.title ||
                    "Unknown property"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedApplication(null)}
                className="rounded-lg px-3 py-2 text-xl leading-none text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              >
                ×
              </button>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-3">
              <div className="space-y-5 lg:col-span-2">
                {detailError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {detailError}
                  </div>
                )}

                <section className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Applicant
                    </div>
                    <div className="mt-2 font-medium text-gray-900">
                      {getRelation(selectedApplication.customer)?.name ||
                        "Unknown"}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      {getRelation(selectedApplication.customer)?.email ||
                        "No email"}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      {getRelation(selectedApplication.customer)?.phone ||
                        "No phone"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Property
                    </div>
                    <div className="mt-2 font-medium text-gray-900">
                      {getRelation(selectedApplication.property)?.title ||
                        "Unknown"}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      {getRelation(selectedApplication.property)
                        ?.property_ref || "No reference"}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      {formatMoney(
                        getRelation(selectedApplication.property)
                          ?.monthly_rent ??
                          selectedApplication.monthly_rent
                      )}{" "}
                      / month
                    </div>
                  </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl bg-gray-50 p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Move-in
                    </div>
                    <div className="mt-2 font-semibold text-gray-900">
                      {formatDate(selectedApplication.move_in_date)}
                    </div>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Monthly Rent
                    </div>
                    <div className="mt-2 font-semibold text-gray-900">
                      {formatMoney(selectedApplication.monthly_rent)}
                    </div>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Deposit
                    </div>
                    <div className="mt-2 font-semibold text-gray-900">
                      {formatMoney(selectedApplication.deposit_amount)}
                    </div>
                  </div>
                </section>

                {selectedApplication.notes && (
                  <section>
                    <h3 className="mb-2 text-sm font-semibold text-gray-900">
                      Internal Notes
                    </h3>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-700">
                      {selectedApplication.notes}
                    </div>
                  </section>
                )}

                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Application History
                    </h3>
                    {detailLoading && (
                      <span className="text-xs text-gray-500">
                        Loading...
                      </span>
                    )}
                  </div>

                  {history.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                      No status history recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {history.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-xl border border-gray-200 p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-sm font-medium text-gray-900">
                              {item.old_status
                                ? `${formatStatus(
                                    normalizeStatus(item.old_status)
                                  )} → `
                                : ""}
                              {formatStatus(
                                normalizeStatus(item.new_status)
                              )}
                            </div>

                            <div className="text-xs text-gray-500">
                              {formatDateTime(item.created_at)}
                            </div>
                          </div>

                          {item.note && (
                            <p className="mt-2 text-sm leading-6 text-gray-600">
                              {item.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <aside className="space-y-5">
                <section className="rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Application Status
                  </h3>

                  <select
                    value={newStatus}
                    onChange={(event) =>
                      setNewStatus(event.target.value as ApplicationStatus)
                    }
                    className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>

                  <textarea
                    value={statusNote}
                    onChange={(event) => setStatusNote(event.target.value)}
                    rows={4}
                    placeholder="Optional status update note..."
                    className="mt-3 w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                  />

                  <button
                    type="button"
                    onClick={() => void updateStatus()}
                    disabled={
                      saving ||
                      (newStatus === selectedApplication.status &&
                        !statusNote.trim())
                    }
                    className="mt-3 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Update Status"}
                  </button>
                </section>

                <section className="rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Assigned Agent
                  </h3>

                  <div className="mt-2 text-sm text-gray-700">
                    {getRelation(selectedApplication.agent)?.name ||
                      "Unassigned"}
                  </div>

                  {getRelation(selectedApplication.agent)?.email && (
                    <a
                      href={`mailto:${
                        getRelation(selectedApplication.agent)?.email
                      }`}
                      className="mt-1 block text-sm text-gray-500 hover:text-gray-900"
                    >
                      {getRelation(selectedApplication.agent)?.email}
                    </a>
                  )}
                </section>

                <section className="rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Application Details
                  </h3>

                  <dl className="mt-3 space-y-3 text-sm">
                    <div>
                      <dt className="text-gray-400">Application ID</dt>
                      <dd className="mt-1 break-all font-mono text-xs text-gray-700">
                        {selectedApplication.id}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-gray-400">Created</dt>
                      <dd className="mt-1 text-gray-700">
                        {formatDateTime(selectedApplication.created_at)}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-gray-400">Last Updated</dt>
                      <dd className="mt-1 text-gray-700">
                        {formatDateTime(selectedApplication.updated_at)}
                      </dd>
                    </div>
                  </dl>
                </section>
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
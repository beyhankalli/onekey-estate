"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Activity,
  Calendar,
  ChevronDown,
  Database,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
} from "lucide-react";

type AuditAction = "INSERT" | "UPDATE" | "DELETE";

type AuditChangedFields = Record<string, unknown>;

type AuditLog = {
  id: string;
  table_name: string;
  record_id: string | null;
  action: AuditAction;
  actor_user_id: string | null;
  actor_email: string | null;
  changed_fields: AuditChangedFields | null;
  created_at: string;
};

const ACTIONS = ["ALL", "INSERT", "UPDATE", "DELETE"] as const;

function formatTableName(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatAction(action: AuditAction) {
  if (action === "INSERT") return "Created";
  if (action === "UPDATE") return "Updated";
  return "Deleted";
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function summariseChanges(changes: AuditChangedFields | null) {
  if (!changes) return "No field details recorded.";

  const keys = Object.keys(changes);

  if (!keys.length) return "No field changes recorded.";

  if (keys.length <= 4) {
    return keys.map((key) => key.replace(/_/g, " ")).join(", ");
  }

  return `${keys
    .slice(0, 4)
    .map((key) => key.replace(/_/g, " "))
    .join(", ")} +${keys.length - 4} more`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message || "Unable to load the audit log.";
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message || "Unable to load the audit log.";
  }

  return "Unable to load the audit log.";
}

async function loadLogsData(): Promise<AuditLog[]> {
  const supabase = createClient();

  const { data, error: queryError } = await supabase
    .from("audit_logs")
    .select(
      "id, table_name, record_id, action, actor_user_id, actor_email, changed_fields, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (queryError) {
    throw queryError;
  }

  return (data ?? []) as AuditLog[];
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [action, setAction] =
    useState<(typeof ACTIONS)[number]>("ALL");
  const [tableFilter, setTableFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadLogs = async (refresh = false) => {
    try {
      setError("");

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await loadLogsData();
      setLogs(data);
    } catch (err: unknown) {
      console.error("Error loading audit log:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadInitialLogs = async () => {
      try {
        const data = await loadLogsData();

        if (cancelled) return;

        setLogs(data);
      } catch (err: unknown) {
        if (!cancelled) {
          console.error("Error loading audit log:", err);
          setError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadInitialLogs();

    return () => {
      cancelled = true;
    };
  }, []);

  const tableOptions = useMemo(() => {
    return Array.from(
      new Set(logs.map((log) => log.table_name))
    ).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return logs.filter((log) => {
      if (action !== "ALL" && log.action !== action) {
        return false;
      }

      if (
        tableFilter !== "ALL" &&
        log.table_name !== tableFilter
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        log.table_name,
        log.record_id || "",
        log.actor_email || "",
        log.actor_user_id || "",
        JSON.stringify(log.changed_fields || {}),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [logs, search, action, tableFilter]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-[#ae884e] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">
            Loading audit log...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#ae884e] uppercase tracking-wider">
            Security & Compliance
          </p>

          <h1 className="text-3xl font-bold text-gray-900 mt-1">
            Audit Log
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Track important database changes made across the OneKey
            platform.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadLogs(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-[#ae884e] hover:text-[#ae884e] transition-colors disabled:opacity-60"
        >
          <RefreshCw
            className={`w-4 h-4 ${
              refreshing ? "animate-spin" : ""
            }`}
          />

          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          icon={<Activity className="w-5 h-5" />}
          label="Visible events"
          value={filteredLogs.length}
        />

        <SummaryCard
          icon={<Database className="w-5 h-5" />}
          label="Tracked tables"
          value={tableOptions.length}
        />

        <SummaryCard
          icon={<ShieldCheck className="w-5 h-5" />}
          label="Audit coverage"
          value="Active"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-900">
          <Filter className="w-4 h-4 text-[#ae884e]" />
          Filters
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search actor, record ID or table..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e]"
            />
          </div>

          <select
            value={action}
            onChange={(event) =>
              setAction(
                event.target.value as (typeof ACTIONS)[number]
              )
            }
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e]"
          >
            {ACTIONS.map((item) => (
              <option key={item} value={item}>
                {item === "ALL"
                  ? "All actions"
                  : formatAction(item as AuditAction)}
              </option>
            ))}
          </select>

          <select
            value={tableFilter}
            onChange={(event) =>
              setTableFilter(event.target.value)
            }
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e]"
          >
            <option value="ALL">All tables</option>

            {tableOptions.map((table) => (
              <option key={table} value={table}>
                {formatTableName(table)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">
              Recent activity
            </h2>

            <p className="text-xs text-gray-500 mt-0.5">
              Showing up to the latest 500 recorded events.
            </p>
          </div>

          <Calendar className="w-5 h-5 text-gray-300" />
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center">
            <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />

            <p className="text-sm font-medium text-gray-700">
              No audit events found.
            </p>

            <p className="text-xs text-gray-400 mt-1">
              Try changing the filters or perform a new admin action.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredLogs.map((log) => {
              const expanded = expandedId === log.id;

              return (
                <div
                  key={log.id}
                  className="p-5 hover:bg-gray-50/60 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(
                        expanded ? null : log.id
                      )
                    }
                    className="w-full text-left"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="shrink-0">
                        <ActionBadge action={log.action} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            {formatAction(log.action)}
                          </span>

                          <span className="text-sm text-gray-500">
                            {formatTableName(log.table_name)}
                          </span>
                        </div>

                        <p className="text-xs text-gray-400 mt-1 truncate">
                          Record: {log.record_id || "N/A"} ·{" "}
                          {summariseChanges(log.changed_fields)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-xs font-medium text-gray-700">
                            {log.actor_email ||
                              "System / public action"}
                          </p>

                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {formatDate(log.created_at)}
                          </p>
                        </div>

                        <ChevronDown
                          className={`w-4 h-4 text-gray-400 transition-transform ${
                            expanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>
                  </button>

                  {expanded && (
                    <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <Detail
                          label="Table"
                          value={log.table_name}
                        />

                        <Detail
                          label="Record ID"
                          value={log.record_id || "N/A"}
                        />

                        <Detail
                          label="Actor"
                          value={
                            log.actor_email ||
                            "System / public action"
                          }
                        />

                        <Detail
                          label="Actor user ID"
                          value={log.actor_user_id || "N/A"}
                        />
                      </div>

                      <div className="mt-4">
                        <p className="text-xs font-semibold text-gray-700 mb-2">
                          Recorded changes
                        </p>

                        <pre className="overflow-auto max-h-80 rounded-lg bg-white border border-gray-200 p-3 text-[11px] leading-5 text-gray-600">
                          {JSON.stringify(
                            log.changed_fields || {},
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-start gap-3 text-xs text-gray-400 px-1">
        <User className="w-4 h-4 shrink-0 mt-0.5" />

        <p>
          Audit records are created by database triggers. Sensitive
          fields such as passwords, document file paths, document
          numbers, share codes, contact details, messages, notes and
          customer preference JSON are intentionally excluded from
          the stored change details.
        </p>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-50 text-[#1c3053] flex items-center justify-center">
          {icon}
        </div>

        <div>
          <p className="text-xs text-gray-500">
            {label}
          </p>

          <p className="text-xl font-bold text-gray-900 mt-0.5">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function ActionBadge({
  action,
}: {
  action: AuditLog["action"];
}) {
  const classes =
    action === "INSERT"
      ? "bg-green-50 text-green-700 border-green-100"
      : action === "UPDATE"
        ? "bg-blue-50 text-blue-700 border-blue-100"
        : "bg-red-50 text-red-700 border-red-100";

  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${classes}`}
    >
      {action}
    </span>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
        {label}
      </p>

      <p className="text-xs text-gray-700 mt-1 break-all">
        {value}
      </p>
    </div>
  );
}
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock3,
  FileCheck2,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type MonthlyActivity = {
  month: string;
  properties: number;
  customers: number;
  viewings: number;
  applications: number;
};

type AnalyticsData = {
  totals: {
    properties: number;
    customers: number;
    viewings: number;
    applications: number;
    documents: number;
    messages: number;
    paidPayments: number;
    paidAmount: number;
  };
  viewingPerformance: {
    completed: number;
    confirmedOrCompleted: number;
    cancelled: number;
    noShow: number;
    pending: number;
  };
  applicationPipeline: {
    approved: number;
    rejected: number;
    active: number;
  };
  rates: {
    viewingCompletion: number;
    viewingCancellation: number;
    applicationApproval: number;
  };
  monthlyActivity: MonthlyActivity[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatMonth(value: string) {
  const date = new Date(`${value}-01T00:00:00`);

  return date.toLocaleDateString("en-GB", {
    month: "short",
    year: "2-digit",
  });
}

function percentage(value: number) {
  return `${Math.round(value)}%`;
}

export default function AdminReportsPage() {
  const supabase = createClient();

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(
    async (refresh = false) => {
      try {
        setError("");

        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const [
          propertiesResult,
          customersResult,
          bookingsResult,
          applicationsResult,
          documentsResult,
          messagesResult,
          paymentsResult,
        ] = await Promise.all([
          supabase
            .from("properties")
            .select("id, created_at"),

          supabase
            .from("customers")
            .select("id, created_at"),

          supabase
            .from("bookings")
            .select(
              "id, status, viewing_date, created_at"
            ),

          supabase
            .from("applications")
            .select(
              "id, status, created_at"
            ),

          supabase
            .from("customer_documents")
            .select("id, status, created_at"),

          supabase
            .from("messages")
            .select("id, created_at"),

          supabase
            .from("customer_payment_records")
            .select(
              "id, status, amount, paid_date, created_at"
            ),
        ]);

        const results = [
          propertiesResult,
          customersResult,
          bookingsResult,
          applicationsResult,
          documentsResult,
          messagesResult,
          paymentsResult,
        ];

        const failed = results.find(
          (result) => result.error
        );

        if (failed?.error) {
          throw failed.error;
        }

        const properties =
          propertiesResult.data || [];
        const customers =
          customersResult.data || [];
        const bookings =
          bookingsResult.data || [];
        const applications =
          applicationsResult.data || [];
        const documents =
          documentsResult.data || [];
        const messages =
          messagesResult.data || [];
        const payments =
          paymentsResult.data || [];

        const completed = bookings.filter(
          (booking: any) =>
            booking.status === "completed"
        ).length;

        const confirmedOrCompleted = bookings.filter(
          (booking: any) =>
            booking.status === "confirmed" ||
            booking.status === "completed"
        ).length;

        const cancelled = bookings.filter(
          (booking: any) =>
            booking.status === "cancelled"
        ).length;

        const noShow = bookings.filter(
          (booking: any) =>
            booking.status === "no_show"
        ).length;

        const pending = bookings.filter(
          (booking: any) =>
            booking.status === "pending"
        ).length;

        const approvedApplications =
          applications.filter(
            (application: any) =>
              application.status === "approved"
          ).length;

        const rejectedApplications =
          applications.filter(
            (application: any) =>
              application.status === "rejected"
          ).length;

        const activeApplications =
          applications.filter(
            (application: any) =>
              ![
                "approved",
                "rejected",
                "withdrawn",
              ].includes(application.status)
          ).length;

        const approvedDocuments =
          documents.filter(
            (document: any) =>
              document.status === "approved"
          ).length;

        const paidPayments =
          payments.filter(
            (payment: any) =>
              payment.status === "paid"
          );

        const paidAmount =
          paidPayments.reduce(
            (sum: number, payment: any) =>
              sum + Number(payment.amount || 0),
            0
          );

        const viewingCompletion =
          bookings.length > 0
            ? (completed / bookings.length) * 100
            : 0;

        const viewingCancellation =
          bookings.length > 0
            ? (cancelled / bookings.length) * 100
            : 0;

        const applicationApproval =
          applications.length > 0
            ? (approvedApplications /
                applications.length) *
              100
            : 0;

        const now = new Date();

        const monthlyActivity: MonthlyActivity[] =
          Array.from({ length: 12 }, (_, index) => {
            const date = new Date(
              now.getFullYear(),
              now.getMonth() - (11 - index),
              1
            );

            const year = date.getFullYear();
            const month = String(
              date.getMonth() + 1
            ).padStart(2, "0");

            const key = `${year}-${month}`;

            const inMonth = (value: string) => {
              if (!value) return false;

              const itemDate = new Date(value);

              return (
                itemDate.getFullYear() === year &&
                itemDate.getMonth() ===
                  date.getMonth()
              );
            };

            return {
              month: key,
              properties: properties.filter(
                (item: any) =>
                  inMonth(item.created_at)
              ).length,
              customers: customers.filter(
                (item: any) =>
                  inMonth(item.created_at)
              ).length,
              viewings: bookings.filter(
                (item: any) =>
                  inMonth(
                    item.viewing_date ||
                      item.created_at
                  )
              ).length,
              applications:
                applications.filter(
                  (item: any) =>
                    inMonth(item.created_at)
                ).length,
            };
          });

        setData({
          totals: {
            properties: properties.length,
            customers: customers.length,
            viewings: bookings.length,
            applications: applications.length,
            documents: approvedDocuments,
            messages: messages.length,
            paidPayments: paidPayments.length,
            paidAmount,
          },
          viewingPerformance: {
            completed,
            confirmedOrCompleted,
            cancelled,
            noShow,
            pending,
          },
          applicationPipeline: {
            approved: approvedApplications,
            rejected: rejectedApplications,
            active: activeApplications,
          },
          rates: {
            viewingCompletion,
            viewingCancellation,
            applicationApproval,
          },
          monthlyActivity,
        });
      } catch (err: any) {
        console.error(
          "Error loading analytics:",
          err
        );

        setError(
          err?.message ||
            "Unable to load analytics."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-[#ae884e] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />

            <div>
              <h1 className="font-semibold text-red-900">
                Analytics unavailable
              </h1>

              <p className="text-sm text-red-700 mt-1">
                {error ||
                  "No analytics data is currently available."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#ae884e] uppercase tracking-wider">
            Business intelligence
          </p>

          <h1 className="text-3xl font-bold text-gray-900 mt-1">
            Analytics & Reports
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Real platform activity across properties,
            customers, viewings, applications and payments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/audit-log"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-[#ae884e] hover:text-[#ae884e] transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            Audit Log
          </Link>

          <button
            type="button"
            onClick={() => loadAnalytics(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1c3053] text-white text-sm font-medium hover:bg-[#162640] transition-colors disabled:opacity-60"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          icon={<Building2 className="w-5 h-5" />}
          label="Properties"
          value={data.totals.properties}
        />

        <MetricCard
          icon={<Users className="w-5 h-5" />}
          label="Customers"
          value={data.totals.customers}
        />

        <MetricCard
          icon={<Clock3 className="w-5 h-5" />}
          label="Viewings"
          value={data.totals.viewings}
        />

        <MetricCard
          icon={<BarChart3 className="w-5 h-5" />}
          label="Applications"
          value={data.totals.applications}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-gray-900">
                Viewing performance
              </h2>

              <p className="text-xs text-gray-500 mt-1">
                Based on recorded viewing statuses.
              </p>
            </div>

            <Activity className="w-5 h-5 text-[#ae884e]" />
          </div>

          <div className="space-y-4">
            <ProgressRow
              label="Completed"
              value={
                data.viewingPerformance.completed
              }
              total={data.totals.viewings}
            />

            <ProgressRow
              label="Confirmed / completed"
              value={
                data.viewingPerformance
                  .confirmedOrCompleted
              }
              total={data.totals.viewings}
            />

            <ProgressRow
              label="Cancelled"
              value={
                data.viewingPerformance.cancelled
              }
              total={data.totals.viewings}
            />

            <ProgressRow
              label="No-show"
              value={
                data.viewingPerformance.noShow
              }
              total={data.totals.viewings}
            />

            <ProgressRow
              label="Pending"
              value={
                data.viewingPerformance.pending
              }
              total={data.totals.viewings}
            />
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-gray-900">
                Application pipeline
              </h2>

              <p className="text-xs text-gray-500 mt-1">
                Current application outcomes.
              </p>
            </div>

            <FileCheck2 className="w-5 h-5 text-[#ae884e]" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <PipelineCard
              label="Active"
              value={
                data.applicationPipeline.active
              }
            />

            <PipelineCard
              label="Approved"
              value={
                data.applicationPipeline.approved
              }
            />

            <PipelineCard
              label="Rejected"
              value={
                data.applicationPipeline.rejected
              }
            />
          </div>

          <div className="mt-6 space-y-4">
            <RateRow
              label="Application approval rate"
              value={
                data.rates.applicationApproval
              }
            />

            <RateRow
              label="Viewing completion rate"
              value={
                data.rates.viewingCompletion
              }
            />

            <RateRow
              label="Viewing cancellation rate"
              value={
                data.rates.viewingCancellation
              }
            />
          </div>
        </section>
      </div>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-gray-900">
              Last 12 months
            </h2>

            <p className="text-xs text-gray-500 mt-1">
              New records created or viewings scheduled
              during each month.
            </p>
          </div>

          <BarChart3 className="w-5 h-5 text-[#ae884e]" />
        </div>

        <div className="space-y-4">
          {data.monthlyActivity.map(
            (month) => {
              const maxValue = Math.max(
                month.properties,
                month.customers,
                month.viewings,
                month.applications,
                1
              );

              return (
                <div
                  key={month.month}
                  className="grid grid-cols-[70px_1fr] gap-4 items-center"
                >
                  <span className="text-xs font-medium text-gray-500">
                    {formatMonth(month.month)}
                  </span>

                  <div className="space-y-1.5">
                    <ActivityBar
                      label="Properties"
                      value={month.properties}
                      max={maxValue}
                    />

                    <ActivityBar
                      label="Customers"
                      value={month.customers}
                      max={maxValue}
                    />

                    <ActivityBar
                      label="Viewings"
                      value={month.viewings}
                      max={maxValue}
                    />

                    <ActivityBar
                      label="Applications"
                      value={month.applications}
                      max={maxValue}
                    />
                  </div>
                </div>
              );
            }
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SmallMetric
          icon={<FileCheck2 className="w-4 h-4" />}
          label="Approved documents"
          value={data.totals.documents}
        />

        <SmallMetric
          icon={<MessageSquare className="w-4 h-4" />}
          label="Messages"
          value={data.totals.messages}
        />

        <SmallMetric
          icon={<CheckCircle2 className="w-4 h-4" />}
          label="Paid payments"
          value={data.totals.paidPayments}
        />

        <SmallMetric
          icon={<Wallet className="w-4 h-4" />}
          label="Paid amount"
          value={formatCurrency(
            data.totals.paidAmount
          )}
        />
      </div>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <ShieldCheck className="w-5 h-5 text-[#ae884e]" />

          <div>
            <h2 className="font-semibold text-gray-900">
              Operational summary
            </h2>

            <p className="text-xs text-gray-500 mt-1">
              Directly calculated from live database records.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryStatus
            icon={<CheckCircle2 className="w-5 h-5" />}
            label="Viewing completion"
            value={percentage(
              data.rates.viewingCompletion
            )}
          />

          <SummaryStatus
            icon={<XCircle className="w-5 h-5" />}
            label="Viewing cancellation"
            value={percentage(
              data.rates.viewingCancellation
            )}
          />

          <SummaryStatus
            icon={<CheckCircle2 className="w-5 h-5" />}
            label="Application approval"
            value={percentage(
              data.rates.applicationApproval
            )}
          />
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
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

          <p className="text-2xl font-bold text-gray-900 mt-0.5">
            {value.toLocaleString("en-GB")}
          </p>
        </div>
      </div>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percentageValue =
    total > 0 ? (value / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-gray-600">
          {label}
        </span>

        <span className="text-xs font-semibold text-gray-900">
          {value}
        </span>
      </div>

      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#ae884e] transition-all"
          style={{
            width: `${Math.min(
              percentageValue,
              100
            )}%`,
          }}
        />
      </div>
    </div>
  );
}

function PipelineCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
      <p className="text-xs text-gray-500">
        {label}
      </p>

      <p className="text-2xl font-bold text-gray-900 mt-1">
        {value}
      </p>
    </div>
  );
}

function RateRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">
        {label}
      </span>

      <span className="text-sm font-bold text-gray-900">
        {percentage(value)}
      </span>
    </div>
  );
}

function ActivityBar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const width =
    max > 0 ? Math.max((value / max) * 100, value > 0 ? 4 : 0) : 0;

  return (
    <div className="flex items-center gap-2">
      <span className="w-24 text-[10px] text-gray-400 shrink-0">
        {label}
      </span>

      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#1c3053]"
          style={{
            width: `${Math.min(width, 100)}%`,
          }}
        />
      </div>

      <span className="w-8 text-right text-[10px] font-medium text-gray-500">
        {value}
      </span>
    </div>
  );
}

function SmallMetric({
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
        <div className="w-9 h-9 rounded-lg bg-gray-50 text-[#ae884e] flex items-center justify-center">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs text-gray-500 truncate">
            {label}
          </p>

          <p className="text-lg font-bold text-gray-900 mt-0.5">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryStatus({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-[#ae884e]">
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
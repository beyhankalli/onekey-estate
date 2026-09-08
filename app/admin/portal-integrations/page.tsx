"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  RefreshCw,
  Save,
  UploadCloud,
} from "lucide-react";

type Portal = "rightmove" | "zoopla" | "onthemarket";

type PublicationStatus =
  | "unpublished"
  | "pending"
  | "published"
  | "error";

type Property = {
  id: string;
  property_ref: string | null;
  title: string | null;
  short_location: string | null;
  status: string | null;
  availability_status: string | null;
};

type Publication = {
  id: string;
  property_id: string;
  portal: Portal;
  status: PublicationStatus;
  external_reference: string | null;
  last_synced_at: string | null;
  last_error: string | null;
  published_at: string | null;
  updated_at: string;
};

const PORTALS: Array<{
  key: Portal;
  name: string;
  description: string;
}> = [
  {
    key: "rightmove",
    name: "Rightmove",
    description: "UK property portal publishing connector",
  },
  {
    key: "zoopla",
    name: "Zoopla",
    description: "UK property portal publishing connector",
  },
  {
    key: "onthemarket",
    name: "OnTheMarket",
    description: "UK property portal publishing connector",
  },
];

const STATUS_OPTIONS: PublicationStatus[] = [
  "unpublished",
  "pending",
  "published",
  "error",
];

function formatDate(value: string | null) {
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

function statusLabel(status: PublicationStatus) {
  switch (status) {
    case "unpublished":
      return "Unpublished";
    case "pending":
      return "Pending";
    case "published":
      return "Published";
    case "error":
      return "Error";
    default:
      return "Unpublished";
  }
}

function statusClasses(status: PublicationStatus) {
  switch (status) {
    case "published":
      return "bg-green-50 text-green-700 border-green-100";

    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-100";

    case "error":
      return "bg-red-50 text-red-700 border-red-100";

    default:
      return "bg-gray-50 text-gray-600 border-gray-100";
  }
}

function portalName(portal: Portal) {
  switch (portal) {
    case "rightmove":
      return "Rightmove";

    case "zoopla":
      return "Zoopla";

    case "onthemarket":
      return "OnTheMarket";

    default:
      return "Portal";
  }
}

export default function PortalIntegrationsPage() {
  const supabase = createClient();

  const [properties, setProperties] = useState<Property[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [savingId, setSavingId] = useState<string | null>(null);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setMessage(null);
    setError(null);

    try {
      const [
        {
          data: propertyData,
          error: propertyError,
        },
        {
          data: publicationData,
          error: publicationError,
        },
      ] = await Promise.all([
        supabase
          .from("properties")
          .select(
            "id, property_ref, title, short_location, status, availability_status"
          )
          .order("created_at", { ascending: false }),

        supabase
          .from("property_portal_publications")
          .select(
            "id, property_id, portal, status, external_reference, last_synced_at, last_error, published_at, updated_at"
          )
          .order("updated_at", { ascending: false }),
      ]);

      if (propertyError) {
        throw propertyError;
      }

      if (publicationError) {
        throw publicationError;
      }

      setProperties((propertyData || []) as Property[]);
      setPublications((publicationData || []) as Publication[]);
    } catch (err) {
      console.error(
        "Failed to load portal publishing data:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load portal publishing data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const publicationMap = useMemo(() => {
    const map = new Map<string, Publication>();

    for (const publication of publications) {
      map.set(
        `${publication.property_id}:${publication.portal}`,
        publication
      );
    }

    return map;
  }, [publications]);

  const counts = useMemo(() => {
    return {
      total: publications.length,

      published: publications.filter(
        (item) => item.status === "published"
      ).length,

      pending: publications.filter(
        (item) => item.status === "pending"
      ).length,

      errors: publications.filter(
        (item) => item.status === "error"
      ).length,
    };
  }, [publications]);

  const updatePublication = async (
    propertyId: string,
    portal: Portal,
    patch: Partial<Publication>
  ) => {
    const key = `${propertyId}:${portal}`;
    const existing = publicationMap.get(key);

    setSavingId(key);
    setMessage(null);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          "Your admin session has expired."
        );
      }

      const nextStatus: PublicationStatus =
        patch.status ||
        existing?.status ||
        "unpublished";

      const nextExternalReference =
        typeof patch.external_reference === "string"
          ? patch.external_reference.trim() || null
          : existing?.external_reference || null;

      const nextLastError =
        typeof patch.last_error === "string"
          ? patch.last_error.trim() || null
          : existing?.last_error || null;

      const payload = {
        property_id: propertyId,
        portal,
        status: nextStatus,

        external_reference:
          nextExternalReference,

        last_error:
          nextStatus === "error"
            ? nextLastError || "Manual error state"
            : null,

        published_at:
          nextStatus === "published"
            ? existing?.published_at ||
              new Date().toISOString()
            : null,

        updated_by: user.id,
      };

      let data: Publication | null = null;

      if (existing) {
        const result = await supabase
          .from("property_portal_publications")
          .update(payload)
          .eq("id", existing.id)
          .select(
            "id, property_id, portal, status, external_reference, last_synced_at, last_error, published_at, updated_at"
          )
          .single();

        if (result.error) {
          throw result.error;
        }

        data = result.data as Publication;
      } else {
        const result = await supabase
          .from("property_portal_publications")
          .insert(payload)
          .select(
            "id, property_id, portal, status, external_reference, last_synced_at, last_error, published_at, updated_at"
          )
          .single();

        if (result.error) {
          throw result.error;
        }

        data = result.data as Publication;
      }

      if (!data) {
        throw new Error(
          "The portal publishing record was not returned."
        );
      }

      setPublications((current) => {
        const withoutCurrent = current.filter(
          (item) => item.id !== data!.id
        );

        return [data!, ...withoutCurrent];
      });

      setMessage(
        `${portalName(
          portal
        )} publishing record updated.`
      );
    } catch (err) {
      console.error(
        "Failed to update portal publication:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update portal publishing record."
      );
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <RefreshCw className="w-5 h-5 animate-spin" />

          <span className="text-sm font-medium">
            Loading portal publishing...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#ae884e] mb-2">
            <ExternalLink className="w-4 h-4" />

            External Portals
          </div>

          <h1 className="text-3xl font-semibold text-gray-900">
            Portal Publishing
          </h1>

          <p className="text-gray-500 font-light mt-1 max-w-2xl">
            Manage the OneKey publishing state for
            Rightmove, Zoopla and OnTheMarket.
            External API connections are not active yet.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium text-sm hover:bg-gray-50 disabled:opacity-60 transition-colors"
        >
          <RefreshCw
            className={`w-4 h-4 ${
              refreshing ? "animate-spin" : ""
            }`}
          />

          Refresh
        </button>
      </div>

      {/* INTEGRATION STATUS */}
      <div className="bg-[#1c3053] rounded-2xl p-6 text-white mb-8 shadow-lg">
        <div className="flex items-start gap-3">
          <UploadCloud className="w-6 h-6 text-[#d5b37b] mt-0.5 shrink-0" />

          <div>
            <h2 className="font-semibold">
              Integration-ready mode
            </h2>

            <p className="text-sm text-white/70 mt-1 max-w-3xl leading-6">
              These records are the internal source of
              truth for future portal connectors. No
              Rightmove, Zoopla or OnTheMarket API request
              is being made and no portal credentials are
              stored here. A future connector can use the
              property ID, publication status, external
              reference, sync timestamp and error fields.
            </p>
          </div>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Portal records",
            value: counts.total,
            icon: ExternalLink,
          },
          {
            label: "Published",
            value: counts.published,
            icon: CheckCircle2,
          },
          {
            label: "Pending",
            value: counts.pending,
            icon: Clock3,
          },
          {
            label: "Errors",
            value: counts.errors,
            icon: AlertCircle,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                  {item.label}
                </p>

                <Icon className="w-4 h-4 text-[#ae884e]" />
              </div>

              <p className="text-2xl font-semibold text-gray-900 mt-2">
                {item.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* SUCCESS MESSAGE */}
      {message && (
        <div className="mb-6 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />

          <span>{error}</span>
        </div>
      )}

      {/* PROPERTIES */}
      <div className="space-y-6">
        {properties.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500">
            No properties are currently available.
          </div>
        ) : (
          properties.map((property) => (
            <section
              key={property.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              {/* PROPERTY HEADER */}
              <div className="px-6 py-5 border-b border-gray-100 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-gray-900">
                      {property.title ||
                        "Untitled property"}
                    </h2>

                    {property.property_ref && (
                      <span className="text-xs text-gray-400">
                        Ref: {property.property_ref}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-500 mt-1">
                    {property.short_location ||
                      "Location unavailable"}
                  </p>
                </div>

                <div className="text-xs text-gray-500">
                  Website status:{" "}
                  <span className="font-semibold text-gray-700">
                    {property.status ||
                      property.availability_status ||
                      "—"}
                  </span>
                </div>
              </div>

              {/* PORTAL ROWS */}
              <div className="divide-y divide-gray-100">
                {PORTALS.map((portal) => {
                  const key = `${property.id}:${portal.key}`;

                  const publication =
                    publicationMap.get(key);

                  const currentStatus: PublicationStatus =
                    publication?.status ||
                    "unpublished";

                  const saving = savingId === key;

                  return (
                    <div
                      key={portal.key}
                      className="p-6"
                    >
                      <div className="grid grid-cols-1 xl:grid-cols-[1fr_180px_220px_190px] gap-5 xl:items-center">
                        {/* PORTAL */}
                        <div>
                          <div className="flex items-center gap-3">
                            <p className="font-semibold text-gray-900">
                              {portal.name}
                            </p>

                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${statusClasses(
                                currentStatus
                              )}`}
                            >
                              {statusLabel(
                                currentStatus
                              )}
                            </span>
                          </div>

                          <p className="text-xs text-gray-500 mt-1">
                            {portal.description}
                          </p>

                          {publication?.last_error && (
                            <div className="mt-3 flex items-start gap-2 text-xs text-red-600">
                              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />

                              <span>
                                {publication.last_error}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* STATUS */}
                        <div>
                          <label
                            htmlFor={`${key}-status`}
                            className="block text-xs font-semibold text-gray-500 mb-1.5"
                          >
                            Status
                          </label>

                          <select
                            id={`${key}-status`}
                            value={currentStatus}
                            disabled={saving}
                            onChange={(event) => {
                              const nextStatus =
                                event.target
                                  .value as PublicationStatus;

                              updatePublication(
                                property.id,
                                portal.key,
                                {
                                  status: nextStatus,

                                  last_error:
                                    nextStatus ===
                                    "error"
                                      ? publication?.last_error ||
                                        "Manual error state"
                                      : null,
                                }
                              );
                            }}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#ae884e] disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {STATUS_OPTIONS.map(
                              (status) => (
                                <option
                                  key={status}
                                  value={status}
                                >
                                  {statusLabel(status)}
                                </option>
                              )
                            )}
                          </select>
                        </div>

                        {/* EXTERNAL REFERENCE */}
                        <div>
                          <label
                            htmlFor={`${key}-reference`}
                            className="block text-xs font-semibold text-gray-500 mb-1.5"
                          >
                            External reference
                          </label>

                          <input
                            id={`${key}-reference`}
                            defaultValue={
                              publication?.external_reference ||
                              ""
                            }
                            key={`${key}:${
                              publication?.updated_at ||
                              "new"
                            }`}
                            disabled={saving}
                            onBlur={(event) => {
                              const value =
                                event.target.value.trim();

                              const previousValue =
                                publication?.external_reference ||
                                "";

                              if (
                                value !== previousValue
                              ) {
                                updatePublication(
                                  property.id,
                                  portal.key,
                                  {
                                    external_reference:
                                      value,
                                  }
                                );
                              }
                            }}
                            placeholder="Assigned by future portal API"
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#ae884e] placeholder:text-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
                          />
                        </div>

                        {/* SYNC INFORMATION */}
                        <div className="text-xs text-gray-500 space-y-1.5">
                          <p>
                            Last sync:{" "}
                            <span className="font-medium text-gray-700">
                              {formatDate(
                                publication?.last_synced_at ||
                                  null
                              )}
                            </span>
                          </p>

                          <p>
                            Published:{" "}
                            <span className="font-medium text-gray-700">
                              {formatDate(
                                publication?.published_at ||
                                  null
                              )}
                            </span>
                          </p>

                          {saving && (
                            <p className="inline-flex items-center gap-1.5 text-[#ae884e] font-medium">
                              <Save className="w-3.5 h-3.5" />

                              Saving…
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bath,
  Bed,
  Check,
  ChevronRight,
  Home,
  MapPin,
  PawPrint,
  ParkingSquare,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCompare } from "@/context/CompareContext";

type Property = {
  id: string;
  property_ref?: string | null;
  title?: string | null;
  full_address?: string | null;
  short_location?: string | null;
  monthly_rent?: number | null;
  weekly_rent?: number | null;
  deposit?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  bills_included?: boolean | null;
  dss_lha_covers_rent?: boolean | null;
  broadband_info?: string | null;
  available_from?: string | null;
  preferred_min_tenancy?: string | null;
  online_viewings?: boolean | null;
  student_friendly?: boolean | null;
  families_allowed?: boolean | null;
  pets_allowed?: boolean | null;
  smokers_allowed?: boolean | null;
  garden?: boolean | null;
  parking?: boolean | null;
  fireplace?: boolean | null;
  furnishing_status?: string | null;
  epc_rating?: string | null;
  availability_status?: string | null;
  property_images?: {
    url: string | null;
    image_type: string | null;
    display_order?: number | null;
  }[];
};

function formatPrice(value?: number | null) {
  if (value === null || value === undefined) return "—";

  return `£${value.toLocaleString("en-GB")}`;
}

function BooleanValue({
  value,
}: {
  value?: boolean | null;
}) {
  if (value === true) {
    return (
      <span className="inline-flex items-center gap-1.5 text-green-600 font-medium">
        <Check className="w-4 h-4" />
        Yes
      </span>
    );
  }

  if (value === false) {
    return (
      <span className="inline-flex items-center gap-1.5 text-gray-400">
        <X className="w-4 h-4" />
        No
      </span>
    );
  }

  return <span className="text-gray-400">—</span>;
}

export default function ComparePage() {
  const { compareIds, removeFromCompare, clearCompare } = useCompare();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProperties() {
      if (compareIds.length === 0) {
        setProperties([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const supabase = createClient();

      const { data, error } = await supabase
        .from("properties")
        .select(
          `
            id,
            property_ref,
            title,
            full_address,
            short_location,
            monthly_rent,
            weekly_rent,
            deposit,
            bedrooms,
            bathrooms,
            bills_included,
            dss_lha_covers_rent,
            broadband_info,
            available_from,
            preferred_min_tenancy,
            online_viewings,
            student_friendly,
            families_allowed,
            pets_allowed,
            smokers_allowed,
            garden,
            parking,
            fireplace,
            furnishing_status,
            epc_rating,
            availability_status,
            property_images(
              url,
              image_type,
              display_order
            )
          `
        )
        .in("id", compareIds);

      if (error) {
        console.error("Failed to load comparison properties:", error);
        setProperties([]);
        setLoading(false);
        return;
      }

      const fetched = (data as Property[]) || [];

      const ordered = compareIds
        .map((id) => fetched.find((property) => property.id === id))
        .filter((property): property is Property => Boolean(property));

      setProperties(ordered);
      setLoading(false);
    }

    fetchProperties();
  }, [compareIds]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 w-56 bg-gray-200 rounded-lg" />
            <div className="h-4 w-80 bg-gray-100 rounded mt-3" />

            <div className="mt-10 bg-white rounded-[2rem] border border-gray-100 p-8">
              <div className="h-12 bg-gray-100 rounded-xl" />
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="space-y-4">
                    <div className="h-56 bg-gray-100 rounded-2xl" />
                    <div className="h-6 bg-gray-100 rounded" />
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/listings"
            className="inline-flex items-center text-[#1c3053] hover:text-[#ae884e] font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Properties
          </Link>

          <div className="mt-10 bg-white rounded-[2rem] border border-gray-100 shadow-sm p-12 md:p-16 text-center">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gray-50 flex items-center justify-center mb-6">
              <Home className="w-10 h-10 text-gray-300" />
            </div>

            <h1 className="text-3xl font-semibold text-gray-900">
              Compare Properties
            </h1>

            <p className="text-gray-500 mt-3 max-w-md mx-auto">
              Add up to three properties to compare their prices, features
              and key details side by side.
            </p>

            <Link
              href="/listings"
              className="inline-flex items-center gap-2 mt-8 px-6 py-3.5 rounded-xl bg-[#1c3053] text-white font-medium hover:bg-[#ae884e] transition-all"
            >
              Browse Properties
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
          <div>
            <Link
              href="/listings"
              className="inline-flex items-center text-sm text-gray-500 hover:text-[#ae884e] mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Properties
            </Link>

            <p className="text-sm font-medium text-[#ae884e]">
              OneKey Estate Agency
            </p>

            <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 mt-1">
              Compare Properties
            </h1>

            <p className="text-gray-500 mt-2">
              Compare up to three properties side by side.
            </p>
          </div>

          <button
            onClick={clearCompare}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:text-red-600 hover:border-red-200 transition-all text-sm font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            Clear Comparison
          </button>
        </div>

        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <div
              className="min-w-[900px]"
              style={{
                gridTemplateColumns: `220px repeat(${properties.length}, minmax(280px, 1fr))`,
              }}
            >
              {/* Property headers */}
              <div
                className="grid border-b border-gray-100"
                style={{
                  gridTemplateColumns: `220px repeat(${properties.length}, minmax(280px, 1fr))`,
                }}
              >
                <div className="p-6 bg-gray-50 flex items-end">
                  <span className="text-sm font-semibold text-gray-500">
                    Property
                  </span>
                </div>

                {properties.map((property) => {
                  const image =
                    property.property_images?.find(
                      (item) => item.image_type === "exterior"
                    )?.url ||
                    property.property_images?.find(
                      (item) => item.image_type === "interior"
                    )?.url ||
                    property.property_images?.[0]?.url ||
                    null;

                  return (
                    <div
                      key={property.id}
                      className="p-5 border-l border-gray-100 relative"
                    >
                      <button
                        onClick={() => removeFromCompare(property.id)}
                        aria-label={`Remove ${property.title || "property"} from comparison`}
                        className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/95 shadow-md flex items-center justify-center text-gray-500 hover:text-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <Link href={`/listings/${property.id}`}>
                        <div className="h-48 rounded-2xl overflow-hidden bg-gray-100 mb-4">
                          {image ? (
                            <img
                              src={image}
                              alt={property.title || "Property"}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Home className="w-10 h-10 text-gray-300" />
                            </div>
                          )}
                        </div>

                        <div className="pr-6">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                              property.availability_status === "Available"
                                ? "bg-green-50 text-green-700"
                                : "bg-orange-50 text-orange-700"
                            }`}
                          >
                            {property.availability_status || "Contact Agent"}
                          </span>

                          <h2 className="text-lg font-semibold text-gray-900 mt-3 line-clamp-2">
                            {property.title || "Property"}
                          </h2>

                          <div className="flex items-start gap-1.5 mt-2 text-sm text-gray-500">
                            <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[#ae884e]" />
                            <span>
                              {property.short_location ||
                                property.full_address ||
                                "Location unavailable"}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>

              {/* Price */}
              <ComparisonRow label="Monthly Rent" properties={properties}>
                {(property) => (
                  <span className="text-xl font-semibold text-[#ae884e]">
                    {formatPrice(property.monthly_rent)}
                    <span className="text-sm text-gray-400 font-normal">
                      {" "}
                      pcm
                    </span>
                  </span>
                )}
              </ComparisonRow>

              <ComparisonRow label="Weekly Rent" properties={properties}>
                {(property) => (
                  <span className="font-medium text-gray-900">
                    {formatPrice(property.weekly_rent)}
                  </span>
                )}
              </ComparisonRow>

              <ComparisonRow label="Deposit" properties={properties}>
                {(property) => (
                  <span className="font-medium text-gray-900">
                    {formatPrice(property.deposit)}
                  </span>
                )}
              </ComparisonRow>

              <ComparisonRow label="Bedrooms" properties={properties}>
                {(property) => (
                  <span className="inline-flex items-center gap-2 font-medium text-gray-900">
                    <Bed className="w-4 h-4 text-[#ae884e]" />
                    {property.bedrooms ?? "—"}
                  </span>
                )}
              </ComparisonRow>

              <ComparisonRow label="Bathrooms" properties={properties}>
                {(property) => (
                  <span className="inline-flex items-center gap-2 font-medium text-gray-900">
                    <Bath className="w-4 h-4 text-[#ae884e]" />
                    {property.bathrooms ?? "—"}
                  </span>
                )}
              </ComparisonRow>

              <ComparisonRow label="Available From" properties={properties}>
                {(property) => (
                  <span>{property.available_from || "—"}</span>
                )}
              </ComparisonRow>

              <ComparisonRow label="Minimum Tenancy" properties={properties}>
                {(property) => (
                  <span>{property.preferred_min_tenancy || "—"}</span>
                )}
              </ComparisonRow>

              <ComparisonRow label="Furnishing" properties={properties}>
                {(property) => (
                  <span>{property.furnishing_status || "—"}</span>
                )}
              </ComparisonRow>

              <ComparisonRow label="EPC Rating" properties={properties}>
                {(property) => (
                  <span>{property.epc_rating || "—"}</span>
                )}
              </ComparisonRow>

              <ComparisonRow label="Bills Included" properties={properties}>
                {(property) => (
                  <BooleanValue value={property.bills_included} />
                )}
              </ComparisonRow>

              <ComparisonRow
                label="DSS / LHA Considered"
                properties={properties}
              >
                {(property) => (
                  <BooleanValue value={property.dss_lha_covers_rent} />
                )}
              </ComparisonRow>

              <ComparisonRow label="Students" properties={properties}>
                {(property) => (
                  <BooleanValue value={property.student_friendly} />
                )}
              </ComparisonRow>

              <ComparisonRow label="Families" properties={properties}>
                {(property) => (
                  <BooleanValue value={property.families_allowed} />
                )}
              </ComparisonRow>

              <ComparisonRow label="Pets" properties={properties}>
                {(property) => (
                  <span className="inline-flex items-center gap-2">
                    <PawPrint
                      className={`w-4 h-4 ${
                        property.pets_allowed
                          ? "text-[#ae884e]"
                          : "text-gray-300"
                      }`}
                    />
                    <BooleanValue value={property.pets_allowed} />
                  </span>
                )}
              </ComparisonRow>

              <ComparisonRow label="Smokers" properties={properties}>
                {(property) => (
                  <BooleanValue value={property.smokers_allowed} />
                )}
              </ComparisonRow>

              <ComparisonRow label="Garden" properties={properties}>
                {(property) => (
                  <BooleanValue value={property.garden} />
                )}
              </ComparisonRow>

              <ComparisonRow label="Parking" properties={properties}>
                {(property) => (
                  <span className="inline-flex items-center gap-2">
                    <ParkingSquare
                      className={`w-4 h-4 ${
                        property.parking
                          ? "text-[#ae884e]"
                          : "text-gray-300"
                      }`}
                    />
                    <BooleanValue value={property.parking} />
                  </span>
                )}
              </ComparisonRow>

              <ComparisonRow label="Fireplace" properties={properties}>
                {(property) => (
                  <BooleanValue value={property.fireplace} />
                )}
              </ComparisonRow>

              <ComparisonRow label="Online Viewings" properties={properties}>
                {(property) => (
                  <BooleanValue value={property.online_viewings} />
                )}
              </ComparisonRow>

              <ComparisonRow label="Broadband" properties={properties}>
                {(property) => (
                  <span>{property.broadband_info || "Ask Agent"}</span>
                )}
              </ComparisonRow>

              {/* CTA */}
              <div
                className="grid border-t border-gray-100"
                style={{
                  gridTemplateColumns: `220px repeat(${properties.length}, minmax(280px, 1fr))`,
                }}
              >
                <div className="p-6 bg-gray-50" />

                {properties.map((property) => (
                  <div
                    key={property.id}
                    className="p-6 border-l border-gray-100"
                  >
                    <Link
                      href={`/listings/${property.id}`}
                      className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#1c3053] text-white font-medium hover:bg-[#ae884e] transition-all"
                    >
                      View Property
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 text-sm text-gray-400">
          <Trash2 className="w-4 h-4" />
          Remove a property from the comparison using the × button.
        </div>
      </div>
    </div>
  );
}

function ComparisonRow({
  label,
  properties,
  children,
}: {
  label: string;
  properties: Property[];
  children: (property: Property) => React.ReactNode;
}) {
  return (
    <div
      className="grid border-b border-gray-100"
      style={{
        gridTemplateColumns: `220px repeat(${properties.length}, minmax(280px, 1fr))`,
      }}
    >
      <div className="p-5 bg-gray-50 flex items-center">
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>

      {properties.map((property) => (
        <div
          key={property.id}
          className="p-5 border-l border-gray-100 text-sm text-gray-700 flex items-center min-h-[64px]"
        >
          {children(property)}
        </div>
      ))}
    </div>
  );
}
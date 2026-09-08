"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Bed,
  Bath,
  Search,
  SlidersHorizontal,
  X,
  Heart,
  Home as HomeIcon,
  ChevronDown,
  RotateCcw,
  PawPrint,
  TreePine,
  Car,
  GraduationCap,
  Users,
  BadgeCheck,
  ArrowUpDown,
  Bookmark,
  Trash2,
  Check,
  Scale,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useWishlist } from "@/context/WishlistContext";
import { useCompare } from "@/context/CompareContext";

type PropertyImage = {
  url: string | null;
  image_type: string | null;
  display_order: number | null;
};

type Property = {
  id: string;
  title: string | null;
  property_ref: string | null;
  short_location: string | null;
  full_address: string | null;
  postcode: string | null;
  monthly_rent: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  availability_status: string | null;
  pets_allowed?: boolean | null;
  garden?: boolean | null;
  parking?: boolean | null;
  student_friendly?: boolean | null;
  families_allowed?: boolean | null;
  dss_lha_covers_rent?: boolean | null;
  created_at: string | null;
  property_images?: PropertyImage[];
};

type SortOrder =
  | "newest"
  | "price-asc"
  | "price-desc"
  | "beds-desc"
  | "beds-asc";

type SavedSearch = {
  id: string;
  name: string;
  createdAt: string;
  filters: SearchFilters;
};

type SearchFilters = {
  searchTerm: string;
  sortOrder: SortOrder;
  minPrice: number | "";
  maxPrice: number | "";
  minBeds: number | "";
  maxBeds: number | "";
  minBaths: number | "";
  availableOnly: boolean;
  petsAllowed: boolean;
  garden: boolean;
  parking: boolean;
  studentFriendly: boolean;
  familiesAllowed: boolean;
  dssAllowed: boolean;
};

const SAVED_SEARCHES_KEY = "onekey_saved_searches";
const MAX_SAVED_SEARCHES = 10;

export default function PublicListingsPage() {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { compareIds, toggleCompare, canAddMore } = useCompare();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSavedSearchOpen, setIsSavedSearchOpen] = useState(false);
  const [isSavedSearchesOpen, setIsSavedSearchesOpen] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState("");
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [saveMessage, setSaveMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [minBeds, setMinBeds] = useState<number | "">("");
  const [maxBeds, setMaxBeds] = useState<number | "">("");
  const [minBaths, setMinBaths] = useState<number | "">("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [garden, setGarden] = useState(false);
  const [parking, setParking] = useState(false);
  const [studentFriendly, setStudentFriendly] = useState(false);
  const [familiesAllowed, setFamiliesAllowed] = useState(false);
  const [dssAllowed, setDssAllowed] = useState(false);

  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        setError("");

        const supabase = createClient();

        const { data, error: queryError } = await supabase
          .from("properties")
          .select(
            `
              id,
              title,
              property_ref,
              short_location,
              full_address,
              postcode,
              monthly_rent,
              bedrooms,
              bathrooms,
              availability_status,
              pets_allowed,
              garden,
              parking,
              student_friendly,
              families_allowed,
              dss_lha_covers_rent,
              created_at,
              property_images(
                url,
                image_type,
                display_order
              )
            `
          )
          .order("created_at", { ascending: false });

        if (queryError) throw queryError;

        setProperties((data as Property[]) || []);
      } catch (err: any) {
        console.error("Error fetching properties:", err);
        setError(err?.message || "Unable to load properties.");
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SAVED_SEARCHES_KEY);

      if (stored) {
        const parsed = JSON.parse(stored);

        if (Array.isArray(parsed)) {
          setSavedSearches(parsed.slice(0, MAX_SAVED_SEARCHES));
        }
      }
    } catch (err) {
      console.error("Failed to load saved searches:", err);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        SAVED_SEARCHES_KEY,
        JSON.stringify(savedSearches)
      );
    } catch (err) {
      console.error("Failed to save searches:", err);
    }
  }, [savedSearches]);

  const filteredProperties = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const result = properties.filter((property) => {
      const searchableText = [
        property.title,
        property.property_ref,
        property.short_location,
        property.full_address,
        property.postcode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (query && !searchableText.includes(query)) {
        return false;
      }

      if (
        minPrice !== "" &&
        (property.monthly_rent === null ||
          property.monthly_rent < Number(minPrice))
      ) {
        return false;
      }

      if (
        maxPrice !== "" &&
        (property.monthly_rent === null ||
          property.monthly_rent > Number(maxPrice))
      ) {
        return false;
      }

      if (
        minBeds !== "" &&
        (property.bedrooms === null ||
          property.bedrooms < Number(minBeds))
      ) {
        return false;
      }

      if (
        maxBeds !== "" &&
        (property.bedrooms === null ||
          property.bedrooms > Number(maxBeds))
      ) {
        return false;
      }

      if (
        minBaths !== "" &&
        (property.bathrooms === null ||
          property.bathrooms < Number(minBaths))
      ) {
        return false;
      }

      if (
        availableOnly &&
        property.availability_status?.toLowerCase() !== "available"
      ) {
        return false;
      }

      if (petsAllowed && !property.pets_allowed) return false;
      if (garden && !property.garden) return false;
      if (parking && !property.parking) return false;
      if (studentFriendly && !property.student_friendly) return false;
      if (familiesAllowed && !property.families_allowed) return false;
      if (dssAllowed && !property.dss_lha_covers_rent) return false;

      return true;
    });

    return [...result].sort((a, b) => {
      if (sortOrder === "price-asc") {
        return (a.monthly_rent ?? Infinity) - (b.monthly_rent ?? Infinity);
      }

      if (sortOrder === "price-desc") {
        return (b.monthly_rent ?? -Infinity) - (a.monthly_rent ?? -Infinity);
      }

      if (sortOrder === "beds-desc") {
        return (b.bedrooms ?? -Infinity) - (a.bedrooms ?? -Infinity);
      }

      if (sortOrder === "beds-asc") {
        return (a.bedrooms ?? Infinity) - (b.bedrooms ?? Infinity);
      }

      return (
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
      );
    });
  }, [
    properties,
    searchTerm,
    sortOrder,
    minPrice,
    maxPrice,
    minBeds,
    maxBeds,
    minBaths,
    availableOnly,
    petsAllowed,
    garden,
    parking,
    studentFriendly,
    familiesAllowed,
    dssAllowed,
  ]);

  const activeFilterCount = [
    minPrice !== "",
    maxPrice !== "",
    minBeds !== "",
    maxBeds !== "",
    minBaths !== "",
    availableOnly,
    petsAllowed,
    garden,
    parking,
    studentFriendly,
    familiesAllowed,
    dssAllowed,
  ].filter(Boolean).length;

  const hasAnyFilter =
    Boolean(searchTerm.trim()) || activeFilterCount > 0;

  const clearFilters = () => {
    setSearchTerm("");
    setSortOrder("newest");
    setMinPrice("");
    setMaxPrice("");
    setMinBeds("");
    setMaxBeds("");
    setMinBaths("");
    setAvailableOnly(false);
    setPetsAllowed(false);
    setGarden(false);
    setParking(false);
    setStudentFriendly(false);
    setFamiliesAllowed(false);
    setDssAllowed(false);
  };

  const getCurrentFilters = (): SearchFilters => ({
    searchTerm,
    sortOrder,
    minPrice,
    maxPrice,
    minBeds,
    maxBeds,
    minBaths,
    availableOnly,
    petsAllowed,
    garden,
    parking,
    studentFriendly,
    familiesAllowed,
    dssAllowed,
  });

  const applyFilters = (filters: SearchFilters) => {
    setSearchTerm(filters.searchTerm);
    setSortOrder(filters.sortOrder);
    setMinPrice(filters.minPrice);
    setMaxPrice(filters.maxPrice);
    setMinBeds(filters.minBeds);
    setMaxBeds(filters.maxBeds);
    setMinBaths(filters.minBaths);
    setAvailableOnly(filters.availableOnly);
    setPetsAllowed(filters.petsAllowed);
    setGarden(filters.garden);
    setParking(filters.parking);
    setStudentFriendly(filters.studentFriendly);
    setFamiliesAllowed(filters.familiesAllowed);
    setDssAllowed(filters.dssAllowed);
    setIsSavedSearchesOpen(false);
    setSaveMessage("Saved search applied.");
  };

  const saveCurrentSearch = () => {
    const name = saveSearchName.trim();

    if (!name) {
      setSaveMessage("Please enter a name for this search.");
      return;
    }

    if (savedSearches.length >= MAX_SAVED_SEARCHES) {
      setSaveMessage(`You can save up to ${MAX_SAVED_SEARCHES} searches.`);
      return;
    }

    const newSearch: SavedSearch = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      filters: getCurrentFilters(),
    };

    setSavedSearches((current) => [newSearch, ...current]);
    setSaveSearchName("");
    setIsSavedSearchOpen(false);
    setSaveMessage("Search saved successfully.");
  };

  const deleteSavedSearch = (id: string) => {
    setSavedSearches((current) =>
      current.filter((search) => search.id !== id)
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
          <div className="h-10 w-64 bg-gray-200 rounded-xl mb-4" />
          <div className="h-5 w-96 max-w-full bg-gray-200 rounded-lg mb-10" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
              >
                <div className="h-56 bg-gray-200" />
                <div className="p-6 space-y-4">
                  <div className="h-6 w-3/4 bg-gray-200 rounded" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded" />
                  <div className="h-8 w-1/3 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-sm font-medium text-[#ae884e] mb-2">
            OneKey Estate Agency
          </p>

          <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 tracking-tight">
            Find Your Next Home
          </h1>

          <p className="text-gray-500 font-light mt-3 max-w-2xl">
            Browse our available properties and compare the homes that best
            match your requirements.
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />

              <input
                type="text"
                placeholder="Search by location, postcode, property name or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 text-gray-900 bg-gray-50/50 outline-none focus:border-[#ae884e] focus:ring-1 focus:ring-[#ae884e]/20 transition-all"
              />
            </div>

            <button
              onClick={() => setIsFilterOpen(true)}
              className="relative flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#1c3053] text-white font-medium hover:bg-[#ae884e] transition-all"
            >
              <SlidersHorizontal className="w-5 h-5" />
              Filters

              {activeFilterCount > 0 && (
                <span className="min-w-6 h-6 px-1.5 rounded-full bg-[#ae884e] text-white text-xs flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsSavedSearchOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:border-[#ae884e] hover:text-[#ae884e] transition-all"
            >
              <Bookmark className="w-5 h-5" />
              Save Search
            </button>

            <button
              onClick={() => setIsSavedSearchesOpen(true)}
              className="relative flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:border-[#ae884e] hover:text-[#ae884e] transition-all"
            >
              <Bookmark className="w-5 h-5" />
              Saved Searches

              {savedSearches.length > 0 && (
                <span className="min-w-6 h-6 px-1.5 rounded-full bg-[#1c3053] text-white text-xs flex items-center justify-center">
                  {savedSearches.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {saveMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 flex items-center gap-2 bg-white border border-green-100 text-green-700 rounded-xl px-4 py-3 text-sm shadow-sm"
            >
              <Check className="w-4 h-4 shrink-0" />
              {saveMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {hasAnyFilter && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-500 mr-1">
              Active:
            </span>

            {searchTerm.trim() && (
              <button
                onClick={() => setSearchTerm("")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm text-gray-700 hover:border-[#ae884e] transition-colors"
              >
                Search: {searchTerm}
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {minPrice !== "" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm text-gray-700">
                Min £{minPrice.toLocaleString()}
              </span>
            )}

            {maxPrice !== "" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm text-gray-700">
                Max £{maxPrice.toLocaleString()}
              </span>
            )}

            {minBeds !== "" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm text-gray-700">
                {minBeds}+ beds
              </span>
            )}

            {maxBeds !== "" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm text-gray-700">
                Up to {maxBeds} beds
              </span>
            )}

            {minBaths !== "" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm text-gray-700">
                {minBaths}+ baths
              </span>
            )}

            {petsAllowed && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm text-gray-700">
                Pets
              </span>
            )}

            {garden && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm text-gray-700">
                Garden
              </span>
            )}

            {parking && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm text-gray-700">
                Parking
              </span>
            )}

            {studentFriendly && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm text-gray-700">
                Students
              </span>
            )}

            {familiesAllowed && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm text-gray-700">
                Families
              </span>
            )}

            {dssAllowed && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm text-gray-700">
                DSS / LHA
              </span>
            )}

            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#ae884e] hover:text-[#8f6e3c]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear all
            </button>
          </div>
        )}

        <div className="mb-6 flex items-center justify-between gap-4">
          <p className="text-sm text-gray-500 font-medium">
            Showing{" "}
            <span className="text-gray-900">
              {filteredProperties.length}
            </span>{" "}
            of{" "}
            <span className="text-gray-900">{properties.length}</span>{" "}
            properties
          </p>

          <button
            onClick={() => setIsFilterOpen(true)}
            className="hidden sm:inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#ae884e] transition-colors"
          >
            <ArrowUpDown className="w-4 h-4" />
            {sortOrder === "newest"
              ? "Newest"
              : sortOrder === "price-asc"
              ? "Lowest price"
              : sortOrder === "price-desc"
              ? "Highest price"
              : sortOrder === "beds-desc"
              ? "Most bedrooms"
              : "Fewest bedrooms"}
          </button>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-100 text-red-700 rounded-2xl px-5 py-4 text-sm">
            {error}
          </div>
        )}

        {filteredProperties.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 md:p-16 text-center shadow-sm flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center mb-6">
              <HomeIcon className="w-10 h-10 text-gray-300" />
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              No properties found
            </h2>

            <p className="text-gray-500 font-light max-w-md mb-7">
              We couldn&apos;t find any properties matching your current
              search criteria. Try adjusting your filters.
            </p>

            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1c3053] text-white font-medium hover:bg-[#ae884e] transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map((property) => {
              const thumbnail =
                [...(property.property_images || [])]
                  .sort(
                    (a, b) =>
                      (a.display_order ?? Number.MAX_SAFE_INTEGER) -
                      (b.display_order ?? Number.MAX_SAFE_INTEGER)
                  )[0]?.url ||
                property.property_images?.find(
                  (img) => img.image_type === "main"
                )?.url ||
                "https://via.placeholder.com/600x400?text=No+Image";

              const isSaved = isInWishlist(property.id);
              const isCompared = compareIds.includes(property.id);

              return (
                <div
                  key={property.id}
                  className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group flex flex-col transition-all hover:-translate-y-1 hover:shadow-[0_16px_40px_rgb(0,0,0,0.08)]"
                >
                  <div className="relative h-64 overflow-hidden bg-gray-100">
                    <img
                      src={thumbnail}
                      alt={property.title || "Property"}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />

                    <div className="absolute top-4 left-4">
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm ${
                          property.availability_status === "Available"
                            ? "bg-white text-green-600"
                            : "bg-white text-orange-600"
                        }`}
                      >
                        {property.availability_status || "Status unavailable"}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleWishlist(property.id);
                      }}
                      aria-label={
                        isSaved
                          ? "Remove property from saved properties"
                          : "Save property"
                      }
                      className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 text-red-500 hover:bg-white transition-colors shadow-sm"
                    >
                      <Heart
                        fill={isSaved ? "currentColor" : "none"}
                        className={`w-5 h-5 ${
                          isSaved ? "text-red-500" : "text-gray-400"
                        }`}
                      />
                    </button>

                    <button
                      onClick={(e) => {
                        e.preventDefault();

                        if (!isCompared && !canAddMore) {
                          window.alert(
                            "You can compare up to 3 properties at a time."
                          );
                          return;
                        }

                        toggleCompare(property.id);
                      }}
                      aria-label={
                        isCompared
                          ? "Remove property from comparison"
                          : "Add property to comparison"
                      }
                      className={`absolute bottom-4 right-4 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shadow-md backdrop-blur-sm transition-all ${
                        isCompared
                          ? "bg-[#1c3053] text-white"
                          : "bg-white/95 text-gray-700 hover:bg-[#1c3053] hover:text-white"
                      }`}
                    >
                      <Scale className="w-4 h-4" />
                      {isCompared ? "Comparing" : "Compare"}
                    </button>
                  </div>

                  <Link
                    href={`/listings/${property.id}`}
                    className="p-6 flex flex-col flex-grow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[#ae884e] font-semibold text-2xl">
                          £
                          {property.monthly_rent?.toLocaleString() || "—"}
                          <span className="text-sm text-gray-500 font-normal">
                            {" "}
                            pcm
                          </span>
                        </p>

                        {property.property_ref && (
                          <p className="text-gray-400 text-xs mt-1">
                            Ref: {property.property_ref}
                          </p>
                        )}
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                      {property.title || "Property"}
                    </h3>

                    <div className="flex items-center text-gray-500 text-sm mb-6">
                      <MapPin className="w-4 h-4 mr-1 text-gray-400 shrink-0" />
                      <span className="line-clamp-1">
                        {property.short_location || "Location unavailable"}
                      </span>
                    </div>

                    <div className="flex items-center gap-5 pt-4 border-t border-gray-50 mt-auto">
                      <div className="flex items-center text-gray-600">
                        <Bed className="w-5 h-5 mr-2 text-[#ae884e]" />
                        <span className="font-medium text-sm">
                          {property.bedrooms ?? "—"} Beds
                        </span>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <Bath className="w-5 h-5 mr-2 text-[#ae884e]" />
                        <span className="font-medium text-sm">
                          {property.bathrooms ?? "—"} Baths
                        </span>
                      </div>

                      <div className="ml-auto flex items-center gap-1.5">
                        {property.garden && (
                          <span
                            title="Garden"
                            className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-[#ae884e]"
                          >
                            <TreePine className="w-4 h-4" />
                          </span>
                        )}

                        {property.parking && (
                          <span
                            title="Parking"
                            className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-[#ae884e]"
                          >
                            <Car className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {compareIds.length > 0 && (
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl">
            <div className="bg-[#1c3053] text-white rounded-2xl shadow-2xl border border-white/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Scale className="w-5 h-5" />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {compareIds.length} of 3 properties selected
                  </p>

                  <p className="text-xs text-white/70 truncate">
                    Select up to three properties to compare side by side.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    compareIds.forEach((id) => toggleCompare(id));
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors"
                >
                  Clear
                </button>

                <Link
                  href="/compare"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#ae884e] hover:bg-[#c09a62] text-white text-sm font-semibold transition-colors"
                >
                  Compare now
                  <Scale className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 200,
              }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[70] flex flex-col"
            >
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Filters & Sort
                  </h2>

                  <p className="text-xs text-gray-500 mt-1">
                    Refine your property search
                  </p>
                </div>

                <button
                  onClick={() => setIsFilterOpen(false)}
                  aria-label="Close filters"
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
                    <ArrowUpDown className="w-4 h-4 text-[#ae884e]" />
                    Sort By
                  </label>

                  <div className="relative">
                    <select
                      value={sortOrder}
                      onChange={(e) =>
                        setSortOrder(e.target.value as SortOrder)
                      }
                      className="appearance-none w-full p-3.5 pr-10 rounded-xl border border-gray-200 text-gray-900 bg-white outline-none focus:border-[#ae884e] focus:ring-1 focus:ring-[#ae884e]/20"
                    >
                      <option value="newest">Newest First</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="beds-desc">Most Bedrooms</option>
                      <option value="beds-asc">Fewest Bedrooms</option>
                    </select>

                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <FilterNumber
                  label="Minimum Price"
                  value={minPrice}
                  setValue={setMinPrice}
                  prefix="£"
                />

                <FilterNumber
                  label="Maximum Price"
                  value={maxPrice}
                  setValue={setMaxPrice}
                  prefix="£"
                />

                <FilterNumber
                  label="Minimum Bedrooms"
                  value={minBeds}
                  setValue={setMinBeds}
                />

                <FilterNumber
                  label="Maximum Bedrooms"
                  value={maxBeds}
                  setValue={setMaxBeds}
                />

                <FilterNumber
                  label="Minimum Bathrooms"
                  value={minBaths}
                  setValue={setMinBaths}
                />

                <ToggleFilter
                  title="Available Properties"
                  description="Only show properties currently available"
                  checked={availableOnly}
                  onChange={setAvailableOnly}
                />

                <ToggleFilter
                  title="Pets Allowed"
                  description="Show homes that allow pets"
                  checked={petsAllowed}
                  onChange={setPetsAllowed}
                />

                <ToggleFilter
                  title="Garden"
                  description="Show properties with a garden"
                  checked={garden}
                  onChange={setGarden}
                />

                <ToggleFilter
                  title="Parking"
                  description="Show properties with parking"
                  checked={parking}
                  onChange={setParking}
                />

                <ToggleFilter
                  title="Student Friendly"
                  description="Show student-friendly properties"
                  checked={studentFriendly}
                  onChange={setStudentFriendly}
                />

                <ToggleFilter
                  title="Families Allowed"
                  description="Show properties suitable for families"
                  checked={familiesAllowed}
                  onChange={setFamiliesAllowed}
                />

                <ToggleFilter
                  title="DSS / LHA"
                  description="Show properties where DSS / LHA is considered"
                  checked={dssAllowed}
                  onChange={setDssAllowed}
                />
              </div>

              <div className="p-5 border-t border-gray-100 bg-white flex gap-3">
                <button
                  onClick={clearFilters}
                  className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Reset
                </button>

                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="flex-1 py-3.5 rounded-xl bg-[#1c3053] text-white font-medium hover:bg-[#ae884e] transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSavedSearchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSavedSearchOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80]"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="fixed inset-0 z-[90] flex items-center justify-center p-4"
            >
              <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-7">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Save Search
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Save your current filters for later.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsSavedSearchOpen(false)}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <input
                  autoFocus
                  value={saveSearchName}
                  onChange={(e) => setSaveSearchName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveCurrentSearch();
                  }}
                  placeholder="e.g. Norwich 2-bed homes"
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 outline-none focus:border-[#ae884e] focus:ring-1 focus:ring-[#ae884e]/20"
                />

                <button
                  onClick={saveCurrentSearch}
                  className="w-full mt-4 py-3.5 rounded-xl bg-[#1c3053] text-white font-medium hover:bg-[#ae884e] transition-colors"
                >
                  Save Search
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSavedSearchesOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSavedSearchesOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80]"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="fixed inset-0 z-[90] flex items-center justify-center p-4"
            >
              <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-white rounded-3xl shadow-2xl p-7">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Saved Searches
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Quickly restore a previous property search.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsSavedSearchesOpen(false)}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {savedSearches.length === 0 ? (
                  <div className="text-center py-12">
                    <Bookmark className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      You have no saved searches yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedSearches.map((savedSearch) => (
                      <div
                        key={savedSearch.id}
                        className="border border-gray-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {savedSearch.name}
                          </h3>

                          <p className="text-xs text-gray-400 mt-1">
                            Saved{" "}
                            {new Date(
                              savedSearch.createdAt
                            ).toLocaleDateString("en-GB")}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              applyFilters(savedSearch.filters)
                            }
                            className="px-4 py-2.5 rounded-xl bg-[#1c3053] text-white text-sm font-medium hover:bg-[#ae884e] transition-colors"
                          >
                            Apply
                          </button>

                          <button
                            onClick={() =>
                              deleteSavedSearch(savedSearch.id)
                            }
                            className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200 text-sm font-medium transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterNumber({
  label,
  value,
  setValue,
  prefix,
}: {
  label: string;
  value: number | "";
  setValue: (value: number | "") => void;
  prefix?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-900 mb-3">
        {label}
      </label>

      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {prefix}
          </span>
        )}

        <input
          type="number"
          min="0"
          value={value}
          onChange={(e) =>
            setValue(e.target.value === "" ? "" : Number(e.target.value))
          }
          className={`w-full ${
            prefix ? "pl-9" : "pl-4"
          } pr-4 py-3.5 rounded-xl border border-gray-200 text-gray-900 bg-white outline-none focus:border-[#ae884e] focus:ring-1 focus:ring-[#ae884e]/20`}
        />
      </div>
    </div>
  );
}

function ToggleFilter({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <label className="flex items-center justify-between gap-4 cursor-pointer">
        <div>
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>

        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="w-5 h-5 accent-[#1c3053]"
        />
      </label>
    </div>
  );
}
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useWishlist } from "@/context/WishlistContext";

type PropertyImage = {
  url: string | null;
  image_type: string | null;
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

  const [availableOnly, setAvailableOnly] = useState(true);
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [garden, setGarden] = useState(false);
  const [parking, setParking] = useState(false);
  const [studentFriendly, setStudentFriendly] = useState(false);
  const [familiesAllowed, setFamiliesAllowed] = useState(false);
  const [dssAllowed, setDssAllowed] = useState(false);

  useEffect(() => {
    async function fetchProperties() {
      const supabase = createClient();

      setLoading(true);
      setError("");

      const { data, error: fetchError } = await supabase
        .from("properties")
        .select("*, property_images(url, image_type)")
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching properties:", fetchError);
        setError("Unable to load properties. Please try again later.");
        setProperties([]);
      } else {
        setProperties((data as Property[]) || []);
      }

      setLoading(false);
    }

    fetchProperties();
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SAVED_SEARCHES_KEY);

      if (!stored) return;

      const parsed = JSON.parse(stored);

      if (Array.isArray(parsed)) {
        setSavedSearches(parsed.slice(0, MAX_SAVED_SEARCHES));
      }
    } catch (error) {
      console.error("Failed to load saved searches:", error);
    }
  }, []);

  const currentFilters = useMemo<SearchFilters>(
    () => ({
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
    }),
    [
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
    ]
  );

  const filteredProperties = useMemo(() => {
    let result = [...properties];

    const term = searchTerm.trim().toLowerCase();

    if (term) {
      result = result.filter((property) => {
        const searchableText = [
          property.title,
          property.short_location,
          property.full_address,
          property.postcode,
          property.property_ref,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(term);
      });
    }

    if (minPrice !== "") {
      result = result.filter(
        (property) =>
          property.monthly_rent !== null &&
          property.monthly_rent >= minPrice
      );
    }

    if (maxPrice !== "") {
      result = result.filter(
        (property) =>
          property.monthly_rent !== null &&
          property.monthly_rent <= maxPrice
      );
    }

    if (minBeds !== "") {
      result = result.filter(
        (property) =>
          property.bedrooms !== null && property.bedrooms >= minBeds
      );
    }

    if (maxBeds !== "") {
      result = result.filter(
        (property) =>
          property.bedrooms !== null && property.bedrooms <= maxBeds
      );
    }

    if (minBaths !== "") {
      result = result.filter(
        (property) =>
          property.bathrooms !== null && property.bathrooms >= minBaths
      );
    }

    if (availableOnly) {
      result = result.filter(
        (property) => property.availability_status === "Available"
      );
    }

    if (petsAllowed) {
      result = result.filter((property) => property.pets_allowed === true);
    }

    if (garden) {
      result = result.filter((property) => property.garden === true);
    }

    if (parking) {
      result = result.filter((property) => property.parking === true);
    }

    if (studentFriendly) {
      result = result.filter(
        (property) => property.student_friendly === true
      );
    }

    if (familiesAllowed) {
      result = result.filter(
        (property) => property.families_allowed === true
      );
    }

    if (dssAllowed) {
      result = result.filter(
        (property) => property.dss_lha_covers_rent === true
      );
    }

    result.sort((a, b) => {
      if (sortOrder === "price-asc") {
        return (a.monthly_rent || 0) - (b.monthly_rent || 0);
      }

      if (sortOrder === "price-desc") {
        return (b.monthly_rent || 0) - (a.monthly_rent || 0);
      }

      if (sortOrder === "beds-desc") {
        return (b.bedrooms || 0) - (a.bedrooms || 0);
      }

      if (sortOrder === "beds-asc") {
        return (a.bedrooms || 0) - (b.bedrooms || 0);
      }

      return (
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
      );
    });

    return result;
  }, [
    properties,
    searchTerm,
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
    sortOrder,
  ]);

  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (minPrice !== "") count++;
    if (maxPrice !== "") count++;
    if (minBeds !== "") count++;
    if (maxBeds !== "") count++;
    if (minBaths !== "") count++;
    if (!availableOnly) count++;
    if (petsAllowed) count++;
    if (garden) count++;
    if (parking) count++;
    if (studentFriendly) count++;
    if (familiesAllowed) count++;
    if (dssAllowed) count++;
    if (sortOrder !== "newest") count++;

    return count;
  }, [
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
    sortOrder,
  ]);

  const hasAnyFilter =
    searchTerm.trim() !== "" || activeFilterCount > 0;

  const clearFilters = () => {
    setSearchTerm("");
    setMinPrice("");
    setMaxPrice("");
    setMinBeds("");
    setMaxBeds("");
    setMinBaths("");
    setAvailableOnly(true);
    setPetsAllowed(false);
    setGarden(false);
    setParking(false);
    setStudentFriendly(false);
    setFamiliesAllowed(false);
    setDssAllowed(false);
    setSortOrder("newest");
  };

  const applySavedSearch = (savedSearch: SavedSearch) => {
    const filters = savedSearch.filters;

    setSearchTerm(filters.searchTerm || "");
    setSortOrder(filters.sortOrder || "newest");
    setMinPrice(filters.minPrice ?? "");
    setMaxPrice(filters.maxPrice ?? "");
    setMinBeds(filters.minBeds ?? "");
    setMaxBeds(filters.maxBeds ?? "");
    setMinBaths(filters.minBaths ?? "");
    setAvailableOnly(filters.availableOnly ?? true);
    setPetsAllowed(filters.petsAllowed ?? false);
    setGarden(filters.garden ?? false);
    setParking(filters.parking ?? false);
    setStudentFriendly(filters.studentFriendly ?? false);
    setFamiliesAllowed(filters.familiesAllowed ?? false);
    setDssAllowed(filters.dssAllowed ?? false);

    setIsSavedSearchesOpen(false);
    setSaveMessage(`Applied "${savedSearch.name}"`);
    setTimeout(() => setSaveMessage(""), 2500);
  };

  const saveCurrentSearch = () => {
    const name = saveSearchName.trim();

    if (!name) {
      setSaveMessage("Please enter a name for this search.");
      return;
    }

    if (savedSearches.length >= MAX_SAVED_SEARCHES) {
      setSaveMessage(
        `You can save up to ${MAX_SAVED_SEARCHES} searches. Delete one first.`
      );
      return;
    }

    const duplicate = savedSearches.some(
      (savedSearch) =>
        JSON.stringify(savedSearch.filters) ===
        JSON.stringify(currentFilters)
    );

    if (duplicate) {
      setSaveMessage("This search is already saved.");
      return;
    }

    const newSearch: SavedSearch = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      filters: currentFilters,
    };

    const updated = [newSearch, ...savedSearches];

    try {
      window.localStorage.setItem(
        SAVED_SEARCHES_KEY,
        JSON.stringify(updated)
      );

      setSavedSearches(updated);
      setSaveSearchName("");
      setIsSavedSearchOpen(false);
      setSaveMessage(`"${name}" has been saved.`);
      setTimeout(() => setSaveMessage(""), 2500);
    } catch (error) {
      console.error("Failed to save search:", error);
      setSaveMessage("Unable to save this search on your device.");
    }
  };

  const deleteSavedSearch = (id: string) => {
    const updated = savedSearches.filter(
      (savedSearch) => savedSearch.id !== id
    );

    try {
      window.localStorage.setItem(
        SAVED_SEARCHES_KEY,
        JSON.stringify(updated)
      );

      setSavedSearches(updated);
    } catch (error) {
      console.error("Failed to delete saved search:", error);
    }
  };

  const getSavedSearchSummary = (filters: SearchFilters) => {
    const summary: string[] = [];

    if (filters.searchTerm.trim()) {
      summary.push(filters.searchTerm.trim());
    }

    if (filters.minPrice !== "") {
      summary.push(`£${filters.minPrice}+`);
    }

    if (filters.maxPrice !== "") {
      summary.push(`up to £${filters.maxPrice}`);
    }

    if (filters.minBeds !== "") {
      summary.push(`${filters.minBeds}+ beds`);
    }

    if (filters.maxBeds !== "") {
      summary.push(`up to ${filters.maxBeds} beds`);
    }

    if (filters.minBaths !== "") {
      summary.push(`${filters.minBaths}+ baths`);
    }

    if (filters.petsAllowed) summary.push("Pets");
    if (filters.garden) summary.push("Garden");
    if (filters.parking) summary.push("Parking");
    if (filters.studentFriendly) summary.push("Students");
    if (filters.familiesAllowed) summary.push("Families");
    if (filters.dssAllowed) summary.push("DSS/LHA");

    if (filters.availableOnly) {
      summary.push("Available");
    }

    return summary.length > 0
      ? summary.slice(0, 4).join(" · ")
      : "All properties";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-10 w-72 bg-gray-200 rounded-xl" />
            <div className="h-5 w-96 max-w-full bg-gray-100 rounded-lg mt-3" />

            <div className="mt-8 h-14 bg-white border border-gray-100 rounded-2xl" />

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="bg-white rounded-[2rem] overflow-hidden border border-gray-100"
                >
                  <div className="h-64 bg-gray-200" />
                  <div className="p-6 space-y-4">
                    <div className="h-7 w-32 bg-gray-100 rounded" />
                    <div className="h-5 w-3/4 bg-gray-100 rounded" />
                    <div className="h-4 w-1/2 bg-gray-100 rounded" />
                    <div className="h-10 bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pt-28 pb-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <p className="text-sm font-medium text-[#ae884e] mb-2">
                OneKey Estate Agency
              </p>

              <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 tracking-tight">
                Discover Properties
              </h1>

              <p className="text-gray-500 font-light mt-2">
                Find your perfect home from our premium selection.
              </p>
            </div>

            <div className="text-sm text-gray-500">
              <span className="font-semibold text-gray-900">
                {filteredProperties.length}
              </span>{" "}
              {filteredProperties.length === 1
                ? "property"
                : "properties"}{" "}
              found
            </div>
          </div>
        </div>

        {/* Search controls */}
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

        {/* Save/apply message */}
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

        {/* Active filters */}
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

        {/* Results */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <p className="text-sm text-gray-500 font-medium">
            Showing{" "}
            <span className="text-gray-900">
              {filteredProperties.length}
            </span>{" "}
            of{" "}
            <span className="text-gray-900">
              {properties.length}
            </span>{" "}
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
                property.property_images?.find(
                  (img) => img.image_type === "exterior"
                )?.url ||
                property.property_images?.find(
                  (img) => img.image_type === "main"
                )?.url ||
                property.property_images?.[0]?.url ||
                "https://via.placeholder.com/600x400?text=No+Image";

              const isSaved = isInWishlist(property.id);

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
      </div>

      {/* Filter Sidebar */}
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
                      <option value="price-asc">
                        Price: Low to High
                      </option>
                      <option value="price-desc">
                        Price: High to Low
                      </option>
                      <option value="beds-desc">Most Bedrooms</option>
                      <option value="beds-asc">Fewest Bedrooms</option>
                    </select>

                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Available Properties
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        Only show properties currently available
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={availableOnly}
                      onChange={(e) =>
                        setAvailableOnly(e.target.checked)
                      }
                      className="w-5 h-5 accent-[#ae884e] rounded border-gray-300 shrink-0"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Budget
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">
                        Minimum Rent
                      </label>

                      <select
                        value={minPrice}
                        onChange={(e) =>
                          setMinPrice(
                            e.target.value ? Number(e.target.value) : ""
                          )
                        }
                        className="w-full p-3 rounded-xl border border-gray-200 text-gray-900 bg-white outline-none focus:border-[#ae884e]"
                      >
                        <option value="">No minimum</option>
                        <option value="500">£500</option>
                        <option value="750">£750</option>
                        <option value="1000">£1,000</option>
                        <option value="1250">£1,250</option>
                        <option value="1500">£1,500</option>
                        <option value="2000">£2,000</option>
                        <option value="2500">£2,500</option>
                        <option value="3000">£3,000</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">
                        Maximum Rent
                      </label>

                      <select
                        value={maxPrice}
                        onChange={(e) =>
                          setMaxPrice(
                            e.target.value ? Number(e.target.value) : ""
                          )
                        }
                        className="w-full p-3 rounded-xl border border-gray-200 text-gray-900 bg-white outline-none focus:border-[#ae884e]"
                      >
                        <option value="">No maximum</option>
                        <option value="750">£750</option>
                        <option value="1000">£1,000</option>
                        <option value="1250">£1,250</option>
                        <option value="1500">£1,500</option>
                        <option value="1750">£1,750</option>
                        <option value="2000">£2,000</option>
                        <option value="2500">£2,500</option>
                        <option value="3000">£3,000</option>
                        <option value="4000">£4,000</option>
                        <option value="5000">£5,000</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Bedrooms & Bathrooms
                  </label>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">
                        Minimum Bedrooms
                      </label>

                      <select
                        value={minBeds}
                        onChange={(e) =>
                          setMinBeds(
                            e.target.value ? Number(e.target.value) : ""
                          )
                        }
                        className="w-full p-3 rounded-xl border border-gray-200 text-gray-900 bg-white outline-none focus:border-[#ae884e]"
                      >
                        <option value="">Any</option>
                        <option value="1">1+ Bedrooms</option>
                        <option value="2">2+ Bedrooms</option>
                        <option value="3">3+ Bedrooms</option>
                        <option value="4">4+ Bedrooms</option>
                        <option value="5">5+ Bedrooms</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">
                        Maximum Bedrooms
                      </label>

                      <select
                        value={maxBeds}
                        onChange={(e) =>
                          setMaxBeds(
                            e.target.value ? Number(e.target.value) : ""
                          )
                        }
                        className="w-full p-3 rounded-xl border border-gray-200 text-gray-900 bg-white outline-none focus:border-[#ae884e]"
                      >
                        <option value="">Any</option>
                        <option value="1">Up to 1 Bedroom</option>
                        <option value="2">Up to 2 Bedrooms</option>
                        <option value="3">Up to 3 Bedrooms</option>
                        <option value="4">Up to 4 Bedrooms</option>
                        <option value="5">Up to 5 Bedrooms</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">
                        Minimum Bathrooms
                      </label>

                      <select
                        value={minBaths}
                        onChange={(e) =>
                          setMinBaths(
                            e.target.value ? Number(e.target.value) : ""
                          )
                        }
                        className="w-full p-3 rounded-xl border border-gray-200 text-gray-900 bg-white outline-none focus:border-[#ae884e]"
                      >
                        <option value="">Any</option>
                        <option value="1">1+ Bathrooms</option>
                        <option value="2">2+ Bathrooms</option>
                        <option value="3">3+ Bathrooms</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-4">
                    Property Features
                  </label>

                  <div className="space-y-3">
                    {[
                      {
                        label: "Pets Allowed",
                        icon: PawPrint,
                        value: petsAllowed,
                        setter: setPetsAllowed,
                      },
                      {
                        label: "Garden",
                        icon: TreePine,
                        value: garden,
                        setter: setGarden,
                      },
                      {
                        label: "Parking",
                        icon: Car,
                        value: parking,
                        setter: setParking,
                      },
                      {
                        label: "Student Friendly",
                        icon: GraduationCap,
                        value: studentFriendly,
                        setter: setStudentFriendly,
                      },
                      {
                        label: "Families Allowed",
                        icon: Users,
                        value: familiesAllowed,
                        setter: setFamiliesAllowed,
                      },
                      {
                        label: "DSS / LHA Considered",
                        icon: BadgeCheck,
                        value: dssAllowed,
                        setter: setDssAllowed,
                      },
                    ].map((feature) => {
                      const Icon = feature.icon;

                      return (
                        <label
                          key={feature.label}
                          className="flex items-center gap-3 p-3.5 bg-white border border-gray-100 rounded-xl cursor-pointer hover:border-[#ae884e]/30 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={feature.value}
                            onChange={(e) =>
                              feature.setter(e.target.checked)
                            }
                            className="w-5 h-5 accent-[#ae884e] rounded border-gray-300"
                          />

                          <Icon className="w-4 h-4 text-[#ae884e]" />

                          <span className="text-sm font-medium text-gray-700">
                            {feature.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-5 md:p-6 border-t border-gray-100 bg-white flex gap-3 shrink-0">
                <button
                  onClick={clearFilters}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 font-medium text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  Clear All
                </button>

                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="flex-1 py-3.5 font-medium text-white bg-[#1c3053] hover:bg-[#ae884e] rounded-xl shadow-lg transition"
                >
                  Show {filteredProperties.length} Results
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Save Search Modal */}
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
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-7 pointer-events-auto">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-[#ae884e]/10 flex items-center justify-center mb-4">
                      <Bookmark className="w-6 h-6 text-[#ae884e]" />
                    </div>

                    <h2 className="text-2xl font-semibold text-gray-900">
                      Save This Search
                    </h2>

                    <p className="text-sm text-gray-500 mt-2">
                      Save your current filters so you can quickly use them
                      again later.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsSavedSearchOpen(false)}
                    aria-label="Close save search dialog"
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                    Current Search
                  </p>

                  <p className="text-sm text-gray-700 leading-6">
                    {getSavedSearchSummary(currentFilters)}
                  </p>
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Name
                </label>

                <input
                  type="text"
                  value={saveSearchName}
                  onChange={(e) => setSaveSearchName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      saveCurrentSearch();
                    }
                  }}
                  autoFocus
                  maxLength={60}
                  placeholder="e.g. 2 bedroom Norwich"
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-gray-900 outline-none focus:border-[#ae884e] focus:ring-1 focus:ring-[#ae884e]/20"
                />

                {saveMessage && (
                  <p className="text-sm text-red-600 mt-2">{saveMessage}</p>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setIsSavedSearchOpen(false)}
                    className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={saveCurrentSearch}
                    className="flex-1 py-3.5 rounded-xl bg-[#1c3053] text-white font-medium hover:bg-[#ae884e] transition"
                  >
                    Save Search
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Saved Searches Modal */}
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
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden pointer-events-auto">
                <div className="px-7 py-6 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      Saved Searches
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                      {savedSearches.length} of {MAX_SAVED_SEARCHES} saved
                    </p>
                  </div>

                  <button
                    onClick={() => setIsSavedSearchesOpen(false)}
                    aria-label="Close saved searches"
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-6">
                  {savedSearches.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-5">
                        <Bookmark className="w-8 h-8 text-gray-300" />
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900">
                        No saved searches
                      </h3>

                      <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
                        Set your preferred filters and save the search to
                        quickly return to it later.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {savedSearches.map((savedSearch) => (
                        <div
                          key={savedSearch.id}
                          className="border border-gray-100 rounded-2xl p-5 hover:border-[#ae884e]/30 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {savedSearch.name}
                              </h3>

                              <p className="text-sm text-gray-500 mt-1 leading-5">
                                {getSavedSearchSummary(savedSearch.filters)}
                              </p>

                              <p className="text-xs text-gray-400 mt-2">
                                Saved{" "}
                                {new Date(
                                  savedSearch.createdAt
                                ).toLocaleDateString("en-GB")}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() =>
                                  applySavedSearch(savedSearch)
                                }
                                className="px-4 py-2 rounded-xl bg-[#1c3053] text-white text-sm font-medium hover:bg-[#ae884e] transition"
                              >
                                Apply
                              </button>

                              <button
                                onClick={() =>
                                  deleteSavedSearch(savedSearch.id)
                                }
                                aria-label={`Delete ${savedSearch.name}`}
                                className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
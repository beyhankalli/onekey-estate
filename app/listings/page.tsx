"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, MapPin, Bed, Bath, ChevronRight } from "lucide-react";
import { propertiesData } from "@/data/properties";

// URL'den arama parametresini alan ana bileşen
function ListingsContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedBeds, setSelectedBeds] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("featured");

  const filteredProperties = propertiesData.filter((prop) => {
    const matchesSearch = 
      prop.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      prop.fullAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.postcode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBeds = selectedBeds === "all" || prop.bedrooms === parseInt(selectedBeds);
    const matchesStatus = selectedStatus === "all" || prop.availabilityStatus.toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesBeds && matchesStatus;
  });

  const sortedProperties = [...filteredProperties].sort((a, b) => {
    if (sortBy === "price-asc") return a.monthlyRent - b.monthlyRent;
    if (sortBy === "price-desc") return b.monthlyRent - a.monthlyRent;
    if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === "featured") return (a.isFeatured === b.isFeatured) ? 0 : a.isFeatured ? -1 : 1;
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-12">
        <h1 className="text-4xl font-semibold text-gray-900 mb-4">All Properties<span className="text-[#ae884e]">.</span></h1>
        <p className="text-gray-500 text-lg font-light mb-8 max-w-2xl">
          Find your perfect home from our exclusive portfolio of premium properties.
        </p>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Address or postcode (e.g. E14, London)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-[#ae884e] shadow-sm transition-all"
            />
          </div>
          <select value={selectedBeds} onChange={(e) => setSelectedBeds(e.target.value)} className="px-4 py-3.5 rounded-2xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-[#ae884e] shadow-sm md:w-40">
            <option value="all">All Beds</option>
            <option value="1">1 Bed</option>
            <option value="2">2 Beds</option>
            <option value="3">3 Beds</option>
            <option value="4">4+ Beds</option>
          </select>
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="px-4 py-3.5 rounded-2xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-[#ae884e] shadow-sm md:w-44">
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="let agreed">Let Agreed</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-3.5 rounded-2xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-[#ae884e] shadow-sm md:w-48">
            <option value="featured">Sort by: Featured</option>
            <option value="newest">Newest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {sortedProperties.length === 0 ? (
        <div className="text-center py-20 text-gray-500 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No properties found</h3>
          <p className="text-gray-500">We couldn't find any properties matching "{searchTerm}". Try adjusting your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedProperties.map((prop) => (
            <Link href={`/listings/${prop.id}`} key={prop.id} className="group block bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col cursor-pointer">
              <div className="w-full h-64 overflow-hidden relative">
                <img src={prop.interiorImages[0]} alt={prop.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className={`absolute top-4 right-4 text-xs font-semibold px-3 py-1.5 rounded-full ${prop.availabilityStatus === 'Available' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                  {prop.availabilityStatus}
                </div>
              </div>
              <div className="p-8 flex flex-col flex-grow">
                <h3 className="text-2xl font-semibold tracking-tight text-gray-900 mb-2">{prop.title}</h3>
                <div className="flex items-center text-gray-600 mb-5"><MapPin className="w-4 h-4 mr-1.5 text-[#ae884e]" /><span className="text-sm font-medium">{prop.shortLocation}</span></div>
                <div className="text-2xl font-medium text-[#1c3053] mb-6">£{prop.monthlyRent.toLocaleString()} <span className="text-sm text-gray-400 font-light">pcm</span></div>
                <div className="flex gap-6 mb-8 border-t border-gray-100 pt-6">
                  <div className="flex items-center text-gray-600"><Bed className="w-5 h-5 mr-2 stroke-[1.5] text-[#ae884e]" /><span className="font-light">{prop.bedrooms} Beds</span></div>
                  <div className="flex items-center text-gray-600"><Bath className="w-5 h-5 mr-2 stroke-[1.5] text-[#ae884e]" /><span className="font-light">{prop.bathrooms} Baths</span></div>
                </div>
                <div className="mt-auto flex items-center justify-center w-full bg-[#1c3053]/5 text-[#1c3053] py-4 rounded-2xl font-medium text-[15px] group-hover:bg-[#ae884e] group-hover:text-white transition-all duration-300">
                  View Details <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// Next.js App Router'da URL parametreleri okurken sayfanın çökmemesi için Suspense ile sarmalıyoruz
export default function ListingsPage() {
  return (
    <div className="bg-gray-50 min-h-screen pt-32 pb-20">
      <Suspense fallback={<div className="min-h-screen pt-32 text-center text-gray-500">Loading properties...</div>}>
        <ListingsContent />
      </Suspense>
    </div>
  );
}
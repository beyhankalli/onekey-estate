"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useWishlist } from "@/context/WishlistContext";
import { MapPin, Bed, Bath, Search, SlidersHorizontal, X, Heart, Home as HomeIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PublicListingsPage() {
  const supabase = createClient();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [properties, setProperties] = useState<any[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Arayüz (UI) Durumları
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filtreleme Durumları (States)
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [minBeds, setMinBeds] = useState<number | "">("");
  
  // Detaylı Seçenekler (Toggles)
  const [availableOnly, setAvailableOnly] = useState(true);
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [garden, setGarden] = useState(false);
  const [parking, setParking] = useState(false);

  // 1. Tüm İlanları Veritabanından Çek
  useEffect(() => {
    async function fetchProperties() {
      const { data, error } = await supabase
        .from("properties")
        .select("*, property_images(url, image_type)")
        .order("created_at", { ascending: false });

      if (data) {
        setProperties(data);
        setFilteredProperties(data); // Başlangıçta hepsi filtrelenmiş listede
      }
      if (error) console.error("Error fetching properties:", error);
      setLoading(false);
    }
    fetchProperties();
  }, [supabase]);

  // 2. Filtreler Değiştikçe İlanları Yeniden Hesapla (Dinamik Filtreleme)
  useEffect(() => {
    let result = [...properties];

    // Metin Araması (Başlık veya Lokasyon içinde)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(term) || 
        p.short_location.toLowerCase().includes(term)
      );
    }

    // Maksimum Kira
    if (maxPrice !== "") {
      result = result.filter(p => p.monthly_rent <= maxPrice);
    }

    // Minimum Yatak Odası
    if (minBeds !== "") {
      result = result.filter(p => p.bedrooms >= minBeds);
    }

    // Detaylı Tik Kutuları (Toggles)
    if (availableOnly) result = result.filter(p => p.availability_status === "Available");
    if (petsAllowed) result = result.filter(p => p.pets_allowed === true);
    if (garden) result = result.filter(p => p.garden === true);
    if (parking) result = result.filter(p => p.parking === true);

    // Sıralama Mantığı
    if (sortOrder === "price-asc") {
      result.sort((a, b) => a.monthly_rent - b.monthly_rent); // Ucuzdan Pahalıya
    } else if (sortOrder === "price-desc") {
      result.sort((a, b) => b.monthly_rent - a.monthly_rent); // Pahalıdan Ucuza
    } else {
      // En Yeni (Zaten çekilirken sıralı ama filtreleme sonrası garanti olsun diye id veya tarih kullanılabilir)
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); 
    }

    setFilteredProperties(result);
  }, [searchTerm, maxPrice, minBeds, availableOnly, petsAllowed, garden, parking, sortOrder, properties]);


  // Filtreleri Sıfırlama Fonksiyonu
  const clearFilters = () => {
    setSearchTerm("");
    setMaxPrice("");
    setMinBeds("");
    setAvailableOnly(true);
    setPetsAllowed(false);
    setGarden(false);
    setParking(false);
    setSortOrder("newest");
  };

  if (loading) return <div className="min-h-screen pt-40 text-center text-gray-500">Loading properties...</div>;

  return (
    <div className="bg-gray-50 min-h-screen pt-28 pb-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Üst Kısım: Başlık ve Arama/Filtre Çubuğu */}
        <div className="mb-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">Discover Properties</h1>
            <p className="text-gray-500 font-light mt-2">Find your perfect home from our premium selection.</p>
          </div>
          
          <div className="w-full md:w-auto flex gap-3">
            <div className="relative flex-1 md:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search location or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 text-gray-900 bg-white outline-none focus:border-[#ae884e] shadow-sm transition-all"
              />
            </div>
            
            <button 
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-gray-200 text-gray-900 font-medium hover:border-[#ae884e] hover:text-[#ae884e] shadow-sm transition-all"
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span className="hidden sm:block">Filters & Sort</span>
            </button>
          </div>
        </div>

        {/* Sonuç Sayısı */}
        <div className="mb-6 text-sm text-gray-500 font-medium">
          Showing {filteredProperties.length} properties
        </div>

        {/* İlanlar Grid Yapısı */}
        {filteredProperties.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm flex flex-col items-center justify-center">
            <HomeIcon className="w-16 h-16 text-gray-200 mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No properties found</h2>
            <p className="text-gray-500 font-light mb-6">We couldn't find any properties matching your criteria.</p>
            <button onClick={clearFilters} className="text-[#ae884e] font-medium hover:underline">Clear all filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map((property) => {
              const thumbnail = property.property_images?.find((img: any) => img.image_type === 'exterior')?.url 
                              || property.property_images?.[0]?.url 
                              || "https://via.placeholder.com/600x400?text=No+Image";
              
              const isSaved = isInWishlist(property.id);

              return (
                <div key={property.id} className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group flex flex-col transition-transform hover:-translate-y-1">
                  <div className="relative h-64 overflow-hidden bg-gray-100">
                    <img src={thumbnail} alt={property.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm ${
                        property.availability_status === 'Available' ? 'bg-white text-green-600' : 'bg-white text-orange-600'
                      }`}>
                        {property.availability_status}
                      </span>
                    </div>
                    {/* Favoriye Ekle Butonu */}
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        toggleWishlist(property.id);
                      }}
                      className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 text-red-500 hover:bg-white transition-colors shadow-sm"
                    >
                      <Heart fill={isSaved ? "currentColor" : "none"} className={`w-5 h-5 ${isSaved ? "text-red-500" : "text-gray-400"}`} />
                    </button>
                  </div>

                  <Link href={`/listings/${property.id}`} className="p-6 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[#ae884e] font-semibold text-2xl">£{property.monthly_rent?.toLocaleString()}<span className="text-sm text-gray-500 font-normal"> pcm</span></p>
                        <p className="text-gray-400 text-xs mt-1">Ref: {property.property_ref}</p>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">{property.title}</h3>
                    <div className="flex items-center text-gray-500 text-sm mb-6">
                      <MapPin className="w-4 h-4 mr-1 text-gray-400 shrink-0" />
                      <span className="line-clamp-1">{property.short_location}</span>
                    </div>

                    <div className="flex items-center gap-6 pt-4 border-t border-gray-50 mt-auto">
                      <div className="flex items-center text-gray-600">
                        <Bed className="w-5 h-5 mr-2 text-[#ae884e]" />
                        <span className="font-medium text-sm">{property.bedrooms} Beds</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Bath className="w-5 h-5 mr-2 text-[#ae884e]" />
                        <span className="font-medium text-sm">{property.bathrooms} Baths</span>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Şık Sağ Yan Panel (Slide-over Sidebar) */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            {/* Arka plan karartması */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            
            {/* Yan Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[70] flex flex-col"
            >
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
                <h2 className="text-xl font-semibold text-gray-900">Filters & Sort</h2>
                <button onClick={() => setIsFilterOpen(false)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50">
                
                {/* Sıralama */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">Sort By</label>
                  <select 
                    value={sortOrder} 
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-200 text-gray-900 bg-white outline-none focus:border-[#ae884e]"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>
                </div>

                {/* Temel Filtreler */}
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-900">Budget & Size</label>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Max Rent (PCM)</label>
                    <select 
                      value={maxPrice} 
                      onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : "")}
                      className="w-full p-3 rounded-xl border border-gray-200 text-gray-900 bg-white outline-none focus:border-[#ae884e]"
                    >
                      <option value="">Any Price</option>
                      <option value="1000">Up to £1,000</option>
                      <option value="1500">Up to £1,500</option>
                      <option value="2000">Up to £2,000</option>
                      <option value="3000">Up to £3,000</option>
                      <option value="5000">Up to £5,000</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Minimum Bedrooms</label>
                    <select 
                      value={minBeds} 
                      onChange={(e) => setMinBeds(e.target.value ? Number(e.target.value) : "")}
                      className="w-full p-3 rounded-xl border border-gray-200 text-gray-900 bg-white outline-none focus:border-[#ae884e]"
                    >
                      <option value="">Any</option>
                      <option value="1">1+ Bedrooms</option>
                      <option value="2">2+ Bedrooms</option>
                      <option value="3">3+ Bedrooms</option>
                      <option value="4">4+ Bedrooms</option>
                    </select>
                  </div>
                </div>

                {/* Özellikler (Toggles) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-4">Property Features</label>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} className="w-5 h-5 accent-[#ae884e] rounded border-gray-300" />
                      <span className="text-sm font-medium text-gray-700">Show Only Available Properties</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={petsAllowed} onChange={(e) => setPetsAllowed(e.target.checked)} className="w-5 h-5 accent-[#ae884e] rounded border-gray-300" />
                      <span className="text-sm font-medium text-gray-700">Pets Allowed</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={garden} onChange={(e) => setGarden(e.target.checked)} className="w-5 h-5 accent-[#ae884e] rounded border-gray-300" />
                      <span className="text-sm font-medium text-gray-700">Has Garden</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={parking} onChange={(e) => setParking(e.target.checked)} className="w-5 h-5 accent-[#ae884e] rounded border-gray-300" />
                      <span className="text-sm font-medium text-gray-700">Has Parking</span>
                    </label>
                  </div>
                </div>

              </div>
              
              <div className="p-6 border-t border-gray-100 bg-white flex gap-4">
                <button onClick={clearFilters} className="flex-1 py-4 font-medium text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition">
                  Clear All
                </button>
                <button onClick={() => setIsFilterOpen(false)} className="flex-1 py-4 font-medium text-white bg-[#1c3053] hover:bg-[#ae884e] rounded-xl shadow-lg transition">
                  Show Results
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
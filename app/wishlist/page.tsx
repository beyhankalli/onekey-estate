"use client";

import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useWishlist } from "@/context/WishlistContext";
import { MapPin, Bed, Bath, Heart, HeartCrack, ArrowRight } from "lucide-react";

export default function WishlistPage() {
  const { wishlist, toggleWishlist } = useWishlist();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function fetchSavedProperties() {
      // Eğer kullanıcının favorilerinde hiç ilan yoksa, veritabanına boşuna sorgu atma
      if (wishlist.length === 0) {
        setProperties([]);
        setLoading(false);
        return;
      }

      // Sadece favori listemizdeki ID'lere sahip ve status değeri Published olan ilanları çekiyoruz
      const { data, error } = await supabase
        .from("properties")
        .select("*, property_images(url, image_type)")
        .in("id", wishlist)
        .eq("status", "Published");

      if (data) {
        setProperties(data);
      }
      if (error) {
        console.error("Error fetching wishlist:", error);
      }
      setLoading(false);
    }

    void fetchSavedProperties();
  }, [wishlist, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen pt-40 pb-20 text-center text-gray-500">
        Loading your saved properties...
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">
            Saved Properties
          </h1>
          <p className="text-gray-500 font-light mt-2">
            You have{" "}
            <span className="font-medium text-[#ae884e]">
              {wishlist.length}
            </span>{" "}
            properties saved in your wishlist.
          </p>
        </div>

        {wishlist.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm flex flex-col items-center justify-center">
            <HeartCrack className="w-16 h-16 text-gray-200 mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-gray-500 font-light mb-8 max-w-md mx-auto">
              Looks like you haven't saved any properties yet. Browse our
              listings and tap the heart icon to save your favorites here.
            </p>
            <Link 
              href="/listings" 
              className="inline-flex items-center justify-center px-8 py-4 text-white bg-[#1c3053] hover:bg-[#ae884e] rounded-xl font-medium transition-all shadow-md"
            >
              Browse Properties <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property) => {
              // Sadece dış mekan (exterior) fotoğrafını kapak görseli olarak bulmaya çalışıyoruz
              const thumbnail =
                property.property_images?.find(
                  (img: any) => img.image_type === "exterior"
                )?.url ||
                property.property_images?.[0]?.url ||
                "https://via.placeholder.com/600x400?text=No+Image";

              return (
                <div
                  key={property.id}
                  className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group flex flex-col transition-transform hover:-translate-y-1"
                >
                  <div className="relative h-64 overflow-hidden bg-gray-100">
                    <Image
                      src={thumbnail}
                      alt={property.title || "Saved property"}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      unoptimized
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />

                    <div className="absolute top-4 left-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm ${
                          property.availability_status === "Available"
                            ? "bg-white text-green-600"
                            : "bg-white text-orange-600"
                        }`}
                      >
                        {property.availability_status}
                      </span>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        toggleWishlist(property.id);
                      }}
                      className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 text-red-500 hover:bg-white transition-colors shadow-sm"
                    >
                      <Heart fill="currentColor" className="w-5 h-5" />
                    </button>
                  </div>

                  <Link
                    href={`/listings/${property.id}`}
                    className="p-6 flex flex-col flex-grow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[#ae884e] font-semibold text-2xl">
                          £{property.monthly_rent?.toLocaleString()}
                          <span className="text-sm text-gray-500 font-normal">
                            {" "}
                            pcm
                          </span>
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          Ref: {property.property_ref}
                        </p>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                      {property.title}
                    </h3>

                    <div className="flex items-center text-gray-500 text-sm mb-6">
                      <MapPin className="w-4 h-4 mr-1 text-gray-400 shrink-0" />
                      <span className="line-clamp-1">
                        {property.short_location}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 pt-4 border-t border-gray-50 mt-auto">
                      <div className="flex items-center text-gray-600">
                        <Bed className="w-5 h-5 mr-2 text-[#ae884e]" />
                        <span className="font-medium text-sm">
                          {property.bedrooms} Beds
                        </span>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <Bath className="w-5 h-5 mr-2 text-[#ae884e]" />
                        <span className="font-medium text-sm">
                          {property.bathrooms} Baths
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
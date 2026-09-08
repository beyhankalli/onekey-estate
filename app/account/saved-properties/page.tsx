"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, ArrowLeft, Home, ExternalLink, Trash2 } from "lucide-react";

export default function CustomerSavedPropertiesPage() {
  const [savedProperties, setSavedProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadSavedProperties() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push("/login");
          return;
        }

        // LocalStorage'dan veya mevcut wishlist yapısından favorileri çekiyoruz
        const storedWishlist = localStorage.getItem("onekey_wishlist");

        if (storedWishlist) {
          const ids = JSON.parse(storedWishlist);

          if (Array.isArray(ids) && ids.length > 0) {
            const { data, error } = await supabase
              .from("properties")
              .select("*")
              .in("id", ids);

            if (error) throw error;
            if (data) setSavedProperties(data);
          }
        }
      } catch (err) {
        console.error("Error loading saved properties:", err);
      } finally {
        setLoading(false);
      }
    }

    loadSavedProperties();
  }, [router, supabase]);

  const handleRemove = (id: string) => {
    const updated = savedProperties.filter((p) => p.id !== id);

    setSavedProperties(updated);

    const ids = updated.map((p) => p.id);
    localStorage.setItem("onekey_wishlist", JSON.stringify(ids));

    window.dispatchEvent(new Event("storage"));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
        Loading saved properties...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-[#1c3053] text-white py-12 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <Link
              href="/account"
              className="inline-flex items-center gap-1.5 text-xs text-[#ae884e] font-semibold uppercase tracking-wider mb-2 hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>

            <h1 className="text-3xl font-semibold">Saved Properties</h1>

            <p className="text-gray-300 text-sm font-light mt-1">
              Manage your favorite property listings.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 -mt-6">
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-6 sm:p-8">
          {savedProperties.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />

              <p>You have no saved properties yet.</p>

              <Link
                href="/listings"
                className="inline-block mt-4 bg-[#1c3053] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#ae884e] transition-colors"
              >
                Browse Listings
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {savedProperties.map((property) => {
                const coverImage = property.images?.[0];

                return (
                  <div
                    key={property.id}
                    className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      {coverImage ? (
                        <div className="relative w-full h-48">
                          <Image
                            src={coverImage}
                            alt={property.title || "Property"}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                          <Home className="w-10 h-10 text-gray-400" />
                        </div>
                      )}

                      <div className="p-5">
                        <span className="text-xs font-semibold text-[#ae884e] uppercase tracking-wider">
                          {property.property_type || "Property"}
                        </span>

                        <h3 className="font-semibold text-gray-900 text-lg mt-1">
                          {property.title}
                        </h3>

                        <p className="text-sm text-gray-500 mt-1">
                          {property.short_location}
                        </p>

                        <p className="text-lg font-bold text-[#1c3053] mt-3">
                          £{Number(property.price || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="p-5 pt-0 flex items-center justify-between border-t border-gray-50 mt-4 pt-4">
                      <Link
                        href={`/listings/${property.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1c3053] hover:text-[#ae884e]"
                      >
                        View Property{" "}
                        <ExternalLink className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => handleRemove(property.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove from saved"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
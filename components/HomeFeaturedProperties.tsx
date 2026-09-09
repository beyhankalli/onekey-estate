"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  MapPin,
  Bed,
  Bath,
  ChevronRight,
  ImageIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function HomeFeaturedProperties() {
  const [featured, setFeatured] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    async function fetchFeaturedProperties() {
      try {
        const { data, error } = await supabase
          .from("properties")
          .select("*, property_images(url, image_type, display_order)")
          .eq("is_featured", true)
          .order("created_at", { ascending: false })
          .limit(6);

        if (error) {
          console.error("Error fetching featured properties:", error);
          return;
        }

        if (isMounted) {
          setFeatured(data ?? []);
        }
      } catch (error) {
        console.error("Unexpected error fetching featured properties:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchFeaturedProperties();

    return () => {
      isMounted = false;
    };
  }, []);

  const getMainImage = (prop: any) => {
    if (prop.property_images && prop.property_images.length > 0) {
      const orderedImages = [...prop.property_images].sort(
        (a: any, b: any) =>
          (a.display_order ?? Number.MAX_SAFE_INTEGER) -
          (b.display_order ?? Number.MAX_SAFE_INTEGER)
      );

      return orderedImages[0]?.url || null;
    }

    return null;
  };

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">
              Featured Properties{" "}
              <span className="text-[#ae884e]">.</span>
            </h2>

            <p className="text-gray-500 font-light text-lg">
              Hand-picked premium homes ready for you.
            </p>
          </div>

          <Link
            href="/listings"
            className="text-[#1c3053] font-medium hover:text-[#ae884e] transition-colors flex items-center"
          >
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">
            Loading featured properties...
          </div>
        ) : featured.length === 0 ? (
          <div className="text-center py-10 text-gray-500 border border-gray-100 rounded-2xl bg-gray-50">
            No featured properties available at the moment.
          </div>
        ) : (
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-8 pb-8 hide-scrollbar md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible">
            {featured.map((prop, index) => {
              const mainImageUrl = getMainImage(prop);

              return (
                <motion.div
                  key={prop.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="min-w-[85vw] md:min-w-0 snap-center"
                >
                  <Link
                    href={`/listings/${prop.id}`}
                    className="group block bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col h-full cursor-pointer"
                  >
                    <div className="w-full h-64 overflow-hidden relative bg-gray-100 flex items-center justify-center">
                      {mainImageUrl ? (
                        mainImageUrl.match(/\.(mp4|webm|mov)$/i) ? (
                          <video
                            src={mainImageUrl}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            muted
                            playsInline
                            preload="metadata"
                          />
                        ) : (
                          <Image
                            src={mainImageUrl}
                            alt={prop.title || "Property"}
                            fill
                            sizes="(max-width: 767px) 85vw, (max-width: 1023px) 50vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            quality={75}
                          />
                        )
                      ) : (
                        <div className="text-gray-400 flex flex-col items-center">
                          <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                          <span className="text-sm">No Image</span>
                        </div>
                      )}

                      <div
                        className={`absolute top-4 right-4 text-xs font-semibold px-3 py-1.5 rounded-full ${
                          prop.availability_status === "Available"
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {prop.availability_status}
                      </div>
                    </div>

                    <div className="p-8 flex flex-col flex-grow">
                      <h3 className="text-2xl font-semibold tracking-tight text-gray-900 mb-2 line-clamp-1">
                        {prop.title}
                      </h3>

                      <div className="flex items-center text-gray-600 mb-5">
                        <MapPin className="w-4 h-4 mr-1.5 text-[#ae884e]" />

                        <span className="text-sm font-medium">
                          {prop.short_location}
                        </span>
                      </div>

                      <div className="text-2xl font-medium text-[#1c3053] mb-6">
                        {prop.monthly_rent != null
                          ? `£${Number(prop.monthly_rent).toLocaleString()}`
                          : "Price on request"}{" "}
                        <span className="text-sm text-gray-400 font-light">
                          {prop.monthly_rent != null ? "pcm" : ""}
                        </span>
                      </div>

                      <div className="flex gap-6 mb-8 border-t border-gray-100 pt-6">
                        <div className="flex items-center text-gray-600">
                          <Bed className="w-5 h-5 mr-2 stroke-[1.5] text-[#ae884e]" />

                          <span className="font-light">
                            {prop.bedrooms} Beds
                          </span>
                        </div>

                        <div className="flex items-center text-gray-600">
                          <Bath className="w-5 h-5 mr-2 stroke-[1.5] text-[#ae884e]" />

                          <span className="font-light">
                            {prop.bathrooms} Baths
                          </span>
                        </div>
                      </div>

                      <div className="mt-auto flex items-center justify-center w-full bg-[#1c3053]/5 text-[#1c3053] py-4 rounded-2xl font-medium text-[15px] group-hover:bg-[#ae884e] group-hover:text-white transition-all duration-300">
                        View Property
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
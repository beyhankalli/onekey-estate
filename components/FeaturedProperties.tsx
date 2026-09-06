"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { MapPin, Bed, Bath, ChevronRight, Search } from "lucide-react";
import { client } from "@/sanity/lib/client";

interface Property {
  _id: string;
  title: string;
  price: string;
  location: string;
  beds: number;
  baths: number;
  _createdAt?: string;
  slug: { current: string };
  interiorImage?: { asset: { url: string } };
}

export default function FeaturedProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBeds, setSelectedBeds] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const query = `*[_type == "property"]{
          _id,
          title,
          price,
          location,
          beds,
          baths,
          _createdAt,
          slug,
          interiorImage{ asset->{ url } }
        }`;
        
        const data = await client.fetch(query);
        setProperties(data);
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const filteredProperties = properties.filter((property) => {
    const matchesSearch = 
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesBeds = true;
    if (selectedBeds !== "all") {
      const targetBedNum = Number(selectedBeds);
      if (targetBedNum === 5) {
        matchesBeds = property.beds >= 5;
      } else {
        matchesBeds = property.beds === targetBedNum;
      }
    }

    return matchesSearch && matchesBeds;
  });

  const sortedProperties = [...filteredProperties].sort((a, b) => {
    const getPriceNum = (priceStr: string) => {
      const num = parseInt(priceStr.replace(/[^0-9]/g, ""), 10);
      return isNaN(num) ? 0 : num;
    };

    if (sortBy === "price-asc") return getPriceNum(a.price) - getPriceNum(b.price);
    if (sortBy === "price-desc") return getPriceNum(b.price) - getPriceNum(a.price);
    if (sortBy === "newest") {
      const dateA = a._createdAt ? new Date(a._createdAt).getTime() : 0;
      const dateB = b._createdAt ? new Date(b._createdAt).getTime() : 0;
      return dateB - dateA;
    }
    return 0;
  });

  if (loading) {
    return <div className="py-20 text-center text-gray-500">Loading properties from database...</div>;
  }

  return (
    <section className="py-20 px-4 max-w-7xl mx-auto w-full bg-white">
      
      <div className="mb-12 text-center">
        <h2 className="text-4xl font-semibold tracking-tight text-gray-900 mb-4">
          Featured Properties<span className="text-[#ae884e]">.</span>
        </h2>
        <p className="text-gray-500 text-lg font-light mb-8">
          Discover our hand-picked selection of premium rental homes.
        </p>

        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-center">
          
          {/* Arama Çubuğu - İngilizce Profesyonel Placeholder */}
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Enter address or postal code (e.g. SW1A, London)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-900/50 focus:outline-none focus:border-[#ae884e] shadow-sm transition-all"
            />
          </div>

          <select 
            value={selectedBeds}
            onChange={(e) => setSelectedBeds(e.target.value)}
            className="w-full md:w-44 px-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:border-[#ae884e] shadow-sm transition-all"
          >
            <option value="all">All Bedrooms</option>
            <option value="1">1 Bedroom</option>
            <option value="2">2 Bedrooms</option>
            <option value="3">3 Bedrooms</option>
            <option value="4">4 Bedrooms</option>
            <option value="5">5+ Bedrooms</option>
          </select>

          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full md:w-48 px-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:border-[#ae884e] shadow-sm transition-all"
          >
            <option value="default">Sort by: Featured</option>
            <option value="newest">Newest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>

        </div>
      </div>

      {sortedProperties.length === 0 ? (
        <div className="text-center text-gray-400 py-16">No matching properties found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {sortedProperties.map((property, index) => (
            <motion.div
              key={property._id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, delay: index * 0.15, ease: "easeOut" }}
              className="bg-white rounded-[2rem] overflow-hidden border border-gray-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col group"
            >
              <div className="w-full h-64 overflow-hidden relative" suppressHydrationWarning>
                <img 
                  src={property.interiorImage?.asset?.url || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"} 
                  alt={property.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              
              <div className="p-8 flex flex-col flex-grow">
                <h3 className="text-2xl font-semibold tracking-tight text-gray-900 mb-2">{property.title}</h3>
                
                <div className="flex items-center text-gray-600 mb-5">
                  <MapPin className="w-4 h-4 mr-1.5 text-[#ae884e]" />
                  <span className="text-sm font-medium">{property.location}</span>
                </div>
                
                <div className="text-2xl font-medium text-[#1c3053] mb-6">
                  {property.price}
                </div>
                
                <div className="flex gap-6 mb-8 border-t border-gray-100 pt-6">
                  <div className="flex items-center text-gray-600">
                    <Bed className="w-5 h-5 mr-2 stroke-[1.5] text-[#ae884e]" />
                    <span className="font-light">{property.beds} Beds</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Bath className="w-5 h-5 mr-2 stroke-[1.5] text-[#ae884e]" />
                    <span className="font-light">{property.baths} Baths</span>
                  </div>
                </div>
                
                <Link 
                  href={`/listings/${property._id}`}
                  className="mt-auto flex items-center justify-center w-full bg-[#1c3053]/5 text-[#1c3053] py-4 rounded-2xl font-medium text-[15px] hover:bg-[#ae884e] hover:text-white transition-all duration-300"
                >
                  View Details
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
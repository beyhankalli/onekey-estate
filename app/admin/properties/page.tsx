"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, Edit, Home } from "lucide-react";

interface PropertyWithAgent {
  id: string;
  title: string;
  property_ref: string;
  short_location: string;
  monthly_rent: number | null;
  availability_status: "Available" | "Let Agreed" | "Unavailable" | null;
  agents: {
    name: string;
  } | null;
}

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<PropertyWithAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchProperties = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("properties")
      .select("*, agents(name)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProperties(data as PropertyWithAgent[]);
    } else if (error) {
      console.error("Error fetching properties:", error);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return;

    const { error } = await supabase.from("properties").delete().eq("id", id);

    if (!error) {
      setProperties((currentProperties) =>
        currentProperties.filter((property) => property.id !== id)
      );
    } else {
      alert("Error deleting property: " + error.message);
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading properties...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Property Management
          </h1>
          <p className="text-gray-500 font-light mt-1">
            Manage your agency listings and availability.
          </p>
        </div>

        <Link
          href="/admin/properties/new"
          className="flex items-center gap-2 bg-[#ae884e] text-white px-5 py-3 rounded-xl font-medium hover:bg-[#8f6e3c] transition-all shadow-md"
        >
          <Plus className="w-5 h-5" />
          Add Property
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden">
        {properties.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No properties found in database.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="p-5">Property</th>
                <th className="p-5">Location</th>
                <th className="p-5">Price</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
              {properties.map((property) => (
                <tr
                  key={property.id}
                  className="hover:bg-gray-50/80 transition-colors"
                >
                  <td className="p-5 font-medium text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-[#1c3053] shrink-0">
                      <Home className="w-5 h-5" />
                    </div>

                    <div>
                      <p>{property.title}</p>
                      <span className="text-xs text-gray-400 font-light">
                        Ref: {property.property_ref}
                      </span>
                    </div>
                  </td>

                  <td className="p-5">{property.short_location}</td>

                  <td className="p-5 font-medium text-gray-900">
                    £{property.monthly_rent?.toLocaleString() ?? "—"} pcm
                  </td>

                  <td className="p-5">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        property.availability_status === "Available"
                          ? "bg-green-50 text-green-700"
                          : "bg-orange-50 text-orange-700"
                      }`}
                    >
                      {property.availability_status ?? "Unknown"}
                    </span>
                  </td>

                  <td className="p-5 text-right space-x-2">
                    <Link
                      href={`/admin/properties/${property.id}/edit`}
                      className="inline-flex p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
                      title="Edit Property"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={() => handleDelete(property.id)}
                      className="inline-flex p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
                      title="Delete Property"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
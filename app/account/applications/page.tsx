"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface ApplicationProperty {
  title?: string | null;
  short_location?: string | null;
  property_ref?: string | null;
}

interface CustomerApplication {
  id: string;
  customer_id?: string | null;
  property_id?: string | null;
  message?: string | null;
  status: string;
  created_at: string;
  property?: ApplicationProperty | ApplicationProperty[] | null;
}

export default function CustomerApplicationsPage() {
  const [applications, setApplications] = useState<CustomerApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    async function loadApplications() {
      const supabase = createClient();

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push("/login");
          return;
        }

        const { data, error } = await supabase
          .from("applications")
          .select(
            "*, property:properties(title, short_location, property_ref)"
          )
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data) {
          setApplications(data as CustomerApplication[]);
        }
      } catch (err) {
        console.error("Error loading applications:", err);
      } finally {
        setLoading(false);
      }
    }

    loadApplications();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
        Loading applications...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-[#1c3053] text-white py-12 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <Link
              href="/account"
              className="inline-flex items-center gap-1.5 text-xs text-[#ae884e] font-semibold uppercase tracking-wider mb-2 hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-semibold">Online Applications</h1>
            <p className="text-gray-300 text-sm font-light mt-1">
              Track the status of your property applications.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 -mt-6">
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-6 sm:p-8">
          {applications.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>You have no active applications.</p>
              <Link
                href="/listings"
                className="inline-block mt-4 bg-[#1c3053] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#ae884e] transition-colors"
              >
                Browse Listings
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => {
                const property = Array.isArray(app.property)
                  ? app.property[0]
                  : app.property;

                return (
                  <div
                    key={app.id}
                    className="p-6 rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {property?.title || "Property Application"}
                      </h3>

                      <p className="text-sm text-gray-500 mt-0.5">
                        {property?.short_location || "Location N/A"}
                      </p>

                      {app.message && (
                        <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg mt-3 border border-gray-100">
                          Note: {app.message}
                        </p>
                      )}

                      <p className="text-xs text-gray-400 mt-2">
                        Submitted:{" "}
                        {new Date(app.created_at).toLocaleDateString("en-GB")}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold ${
                        app.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : app.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {app.status === "approved" && (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}

                      {app.status === "rejected" && (
                        <XCircle className="w-3.5 h-3.5" />
                      )}

                      {app.status === "pending" && (
                        <Clock className="w-3.5 h-3.5" />
                      )}

                      {app.status.charAt(0).toUpperCase() +
                        app.status.slice(1)}
                    </span>
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
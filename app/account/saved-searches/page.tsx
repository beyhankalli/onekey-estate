"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, ArrowLeft, Trash2, ArrowRight } from "lucide-react";

interface SavedSearch {
  id: string;
  customer_id?: string | null;
  title?: string | null;
  created_at: string;
}

export default function CustomerSavedSearchesPage() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    async function loadSavedSearches() {
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
          .from("saved_searches")
          .select("*")
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        if (data) {
          setSearches(data as SavedSearch[]);
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Unknown error occurred.";

        console.error("Error loading saved searches:", message);
      } finally {
        setLoading(false);
      }
    }

    loadSavedSearches();
  }, [router]);

  const handleDelete = async (id: string) => {
    const supabase = createClient();

    const { error } = await supabase
      .from("saved_searches")
      .delete()
      .eq("id", id);

    if (!error) {
      setSearches((currentSearches) =>
        currentSearches.filter((search) => search.id !== id)
      );
    } else {
      console.error("Error deleting saved search:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
        Loading saved searches...
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

            <h1 className="text-3xl font-semibold">Saved Searches</h1>

            <p className="text-gray-300 text-sm font-light mt-1">
              Quickly access your preferred search filters and alerts.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 -mt-6">
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-6 sm:p-8">
          {searches.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />

              <p>You have no saved searches yet.</p>

              <Link
                href="/listings"
                className="inline-block mt-4 bg-[#1c3053] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#ae884e] transition-colors"
              >
                Explore Properties
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {searches.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between gap-4"
                >
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {item.title}
                    </h3>

                    <p className="text-xs text-gray-400 mt-1">
                      Saved on:{" "}
                      {new Date(item.created_at).toLocaleDateString("en-GB")}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href="/listings"
                      className="inline-flex items-center gap-1 px-4 py-2 bg-[#1c3053] text-white rounded-xl text-xs font-medium hover:bg-[#ae884e] transition-colors"
                    >
                      Run Search{" "}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete search"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
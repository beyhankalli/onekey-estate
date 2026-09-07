"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Star, MessageSquareQuote } from "lucide-react";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchReviews() {
      const { data } = await supabase.from("reviews").select("*").eq("is_approved", true).order("created_at", { ascending: false });
      if (data) setReviews(data);
      setLoading(false);
    }
    fetchReviews();
  }, [supabase]);

  if (loading) return <div className="min-h-screen pt-32 text-center text-gray-500">Loading reviews...</div>;

  return (
    <div className="bg-gray-50 min-h-screen pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900 mb-4">Client Testimonials<span className="text-[#ae884e]">.</span></h1>
          <p className="text-gray-500 text-lg font-light max-w-2xl mx-auto">Read what our valued tenants and landlords have to say about their experience with OneKey.</p>
        </div>

        {reviews.length === 0 ? (
          <div className="bg-white p-12 rounded-[2rem] text-center border border-gray-100 shadow-sm text-gray-500">
            <MessageSquareQuote className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p>No reviews published yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {reviews.map((rev) => (
              <div key={rev.id} className="bg-white p-10 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                  <div className="flex gap-1 mb-6 text-[#ae884e]">
                    {[...Array(rev.rating)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
                  </div>
                  <p className="text-gray-700 italic font-light mb-8">"{rev.comment}"</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{rev.client_name}</h4>
                  <p className="text-sm text-gray-500 font-light">{rev.location_tag}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
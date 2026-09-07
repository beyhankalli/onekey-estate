"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Star, Plus, Trash2, X, Save, MessageSquareQuote } from "lucide-react";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ client_name: "", location_tag: "", comment: "", rating: 5 });
  const supabase = createClient();

  const fetchReviews = async () => {
    setLoading(true);
    const { data } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
    if (data) setReviews(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [supabase]);

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("reviews").insert([formData]);
    if (error) {
      alert("Error adding review: " + error.message);
    } else {
      setIsAdding(false);
      setFormData({ client_name: "", location_tag: "", comment: "", rating: 5 });
      fetchReviews();
      alert("Review successfully added!");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (!error) fetchReviews();
  };

  if (loading && reviews.length === 0) return <div className="text-gray-500">Loading reviews...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Client Reviews</h1>
          <p className="text-gray-500 font-light mt-1">Manage testimonials shown across the website.</p>
        </div>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 bg-[#ae884e] text-white px-5 py-3 rounded-xl font-medium hover:bg-[#8f6e3c] shadow-md">
            <Plus className="w-5 h-5" /> Add New Review
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAddReview} className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 mb-8 space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <h2 className="text-xl font-semibold text-gray-900">New Client Testimonial</h2>
            <button type="button" onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-red-500"><X className="w-6 h-6" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Client Name *</label>
              <input type="text" required placeholder="Emily R." value={formData.client_name} onChange={(e) => setFormData({...formData, client_name: e.target.value})} className="w-full p-3 rounded-xl border border-gray-300 font-medium text-gray-900 outline-none focus:border-[#ae884e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location Tag *</label>
              <input type="text" required placeholder="Rented in Canary Wharf" value={formData.location_tag} onChange={(e) => setFormData({...formData, location_tag: e.target.value})} className="w-full p-3 rounded-xl border border-gray-300 font-medium text-gray-900 outline-none focus:border-[#ae884e]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating (1-5)</label>
            <select value={formData.rating} onChange={(e) => setFormData({...formData, rating: parseInt(e.target.value)})} className="w-full p-3 rounded-xl border border-gray-300 font-medium text-gray-900 bg-white outline-none focus:border-[#ae884e]">
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Review Comment *</label>
            <textarea required rows={3} placeholder="Incredibly smooth process from viewing to moving in..." value={formData.comment} onChange={(e) => setFormData({...formData, comment: e.target.value})} className="w-full p-3 rounded-xl border border-gray-300 font-medium text-gray-900 outline-none focus:border-[#ae884e]"></textarea>
          </div>
          <button type="submit" className="w-full flex items-center justify-center gap-2 bg-[#1c3053] text-white py-4 rounded-xl font-medium hover:bg-[#ae884e] shadow-lg">
            <Save className="w-5 h-5" /> Save Review
          </button>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-8">
        {reviews.length === 0 ? (
          <div className="text-center text-gray-500 flex flex-col items-center py-12">
            <MessageSquareQuote className="w-12 h-12 text-gray-300 mb-4" />
            <p>No reviews found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-6 border border-gray-100 rounded-2xl bg-gray-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex gap-1 mb-3 text-[#ae884e]">
                    {[...Array(rev.rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                  </div>
                  <p className="text-gray-700 italic font-light mb-4">"{rev.comment}"</p>
                </div>
                <div className="flex justify-between items-end border-t border-gray-200/60 pt-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">{rev.client_name}</h4>
                    <p className="text-xs text-gray-500 font-light">{rev.location_tag}</p>
                  </div>
                  <button onClick={() => handleDelete(rev.id)} className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
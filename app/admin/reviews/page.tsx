"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
Star,
Plus,
Trash2,
X,
Save,
MessageSquareQuote,
Pencil,
Check,
Eye,
EyeOff,
} from "lucide-react";

type Review = {
id: string;
client_name: string;
location_tag: string;
comment: string;
rating: number;
is_approved: boolean;
created_at: string;
};

type ReviewForm = {
client_name: string;
location_tag: string;
comment: string;
rating: number;
};

const emptyForm: ReviewForm = {
client_name: "",
location_tag: "",
comment: "",
rating: 5,
};

export default function AdminReviewsPage() {
const [reviews, setReviews] = useState<Review[]>([]);
const [loading, setLoading] = useState(true);
const [isAdding, setIsAdding] = useState(false);
const [editingId, setEditingId] = useState<string | null>(null);
const [saving, setSaving] = useState(false);
const [formData, setFormData] = useState<ReviewForm>(emptyForm);

const supabase = createClient();

const fetchReviews = async () => {
setLoading(true);

const { data, error } = await supabase
  .from("reviews")
  .select("*")
  .order("created_at", { ascending: false });

if (error) {
  console.error("Error fetching reviews:", error);
  alert("Error loading reviews: " + error.message);
} else {
  setReviews((data as Review[]) || []);
}

setLoading(false);

};

useEffect(() => {
fetchReviews();
}, [supabase]);

const resetForm = () => {
setFormData(emptyForm);
setIsAdding(false);
setEditingId(null);
};

const handleAddReview = async (e: React.FormEvent) => {
e.preventDefault();
setSaving(true);

const { error } = await supabase.from("reviews").insert([
  {
    ...formData,
    is_approved: false,
  },
]);

if (error) {
  alert("Error adding review: " + error.message);
} else {
  resetForm();
  await fetchReviews();
  alert(
    "Review successfully added. Approve it when you are ready to publish it."
  );
}

setSaving(false);

};

const handleEditReview = (review: Review) => {
setEditingId(review.id);
setIsAdding(false);

setFormData({
  client_name: review.client_name,
  location_tag: review.location_tag,
  comment: review.comment,
  rating: review.rating,
});

window.scrollTo({ top: 0, behavior: "smooth" });

};

const handleUpdateReview = async (e: React.FormEvent) => {
e.preventDefault();

if (!editingId) return;

setSaving(true);

const { error } = await supabase
  .from("reviews")
  .update(formData)
  .eq("id", editingId);

if (error) {
  alert("Error updating review: " + error.message);
} else {
  resetForm();
  await fetchReviews();
  alert("Review successfully updated!");
}

setSaving(false);

};

const handleToggleApproval = async (review: Review) => {
const newStatus = !review.is_approved;

const { error } = await supabase
  .from("reviews")
  .update({ is_approved: newStatus })
  .eq("id", review.id);

if (error) {
  alert("Error updating review status: " + error.message);
  return;
}

setReviews((current) =>
  current.map((item) =>
    item.id === review.id
      ? { ...item, is_approved: newStatus }
      : item
  )
);

};

const handleDelete = async (id: string) => {
if (
!window.confirm(
"Are you sure you want to permanently delete this review?"
)
) {
return;
}

const { error } = await supabase
  .from("reviews")
  .delete()
  .eq("id", id);

if (error) {
  alert("Error deleting review: " + error.message);
  return;
}

setReviews((current) => current.filter((review) => review.id !== id));

};

const renderForm = () => {
const editing = editingId !== null;

return (
  <form
    onSubmit={editing ? handleUpdateReview : handleAddReview}
    className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 mb-8 space-y-6"
  >
    <div className="flex justify-between items-center border-b border-gray-100 pb-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          {editing ? "Edit Client Testimonial" : "New Client Testimonial"}
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          {editing
            ? "Update the review details below."
            : "New reviews are unpublished until you approve them."}
        </p>
      </div>

      <button
        type="button"
        onClick={resetForm}
        className="text-gray-400 hover:text-red-500 transition"
      >
        <X className="w-6 h-6" />
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Client Name *
        </label>

        <input
          type="text"
          required
          placeholder="Emily R."
          value={formData.client_name}
          onChange={(e) =>
            setFormData({
              ...formData,
              client_name: e.target.value,
            })
          }
          className="w-full p-3 rounded-xl border border-gray-300 font-medium text-gray-900 outline-none focus:border-[#ae884e]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location Tag *
        </label>

        <input
          type="text"
          required
          placeholder="Rented in Canary Wharf"
          value={formData.location_tag}
          onChange={(e) =>
            setFormData({
              ...formData,
              location_tag: e.target.value,
            })
          }
          className="w-full p-3 rounded-xl border border-gray-300 font-medium text-gray-900 outline-none focus:border-[#ae884e]"
        />
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Rating (1-5)
      </label>

      <select
        value={formData.rating}
        onChange={(e) =>
          setFormData({
            ...formData,
            rating: parseInt(e.target.value, 10),
          })
        }
        className="w-full p-3 rounded-xl border border-gray-300 font-medium text-gray-900 bg-white outline-none focus:border-[#ae884e]"
      >
        <option value="5">5 Stars</option>
        <option value="4">4 Stars</option>
        <option value="3">3 Stars</option>
        <option value="2">2 Stars</option>
        <option value="1">1 Star</option>
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Review Comment *
      </label>

      <textarea
        required
        rows={4}
        placeholder="Incredibly smooth process from viewing to moving in..."
        value={formData.comment}
        onChange={(e) =>
          setFormData({
            ...formData,
            comment: e.target.value,
          })
        }
        className="w-full p-3 rounded-xl border border-gray-300 font-medium text-gray-900 outline-none focus:border-[#ae884e]"
      />
    </div>

    <div className="flex gap-3">
      <button
        type="submit"
        disabled={saving}
        className="flex-1 flex items-center justify-center gap-2 bg-[#1c3053] text-white py-4 rounded-xl font-medium hover:bg-[#ae884e] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition"
      >
        <Save className="w-5 h-5" />

        {saving
          ? "Saving..."
          : editing
          ? "Update Review"
          : "Save Review"}
      </button>

      <button
        type="button"
        onClick={resetForm}
        className="px-6 py-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
      >
        Cancel
      </button>
    </div>
  </form>
);

};

if (loading && reviews.length === 0) {
return ( <div className="max-w-6xl mx-auto pb-12"> <div className="text-gray-500">Loading reviews...</div> </div>
);
}

const approvedCount = reviews.filter(
(review) => review.is_approved
).length;

const pendingCount = reviews.filter(
(review) => !review.is_approved
).length;

return ( <div className="max-w-6xl mx-auto pb-12"> <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8"> <div> <h1 className="text-3xl font-semibold text-gray-900">
Client Reviews </h1>

      <p className="text-gray-500 font-light mt-1">
        Manage testimonials shown across the website.
      </p>

      <div className="flex gap-4 mt-3 text-sm">
        <span className="text-green-700">
          {approvedCount} published
        </span>

        <span className="text-amber-700">
          {pendingCount} pending
        </span>
      </div>
    </div>

    {!isAdding && !editingId && (
      <button
        onClick={() => {
          setFormData(emptyForm);
          setIsAdding(true);
        }}
        className="flex items-center justify-center gap-2 bg-[#ae884e] text-white px-5 py-3 rounded-xl font-medium hover:bg-[#8f6e3c] shadow-md transition"
      >
        <Plus className="w-5 h-5" />
        Add New Review
      </button>
    )}
  </div>

  {(isAdding || editingId) && renderForm()}

  <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-8">
    {reviews.length === 0 ? (
      <div className="text-center text-gray-500 flex flex-col items-center py-12">
        <MessageSquareQuote className="w-12 h-12 text-gray-300 mb-4" />
        <p>No reviews found.</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className={`p-6 border rounded-2xl flex flex-col justify-between transition ${
              rev.is_approved
                ? "border-green-200 bg-green-50/30"
                : "border-amber-200 bg-amber-50/30"
            }`}
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-1 text-[#ae884e]">
                  {[
                    ...Array(
                      Math.min(
                        Math.max(rev.rating || 0, 0),
                        5
                      )
                    ),
                  ].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-current"
                    />
                  ))}
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                    rev.is_approved
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {rev.is_approved ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      Published
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      Pending
                    </>
                  )}
                </span>
              </div>

              <p className="text-gray-700 italic font-light mb-4">
                "{rev.comment}"
              </p>
            </div>

            <div className="border-t border-gray-200/60 pt-4">
              <div className="flex justify-between items-end gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {rev.client_name}
                  </h4>

                  <p className="text-xs text-gray-500 font-light">
                    {rev.location_tag}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleApproval(rev)}
                    title={
                      rev.is_approved
                        ? "Unpublish review"
                        : "Publish review"
                    }
                    className={`p-2 bg-white border rounded-lg transition ${
                      rev.is_approved
                        ? "border-green-200 text-green-600 hover:text-amber-600 hover:bg-amber-50"
                        : "border-amber-200 text-amber-600 hover:text-green-600 hover:bg-green-50"
                    }`}
                  >
                    {rev.is_approved ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => handleEditReview(rev)}
                    title="Edit review"
                    className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-[#ae884e] hover:bg-[#ae884e]/5 transition"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(rev.id)}
                    title="Delete review"
                    className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</div>
);
}

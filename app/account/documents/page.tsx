"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  ArrowLeft,
  Upload,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";

interface CustomerDocument {
  id: string;
  customer_id?: string | null;
  category: string;
  document_number: string;
  full_name: string;
  share_code?: string | null;
  file_url: string;
  status: string;
  created_at: string;
}

export default function CustomerDocumentsPage() {
  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState("Passport");
  const [customCategory, setCustomCategory] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [shareCode, setShareCode] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [openingDocumentId, setOpeningDocumentId] = useState<string | null>(
    null
  );

  const router = useRouter();

  useEffect(() => {
    async function loadDocs() {
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
          .from("customer_documents")
          .select("*")
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data) {
          setDocuments(data as CustomerDocument[]);
        }
      } catch (err) {
        console.error("Error loading documents:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDocs();
  }, [router]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

    const finalCategory =
      category === "Other"
        ? customCategory.trim() || "Other"
        : category;

    setUploading(true);

    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Unauthorized");
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("customer-documents")
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: newDoc, error: dbError } = await supabase
        .from("customer_documents")
        .insert({
          customer_id: user.id,
          category: finalCategory,
          document_number: documentNumber,
          full_name: fullName,
          share_code: shareCode || null,
          file_url: fileName,
          status: "under_review",
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      setDocuments((currentDocuments) => [
        newDoc as CustomerDocument,
        ...currentDocuments,
      ]);

      setFile(null);
      setDocumentNumber("");
      setFullName("");
      setShareCode("");
      setCustomCategory("");

      alert("Document uploaded successfully and is now Under Review.");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to upload document.";

      alert(message);
    } finally {
      setUploading(false);
    }
  };

  const getStoragePath = (value: string) => {
    if (!value) return "";

    const publicMarker =
      "/storage/v1/object/public/customer-documents/";
    const signedMarker =
      "/storage/v1/object/sign/customer-documents/";

    if (value.includes(publicMarker)) {
      return value.split(publicMarker)[1].split("?")[0];
    }

    if (value.includes(signedMarker)) {
      return value.split(signedMarker)[1].split("?")[0];
    }

    return value.replace(/^\/+/, "");
  };

  const handleViewDocument = async (doc: CustomerDocument) => {
    setOpeningDocumentId(doc.id);

    const supabase = createClient();

    try {
      const path = getStoragePath(doc.file_url);

      if (!path) {
        throw new Error("Document file path is missing.");
      }

      const { data, error } = await supabase.storage
        .from("customer-documents")
        .createSignedUrl(path, 300);

      if (error || !data?.signedUrl) {
        throw (
          error ||
          new Error("Unable to create secure document link.")
        );
      }

      window.open(
        data.signedUrl,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to open document.";

      alert(message);
    } finally {
      setOpeningDocumentId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
        Loading documents...
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

            <h1 className="text-3xl font-semibold">
              Verification Documents
            </h1>

            <p className="text-gray-300 text-sm font-light mt-1">
              Upload and manage your identity and address proofs.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 -mt-6 space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Upload New Document
          </h2>

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Document Category
                </label>

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e] text-gray-900"
                >
                  <option value="Passport">Passport</option>
                  <option value="Biometric Residence Permit (BRP)">
                    Biometric Residence Permit (BRP)
                  </option>
                  <option value="Driving Licence">
                    Driving Licence
                  </option>
                  <option value="National ID Card">
                    National ID Card
                  </option>
                  <option value="Travel Document">
                    Travel Document
                  </option>
                  <option value="Proof of Address">
                    Proof of Address
                  </option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {category === "Other" && (
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Specify Document Type
                  </label>

                  <input
                    type="text"
                    required
                    value={customCategory}
                    onChange={(e) =>
                      setCustomCategory(e.target.value)
                    }
                    placeholder="e.g. Visa Document"
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e]"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Full Name on Document
                </label>

                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Document / ID Number
                </label>

                <input
                  type="text"
                  required
                  value={documentNumber}
                  onChange={(e) =>
                    setDocumentNumber(e.target.value)
                  }
                  placeholder="AB123456C"
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Share Code (Optional)
                </label>

                <input
                  type="text"
                  value={shareCode}
                  onChange={(e) => setShareCode(e.target.value)}
                  placeholder="e.g. W12345678"
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#ae884e]/20 focus:border-[#ae884e]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                Select File (Image or PDF)
              </label>

              <input
                type="file"
                required
                accept="image/*,.pdf"
                onChange={(e) =>
                  setFile(e.target.files?.[0] || null)
                }
                className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-[#1c3053] hover:file:bg-gray-200"
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="flex items-center justify-center gap-2 w-full bg-[#1c3053] hover:bg-[#ae884e] text-white py-3 rounded-xl font-medium transition-colors shadow-sm disabled:bg-gray-400"
            >
              <Upload className="w-4 h-4" />
              {uploading ? "Uploading..." : "Upload Document"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Your Uploaded Documents
          </h2>

          {documents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>No documents uploaded yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {doc.category}
                      </span>

                      <span className="text-xs text-gray-600 font-medium">
                        ({doc.document_number})
                      </span>
                    </div>

                    <p className="text-sm text-gray-800 mt-0.5">
                      Name: {doc.full_name}
                    </p>

                    {doc.share_code && (
                      <p className="text-xs text-[#ae884e] font-semibold mt-0.5">
                        Share Code: {doc.share_code}
                      </p>
                    )}

                    <p className="text-xs text-gray-500 mt-1">
                      Uploaded:{" "}
                      {new Date(doc.created_at).toLocaleDateString(
                        "en-GB"
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleViewDocument(doc)}
                      disabled={openingDocumentId === doc.id}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#1c3053] rounded-xl text-xs font-semibold transition-colors disabled:opacity-60 disabled:cursor-wait"
                    >
                      {openingDocumentId === doc.id
                        ? "Opening..."
                        : "View File"}

                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>

                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                        doc.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : doc.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {doc.status === "approved" && (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}

                      {doc.status === "rejected" && (
                        <XCircle className="w-3.5 h-3.5" />
                      )}

                      {doc.status === "under_review" && (
                        <Clock className="w-3.5 h-3.5" />
                      )}

                      {doc.status.replace("_", " ").toUpperCase()}
                    </span>
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
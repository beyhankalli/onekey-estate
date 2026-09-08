"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Home,
  MapPin,
  PoundSterling,
  ClipboardList,
  FileText,
  ExternalLink,
  Plus,
  Trash2,
  UserX,
  UserCheck,
  AlertTriangle,
  Save,
  StickyNote,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Hash,    
  Edit3,   
  X        
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  lead_status: string;
  preferences_json: any;
  notes: string | null;
  created_at: string;
  is_active?: boolean;
  email_verified?: boolean;
  phone_verified?: boolean;
  account_number?: string;
}

interface Booking {
  id: string;
  viewing_date: string;
  start_time: string;
  status: string;
  property?: { title: string };
}

interface Message {
  id: string;
  message: string;
  created_at: string;
}

interface CustomerDocument {
  id: string;
  category: string;
  document_number: string | null;
  full_name: string | null;
  share_code: string | null;
  file_url: string;
  status: string;
  created_at: string;
}

interface PaymentRecord {
  id: string;
  customer_id: string;
  payment_month: string;
  status: "paid" | "unpaid" | "partial" | "overdue";
  amount: number | null;
  due_date: string | null;
  paid_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  const supabase = createClient();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [openingDocumentId, setOpeningDocumentId] = useState<string | null>(null);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [verifyingContact, setVerifyingContact] = useState(false); 

  const [adminNotes, setAdminNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isChecked, setIsChecked] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [category, setCategory] = useState("Passport");
  const [customCategory, setCustomCategory] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [docFullName, setDocFullName] = useState("");
  const [shareCode, setShareCode] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentMonth, setPaymentMonth] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<
    "paid" | "unpaid" | "partial" | "overdue"
  >("unpaid");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDueDate, setPaymentDueDate] = useState("");
  const [paymentPaidDate, setPaymentPaidDate] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  // Müsteri Bilgilerini Düzenleme Modali State'leri
  const [showEditModal, setShowEditModal] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "", email: "", phone: "", budget: "", propertyType: "", area: "", bedrooms: ""
  });

  useEffect(() => {
    if (customerId) {
      fetchFullCustomerProfile();
    }
  }, [customerId]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;

    if (showDeleteModal && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showDeleteModal, countdown]);

  const fetchFullCustomerProfile = async () => {
    try {
      setLoading(true);

      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();

      if (customerError) throw customerError;

      setCustomer(customerData);

      if (customerData) {
        setDocFullName(customerData.name || "");
        setAdminNotes(customerData.notes || "");
      }

      const { data: bookingsData } = await supabase
        .from("bookings")
        .select(
          "id, viewing_date, start_time, status, property:properties(title)"
        )
        .eq("customer_id", customerId)
        .order("viewing_date", { ascending: false });

      if (bookingsData) {
        setBookings(bookingsData as any);
      }

      const { data: messagesData } = await supabase
        .from("messages")
        .select("id, message, created_at")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (messagesData) {
        setMessages(messagesData);
      }

      const { data: docsData } = await supabase
        .from("customer_documents")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (docsData) {
        setDocuments(docsData);
      }

      const { data: paymentsData, error: paymentsError } = await supabase
        .from("customer_payment_records")
        .select("*")
        .eq("customer_id", customerId)
        .order("payment_month", { ascending: false });

      if (paymentsError) {
        console.error("Error loading payment records:", paymentsError);
      } else if (paymentsData) {
        setPaymentRecords(paymentsData as PaymentRecord[]);
      }
    } catch (error) {
      console.error("Error loading customer profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setUpdatingStatus(true);

      const { error } = await supabase
        .from("customers")
        .update({ lead_status: newStatus })
        .eq("id", customerId);

      if (error) throw error;

      if (customer) {
        setCustomer({ ...customer, lead_status: newStatus });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status, please try again.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleContactVerification = async (type: "email" | "phone", currentStatus: boolean | undefined) => {
    if (!customer) return;
    
    setVerifyingContact(true);
    const newStatus = !currentStatus;

    try {
      const response = await fetch("/api/admin/verify-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          type,
          verify: newStatus
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Dogrulama islemi basarisiz oldu.");
      }

      const updateField = type === "email" ? { email_verified: newStatus } : { phone_verified: newStatus };
      setCustomer({ ...customer, ...updateField });

      alert(`Success! ${type === 'email' ? 'Email' : 'Phone'} verification status has been updated in the system.`);
    } catch (err: any) {
      alert(`Failed to update ${type} verification status: ${err.message}`);
    } finally {
      setVerifyingContact(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true);

      const { error } = await supabase
        .from("customers")
        .update({ notes: adminNotes })
        .eq("id", customerId);

      if (error) throw error;

      alert("Customer notes saved successfully!");
    } catch (err: any) {
      alert("Failed to save notes: " + err.message);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleToggleActiveStatus = async () => {
    if (!customer) return;

    const nextStatus = customer.is_active === false ? true : false;
    const actionText = nextStatus ? "restore" : "deactivate and suspend";

    if (
      !window.confirm(
        `Are you sure you want to ${actionText} this customer account?`
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("customers")
        .update({ is_active: nextStatus })
        .eq("id", customerId);

      if (error) throw error;

      setCustomer({ ...customer, is_active: nextStatus });

      alert(
        `Customer account successfully ${
          nextStatus ? "activated" : "deactivated"
        }!`
      );
    } catch (err: any) {
      alert("Failed to update account status: " + err.message);
    }
  };

  const handlePermanentDelete = async () => {
    if (countdown > 0 || !isChecked) return;

    setDeleting(true);

    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", customerId);

      if (error) throw error;

      alert("Customer account permanently deleted.");
      router.push("/admin/customers");
      router.refresh();
    } catch (err: any) {
      alert("Failed to delete customer: " + err.message);
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleDocStatusChange = async (
    docId: string,
    newStatus: string
  ) => {
    try {
      const { error } = await supabase
        .from("customer_documents")
        .update({ status: newStatus })
        .eq("id", docId);

      if (error) throw error;

      setDocuments(
        documents.map((d) =>
          d.id === docId ? { ...d, status: newStatus } : d
        )
      );
    } catch {
      alert("Failed to update document status.");
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const { error } = await supabase
        .from("customer_documents")
        .delete()
        .eq("id", docId);

      if (error) throw error;

      setDocuments(documents.filter((d) => d.id !== docId));
    } catch {
      alert("Failed to delete document.");
    }
  };

  const handleAdminUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      return alert("Please select a file.");
    }

    const finalCategory =
      category === "Other"
        ? customCategory.trim() || "Other"
        : category;

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${customerId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("customer-documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: newDoc, error: dbError } = await supabase
        .from("customer_documents")
        .insert({
          customer_id: customerId,
          category: finalCategory,
          document_number: docNumber,
          full_name: docFullName,
          share_code: shareCode || null,
          file_url: fileName,
          status: "approved",
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setDocuments([newDoc, ...documents]);
      setShowAddDocModal(false);
      setFile(null);
      setDocNumber("");
      setShareCode("");
      setCustomCategory("");

      alert("Document added successfully.");
    } catch (err: any) {
      alert(err.message || "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  const getStoragePath = (value: string) => {
    if (!value) return "";
    const publicMarker = "/storage/v1/object/public/customer-documents/";
    const signedMarker = "/storage/v1/object/sign/customer-documents/";
    if (value.includes(publicMarker)) return value.split(publicMarker)[1].split("?")[0];
    if (value.includes(signedMarker)) return value.split(signedMarker)[1].split("?")[0];
    return value.replace(/^\/+/, "");
  };

  const handleViewDocument = async (doc: CustomerDocument) => {
    setOpeningDocumentId(doc.id);
    try {
      const path = getStoragePath(doc.file_url);
      if (!path) throw new Error("Document file path is missing.");
      const { data, error } = await supabase.storage
        .from("customer-documents")
        .createSignedUrl(path, 300);
      if (error || !data?.signedUrl) throw error || new Error("Unable to create secure document link.");
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      alert(err.message || "Unable to open document.");
    } finally {
      setOpeningDocumentId(null);
    }
  };

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-01`;
  };

  const resetPaymentForm = () => {
    setPaymentMonth(getCurrentMonth());
    setPaymentStatus("unpaid");
    setPaymentAmount("");
    setPaymentDueDate("");
    setPaymentPaidDate("");
    setPaymentNotes("");
  };

  const openNewPaymentForm = () => {
    resetPaymentForm();
    setShowPaymentForm(true);
  };

  const openEditPaymentForm = (payment: PaymentRecord) => {
    setPaymentMonth(payment.payment_month);
    setPaymentStatus(payment.status);
    setPaymentAmount(
      payment.amount !== null && payment.amount !== undefined
        ? String(payment.amount)
        : ""
    );
    setPaymentDueDate(payment.due_date || "");
    setPaymentPaidDate(payment.paid_date || "");
    setPaymentNotes(payment.notes || "");
    setShowPaymentForm(true);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentMonth) {
      alert("Please select a payment month.");
      return;
    }

    setSavingPayment(true);

    try {
      const normalizedMonth = `${paymentMonth.slice(0, 7)}-01`;

      const { data: savedPayment, error } = await supabase
        .from("customer_payment_records")
        .upsert(
          {
            customer_id: customerId,
            payment_month: normalizedMonth,
            status: paymentStatus,
            amount: paymentAmount ? Number(paymentAmount) : null,
            due_date: paymentDueDate || null,
            paid_date:
              paymentStatus === "paid" || paymentStatus === "partial"
                ? paymentPaidDate || null
                : null,
            notes: paymentNotes.trim() || null,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "customer_id,payment_month",
          }
        )
        .select()
        .single();

      if (error) throw error;

      setPaymentRecords((current) => {
        const existing = current.find(
          (record) => record.payment_month === normalizedMonth
        );

        if (existing) {
          return current
            .map((record) =>
              record.id === existing.id
                ? (savedPayment as PaymentRecord)
                : record
            )
            .sort(
              (a, b) =>
                new Date(b.payment_month).getTime() -
                new Date(a.payment_month).getTime()
            );
        }

        return [savedPayment as PaymentRecord, ...current].sort(
          (a, b) =>
            new Date(b.payment_month).getTime() -
            new Date(a.payment_month).getTime()
        );
      });

      setShowPaymentForm(false);
      resetPaymentForm();

      alert("Payment record saved successfully.");
    } catch (err: any) {
      console.error("Payment save error:", err);
      alert(err.message || "Failed to save payment record.");
    } finally {
      setSavingPayment(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this payment record?"
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("customer_payment_records")
        .delete()
        .eq("id", paymentId);

      if (error) throw error;

      setPaymentRecords(
        paymentRecords.filter(
          (payment) => payment.id !== paymentId
        )
      );
    } catch (err: any) {
      alert(err.message || "Failed to delete payment record.");
    }
  };

  const formatPaymentMonth = (dateString: string) => {
    const date = new Date(
      `${dateString.slice(0, 10)}T00:00:00`
    );

    return date.toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });
  };

  const formatPaymentDate = (dateString: string | null) => {
    if (!dateString) return "—";

    return new Date(
      `${dateString.slice(0, 10)}T00:00:00`
    ).toLocaleDateString("en-GB");
  };

  const getPaymentStatusClasses = (
    status: PaymentRecord["status"]
  ) => {
    switch (status) {
      case "paid":
        return "bg-green-50 text-green-800 border-green-200";
      case "partial":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "overdue":
        return "bg-red-50 text-red-800 border-red-200";
      default:
        return "bg-amber-50 text-amber-800 border-amber-200";
    }
  };

  const getPaymentStatusLabel = (
    status: PaymentRecord["status"]
  ) => {
    switch (status) {
      case "paid":
        return "Paid";
      case "partial":
        return "Partial";
      case "overdue":
        return "Overdue";
      default:
        return "Unpaid";
    }
  };

  // Müsteri Bakiyesini Hesaplama (Ödenmemis veya Gecikmis Toplam Tutar)
  const calculateBalance = () => {
    let totalBalance = 0;
    paymentRecords.forEach((record) => {
      if (record.status === "unpaid" || record.status === "overdue") {
        totalBalance += Number(record.amount || 0);
      }
    });
    return totalBalance;
  };

  // Profili Düzenleme Mantigi
  const openEditModal = () => {
    const prefs = customer?.preferences_json || {};
    setEditForm({
      name: customer?.name || "",
      email: customer?.email || "",
      phone: customer?.phone || "",
      budget: prefs.budget || "",
      propertyType: prefs.propertyType || "",
      area: prefs.area || "",
      bedrooms: prefs.bedrooms || ""
    });
    setShowEditModal(true);
  };

  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const updatedPreferences = {
        budget: editForm.budget,
        propertyType: editForm.propertyType,
        area: editForm.area,
        bedrooms: editForm.bedrooms,
      };

      const { error } = await supabase
        .from("customers")
        .update({
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          preferences_json: updatedPreferences
        })
        .eq("id", customerId);

      if (error) throw error;

      if (customer) {
        setCustomer({
          ...customer,
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          preferences_json: updatedPreferences
        });
      }

      setShowEditModal(false);
      alert("Customer profile successfully updated.");
    } catch (err: any) {
      alert("Failed to update profile: " + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading customer profile...
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Customer not found.</p>

        <button
          onClick={() => router.push("/admin/customers")}
          className="mt-4 text-[#ae884e] underline"
        >
          Return to Customers
        </button>
      </div>
    );
  }

  const prefs = customer.preferences_json || {};
  const isInactive = customer.is_active === false;
  const currentBalance = calculateBalance();

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 relative">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/customers"
            className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">
                {customer.name}
              </h1>
              {customer.account_number && (
                <span className="flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md">
                  <Hash className="w-3.5 h-3.5" /> {customer.account_number}
                </span>
              )}

              {/* Bakiye Rozeti Eklendi */}
              <span className={`flex items-center gap-1 text-xs font-extrabold px-2.5 py-0.5 rounded-md border ${
                currentBalance > 0 ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"
              }`}>
                <PoundSterling className="w-3.5 h-3.5" /> Balance: £{currentBalance.toFixed(2)}
              </span>

              {isInactive && (
                <span className="text-xs font-bold px-2.5 py-0.5 bg-red-100 text-red-700 rounded-full">
                  INACTIVE / SUSPENDED
                </span>
              )}
            </div>

            <p className="text-sm text-gray-500 mt-0.5">
              Customer since{" "}
              {new Date(customer.created_at).toLocaleDateString(
                "en-GB"
              )}
            </p>
          </div>
        </div>

        {/* Two-row control group */}
        <div className="flex flex-col items-end gap-2 lg:ml-auto">
          {/* Top row */}
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
              <label className="text-xs font-semibold text-gray-700 pl-1">
                Lead Status:
              </label>

              <select
                value={customer.lead_status}
                onChange={(e) =>
                  handleStatusChange(e.target.value)
                }
                disabled={updatingStatus}
                className="text-xs border border-gray-200 rounded-lg focus:ring-[#ae884e] focus:border-[#ae884e] bg-white py-1.5 px-3 text-gray-900 font-medium outline-none"
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Viewing Booked">
                  Viewing Booked
                </option>
                <option value="Viewing Completed">
                  Viewing Completed
                </option>
                <option value="Application">
                  Application
                </option>
                <option value="Offer">Offer</option>
                <option value="Completed">Completed</option>
                <option value="Lost">Lost</option>
              </select>
            </div>

            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#1c3053] hover:bg-[#ae884e] text-white rounded-xl text-xs font-semibold transition-all shadow-sm disabled:bg-gray-400"
            >
              <Save className="w-4 h-4" />
              {savingNotes ? "Saving..." : "Save"}
            </button>
          </div>

          {/* Bottom row */}
          <div className="flex flex-wrap items-center justify-end gap-3">
            {isInactive && (
              <button
                onClick={() => {
                  setCountdown(5);
                  setIsChecked(false);
                  setShowDeleteModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded-xl text-xs font-semibold transition-all shadow-sm"
                title="Permanently Delete"
              >
                <Trash2 className="w-4 h-4" />
                Delete Permanently
              </button>
            )}

            <button
              onClick={handleToggleActiveStatus}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm ${
                isInactive
                  ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                  : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
              }`}
            >
              {isInactive ? (
                <UserCheck className="w-4 h-4" />
              ) : (
                <UserX className="w-4 h-4" />
              )}

              {isInactive
                ? "Restore Account"
                : "Deactivate Account"}
            </button>
          </div>
        </div>
      </div>

      {/* Profil Düzenleme Modali */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-gray-100 space-y-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#ae884e]" /> Edit Customer Profile
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X className="w-6 h-6"/>
              </button>
            </div>

            <form onSubmit={handleEditProfileSubmit} className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Contact Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      required 
                      value={editForm.name} 
                      onChange={e => setEditForm({...editForm, name: e.target.value})} 
                      className="w-full p-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#ae884e] outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Phone Number</label>
                    <input 
                      type="text" 
                      value={editForm.phone} 
                      onChange={e => setEditForm({...editForm, phone: e.target.value})} 
                      className="w-full p-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#ae884e] outline-none" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Email Address</label>
                    <input 
                      type="email" 
                      required 
                      value={editForm.email} 
                      onChange={e => setEditForm({...editForm, email: e.target.value})} 
                      className="w-full p-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#ae884e] outline-none" 
                    />
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              <div>
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Property Preferences</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Budget</label>
                    <input 
                      type="text" 
                      value={editForm.budget} 
                      onChange={e => setEditForm({...editForm, budget: e.target.value})} 
                      className="w-full p-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#ae884e] outline-none placeholder:text-gray-400" 
                      placeholder="e.g. £1500 pcm" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Property Type</label>
                    <input 
                      type="text" 
                      value={editForm.propertyType} 
                      onChange={e => setEditForm({...editForm, propertyType: e.target.value})} 
                      className="w-full p-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#ae884e] outline-none placeholder:text-gray-400" 
                      placeholder="e.g. House, Apartment" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Preferred Area</label>
                    <input 
                      type="text" 
                      value={editForm.area} 
                      onChange={e => setEditForm({...editForm, area: e.target.value})} 
                      className="w-full p-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#ae884e] outline-none placeholder:text-gray-400" 
                      placeholder="e.g. Birmingham City Centre" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Bedrooms</label>
                    <input 
                      type="text" 
                      value={editForm.bedrooms} 
                      onChange={e => setEditForm({...editForm, bedrooms: e.target.value})} 
                      className="w-full p-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#ae884e] outline-none placeholder:text-gray-400" 
                      placeholder="e.g. 2-3" 
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={savingProfile} className="px-5 py-2 bg-[#1c3053] hover:bg-[#ae884e] text-white text-sm font-semibold rounded-lg disabled:bg-gray-400 flex items-center gap-2 transition-colors">
                  <Save className="w-4 h-4" /> {savingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3.5 text-red-600">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Permanently Delete Account?
                </h3>

                <p className="text-xs text-gray-500">
                  This action is irreversible and will purge all data.
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600 font-medium leading-relaxed">
              Are you sure you want to permanently delete this account?
              To prevent accidental data loss, please check the box below
              and wait for the countdown timer to finish.
            </p>

            <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100/80 transition-colors">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) =>
                  setIsChecked(e.target.checked)
                }
                className="w-4 h-4 text-red-600 accent-red-600 rounded border-gray-300"
              />

              <span className="text-xs font-semibold text-gray-800">
                I'm sure I want to permanently delete this account
              </span>
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  countdown > 0 || !isChecked || deleting
                }
                onClick={handlePermanentDelete}
                className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {countdown > 0
                  ? `Wait (${countdown}s)`
                  : deleting
                  ? "Deleting..."
                  : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          {/* Contact Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-[#ae884e]" />
                Contact Details
              </h3>
              <button 
                onClick={openEditModal} 
                className="text-xs font-semibold text-[#1c3053] hover:text-[#ae884e] flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-200 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">Email Address</p>
                      {customer.email_verified ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          <AlertCircle className="w-3 h-3" /> Unverified
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900 mt-0.5 break-all">
                      {customer.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleContactVerification("email", customer.email_verified)}
                  disabled={verifyingContact}
                  className={`shrink-0 text-[11px] font-semibold px-2 py-1 rounded transition-colors border ${
                    customer.email_verified 
                      ? "text-gray-500 border-gray-200 hover:bg-gray-100" 
                      : "text-[#1c3053] border-[#1c3053]/20 hover:bg-[#1c3053]/5"
                  }`}
                >
                  {customer.email_verified ? "Unverify" : "Verify"}
                </button>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">Phone Number</p>
                      {customer.phone ? (
                        customer.phone_verified ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                            <AlertCircle className="w-3 h-3" /> Unverified
                          </span>
                        )
                      ) : null}
                    </div>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">
                      {customer.phone || "Not provided"}
                    </p>
                  </div>
                </div>
                {customer.phone && (
                  <button
                    onClick={() => handleContactVerification("phone", customer.phone_verified)}
                    disabled={verifyingContact}
                    className={`shrink-0 text-[11px] font-semibold px-2 py-1 rounded transition-colors border ${
                      customer.phone_verified 
                        ? "text-gray-500 border-gray-200 hover:bg-gray-100" 
                        : "text-[#1c3053] border-[#1c3053]/20 hover:bg-[#1c3053]/5"
                    }`}
                  >
                    {customer.phone_verified ? "Unverify" : "Verify"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Account Notes */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-[#ae884e]" />
              Account Notes (Admin Only)
            </h3>

            <p className="text-xs text-gray-400 mb-3">
              Internal confidential notes regarding this client.
            </p>

            <textarea
              rows={4}
              value={adminNotes}
              onChange={(e) =>
                setAdminNotes(e.target.value)
              }
              placeholder="Add internal notes about this customer..."
              className="w-full p-3 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 outline-none focus:border-[#ae884e]"
            />
          </div>

          {/* Property Preferences */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-[#ae884e]" />
              Property Preferences
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <PoundSterling className="w-3 h-3" />
                  Budget
                </p>

                <p className="text-sm font-medium text-gray-900">
                  {prefs.budget || "Any"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Home className="w-3 h-3" />
                  Type
                </p>

                <p className="text-sm font-medium text-gray-900">
                  {prefs.propertyType || "Any"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Area
                </p>

                <p className="text-sm font-medium text-gray-900">
                  {prefs.area || "Any"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Bedrooms
                </p>

                <p className="text-sm font-medium text-gray-900">
                  {prefs.bedrooms || "Any"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Verification Documents */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#ae884e]" />
                Customer Verification Documents ({documents.length})
              </h3>

              <button
                onClick={() => setShowAddDocModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1c3053] text-white rounded-xl text-xs font-semibold hover:bg-[#ae884e] transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Document
              </button>
            </div>

            {showAddDocModal && (
              <form
                onSubmit={handleAdminUploadDoc}
                className="mb-6 p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-4"
              >
                <h4 className="font-semibold text-gray-900 text-sm">
                  Upload Document for Customer
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Category
                    </label>

                    <select
                      value={category}
                      onChange={(e) =>
                        setCategory(e.target.value)
                      }
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white text-gray-900 outline-none"
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
                      <label className="block text-xs font-medium text-gray-700 mb-1">
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
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Document Number
                    </label>

                    <input
                      type="text"
                      required
                      value={docNumber}
                      onChange={(e) =>
                        setDocNumber(e.target.value)
                      }
                      placeholder="AB123456C"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white text-gray-900 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Share Code (Optional)
                    </label>

                    <input
                      type="text"
                      value={shareCode}
                      onChange={(e) =>
                        setShareCode(e.target.value)
                      }
                      placeholder="e.g. W12345678"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white text-gray-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      File (Image / PDF)
                    </label>

                    <input
                      type="file"
                      required
                      accept="image/*,.pdf"
                      onChange={(e) =>
                        setFile(e.target.files?.[0] || null)
                      }
                      className="w-full text-xs text-gray-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-200 file:text-[#1c3053]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setShowAddDocModal(false)
                    }
                    className="px-3.5 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded-lg font-medium"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-4 py-1.5 bg-[#1c3053] text-white text-xs rounded-lg hover:bg-[#ae884e] disabled:bg-gray-400 font-medium"
                  >
                    {uploading
                      ? "Uploading..."
                      : "Save Document"}
                  </button>
                </div>
              </form>
            )}

            {documents.length === 0 ? (
              <p className="text-sm text-gray-500">
                No documents uploaded by this customer yet.
              </p>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">
                          {doc.category}
                        </span>

                        <span className="text-xs font-semibold bg-gray-100 text-gray-800 px-2 py-0.5 rounded border border-gray-200">
                          No: {doc.document_number || "N/A"}
                        </span>
                      </div>

                      <p className="text-xs font-medium text-gray-800 mt-1">
                        Full Name:{" "}
                        {doc.full_name || customer.name}
                      </p>

                      {doc.share_code && (
                        <p className="text-xs font-bold text-[#ae884e] mt-0.5">
                          Share Code: {doc.share_code}
                        </p>
                      )}

                      <p className="text-xs text-gray-500 mt-0.5">
                        Uploaded:{" "}
                        {new Date(
                          doc.created_at
                        ).toLocaleDateString("en-GB")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleViewDocument(doc)}
                        disabled={openingDocumentId === doc.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 border border-gray-300 text-[#1c3053] hover:bg-gray-100 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 disabled:cursor-wait"
                      >
                        {openingDocumentId === doc.id ? "Opening..." : "View File"}
                        <ExternalLink className="w-3 h-3" />
                      </button>

                      <select
                        value={doc.status}
                        onChange={(e) =>
                          handleDocStatusChange(
                            doc.id,
                            e.target.value
                          )
                        }
                        className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border outline-none ${
                          doc.status === "approved"
                            ? "bg-green-50 text-green-800 border-green-300"
                            : doc.status === "rejected"
                            ? "bg-red-50 text-red-800 border-red-300"
                            : "bg-amber-50 text-amber-800 border-amber-300"
                        }`}
                      >
                        <option value="under_review">
                          Under Review
                        </option>

                        <option value="approved">
                          Approved
                        </option>

                        <option value="rejected">
                          Rejected
                        </option>
                      </select>

                      <button
                        onClick={() =>
                          handleDeleteDoc(doc.id)
                        }
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#ae884e]" />
                  Payment Status
                </h3>

                <p className="text-xs text-gray-400 mt-1">
                  Monthly payment records and manual payment tracking.
                </p>
              </div>

              <button
                onClick={openNewPaymentForm}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#1c3053] text-white rounded-xl text-xs font-semibold hover:bg-[#ae884e] transition-colors shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add Payment
              </button>
            </div>

            {showPaymentForm && (
              <form
                onSubmit={handleSavePayment}
                className="mb-6 p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">
                      Payment Record
                    </h4>

                    <p className="text-xs text-gray-400 mt-0.5">
                      Add or update a monthly payment record.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentForm(false);
                      resetPaymentForm();
                    }}
                    className="text-xs text-gray-500 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Payment Month
                    </label>

                    <input
                      type="month"
                      required
                      value={paymentMonth.slice(0, 7)}
                      onChange={(e) =>
                        setPaymentMonth(
                          `${e.target.value}-01`
                        )
                      }
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white text-gray-900 outline-none focus:border-[#ae884e] focus:ring-1 focus:ring-[#ae884e]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Payment Status
                    </label>

                    <select
                      value={paymentStatus}
                      onChange={(e) =>
                        setPaymentStatus(
                          e.target.value as PaymentRecord["status"]
                        )
                      }
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white text-gray-900 outline-none focus:border-[#ae884e] focus:ring-1 focus:ring-[#ae884e]"
                    >
                      <option value="unpaid">Unpaid</option>
                      <option value="paid">Paid</option>
                      <option value="partial">Partial</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Amount (£)
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) =>
                        setPaymentAmount(e.target.value)
                      }
                      placeholder="1200.00"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white text-gray-900 outline-none focus:border-[#ae884e] focus:ring-1 focus:ring-[#ae884e]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Due Date
                    </label>

                    <input
                      type="date"
                      value={paymentDueDate}
                      onChange={(e) =>
                        setPaymentDueDate(e.target.value)
                      }
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white text-gray-900 outline-none focus:border-[#ae884e] focus:ring-1 focus:ring-[#ae884e]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Paid Date
                    </label>

                    <input
                      type="date"
                      value={paymentPaidDate}
                      onChange={(e) =>
                        setPaymentPaidDate(e.target.value)
                      }
                      disabled={
                        paymentStatus !== "paid" &&
                        paymentStatus !== "partial"
                      }
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white text-gray-900 outline-none focus:border-[#ae884e] focus:ring-1 focus:ring-[#ae884e] disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Notes
                  </label>

                  <textarea
                    rows={2}
                    value={paymentNotes}
                    onChange={(e) =>
                      setPaymentNotes(e.target.value)
                    }
                    placeholder="e.g. Paid by bank transfer..."
                    className="w-full p-3 text-xs border border-gray-300 rounded-lg bg-white text-gray-900 outline-none focus:border-[#ae884e] focus:ring-1 focus:ring-[#ae884e]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentForm(false);
                      resetPaymentForm();
                    }}
                    className="px-3.5 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded-lg font-medium"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={savingPayment}
                    className="px-4 py-1.5 bg-[#1c3053] text-white text-xs rounded-lg hover:bg-[#ae884e] disabled:bg-gray-400 font-medium"
                  >
                    {savingPayment
                      ? "Saving..."
                      : "Save Payment"}
                  </button>
                </div>
              </form>
            )}

            {paymentRecords.length === 0 ? (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <p className="text-sm text-gray-500">
                  No payment records have been added for this customer yet.
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  Use "Add Payment" to start tracking monthly payments.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentRecords.map((payment) => (
                  <div
                    key={payment.id}
                    className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatPaymentMonth(
                              payment.payment_month
                            )}
                          </p>

                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${getPaymentStatusClasses(
                              payment.status
                            )}`}
                          >
                            {getPaymentStatusLabel(
                              payment.status
                            )}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 mt-3">
                          <div>
                            <p className="text-xs text-gray-500">
                              Amount
                            </p>

                            <p className="text-sm font-semibold text-gray-900 mt-0.5">
                              {payment.amount !== null
                                ? `£${Number(
                                    payment.amount
                                  ).toFixed(2)}`
                                : "Not set"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">
                              Due Date
                            </p>

                            <p className="text-sm font-medium text-gray-800 mt-0.5">
                              {formatPaymentDate(
                                payment.due_date
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">
                              Paid Date
                            </p>

                            <p className="text-sm font-medium text-gray-800 mt-0.5">
                              {formatPaymentDate(
                                payment.paid_date
                              )}
                            </p>
                          </div>
                        </div>

                        {payment.notes && (
                          <div className="mt-3 p-2.5 bg-gray-50 border border-gray-100 rounded-lg">
                            <p className="text-xs text-gray-600">
                              <span className="font-semibold text-gray-700">
                                Note:
                              </span>{" "}
                              {payment.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() =>
                            openEditPaymentForm(payment)
                          }
                          className="inline-flex items-center justify-center px-3.5 py-1.5 bg-gray-50 border border-gray-200 text-[#1c3053] hover:bg-gray-100 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            handleDeletePayment(payment.id)
                          }
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Payment Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Viewing History */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#ae884e]" />
              Viewing History
            </h3>

            {bookings.length === 0 ? (
              <p className="text-sm text-gray-500">
                No viewings found for this customer.
              </p>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex justify-between items-center p-3.5 border border-gray-100 rounded-xl bg-gray-50/50"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {Array.isArray(booking.property)
                          ? booking.property[0]?.title
                          : booking.property?.title ||
                            "Unknown Property"}
                      </p>

                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(
                          booking.viewing_date
                        ).toLocaleDateString("en-GB")}{" "}
                        at{" "}
                        {String(
                          booking.start_time
                        ).slice(0, 5)}
                      </p>
                    </div>

                    <span className="text-xs font-semibold px-3 py-1 bg-white border border-gray-200 rounded-lg text-gray-800 shadow-xs">
                      {booking.status || "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message History */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#ae884e]" />
              Message History
            </h3>

            {messages.length === 0 ? (
              <p className="text-sm text-gray-500">
                No messages found for this customer.
              </p>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-4 bg-gray-50 border border-gray-200 rounded-2xl shadow-xs"
                  >
                    <p className="text-xs font-semibold text-gray-500 mb-1">
                      {new Date(
                        msg.created_at
                      ).toLocaleString("en-GB")}
                    </p>

                    <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                      {msg.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

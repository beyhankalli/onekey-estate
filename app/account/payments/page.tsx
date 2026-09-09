"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Landmark,
  Receipt,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface Customer {
  id: string;
  email?: string | null;
  name?: string | null;
  account_number?: string | null;
}

interface PaymentRecord {
  id: string;
  customer_id?: string | null;
  payment_month?: string | null;
  amount?: number | string | null;
  status: string;
  paid_date?: string | null;
  notes?: string | null;
}

export default function CustomerPaymentsDashboard() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  useEffect(() => {
    async function loadBillingData() {
      try {
        setLoading(true);

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push("/login");
          return;
        }

        // Güvenli ID çözümlemesi (auth_user_id -> customers.id)
        const { data: custData, error: custError } = await supabase
          .from("customers")
          .select("id, name, email, account_number")
          .eq("auth_user_id", user.id)
          .single();

        if (custError || !custData) {
          console.error("Customer record not found.");
          setLoading(false);
          return;
        }

        setCustomer(custData);

        const { data: payData } = await supabase
          .from("customer_payment_records")
          .select("*")
          .eq("customer_id", custData.id)
          .order("payment_month", { ascending: false });

        if (payData) {
          setPayments(payData as PaymentRecord[]);
        }
      } catch (err) {
        console.error("Error loading billing dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    void loadBillingData();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
        Loading billing dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="bg-[#1c3053] text-white pt-32 pb-12 px-4 sm:px-8 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <Link
              href="/account"
              className="inline-flex items-center gap-1.5 text-xs text-[#ae884e] font-semibold uppercase tracking-wider mb-2 hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>

            <h1 className="text-3xl font-semibold">
              Billing & Invoices
            </h1>

            <p className="text-gray-300 text-sm font-light mt-1">
              View your payment history and outstanding balances.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 -mt-6 space-y-8">
        {/* BANKA HAVALESİ BİLGİLERİ (READ-ONLY) */}
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
              <Landmark className="w-6 h-6 text-[#ae884e]" />
            </div>
            
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                How to Pay Your Invoices
              </h2>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Currently, we only accept payments via direct Bank Transfer (EFT). 
                Please use your unique Account Number{" "}
                <span className="font-bold text-[#1c3053]">
                  ({customer?.account_number || "N/A"})
                </span>{" "}
                as the payment reference when transferring funds so we can allocate the payment correctly.
              </p>

              <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm text-gray-800 font-mono space-y-2 shadow-sm">
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <span className="text-gray-500 font-sans text-xs uppercase tracking-wider font-semibold">Bank Name</span>
                  <span className="font-medium">Barclays UK PLC</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <span className="text-gray-500 font-sans text-xs uppercase tracking-wider font-semibold">Account Name</span>
                  <span className="font-medium">OneKey Estate Agency Ltd</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <span className="text-gray-500 font-sans text-xs uppercase tracking-wider font-semibold">Sort Code</span>
                  <span className="font-medium">20-04-15</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <span className="text-gray-500 font-sans text-xs uppercase tracking-wider font-semibold">Account No</span>
                  <span className="font-medium">84920173</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FATURALAR VE ÖDEME GEÇMİŞİ (READ-ONLY) */}
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <Receipt className="w-6 h-6 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900">
              Your Invoices
            </h2>
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-sm text-gray-500">
                No payment invoices have been issued to your account yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="p-5 rounded-xl border border-gray-200 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div>
                    <p className="font-bold text-gray-900">
                      Billing Period:{" "}
                      {payment.payment_month
                        ? new Date(payment.payment_month).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
                        : "Unknown"}
                    </p>

                    <p className="text-sm text-gray-600 mt-1">
                      Amount Due: <span className="font-semibold text-gray-900">£{Number(payment.amount || 0).toFixed(2)}</span>
                    </p>

                    {payment.paid_date && payment.status === "paid" && (
                      <p className="text-xs text-gray-500 mt-1">
                        Cleared on: {new Date(payment.paid_date).toLocaleDateString("en-GB")}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        payment.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : payment.status === "overdue"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {payment.status === "paid" && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {payment.status === "overdue" && <AlertCircle className="w-3.5 h-3.5" />}
                      {payment.status === "unpaid" && <Clock className="w-3.5 h-3.5" />}
                      {payment.status}
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
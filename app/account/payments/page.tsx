"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  CheckCircle2,
  Trash2,
  Building2,
  Landmark,
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

interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  expiry: string;
  holder: string;
}

export default function CustomerPaymentsDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([
    {
      id: "card-1",
      brand: "Visa",
      last4: "4242",
      expiry: "12/28",
      holder: "Demo User",
    },
  ]);
  const [directDebitActive, setDirectDebitActive] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<
    "card" | "debit" | "bank"
  >("card");

  const [showCardModal, setShowCardModal] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardHolder, setCardHolder] = useState("");

  useEffect(() => {
    async function loadBillingData() {
      const supabase = createClient();

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

        const { data: custData } = await supabase
          .from("customers")
          .select("*")
          .eq("email", user.email)
          .maybeSingle();

        setCustomer(
          custData || {
            id: user.id,
            email: user.email,
          }
        );

        const actualCustomerId = custData?.id || user.id;

        const { data: payData } = await supabase
          .from("customer_payment_records")
          .select("*")
          .eq("customer_id", actualCustomerId)
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

    loadBillingData();
  }, [router]);

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();

    if (!cardNumber || !cardExpiry || !cardCvc) {
      alert("Please fill in all card details.");
      return;
    }

    const last4 = cardNumber.slice(-4) || "0000";

    const newCard: SavedCard = {
      id: `card-${Date.now()}`,
      brand: "Visa/Mastercard",
      last4,
      expiry: cardExpiry,
      holder: cardHolder || customer?.name || "Cardholder",
    };

    setSavedCards((currentCards) => [...currentCards, newCard]);
    setShowCardModal(false);
    setCardNumber("");
    setCardExpiry("");
    setCardCvc("");
    setCardHolder("");

    alert("Demo card successfully saved securely!");
  };

  const handleDeleteCard = (id: string) => {
    if (confirm("Are you sure you want to remove this saved card?")) {
      setSavedCards((currentCards) =>
        currentCards.filter((card) => card.id !== id)
      );
    }
  };

  const handleToggleDirectDebit = () => {
    setDirectDebitActive((currentActive) => {
      const nextActive = !currentActive;

      alert(
        nextActive
          ? "Direct Debit mandate successfully set up (Demo)!"
          : "Direct Debit mandate cancelled."
      );

      return nextActive;
    });
  };

  const handleDemoPay = async (paymentId: string, method: string) => {
    const supabase = createClient();

    try {
      const paidDate = new Date().toISOString().split("T")[0];

      const { error } = await supabase
        .from("customer_payment_records")
        .update({
          status: "paid",
          paid_date: paidDate,
          notes: `Paid via ${method} (Demo)`,
        })
        .eq("id", paymentId);

      if (error) {
        throw error;
      }

      setPayments((currentPayments) =>
        currentPayments.map((payment) =>
          payment.id === paymentId
            ? {
                ...payment,
                status: "paid",
                paid_date: paidDate,
              }
            : payment
        )
      );

      alert(
        `Payment of invoice successfully processed via ${method} (Demo)!`
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "An unknown error occurred.";

      alert("Payment simulation failed: " + message);
    }
  };

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
              Payments & Billing Options
            </h1>

            <p className="text-gray-300 text-sm font-light mt-1">
              Manage payment methods, bank transfers, Direct Debit, and
              invoices.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 -mt-6 space-y-8">
        {/* ÖDEME YÖNTEMİ SEÇİMİ */}
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Select Preferred Payment Method
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setSelectedMethod("card")}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedMethod === "card"
                  ? "border-[#ae884e] bg-amber-50/30"
                  : "border-gray-200 bg-white"
              }`}
            >
              <CreditCard className="w-5 h-5 text-[#ae884e] mb-2" />
              <p className="font-bold text-sm text-gray-900">
                Credit / Debit Card
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Instant payment via saved cards
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod("debit")}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedMethod === "debit"
                  ? "border-[#ae884e] bg-amber-50/30"
                  : "border-gray-200 bg-white"
              }`}
            >
              <Building2 className="w-5 h-5 text-[#ae884e] mb-2" />
              <p className="font-bold text-sm text-gray-900">Direct Debit</p>
              <p className="text-xs text-gray-500 mt-1">
                Automated monthly collection
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod("bank")}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedMethod === "bank"
                  ? "border-[#ae884e] bg-amber-50/30"
                  : "border-gray-200 bg-white"
              }`}
            >
              <Landmark className="w-5 h-5 text-[#ae884e] mb-2" />
              <p className="font-bold text-sm text-gray-900">
                Bank Transfer (EFT)
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Direct bank-to-bank transfer
              </p>
            </button>
          </div>

          {/* KARTLARIM */}
          {selectedMethod === "card" && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                  Saved Cards
                </h3>

                <button
                  type="button"
                  onClick={() => setShowCardModal(true)}
                  className="px-3 py-1.5 bg-[#1c3053] text-white text-xs font-semibold rounded-lg hover:bg-[#ae884e]"
                >
                  + Add Card
                </button>
              </div>

              {showCardModal && (
                <form
                  onSubmit={handleAddCard}
                  className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3"
                >
                  <input
                    type="text"
                    required
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    placeholder="Cardholder Name"
                    className="w-full p-2 text-xs border rounded-lg bg-white text-gray-900 outline-none"
                  />

                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="Card Number (16 digits)"
                    className="w-full p-2 text-xs border rounded-lg bg-white text-gray-900 outline-none"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="p-2 text-xs border rounded-lg bg-white text-gray-900 outline-none"
                    />

                    <input
                      type="password"
                      required
                      maxLength={4}
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      placeholder="CVC"
                      className="p-2 text-xs border rounded-lg bg-white text-gray-900 outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCardModal(false)}
                      className="text-xs text-gray-600 px-2 py-1"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="text-xs bg-[#1c3053] text-white px-3 py-1.5 rounded-lg"
                    >
                      Save Card
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {savedCards.map((card) => (
                  <div
                    key={card.id}
                    className="p-4 rounded-xl border bg-gradient-to-br from-[#1c3053] to-[#263f68] text-white shadow-sm flex flex-col justify-between h-32"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-[#ae884e]">
                        {card.brand}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleDeleteCard(card.id)}
                        className="text-gray-300 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <p className="font-mono tracking-widest text-sm">
                        •••• •••• •••• {card.last4}
                      </p>

                      <div className="flex justify-between text-[11px] text-gray-300 mt-1">
                        <span>{card.holder}</span>
                        <span>Exp: {card.expiry}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DIRECT DEBIT */}
          {selectedMethod === "debit" && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                    Direct Debit Instruction
                  </h3>

                  <p className="text-xs text-gray-500 mt-0.5">
                    Automate your monthly payments securely.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleToggleDirectDebit}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold ${
                    directDebitActive
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {directDebitActive
                    ? "Active Mandate ✓"
                    : "Set Up Mandate"}
                </button>
              </div>

              {directDebitActive && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span>
                    Direct Debit is successfully configured for your account.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* BANKA HAVALESİ */}
          {selectedMethod === "bank" && (
            <div className="space-y-3 pt-4 border-t border-gray-100 bg-gray-50 p-4 rounded-xl border">
              <h3 className="text-sm font-bold text-gray-900">
                OneKey Estate Agency - Bank Account Details
              </h3>

              <p className="text-xs text-gray-600">
                Please use your unique Account Number{" "}
                <span className="font-bold text-[#1c3053]">
                  ({customer?.account_number || "N/A"})
                </span>{" "}
                as the payment reference when transferring funds.
              </p>

              <div className="text-xs space-y-1 bg-white p-3 rounded-lg border border-gray-200 text-gray-800 font-mono">
                <p>Bank Name: Barclays UK PLC</p>
                <p>Account Name: OneKey Estate Agency Ltd</p>
                <p>Sort Code: 20-04-15</p>
                <p>Account Number: 84920173</p>
              </div>
            </div>
          )}
        </div>

        {/* FATURALAR VE ÖDEME GEÇMİŞİ */}
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Invoices & Payment Processing
          </h2>

          {payments.length === 0 ? (
            <p className="text-sm text-gray-500">
              No payment invoices issued yet.
            </p>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="p-4 rounded-xl border border-gray-200 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm"
                >
                  <div>
                    <p className="font-bold text-sm text-gray-900">
                      Billing Month:{" "}
                      {payment.payment_month?.slice(0, 7)}
                    </p>

                    <p className="text-xs text-gray-500 mt-0.5">
                      Amount Due: £{payment.amount || "0.00"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        payment.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {payment.status}
                    </span>

                    {payment.status !== "paid" && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleDemoPay(payment.id, "Credit Card")
                          }
                          className="px-3 py-1.5 bg-[#1c3053] text-white text-xs font-semibold rounded-lg hover:bg-[#ae884e]"
                        >
                          Pay by Card
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDemoPay(payment.id, "Bank Transfer")
                          }
                          className="px-3 py-1.5 bg-gray-100 text-gray-800 text-xs font-semibold rounded-lg hover:bg-gray-200"
                        >
                          Confirm Bank EFT
                        </button>
                      </div>
                    )}
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
"use client";

import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [generalError, setGeneralError] = useState("");

  const supabase = createClient();

  const validateEmail = (email: string) => {
    if (!email) return true;

    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone: string) => {
    if (!phone) return true;

    const cleaned = phone.replace(/[\s()-]/g, "");
    const ukPhoneRegex = /^(\+44|0)[1-9]\d{9}$/;

    return ukPhoneRegex.test(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setGeneralError("");
    setEmailError("");
    setPhoneError("");

    let hasError = false;

    if (!formData.name.trim()) {
      setGeneralError("Please enter your full name.");
      return;
    }

    if (!formData.email.trim() && !formData.phone.trim()) {
      setGeneralError(
        "Please provide at least one contact method (Email or Phone)."
      );
      return;
    }

    if (formData.email.trim() && !validateEmail(formData.email)) {
      setEmailError(
        "Please enter a valid email address (e.g., name@example.co.uk)."
      );
      hasError = true;
    }

    if (formData.phone.trim() && !validatePhone(formData.phone)) {
      setPhoneError(
        "Please enter a valid UK phone number (e.g., 07123 456789 or +447123456789)."
      );
      hasError = true;
    }

    if (!formData.message.trim()) {
      setGeneralError("Please enter your message.");
      hasError = true;
    }

    if (hasError) return;

    setIsSending(true);

    try {
      const { error: dbError } = await supabase
        .from("contact_messages")
        .insert([
          {
            name: formData.name,
            email: formData.email || null,
            phone: formData.phone || null,
            message: formData.message,
          },
        ]);

      if (dbError) throw dbError;

      await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      setSubmitted(true);
    } catch (err) {
      setGeneralError(
        "An error occurred while sending your message. Please try again later."
      );

      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900 mb-4">
            Contact Us
            <span className="text-[#ae884e]">.</span>
          </h1>

          <p className="text-gray-500 text-lg font-light max-w-2xl mx-auto">
            Get in touch with our team for premium property services.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 bg-white p-8 md:p-12 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex-1 space-y-8">
            <h3 className="text-2xl font-semibold text-gray-900">
              Get In Touch
            </h3>

            <div className="flex items-start space-x-4">
              <MapPin className="w-6 h-6 text-[#ae884e] mt-1 shrink-0" />

              <p className="text-gray-600 font-light leading-relaxed">
                Netherend Neighbourhood Centre
                <br />
                13 Mogul Lane, Halesowen
                <br />
                United Kingdom, B63 2QQ
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <Phone className="w-6 h-6 text-[#ae884e] shrink-0" />
              <p className="text-gray-600 font-light">+44000...</p>
            </div>

            <div className="flex items-center space-x-4">
              <Mail className="w-6 h-6 text-[#ae884e] shrink-0" />
              <p className="text-gray-600 font-light">info@onekey.co.uk</p>
            </div>
          </div>

          <div className="flex-1">
            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-[2rem] p-12 text-center h-full flex flex-col items-center justify-center">
                <CheckCircle className="w-16 h-16 text-green-500 mb-4" />

                <h4 className="text-2xl font-semibold text-green-900 mb-2">
                  Message Sent!
                </h4>

                <p className="text-green-700 font-light text-lg">
                  Thank you for reaching out,{" "}
                  <span className="font-semibold">
                    {formData.name.split(" ")[0]}
                  </span>
                  . Our team will get back to you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {generalError && (
                  <div className="flex items-start p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
                    <AlertCircle className="w-5 h-5 mr-3 mt-0.5 shrink-0" />
                    <p>{generalError}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Full Name <span className="text-[#ae884e]">*</span>
                  </label>

                  <input
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        name: e.target.value,
                      });
                      setGeneralError("");
                    }}
                    className="w-full p-4 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 font-medium placeholder:text-gray-400 focus:outline-none focus:border-[#ae884e] transition-all"
                  />
                </div>

                <div>
                  <div className="flex flex-col md:flex-row gap-6 mb-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Email
                      </label>

                      <input
                        type="text"
                        placeholder="john@example.co.uk"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            email: e.target.value,
                          });
                          setEmailError("");
                          setGeneralError("");
                        }}
                        className={`w-full p-4 rounded-2xl border transition-all font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none ${
                          emailError
                            ? "bg-red-500/10 border-red-500 focus:border-red-600"
                            : "border-gray-200 bg-gray-50 focus:border-[#ae884e]"
                        }`}
                      />

                      {emailError && (
                        <p className="text-xs text-red-600 mt-1.5 font-medium">
                          {emailError}
                        </p>
                      )}
                    </div>

                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Phone
                      </label>

                      <input
                        type="text"
                        placeholder="07123 456789"
                        value={formData.phone}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            phone: e.target.value,
                          });
                          setPhoneError("");
                          setGeneralError("");
                        }}
                        className={`w-full p-4 rounded-2xl border transition-all font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none ${
                          phoneError
                            ? "bg-red-500/10 border-red-500 focus:border-red-600"
                            : "border-gray-200 bg-gray-50 focus:border-[#ae884e]"
                        }`}
                      />

                      {phoneError && (
                        <p className="text-xs text-red-600 mt-1.5 font-medium">
                          {phoneError}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="text-xs font-light text-gray-500">
                    * Please provide at least one valid contact method (Email or
                    Phone).
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Message <span className="text-[#ae884e]">*</span>
                  </label>

                  <textarea
                    placeholder="How can we help you?"
                    rows={4}
                    value={formData.message}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        message: e.target.value,
                      });
                      setGeneralError("");
                    }}
                    className="w-full p-4 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 font-medium placeholder:text-gray-400 focus:outline-none focus:border-[#ae884e] transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full flex items-center justify-center py-4 rounded-2xl font-medium text-[15px] bg-[#1c3053] text-white hover:bg-[#ae884e] disabled:bg-gray-400 transition-all shadow-lg"
                >
                  {isSending ? "Sending..." : "Send Message"}

                  {!isSending && <Send className="w-4 h-4 ml-2" />}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
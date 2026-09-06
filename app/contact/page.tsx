"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      alert("Please fill in all required fields.");
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="bg-gray-50 min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="text-center mb-16">
          <h1 className="text-4xl font-semibold text-gray-900 mb-4">
            Get in Touch<span className="text-[#ae884e]">.</span>
          </h1>
          <p className="text-gray-500 text-lg font-light max-w-xl mx-auto">
            We are here to help you find your dream property in the UK. Reach out to our expert team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          <div className="bg-[#1c3053] text-white p-10 rounded-[2rem] flex flex-col justify-between shadow-lg">
            <div>
              <h3 className="text-2xl font-semibold mb-6">Contact Information</h3>
              <p className="text-blue-100 font-light mb-10 leading-relaxed">
                Fill out the form or contact us directly via our office details below.
              </p>

              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <MapPin className="w-6 h-6 text-[#ae884e]" />
                  <span className="font-light">123 Regent Street, Mayfair, London, UK</span>
                </div>
                <div className="flex items-center space-x-4">
                  <Phone className="w-6 h-6 text-[#ae884e]" />
                  <span className="font-light">+44 20 7946 0912</span>
                </div>
                <div className="flex items-center space-x-4">
                  <Mail className="w-6 h-6 text-[#ae884e]" />
                  <span className="font-light">info@onekeyestate.co.uk</span>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-blue-900/50 text-sm text-blue-200 font-light">
              Working Hours: Mon - Fri: 9:00 AM - 6:00 PM
            </div>
          </div>

          <div className="bg-white p-10 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            {submitted ? (
              <div className="py-16 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-500 font-light">
                  Thank you for reaching out, {formData.name}. Our team will get back to you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                  <input 
                    type="text"
                    required
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#ae884e]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input 
                      type="email"
                      required
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#ae884e]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input 
                      type="text"
                      placeholder="+44 7000 000000"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#ae884e]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea 
                    rows={4}
                    required
                    placeholder="I am interested in..."
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#ae884e]"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 rounded-2xl font-medium text-[16px] bg-[#ae884e] text-white hover:bg-[#8f6e3c] transition-all flex items-center justify-center shadow-lg"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Send Message
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
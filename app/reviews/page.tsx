"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

// Sahte müşteri değerlendirmeleri (İleride admin panelinden yönetilebilir)
const reviewsData = [
  {
    id: 1,
    name: "Sarah Jenkins",
    location: "Rented in Canary Wharf",
    rating: 5,
    text: "The online booking system is flawless. I scheduled a viewing on Sunday evening, saw the 3D map beforehand, and secured the apartment by Tuesday. Exceptional service by OneKey."
  },
  {
    id: 2,
    name: "David Thompson",
    location: "Rented in Kensington",
    rating: 5,
    text: "Moving to London was stressful until I found this agency. The agent was transparent, and the property matched the high-quality photos perfectly. Highly recommended."
  },
  {
    id: 3,
    name: "Emma Williams",
    location: "Rented in Manchester",
    rating: 5,
    text: "Professional, responsive, and luxurious. The whole team made sure all my questions were answered via WhatsApp almost instantly. The best estate agency I've dealt with."
  },
  {
    id: 4,
    name: "James Patel",
    location: "Rented in Birmingham",
    rating: 5,
    text: "I loved how easy it was to navigate the 3D floor plans. It gave me real confidence in the property before visiting. The agent was incredibly polite and helpful."
  }
];

export default function ReviewsPage() {
  return (
    <div className="bg-gray-50 min-h-screen pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-semibold tracking-tight text-gray-900 mb-6"
          >
            Client Experiences<span className="text-[#ae884e]">.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-500 font-light max-w-2xl mx-auto"
          >
            Don't just take our word for it. Read what our clients have to say about their journey with OneKey Estate Agency.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {reviewsData.map((review, index) => (
            <motion.div 
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-white p-8 md:p-10 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
            >
              {/* Yıldızlar */}
              <div className="flex gap-1 mb-6">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[#ae884e] text-[#ae884e]" />
                ))}
              </div>
              
              {/* Yorum Metni */}
              <p className="text-gray-700 text-lg font-light leading-relaxed mb-8">
                "{review.text}"
              </p>
              
              {/* Müşteri Bilgisi */}
              <div className="flex items-center">
                <div className="w-12 h-12 bg-[#1c3053] rounded-full flex items-center justify-center text-white font-semibold text-lg mr-4">
                  {review.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{review.name}</h4>
                  <p className="text-sm text-gray-500 font-light">{review.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}
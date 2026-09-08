"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <div className="bg-gray-50 min-h-screen pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Başlık Alanı */}
        <div className="text-center mb-20">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-semibold tracking-tight text-gray-900 mb-6"
          >
            Redefining UK Real Estate<span className="text-[#ae884e]">.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-500 font-light max-w-3xl mx-auto leading-relaxed"
          >
            At OneKey, we believe that finding a home should be as seamless and premium as the properties we represent. Our mission is to connect individuals with spaces that inspire them.
          </motion.p>
        </div>

        {/* Görsel ve Hikaye Alanı */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-[2rem] overflow-hidden relative h-96 flex items-center justify-center"
        >
          <Image
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80"
            alt="OneKey Office"
            fill
            sizes="(max-width: 768px) 100vw, 1200px"
            className="absolute inset-0 w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-[#1c3053]/70"></div>

          <div className="relative z-10 text-center px-4">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Our Commitment
            </h2>

            <p className="text-blue-100 font-light max-w-2xl mx-auto text-lg">
              We provide transparent, fast, and secure online viewing bookings, accompanied by highly detailed 3D floor plans to ensure you know exactly what you are getting before you even step through the door.
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative px-4 pt-32 pb-20 flex flex-col items-center text-center bg-white">
      
      <motion.h1 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-5xl font-semibold tracking-tight text-gray-900 mb-6"
      >
        Find Your Perfect <br className="md:hidden" />
        <span className="text-[#1c3053]">UK Rental</span> Home<span className="text-[#ae884e]">.</span>
      </motion.h1>

      <motion.p 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="text-lg text-gray-500 mb-10 max-w-sm sm:max-w-2xl font-light tracking-wide"
      >
        Premium estate agency offering the finest properties. Book your viewings online instantly and explore 3D floor plans.
      </motion.p>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        className="flex flex-col w-full sm:w-auto sm:flex-row gap-4"
      >
        {/* Ana buton ikincil altın rengimiz oldu */}
        <Link 
          href="/listings" 
          className="bg-[#ae884e] text-white px-8 py-3.5 rounded-full font-medium text-[17px] hover:bg-[#8f6e3c] transition-all shadow-[0_4px_14px_0_rgba(174,136,78,0.39)] w-full sm:w-auto"
        >
          View Properties
        </Link>
        <Link 
          href="/contact" 
          className="bg-gray-50 text-[#1c3053] px-8 py-3.5 rounded-full font-medium text-[17px] hover:bg-gray-100 transition-colors w-full sm:w-auto"
        >
          Contact an Agent
        </Link>
      </motion.div>
    </section>
  );
}
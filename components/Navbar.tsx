"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          <div className="flex-shrink-0 flex items-center">
            <Link href="/">
              <Image 
                src="/onekey-logo.png" 
                alt="OneKey Estate Agency Logo" 
                width={200} 
                height={68} 
                className="h-14 w-auto object-contain" 
                priority 
              />
            </Link>
          </div>

          <div className="flex md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-900 hover:bg-gray-50 focus:outline-none transition"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          <div className="hidden md:flex md:items-center md:space-x-8">
            <Link href="/listings" className="text-sm font-medium text-gray-600 hover:text-black transition">Properties</Link>
            <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-black transition">About Us</Link>
            <Link href="/reviews" className="text-sm font-medium text-gray-600 hover:text-black transition">Reviews</Link>
            {/* Buton rengini #ae884e olarak güncelledik (üzerine gelince biraz koyulaşması için hover değeri eklendi) */}
            <Link href="/contact" className="text-sm font-medium text-white bg-[#ae884e] px-5 py-2.5 rounded-full hover:bg-[#8f6e3c] transition">Contact Us</Link>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white border-t border-gray-100 shadow-xl absolute w-full"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              <Link href="/listings" className="block px-3 py-4 text-lg font-medium text-gray-900 border-b border-gray-50" onClick={toggleMenu}>Properties</Link>
              <Link href="/about" className="block px-3 py-4 text-lg font-medium text-gray-900 border-b border-gray-50" onClick={toggleMenu}>About Us</Link>
              <Link href="/reviews" className="block px-3 py-4 text-lg font-medium text-gray-900 border-b border-gray-50" onClick={toggleMenu}>Reviews</Link>
              <Link href="/contact" className="block px-3 py-4 text-lg font-medium text-[#ae884e]" onClick={toggleMenu}>Contact Us</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
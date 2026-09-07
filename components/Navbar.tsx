"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
// YENİ: Heart (Kalp) ikonunu lucide-react kütüphanesinden içe aktarıyoruz
import { Menu, X, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
// YENİ: Favori sayısını okuyabilmek için oluşturduğumuz Context'i içe aktarıyoruz
import { useWishlist } from "@/context/WishlistContext";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  
  // YENİ: Context'ten favori listemizi (wishlist) alıyoruz
  const { wishlist } = useWishlist();

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

          <div className="flex md:hidden items-center gap-4">
            {/* YENİ MOBİL KALP İKONU: Telefondan girenler için üst barda kalp ikonu */}
            <Link href="/wishlist" className="relative text-gray-900 hover:text-[#ae884e] transition">
              <Heart className="h-6 w-6" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1.5 -right-2 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full">
                  {wishlist.length}
                </span>
              )}
            </Link>

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
            
            {/* YENİ MASAÜSTÜ KALP İKONU: Favoriler sayfasına giden ve sayacı olan ikon */}
            <Link href="/wishlist" className="relative flex items-center text-gray-600 hover:text-black transition">
              <Heart className="w-5 h-5" />
              {/* Sadece favoride ürün varsa kırmızı sayı rozetini göster */}
              {wishlist.length > 0 && (
                <span className="absolute -top-2 -right-2.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full border-2 border-white">
                  {wishlist.length}
                </span>
              )}
            </Link>

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
              
              {/* YENİ MOBİL LİSTE YAZISI: Mobil menü içine favoriler sekmesi */}
              <Link href="/wishlist" className="flex items-center justify-between px-3 py-4 text-lg font-medium text-gray-900 border-b border-gray-50" onClick={toggleMenu}>
                Saved Properties
                {wishlist.length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">{wishlist.length}</span>
                )}
              </Link>

              <Link href="/contact" className="block px-3 py-4 text-lg font-medium text-[#ae884e]" onClick={toggleMenu}>Contact Us</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
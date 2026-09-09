"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Context'in içinde hangi veri ve fonksiyonların olacağını tanımlıyoruz
interface WishlistContextType {
  wishlist: string[]; // Favoriye eklenen ilanların ID'lerini tutan liste
  toggleWishlist: (id: string) => void; // Favoriye ekleme/çıkarma fonksiyonu
  isInWishlist: (id: string) => boolean; // Bir ilanın favoride olup olmadığını kontrol etme
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sayfa ilk açıldığında tarayıcı hafızasından (LocalStorage) eski favorileri yükle
  useEffect(() => {
    try {
      const storedWishlist = localStorage.getItem("onekey_wishlist");
      if (storedWishlist) {
        const parsed = JSON.parse(storedWishlist);
        if (Array.isArray(parsed)) {
          setWishlist(parsed.filter((item): item is string => typeof item === "string"));
        }
      }
    } catch (error) {
      console.error("Failed to load wishlist from localStorage:", error);
      localStorage.removeItem("onekey_wishlist");
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Kullanıcı kalp butonuna bastığında çalışacak fonksiyon
  const toggleWishlist = (id: string) => {
    setWishlist((prev) => {
      // Eğer ilan zaten listedeyse çıkar, değilse listeye ekle
      const updatedWishlist = prev.includes(id) 
        ? prev.filter((item) => item !== id) 
        : [...prev, id];
      
      // Yeni listeyi tarayıcı hafızasına kaydet
      try {
        localStorage.setItem("onekey_wishlist", JSON.stringify(updatedWishlist));
      } catch (error) {
        console.error("Failed to save wishlist to localStorage:", error);
      }

      return updatedWishlist;
    });
  };

  const isInWishlist = (id: string) => wishlist.includes(id);

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist }}>
      {/* Sadece hafıza yüklendikten sonra sayfayı göster ki ekranda titreme olmasın */}
      {isLoaded ? children : <div className="hidden">{children}</div>}
    </WishlistContext.Provider>
  );
}

// Diğer sayfalarda bu hafızayı kolayca kullanabilmek için yazdığımız kısayol
export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
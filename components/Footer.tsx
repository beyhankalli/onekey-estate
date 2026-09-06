import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 
          YENİ IZGARA (GRID) YAPISI: 
          Eşit 4 sütun yerine, 12 sütunluk (grid-cols-12) bir sistem kurduk. 
          Böylece her bölüme ihtiyacı kadar genişlik verebiliyoruz.
        */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 mb-16">
          
          {/* 1. Logo Bölümü (3 birim genişlik - lg:col-span-3) */}
          <div className="lg:col-span-3 space-y-6">
            <Link href="/" className="inline-block">
              <img 
                src="/onekey-logo.png" 
                alt="OneKey Estate Agency Logo" 
                className="h-[84px] w-auto" 
              />
            </Link>
            <p className="text-gray-500 font-light leading-relaxed mt-4 pr-4">
              Premium estate agency combining modern technology with dedicated personal service across the UK.
            </p>
          </div>

          {/* 2. Menü Bölümü (2 birim genişlik - Daha az yer kaplar, böylece sağındaki Contact sola kayar) */}
          <div className="lg:col-span-2">
            <h4 className="font-semibold text-gray-900 mb-6">Navigation</h4>
            <ul className="space-y-4 font-light text-gray-600">
              <li><Link href="/" className="hover:text-[#ae884e] transition-colors">Home</Link></li>
              <li><Link href="/listings" className="hover:text-[#ae884e] transition-colors">Properties</Link></li>
              <li><Link href="/about" className="hover:text-[#ae884e] transition-colors">About Us</Link></li>
              <li><Link href="/reviews" className="hover:text-[#ae884e] transition-colors">Reviews</Link></li>
              <li><Link href="/contact" className="hover:text-[#ae884e] transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* 3. İletişim Bölümü (4 birim genişlik - Adresin rahat sığması için en geniş alan) */}
          <div className="lg:col-span-4">
            <h4 className="font-semibold text-gray-900 mb-6">Contact</h4>
            <ul className="space-y-4 font-light text-gray-600">
              <li className="flex items-start">
                <MapPin className="w-5 h-5 mr-3 text-[#ae884e] shrink-0 mt-1" /> 
                <span className="leading-relaxed">
                  Netherend Neighbourhood Centre,<br/>
                  13 Mogul Lane, Halesowen,<br/>
                  United Kingdom, B63 2QQ
                </span>
              </li>
              <li className="flex items-center"><Phone className="w-5 h-5 mr-3 text-[#ae884e] shrink-0" /> +44 20 7946 0000</li>
              <li className="flex items-center"><Mail className="w-5 h-5 mr-3 text-[#ae884e] shrink-0" /> contact@onekeyestate.co.uk</li>
            </ul>
          </div>

          {/* 4. Sosyal Medya Bölümü (3 birim genişlik) */}
          <div className="lg:col-span-3">
            <h4 className="font-semibold text-gray-900 mb-6">Follow Us</h4>
            <div className="flex flex-wrap gap-3">
              <a href="#" className="px-4 py-2 bg-gray-50 rounded-xl text-sm font-medium text-gray-600 hover:bg-[#ae884e] hover:text-white transition-all">
                Instagram
              </a>
              <a href="#" className="px-4 py-2 bg-gray-50 rounded-xl text-sm font-medium text-gray-600 hover:bg-[#ae884e] hover:text-white transition-all">
                Facebook
              </a>
              <a href="#" className="px-4 py-2 bg-gray-50 rounded-xl text-sm font-medium text-gray-600 hover:bg-[#ae884e] hover:text-white transition-all">
                LinkedIn
              </a>
            </div>
          </div>
        </div>

        {/* En Alt Telif Hakkı (Copyright) Çizgisi */}
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-light text-gray-400">
          <p>© 2026 OneKey Estate Agency. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-900">Privacy Policy</a>
            <a href="#" className="hover:text-gray-900">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
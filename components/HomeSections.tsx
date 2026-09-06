"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, MapPin, Bed, Bath, ChevronRight, CheckCircle, Calendar, Home, Star } from "lucide-react";
import { propertiesData } from "@/data/properties";

// 1. HERO (ÜST ARAMA ALANI)
export function Hero() {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/listings?search=${encodeURIComponent(searchTerm)}`);
    } else {
      router.push(`/listings`);
    }
  };

  return (
    <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-5xl md:text-7xl font-semibold tracking-tight text-[#1c3053] mb-6">
          Find Your Next Home <br className="hidden md:block" />
          With <span className="text-[#ae884e]">OneKey.</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-lg md:text-xl text-gray-500 font-light max-w-2xl mx-auto mb-12">
          Premium properties, transparent service, and a modern approach to renting in the UK.
        </motion.p>
        
        <motion.form onSubmit={handleSearch} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="max-w-3xl mx-auto flex flex-col md:flex-row gap-4 bg-white p-4 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100">
          <div className="relative flex-1">
            <Search className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Postcode, area, or street (e.g. E14)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-14 pr-4 py-4 rounded-2xl bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none text-lg" />
          </div>
          <button type="submit" className="bg-[#1c3053] text-white px-8 py-4 rounded-2xl font-medium text-lg hover:bg-[#ae884e] transition-all shadow-md">
            Search Properties
          </button>
        </motion.form>
      </div>
    </div>
  );
}

// 2. ÖNE ÇIKAN İLANLAR
export function FeaturedProperties() {
  const featured = propertiesData.filter(p => p.isFeatured);

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">Featured Properties<span className="text-[#ae884e]">.</span></h2>
            <p className="text-gray-500 font-light text-lg">Hand-picked premium homes ready for you.</p>
          </div>
          <Link href="/listings" className="text-[#1c3053] font-medium hover:text-[#ae884e] transition-colors flex items-center">
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {/* Mobilde yatay kaydırma, Masaüstünde Grid */}
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-8 pb-8 hide-scrollbar md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible">
          {featured.map((prop, index) => (
            <motion.div key={prop.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.1 }} className="min-w-[85vw] md:min-w-0 snap-center">
              <Link href={`/listings/${prop.id}`} className="group block bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col h-full cursor-pointer">
                <div className="w-full h-64 overflow-hidden relative">
                  <img src={prop.interiorImages[0]} alt={prop.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className={`absolute top-4 right-4 text-xs font-semibold px-3 py-1.5 rounded-full ${prop.availabilityStatus === 'Available' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>{prop.availabilityStatus}</div>
                </div>
                <div className="p-8 flex flex-col flex-grow">
                  <h3 className="text-2xl font-semibold tracking-tight text-gray-900 mb-2 line-clamp-1">{prop.title}</h3>
                  <div className="flex items-center text-gray-600 mb-5"><MapPin className="w-4 h-4 mr-1.5 text-[#ae884e]" /><span className="text-sm font-medium">{prop.shortLocation}</span></div>
                  <div className="text-2xl font-medium text-[#1c3053] mb-6">£{prop.monthlyRent.toLocaleString()} <span className="text-sm text-gray-400 font-light">pcm</span></div>
                  <div className="flex gap-6 mb-8 border-t border-gray-100 pt-6">
                    <div className="flex items-center text-gray-600"><Bed className="w-5 h-5 mr-2 stroke-[1.5] text-[#ae884e]" /><span className="font-light">{prop.bedrooms} Beds</span></div>
                    <div className="flex items-center text-gray-600"><Bath className="w-5 h-5 mr-2 stroke-[1.5] text-[#ae884e]" /><span className="font-light">{prop.bathrooms} Baths</span></div>
                  </div>
                  <div className="mt-auto flex items-center justify-center w-full bg-[#1c3053]/5 text-[#1c3053] py-4 rounded-2xl font-medium text-[15px] group-hover:bg-[#ae884e] group-hover:text-white transition-all duration-300">
                    View Property <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 3. NEDEN BİZ?
export function WhyOneKey() {
  const benefits = [
    { num: "01", title: "Curated Properties", desc: "Carefully selected homes from trusted landlords ensuring high standards." },
    { num: "02", title: "Easy Viewings", desc: "Book property viewings online at a time that perfectly suits your schedule." },
    { num: "03", title: "Dedicated Agents", desc: "Speak directly with a property professional personally assigned to your home." },
    { num: "04", title: "A Better Experience", desc: "A simple, modern and highly transparent way to find your next rental." }
  ];

  return (
    <section className="py-24 bg-[#1c3053] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">Why OneKey Estate Agency<span className="text-[#ae884e]">?</span></h2>
          <p className="text-blue-200 font-light text-lg">Setting a new standard in the UK rental market.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {benefits.map((b, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}>
              <div className="text-[#ae884e] text-2xl font-bold mb-4">{b.num}</div>
              <h3 className="text-xl font-semibold mb-3">{b.title}</h3>
              <p className="text-blue-200 font-light leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 4. NASIL ÇALIŞIR?
export function HowItWorks() {
  const steps = [
    { icon: Search, title: "Find Your Property", desc: "Search our portfolio of available premium rental properties." },
    { icon: Calendar, title: "Book A Viewing", desc: "Choose your preferred date and time online instantly." },
    { icon: Home, title: "Move In", desc: "Our team guides you seamlessly through the entire process." }
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-16">How It Works<span className="text-[#ae884e]">.</span></h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {steps.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.2 }} className="bg-white p-10 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-[#ae884e]">
                <s.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">0{i+1} — {s.title}</h3>
              <p className="text-gray-500 font-light">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 5. HAKKIMIZDA KISA BİLGİ
export function AboutPreview() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-5xl font-semibold text-[#1c3053] mb-6">Property, made simple<span className="text-[#ae884e]">.</span></h2>
        <p className="text-xl text-gray-600 font-light leading-relaxed mb-10">
          OneKey Estate Agency combines cutting-edge modern technology with dedicated personal service. We believe finding your next home should be transparent, straightforward, and entirely stress-free.
        </p>
        <Link href="/about" className="inline-flex items-center justify-center px-8 py-4 border-2 border-[#1c3053] text-[#1c3053] rounded-2xl font-medium hover:bg-[#1c3053] hover:text-white transition-all">
          Learn More About Us
        </Link>
      </div>
    </section>
  );
}

// 6. MÜŞTERİ YORUMLARI
export function ReviewsPreview() {
  const reviews = [
    { name: "Emily R.", loc: "Rented in Canary Wharf", text: "Incredibly smooth process from viewing to moving in. The agent was always available on WhatsApp." },
    { name: "David T.", loc: "Rented in Richmond", text: "OneKey made finding a pet-friendly home so easy. Highly recommend their modern approach." },
    { name: "Sarah & James", loc: "Rented in Hampstead", text: "Professional, transparent and completely stress-free. The 3D tours saved us so much time." }
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">What Our Clients Say</h2>
          <Link href="/reviews" className="text-[#ae884e] hover:underline font-medium">View All Reviews &rarr;</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((r, i) => (
            <div key={i} className="bg-white p-10 rounded-[2rem] shadow-sm border border-gray-100">
              <div className="flex gap-1 mb-6 text-[#ae884e]">
                {[...Array(5)].map((_, idx) => <Star key={idx} className="w-5 h-5 fill-current" />)}
              </div>
              <p className="text-gray-700 italic font-light mb-8">"{r.text}"</p>
              <div>
                <h4 className="font-semibold text-gray-900">{r.name}</h4>
                <p className="text-sm text-gray-500 font-light">{r.loc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 7. ALT AKSİYON (CTA)
export function FinalCTA() {
  return (
    <section className="py-24 bg-[#1c3053] text-center px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-semibold text-white mb-6">Ready to find your next home?</h2>
        <p className="text-xl text-blue-200 font-light mb-10">Explore our available properties and book a viewing online today.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/listings" className="bg-[#ae884e] text-white px-8 py-4 rounded-2xl font-medium hover:bg-white hover:text-[#1c3053] transition-all shadow-lg">
            View Properties
          </Link>
          
          {/* GÜNCELLENEN BUTON: Açık mavi yerine saydam beyaz çerçeve ve şık hover efekti eklendi */}
          <Link href="/contact" className="bg-transparent border-2 border-white/30 text-white px-8 py-4 rounded-2xl font-medium hover:bg-white hover:text-[#1c3053] transition-all">
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  );
}
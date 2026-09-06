"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Bed, Bath, Calendar, CheckCircle, Box, Share2, Check, X, ChevronLeft, ChevronRight, Maximize2, Phone, Mail, MessageCircle } from "lucide-react";
import { propertiesData } from "@/data/properties";
import { Property } from "@/types";

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  
  // Tabs: "interior" | "exterior" | "floorplan" | "3dtour"
  const [activeTab, setActiveTab] = useState<string>("interior");
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Booking Form State
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedTime, setSelectedTime] = useState<string>("10:00 AM");
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  useEffect(() => {
    // Veritabanı simülasyonu
    const found = propertiesData.find((p) => p.id === id);
    if (found) {
      setProperty(found);
    } else {
      router.push("/listings");
    }
  }, [id, router]);

  if (!property) return <div className="min-h-screen pt-32 text-center text-gray-500">Loading property...</div>;

  const getActiveList = () => {
    if (activeTab === "interior") return property.interiorImages;
    if (activeTab === "exterior") return property.exteriorImages;
    if (activeTab === "floorplan" && property.floorPlan2D) return [property.floorPlan2D];
    return [];
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    const list = getActiveList();
    if (list.length > 1) setCurrentIndex((prev) => (prev === 0 ? list.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const list = getActiveList();
    if (list.length > 1) setCurrentIndex((prev) => (prev === list.length - 1 ? 0 : prev + 1));
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userPhone || !selectedDate) {
      alert("Please fill in all required fields.");
      return;
    }
    setBookingConfirmed(true);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: property.title, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentList = getActiveList();
  const currentImage = currentList[currentIndex] || "";

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-4 flex justify-between items-center">
        <Link href="/listings" className="inline-flex items-center text-[#1c3053] hover:text-[#ae884e] transition-colors font-medium">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Properties
        </Link>
        <button onClick={handleShare} className="inline-flex items-center px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all text-sm font-medium shadow-sm">
          <Share2 className="w-4 h-4 mr-2 text-[#ae884e]" />
          {copied ? "Link Copied!" : "Share Listing"}
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Medya Galerisi */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm mb-10 overflow-hidden p-4">
          <div className="flex gap-3 mb-4 overflow-x-auto pb-2 scrollbar-hide justify-start md:justify-center">
            <button onClick={() => { setActiveTab("interior"); setCurrentIndex(0); }} className={`px-5 py-2.5 rounded-full font-medium transition-all ${activeTab === "interior" ? "bg-[#1c3053] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Interior ({property.interiorImages.length})</button>
            <button onClick={() => { setActiveTab("exterior"); setCurrentIndex(0); }} className={`px-5 py-2.5 rounded-full font-medium transition-all ${activeTab === "exterior" ? "bg-[#1c3053] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Exterior ({property.exteriorImages.length})</button>
            {property.floorPlan2D && <button onClick={() => { setActiveTab("floorplan"); setCurrentIndex(0); }} className={`px-5 py-2.5 rounded-full font-medium transition-all ${activeTab === "floorplan" ? "bg-[#1c3053] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>2D Floor Plan</button>}
            {property.has3DModel && <button onClick={() => { setActiveTab("3dtour"); setCurrentIndex(0); }} className={`px-5 py-2.5 rounded-full font-medium transition-all ${activeTab === "3dtour" ? "bg-[#1c3053] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>3D Tour</button>}
          </div>

          <div onClick={() => activeTab !== "3dtour" && setIsLightboxOpen(true)} className="w-full h-[300px] md:h-[550px] rounded-2xl overflow-hidden relative bg-gray-900 flex items-center justify-center cursor-pointer group">
            {activeTab === "3dtour" ? (
              <div className="text-white text-center">
                <Box className="w-16 h-16 mx-auto mb-4 text-[#ae884e]" />
                <h3 className="text-2xl font-semibold mb-2">Interactive 3D Tour</h3>
                <p className="font-light">3D GLB/GLTF Model Area</p>
              </div>
            ) : (
              <>
                <img src={currentImage} alt="Property" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102" />
                {currentList.length > 1 && (
                  <>
                    <button onClick={handlePrev} className="absolute left-4 p-3 rounded-full bg-black/50 text-white hover:bg-black/75 opacity-80 group-hover:opacity-100"><ChevronLeft className="w-6 h-6" /></button>
                    <button onClick={handleNext} className="absolute right-4 p-3 rounded-full bg-black/50 text-white hover:bg-black/75 opacity-80 group-hover:opacity-100"><ChevronRight className="w-6 h-6" /></button>
                  </>
                )}
                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 opacity-0 group-hover:opacity-100"><Maximize2 className="w-3.5 h-3.5" /> Click to enlarge</div>
              </>
            )}
          </div>
        </div>

        {/* Lightbox */}
        {isLightboxOpen && (
          <div onClick={() => setIsLightboxOpen(false)} className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm">
            <button onClick={() => setIsLightboxOpen(false)} className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20"><X className="w-8 h-8" /></button>
            {currentList.length > 1 && <button onClick={handlePrev} className="absolute left-6 p-4 rounded-full bg-white/10 text-white hover:bg-white/20"><ChevronLeft className="w-8 h-8" /></button>}
            <img src={currentImage} alt="Fullscreen" className="max-w-full max-h-[90vh] object-contain rounded-xl" />
            {currentList.length > 1 && <button onClick={handleNext} className="absolute right-6 p-4 rounded-full bg-white/10 text-white hover:bg-white/20"><ChevronRight className="w-8 h-8" /></button>}
          </div>
        )}

        {/* İçerik Düzeni */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          <div className="flex-1 space-y-8">
            <div className="bg-white p-8 md:p-12 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 mb-4">{property.title}</h1>
              <div className="flex items-center text-gray-600 mb-6">
                <MapPin className="w-5 h-5 mr-2 text-[#ae884e]" />
                <span className="text-lg font-medium">{property.fullAddress}</span>
              </div>
              
              <div className="flex flex-wrap gap-6 border-y border-gray-100 py-6 mb-6">
                <div className="flex items-center text-gray-600"><Bed className="w-6 h-6 mr-3 text-[#ae884e]" /> <span className="font-light text-lg">{property.bedrooms} Beds</span></div>
                <div className="flex items-center text-gray-600"><Bath className="w-6 h-6 mr-3 text-[#ae884e]" /> <span className="font-light text-lg">{property.bathrooms} Baths</span></div>
                <div className="flex items-center text-gray-600"><span className="font-light text-lg">👥 Max {property.maxTenants} tenants</span></div>
              </div>
              <p className="text-gray-700 font-light leading-relaxed text-lg">{property.description}</p>
            </div>

            {/* Fiyat ve Tercih Tabloları */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-3">Price & Bills</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-500">Deposit</span><span className="font-medium text-gray-900">£{property.deposit.toLocaleString()}</span></div>
                  <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-500">Rent PCM</span><span className="font-medium text-gray-900">£{property.monthlyRent.toLocaleString()}</span></div>
                  <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-500">Bills Included</span><span className="font-medium">{property.billsIncluded ? <Check className="w-5 h-5 text-green-600 inline" /> : <X className="w-5 h-5 text-red-500 inline" />}</span></div>
                  <div className="flex justify-between py-2"><span className="text-gray-500">Furnishing</span><span className="font-medium text-gray-900">{property.furnishingStatus}</span></div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-3">Preferences & Features</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-500">Pets Allowed</span><span className="font-medium">{property.petsAllowed ? <Check className="w-5 h-5 text-green-600 inline" /> : <X className="w-5 h-5 text-red-500 inline" />}</span></div>
                  <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-500">Smokers Allowed</span><span className="font-medium">{property.smokersAllowed ? <Check className="w-5 h-5 text-green-600 inline" /> : <X className="w-5 h-5 text-red-500 inline" />}</span></div>
                  <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-500">EPC Rating</span><span className="font-medium text-gray-900">{property.epcRating}</span></div>
                </div>
              </div>
            </div>

            {/* Ajan Bilgisi (NEW) */}
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-3">Your Property Agent</h3>
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                <img src={property.agent.photo} alt={property.agent.name} className="w-24 h-24 rounded-full object-cover shadow-md" />
                <div className="flex-1 text-center md:text-left">
                  <h4 className="text-lg font-semibold text-gray-900">{property.agent.name}</h4>
                  <p className="text-gray-500 text-sm font-light mt-1 mb-4">{property.agent.bio}</p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <a href={`tel:${property.agent.phone}`} className="flex items-center text-sm font-medium text-[#1c3053] bg-gray-50 px-4 py-2 rounded-xl hover:bg-[#ae884e] hover:text-white transition-all"><Phone className="w-4 h-4 mr-2" /> {property.agent.phone}</a>
                    <a href={`mailto:${property.agent.email}`} className="flex items-center text-sm font-medium text-[#1c3053] bg-gray-50 px-4 py-2 rounded-xl hover:bg-[#ae884e] hover:text-white transition-all"><Mail className="w-4 h-4 mr-2" /> Email</a>
                    <a href={`https://wa.me/${property.agent.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center text-sm font-medium text-[#1c3053] bg-gray-50 px-4 py-2 rounded-xl hover:bg-[#ae884e] hover:text-white transition-all"><MessageCircle className="w-4 h-4 mr-2" /> WhatsApp</a>
                  </div>
                </div>
              </div>
            </div>

            {/* Harita */}
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center"><MapPin className="w-5 h-5 mr-2 text-[#ae884e]" /> Property Location</h3>
              <div className="w-full h-64 rounded-2xl overflow-hidden relative border border-gray-200 bg-gray-100 flex items-center justify-center">
                <iframe title="map" width="100%" height="100%" style={{ border: 0 }} loading="lazy" src={`https://maps.google.com/maps?q=${encodeURIComponent(property.fullAddress)}&t=&z=14&ie=UTF8&iwloc=&output=embed`} />
              </div>
            </div>
          </div>

          {/* Sağ Kolon: Randevu Formu (Mevcut yapı korundu) */}
          <div className="w-full lg:w-96 shrink-0">
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sticky top-28 space-y-6">
              <div className="text-center pb-6 border-b border-gray-100">
                <div className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3 ${property.availabilityStatus === 'Available' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>{property.availabilityStatus}</div>
                <p className="text-4xl font-bold text-[#1c3053]">£{property.monthlyRent.toLocaleString()} <span className="text-sm font-normal text-gray-500">pcm</span></p>
                <p className="text-gray-500 text-sm font-light mt-1">£{property.weeklyRent} pw</p>
                <div className="mt-4 text-xs text-gray-400 font-light">Property reference: <span className="font-medium text-gray-600">{property.propertyRef}</span></div>
              </div>

              {bookingConfirmed ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h4 className="font-semibold text-green-900 mb-1">Viewing Booked!</h4>
                  <p className="text-sm text-green-700 font-light">Scheduled for {selectedDate} at {selectedTime}. We will contact you shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <h3 className="font-semibold text-gray-900 text-lg flex items-center"><Calendar className="w-5 h-5 mr-2 text-[#ae884e]" /> Schedule Viewing</h3>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Select Day</label>
                    <input type="date" min={new Date().toISOString().split("T")[0]} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-900 focus:outline-none focus:border-[#ae884e]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Select Time</label>
                    <select value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-900 focus:outline-none focus:border-[#ae884e]">
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="01:00 PM">01:00 PM</option>
                      <option value="03:30 PM">03:30 PM</option>
                      <option value="05:00 PM">05:00 PM</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Your Full Name</label>
                    <input type="text" placeholder="John Smith" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-[#ae884e]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                    <input type="text" placeholder="+44 7000 000000" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-[#ae884e]" />
                  </div>
                  <button type="submit" className="w-full py-4 rounded-2xl font-medium text-[15px] bg-[#ae884e] text-white hover:bg-[#8f6e3c] transition-all shadow-lg">Confirm Booking</button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
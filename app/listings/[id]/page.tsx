"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Bed, Bath, Calendar, CheckCircle, Box, Share2, Check, X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { client } from "@/sanity/lib/client";

interface PropertyDetail {
  _id: string;
  title: string;
  price: string;
  deposit?: string;
  propertyRef?: string;
  maxTenants?: number;
  location: string;
  beds: number;
  baths: number;
  billsIncluded?: boolean;
  petsAllowed?: boolean;
  smokingAllowed?: boolean;
  furnishing?: string;
  epcRating?: string;
  description: string;
  interiorImages?: Array<{ asset: { url: string } }>;
  exteriorImages?: Array<{ asset: { url: string } }>;
  floorPlanImage?: { asset: { url: string } };
}

export default function PropertyDetailsPage() {
  const params = useParams();
  const id = params.id;

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<"interior" | "exterior" | "floorplan" | "3dtour">("interior");
  
  // İç ve dış mekan fotoğrafları için ayrı indeks takipleri
  const [currentInteriorIndex, setCurrentInteriorIndex] = useState<number>(0);
  const [currentExteriorIndex, setCurrentExteriorIndex] = useState<number>(0);
  
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedTime, setSelectedTime] = useState<string>("10:00 AM");
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchPropertyDetail = async () => {
      try {
        const query = `*[_type == "property" && _id == $id][0]{
          _id,
          title,
          price,
          deposit,
          propertyRef,
          maxTenants,
          location,
          beds,
          baths,
          billsIncluded,
          petsAllowed,
          smokingAllowed,
          furnishing,
          epcRating,
          description,
          interiorImages[]{ asset->{ url } },
          exteriorImages[]{ asset->{ url } },
          floorPlanImage{ asset->{ url } }
        }`;
        
        const data = await client.fetch(query, { id });
        setProperty(data);
      } catch (error) {
        console.error("Error fetching property details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyDetail();
  }, [id]);

  // Fotoğraf listeleri
  const interiorList = property?.interiorImages?.map(img => img.asset.url) || [
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80"
  ];

  const exteriorList = property?.exteriorImages?.map(img => img.asset.url) || [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"
  ];

  // Aktif sekmeye göre ok tuşlarının çalışacağı mantık
  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeTab === "interior") {
      setCurrentInteriorIndex((prev) => (prev === 0 ? interiorList.length - 1 : prev - 1));
    } else if (activeTab === "exterior") {
      setCurrentExteriorIndex((prev) => (prev === 0 ? exteriorList.length - 1 : prev - 1));
    }
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeTab === "interior") {
      setCurrentInteriorIndex((prev) => (prev === interiorList.length - 1 ? 0 : prev + 1));
    } else if (activeTab === "exterior") {
      setCurrentExteriorIndex((prev) => (prev === exteriorList.length - 1 ? 0 : prev + 1));
    }
  };

  // Ekranda gösterilecek aktif görsel
  const getCurrentDisplayImage = () => {
    if (activeTab === "interior") return interiorList[currentInteriorIndex];
    if (activeTab === "exterior") return exteriorList[currentExteriorIndex];
    if (activeTab === "floorplan") return property?.floorPlanImage?.asset?.url || "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80";
    return "";
  };

  const calculateWeeklyRent = (priceStr: string) => {
    const pcm = parseInt(priceStr.replace(/[^0-9]/g, ""), 10);
    if (isNaN(pcm)) return "N/A";
    const pw = (pcm * 12) / 52;
    return `£${pw.toFixed(2)} pw`;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: property?.title, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userPhone || !selectedDate) {
      alert("Please fill in all required fields.");
      return;
    }
    setBookingConfirmed(true);
  };

  if (loading) {
    return <div className="min-h-screen pt-32 text-center text-gray-500">Loading property details...</div>;
  }

  if (!property) {
    return (
      <div className="min-h-screen pt-32 text-center">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">Property Not Found</h1>
        <Link href="/" className="text-[#ae884e] underline">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-4 flex justify-between items-center">
        <Link href="/" className="inline-flex items-center text-[#1c3053] hover:text-[#ae884e] transition-colors font-medium">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Go Back to Search
        </Link>
        <button 
          onClick={handleShare}
          className="inline-flex items-center px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all text-sm font-medium shadow-sm"
        >
          <Share2 className="w-4 h-4 mr-2 text-[#ae884e]" />
          {copied ? "Link Copied!" : "Share Listing"}
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Medya Galerisi */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm mb-10 overflow-hidden p-4">
          <div className="flex gap-3 mb-4 overflow-x-auto pb-2 scrollbar-hide justify-start md:justify-center">
            <button onClick={() => setActiveTab("interior")} className={`px-5 py-2.5 rounded-full font-medium transition-all ${activeTab === "interior" ? "bg-[#1c3053] text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Interior ({interiorList.length})</button>
            <button onClick={() => setActiveTab("exterior")} className={`px-5 py-2.5 rounded-full font-medium transition-all ${activeTab === "exterior" ? "bg-[#1c3053] text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Exterior ({exteriorList.length})</button>
            <button onClick={() => setActiveTab("floorplan")} className={`px-5 py-2.5 rounded-full font-medium transition-all ${activeTab === "floorplan" ? "bg-[#1c3053] text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>2D Floor Plan</button>
            <button onClick={() => setActiveTab("3dtour")} className={`px-5 py-2.5 rounded-full font-medium transition-all ${activeTab === "3dtour" ? "bg-[#1c3053] text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>3D Tour</button>
          </div>

          <div 
            onClick={() => activeTab !== "3dtour" && setIsLightboxOpen(true)}
            className="w-full h-[300px] md:h-[550px] rounded-2xl overflow-hidden relative bg-gray-900 flex items-center justify-center cursor-pointer group"
          >
            {activeTab === "3dtour" ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#1c3053] text-white">
                <Box className="w-16 h-16 mb-4 text-[#ae884e]" />
                <h3 className="text-2xl font-semibold mb-2">Interactive 3D Tour</h3>
                <p className="text-blue-200 font-light max-w-md text-center px-4">Matterport virtual tour embed area.</p>
              </div>
            ) : (
              <>
                <img 
                  src={getCurrentDisplayImage()} 
                  alt="Property Media" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102" 
                />
                
                {/* Interior veya Exterior sekmelerinde birden fazla fotoğraf varsa oklar aktif olur */}
                {((activeTab === "interior" && interiorList.length > 1) || (activeTab === "exterior" && exteriorList.length > 1)) && (
                  <>
                    <button 
                      onClick={handlePrevImage}
                      className="absolute left-4 p-3 rounded-full bg-black/50 text-white hover:bg-black/75 transition-all opacity-80 group-hover:opacity-100"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>

                    <button 
                      onClick={handleNextImage}
                      className="absolute right-4 p-3 rounded-full bg-black/50 text-white hover:bg-black/75 transition-all opacity-80 group-hover:opacity-100"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}

                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-3.5 h-3.5" /> Click to view full screen
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tam Ekran Lightbox */}
        {isLightboxOpen && (
          <div 
            onClick={() => setIsLightboxOpen(false)}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <button 
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              <X className="w-8 h-8" />
            </button>

            {((activeTab === "interior" && interiorList.length > 1) || (activeTab === "exterior" && exteriorList.length > 1)) && (
              <button 
                onClick={handlePrevImage}
                className="absolute left-6 p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}

            <img 
              src={getCurrentDisplayImage()} 
              alt="Fullscreen View" 
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" 
            />

            {((activeTab === "interior" && interiorList.length > 1) || (activeTab === "exterior" && exteriorList.length > 1)) && (
              <button 
                onClick={handleNextImage}
                className="absolute right-6 p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
          </div>
        )}

        {/* Alt Detaylar ve Sağ Kolon (Form) */}
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-8">
            <div className="bg-white p-8 md:p-12 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 mb-4">{property.title}</h1>
              <div className="flex items-center text-gray-600 mb-6">
                <MapPin className="w-5 h-5 mr-2 text-[#ae884e]" />
                <span className="text-lg font-medium">{property.location}</span>
              </div>
              
              <div className="flex flex-wrap gap-6 border-y border-gray-100 py-6 mb-6">
                <div className="flex items-center text-gray-600">
                  <Bed className="w-6 h-6 mr-3 stroke-[1.5] text-[#ae884e]" />
                  <span className="font-light text-lg">{property.beds} Bedrooms</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Bath className="w-6 h-6 mr-3 stroke-[1.5] text-[#ae884e]" />
                  <span className="font-light text-lg">{property.baths} Bathrooms</span>
                </div>
                {property.maxTenants && (
                  <div className="flex items-center text-gray-600">
                    <span className="font-light text-lg">👥 Max {property.maxTenants} tenants</span>
                  </div>
                )}
              </div>
              
              <p className="text-gray-700 font-light leading-relaxed text-lg mb-8">{property.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-3">Price & Bills</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500">Deposit</span>
                    <span className="font-medium text-gray-900">{property.deposit || property.price}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500">Rent PCM</span>
                    <span className="font-medium text-gray-900">{property.price}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500">Bills Included</span>
                    <span className="font-medium">{property.billsIncluded ? <Check className="w-5 h-5 text-green-600 inline" /> : <X className="w-5 h-5 text-red-500 inline" />}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">Furnishing</span>
                    <span className="font-medium text-gray-900">{property.furnishing || "Unfurnished"}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-3">Preferences & Features</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500">Pets Allowed</span>
                    <span className="font-medium">{property.petsAllowed ? <Check className="w-5 h-5 text-green-600 inline" /> : <X className="w-5 h-5 text-red-500 inline" />}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500">Smokers Allowed</span>
                    <span className="font-medium">{property.smokingAllowed ? <Check className="w-5 h-5 text-green-600 inline" /> : <X className="w-5 h-5 text-red-500 inline" />}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500">EPC Rating</span>
                    <span className="font-medium text-gray-900">{property.epcRating || "C"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-[#ae884e]" />
                Property Location ({property.location})
              </h3>
              <div className="w-full h-64 rounded-2xl overflow-hidden relative border border-gray-200 bg-gray-100 flex items-center justify-center">
                <iframe 
                  title="map"
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  loading="lazy" 
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(property.location + " UK")}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                />
              </div>
            </div>
          </div>

          <div className="w-full lg:w-96 shrink-0">
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sticky top-28 space-y-6">
              
              <div className="text-center pb-6 border-b border-gray-100">
                <div className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full mb-3">Available</div>
                <p className="text-4xl font-bold text-[#1c3053]">{property.price} <span className="text-sm font-normal text-gray-500">pcm</span></p>
                <p className="text-gray-500 text-sm font-light mt-1">{calculateWeeklyRent(property.price)}</p>
                
                <div className="mt-4 text-xs text-gray-400 font-light">
                  Property reference: <span className="font-medium text-gray-600">{property.propertyRef || "3015767"}</span>
                </div>
              </div>

              {bookingConfirmed ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h4 className="font-semibold text-green-900 mb-1">Viewing Booked!</h4>
                  <p className="text-sm text-green-700 font-light">Scheduled for {selectedDate} at {selectedTime}.</p>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <h3 className="font-semibold text-gray-900 text-lg flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-[#ae884e]" />
                    Schedule Viewing
                  </h3>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Select Day</label>
                    <input 
                      type="date"
                      min={todayStr}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-900 focus:outline-none focus:border-[#ae884e]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Select Time</label>
                    <select 
                      value={selectedTime} 
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-900 focus:outline-none focus:border-[#ae884e]"
                    >
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="01:00 PM">01:00 PM</option>
                      <option value="03:30 PM">03:30 PM</option>
                      <option value="05:00 PM">05:00 PM</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Your Full Name</label>
                    <input 
                      type="text" 
                      placeholder="John Smith"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-900 placeholder:text-gray-900/50 focus:outline-none focus:border-[#ae884e]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                    <input 
                      type="text" 
                      placeholder="+44 7000 000000"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-900 placeholder:text-gray-900/50 focus:outline-none focus:border-[#ae884e]"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 rounded-2xl font-medium text-[15px] bg-[#ae884e] text-white hover:bg-[#8f6e3c] transition-all shadow-lg"
                  >
                    Confirm Booking
                  </button>
                </form>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
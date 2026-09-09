"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  MapPin,
  Bed,
  Bath,
  Calendar,
  CheckCircle,
  Share2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Phone,
  Mail,
  MessageCircle,
  Heart,
  Send,
  Box,
  Globe,
  ExternalLink,
} from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";

interface Agent {
  id: string;
  name: string;
  bio?: string | null;
  phone?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  photo?: string | null;
  avatar_url?: string | null;
}

interface Property {
  id: string;
  title: string;
  property_ref: string;
  full_address: string;
  short_location: string;
  postcode: string;
  monthly_rent: number;
  deposit: number;
  bedrooms: number;
  bathrooms: number;
  description: string;
  availability_status: string;
  bills_included: boolean;
  dss_lha_covers_rent: boolean;
  broadband_info?: string | null;
  available_from?: string | null;
  preferred_min_tenancy?: string | null;
  online_viewings: boolean;
  student_friendly: boolean;
  families_allowed: boolean;
  pets_allowed: boolean;
  smokers_allowed: boolean;
  garden: boolean;
  parking: boolean;
  fireplace: boolean;
  furnishing_status: string;
  epc_rating?: string | null;
  council_tax_band?: string | null;
  heating_type?: string | null;
  tenure?: string | null;
  minimum_tenancy?: number | null;
  floor_plan_2d?: string | null;
  model_3d_url?: string | null;
  has_3d_model: boolean;
  virtual_tour_url?: string | null;
  agents?: Agent | null;
}

// UK Yerel Tarih Helper'ı (UTC kaymasını önlemek için)
const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { toggleWishlist, isInWishlist } = useWishlist();
  const isSaved = isInWishlist(id);

  const [property, setProperty] = useState<Property | null>(null);
  const [interiorImages, setInteriorImages] = useState<string[]>([]);
  const [exteriorImages, setExteriorImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("interior");
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookingError, setBookingError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  
  const [msgName, setMsgName] = useState("");
  const [msgEmail, setMsgEmail] = useState("");
  const [msgPhone, setMsgPhone] = useState("");
  const [msgText, setMsgText] = useState("");
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState(false);
  const [msgError, setMsgError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchProperty() {
      const supabase = createClient();

      // Madde 2: status = Published filtresi eklendi
      const { data: propData, error: propError } = await supabase
        .from("properties")
        .select("*, agents(*)")
        .eq("id", id)
        .eq("status", "Published")
        .single();

      if (cancelled) return;

      if (propError || !propData) {
        router.push("/listings");
        return;
      }

      setProperty(propData as Property);

      const { data: imgData } = await supabase
        .from("property_images")
        .select("*")
        .eq("property_id", id)
        .order("display_order", { ascending: true });

      if (cancelled) return;

      if (imgData) {
        setInteriorImages(
          imgData
            .filter((img) => img.image_type === "interior")
            .map((img) => img.url as string)
        );

        setExteriorImages(
          imgData
            .filter((img) => img.image_type === "exterior")
            .map((img) => img.url as string)
        );
      }

      setLoading(false);
    }

    if (id) {
      fetchProperty();
    }

    return () => {
      cancelled = true;
    };
  }, [id, router]);

  // Madde 4: selectedTime dependency'den çıkarıldı (Gereksiz DB request engellendi)
  useEffect(() => {
    let cancelled = false;

    async function calculateAvailability() {
      if (!property?.agents?.id || !selectedDate) {
        return;
      }

      const supabase = createClient();
      setBookingError("");

      const dateObj = new Date(`${selectedDate}T00:00:00`);
      if (dateObj.getDay() === 0) {
        setAvailableSlots([]);
        setSelectedTime("");
        return;
      }

      const { data: blocks } = await supabase
        .from("blocked_dates")
        .select("*")
        .lte("start_date", selectedDate)
        .gte("end_date", selectedDate)
        .or(`agent_id.is.null,agent_id.eq.${property.agents.id}`);

      if (cancelled) return;

      let isFullDayBlocked = false;
      const specificallyBlockedSlots: string[] = [];

      const allSlots = [
        "08:00",
        "09:00",
        "10:00",
        "11:00",
        "12:00",
        "13:00",
        "14:00",
        "15:00",
        "16:00",
        "17:00",
      ];

      if (blocks && blocks.length > 0) {
        blocks.forEach((block) => {
          if (!block.start_time || !block.end_time) {
            isFullDayBlocked = true;
          } else {
            const blockStart = block.start_time.substring(0, 5);
            const blockEnd = block.end_time.substring(0, 5);

            allSlots.forEach((slot) => {
              if (slot >= blockStart && slot < blockEnd) {
                specificallyBlockedSlots.push(slot);
              }
            });
          }
        });
      }

      if (isFullDayBlocked) {
        setAvailableSlots([]);
        setSelectedTime("");
        return;
      }

      const { data: existingBookings } = await supabase
        .from("bookings")
        .select("start_time")
        .eq("agent_id", property.agents.id)
        .eq("viewing_date", selectedDate)
        .in("status", ["pending", "confirmed"]);

      if (cancelled) return;

      const bookedTimes =
        existingBookings?.map((b) => b.start_time.substring(0, 5)) || [];

      const freeSlots = allSlots.filter(
        (slot) =>
          !bookedTimes.includes(slot) &&
          !specificallyBlockedSlots.includes(slot)
      );

      setAvailableSlots(freeSlots);

      setSelectedTime((prev) =>
        freeSlots.includes(prev) ? prev : freeSlots[0] || ""
      );
    }

    calculateAvailability();

    return () => {
      cancelled = true;
    };
  }, [selectedDate, property?.agents?.id]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userName || !userPhone || !userEmail || !selectedDate || !selectedTime) {
      setBookingError("Please fill in all required fields and select a valid time.");
      return;
    }

    // Madde 5: Geçmiş tarih server-side kontrolü
    const todayStr = getLocalDateString();
    if (selectedDate < todayStr) {
      setBookingError("You cannot schedule a viewing for a past date.");
      return;
    }

    if (!property?.agents?.id) {
      setBookingError("No agent is currently assigned to this property. Viewing cannot be booked.");
      return;
    }

    setBookingLoading(true);
    setBookingError("");

    try {
      const supabase = createClient();
      const hour = parseInt(selectedTime.split(":")[0], 10);
      const endTime = `${(hour + 1).toString().padStart(2, "0")}:00:00`;

      // Madde 1: Doğrudan insert yerine güvenli atomik RPC çağrısı (Race condition korumalı)
      const { data: rpcData, error } = await supabase.rpc(
        "create_pending_booking",
        {
          p_property_id: property.id,
          p_agent_id: property.agents.id,
          p_viewing_date: selectedDate,
          p_start_time: `${selectedTime}:00`,
          p_end_time: endTime,
          p_customer_name: userName.trim(),
          p_customer_email: userEmail.trim(),
          p_customer_phone: userPhone.trim(),
        }
      );

      if (error) {
        if (error.code === "23505") {
          throw new Error("This time slot was just booked by someone else.");
        }
        throw error;
      }

      const bookingId = rpcData?.id || rpcData;

      // Madde 6: Bildirim gönderimi hata yönetimi (Email gitmese bile booking başarısını yutmamak için detaylı loglama)
      try {
        const notificationResponse = await fetch("/api/bookings/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId }),
        });

        if (!notificationResponse.ok) {
          const errText = await notificationResponse.text();
          console.error("Booking email notification failed:", errText);
          setBookingError("Booking created, but email notification failed to send. Our team has been notified.");
        }
      } catch (notificationError) {
        console.error("Booking email notification request failed:", notificationError);
      }

      setBookingConfirmed(true);
    } catch (err: any) {
      setBookingError(err.message || "Failed to book viewing.");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsgLoading(true);
    setMsgError("");
    setMsgSuccess(false);

    try {
      const supabase = createClient();

      // Madde 8: Oturum açmış müşteri varsa customer_id eklenerek hesap ile ilişkilendirilir
      const { data: authData } = await supabase.auth.getUser();
      let customerId: string | null = null;

      if (authData?.user) {
        const { data: custData } = await supabase
          .from("customers")
          .select("id")
          .eq("auth_user_id", authData.user.id)
          .single();
        if (custData) {
          customerId = custData.id;
        }
      }

      const { error } = await supabase.from("messages").insert([
        {
          property_id: property?.id,
          customer_id: customerId,
          sender_name: msgName.trim(),
          sender_email: msgEmail.trim(),
          sender_phone: msgPhone.trim() || null,
          message: msgText.trim(),
        },
      ]);

      if (error) throw error;

      // Madde 7: Contact email bildirimi hata kontrolü
      try {
        const notificationResponse = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: msgName.trim(),
            email: msgEmail.trim(),
            phone: msgPhone.trim() || null,
            message: msgText.trim(),
            propertyTitle: property?.title,
            propertyRef: property?.property_ref,
          }),
        });

        if (!notificationResponse.ok) {
          console.error("Contact email notification failed:", await notificationResponse.text());
        }
      } catch (notificationError) {
        console.error("Contact email notification request failed:", notificationError);
      }

      setMsgSuccess(true);
      setMsgName("");
      setMsgEmail("");
      setMsgPhone("");
      setMsgText("");
    } catch (error: any) {
      setMsgError("Failed to send message: " + error.message);
    } finally {
      setMsgLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property?.title || "Property",
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentList =
    activeTab === "interior"
      ? interiorImages
      : activeTab === "exterior"
      ? exteriorImages
      : activeTab === "floorplan" && property?.floor_plan_2d
      ? [property.floor_plan_2d]
      : [];

  const currentImage = currentList[currentIndex] || "";

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentList.length > 1) {
      setCurrentIndex((prev) => (prev === 0 ? currentList.length - 1 : prev - 1));
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentList.length > 1) {
      setCurrentIndex((prev) => (prev === currentList.length - 1 ? 0 : prev + 1));
    }
  };

  const selectMediaTab = (tab: string) => {
    setActiveTab(tab);
    setCurrentIndex(0);
    setIsLightboxOpen(false);
  };

  const FeatureRow = ({
    label,
    value,
    type = "bool",
  }: {
    label: string;
    value: any;
    type?: "bool" | "text";
  }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
      <span className="text-gray-500 text-sm">{label}</span>
      {type === "bool" ? (
        value ? (
          <Check className="w-5 h-5 text-green-600" />
        ) : (
          <X className="w-5 h-5 text-red-500" />
        )
      ) : (
        <span className="text-gray-900 text-sm font-medium">
          {value || "-"}
        </span>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-[#ae884e] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-light">Loading property...</p>
        </div>
      </div>
    );
  }

  if (!property) return null;

  const has3DModel = Boolean(property.model_3d_url && property.has_3d_model);
  const hasVirtualTour = Boolean(property.virtual_tour_url);

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-[#1c3053] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Listings
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleWishlist(id)}
              className={`inline-flex items-center px-4 py-2 rounded-xl border transition-all text-sm font-medium ${
                isSaved
                  ? "bg-red-50 border-red-200 text-red-600"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Heart className={`w-4 h-4 mr-2 ${isSaved ? "fill-current" : ""}`} />
              {isSaved ? "Saved" : "Save"}
            </button>

            <button
              onClick={handleShare}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all text-sm font-medium shadow-sm"
            >
              <Share2 className="w-4 h-4 mr-2 text-[#ae884e]" />
              {copied ? "Link Copied!" : "Share"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm mb-10 overflow-hidden p-4">
          <div className="flex gap-3 mb-4 overflow-x-auto pb-2 scrollbar-hide justify-start md:justify-center">
            <button
              onClick={() => selectMediaTab("interior")}
              className={`px-5 py-2.5 rounded-full font-medium transition-all whitespace-nowrap ${
                activeTab === "interior"
                  ? "bg-[#1c3053] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Interior ({interiorImages.length})
            </button>

            <button
              onClick={() => selectMediaTab("exterior")}
              className={`px-5 py-2.5 rounded-full font-medium transition-all whitespace-nowrap ${
                activeTab === "exterior"
                  ? "bg-[#1c3053] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Exterior ({exteriorImages.length})
            </button>

            {property.floor_plan_2d && (
              <button
                onClick={() => selectMediaTab("floorplan")}
                className={`px-5 py-2.5 rounded-full font-medium transition-all whitespace-nowrap ${
                  activeTab === "floorplan"
                    ? "bg-[#1c3053] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                2D Floor Plan
              </button>
            )}

            {has3DModel && (
              <button
                onClick={() => selectMediaTab("3dtour")}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all whitespace-nowrap ${
                  activeTab === "3dtour"
                    ? "bg-[#1c3053] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Box className="w-4 h-4" />
                3D Model
              </button>
            )}

            {hasVirtualTour && (
              <button
                onClick={() => selectMediaTab("virtualtour")}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all whitespace-nowrap ${
                  activeTab === "virtualtour"
                    ? "bg-[#1c3053] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Globe className="w-4 h-4" />
                Virtual Tour
              </button>
            )}
          </div>

          <div
            onClick={() =>
              activeTab !== "3dtour" &&
              activeTab !== "virtualtour" &&
              currentImage &&
              setIsLightboxOpen(true)
            }
            className={`w-full h-[300px] md:h-[550px] rounded-2xl overflow-hidden relative bg-gray-900 flex items-center justify-center ${
              activeTab === "3dtour" || activeTab === "virtualtour"
                ? ""
                : "cursor-pointer group"
            }`}
          >
            {activeTab === "3dtour" && has3DModel ? (
              <div className="w-full h-full bg-gray-900 relative">
                {/* @ts-ignore */}
                <model-viewer
                  src={property.model_3d_url ?? undefined}
                  alt="A 3D model of the property"
                  auto-rotate
                  camera-controls
                  ar
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: "#111827",
                  }}
                >
                  <div className="absolute bottom-4 left-4 right-4 md:right-auto bg-black/60 backdrop-blur-md text-white text-xs px-3 py-2 rounded-lg pointer-events-none">
                    Use your mouse or touch screen to rotate, zoom and explore the property.
                  </div>
                </model-viewer>
              </div>
            ) : activeTab === "virtualtour" && hasVirtualTour ? (
              <div className="w-full h-full bg-gray-950 relative">
                <iframe
                  src={property.virtual_tour_url ?? undefined}
                  title={`Virtual tour of ${property.title}`}
                  className="w-full h-full border-0"
                  allow="fullscreen; autoplay; xr-spatial-tracking"
                  allowFullScreen
                  loading="lazy"
                />

                <a
                  href={property.virtual_tour_url ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-4 right-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/70 backdrop-blur-md text-white text-sm font-medium hover:bg-[#ae884e] transition-all shadow-lg"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Full Tour
                </a>
              </div>
            ) : currentImage ? (
              <>
                {currentImage.match(/\.(mp4|webm|mov)$/i) ? (
                  <video
                    src={currentImage}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <Image
                    src={currentImage}
                    alt="Property"
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 1200px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}

                {currentList.length > 1 && (
                  <>
                    <button
                      onClick={handlePrev}
                      className="absolute left-4 p-3 rounded-full bg-black/50 text-white hover:bg-black/75 opacity-80 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>

                    <button
                      onClick={handleNext}
                      className="absolute right-4 p-3 rounded-full bg-black/50 text-white hover:bg-black/75 opacity-80 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}

                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-3.5 h-3.5" />
                  Click to enlarge
                </div>
              </>
            ) : (
              <span className="text-gray-400">No media available</span>
            )}
          </div>
        </div>

        {isLightboxOpen && currentImage && (
          <div
            onClick={() => setIsLightboxOpen(false)}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X className="w-8 h-8" />
            </button>

            {currentList.length > 1 && (
              <button
                onClick={handlePrev}
                className="absolute left-6 p-4 rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}

            {currentImage.match(/\.(mp4|webm|mov)$/i) ? (
              <video
                src={currentImage}
                controls
                autoPlay
                playsInline
                className="max-w-full max-h-[90vh] rounded-xl"
              />
            ) : (
              <div className="relative w-full max-w-6xl h-[80vh]">
                <Image
                  src={currentImage}
                  alt="Fullscreen"
                  fill
                  sizes="100vw"
                  className="object-contain rounded-xl"
                />
              </div>
            )}

            {currentList.length > 1 && (
              <button
                onClick={handleNext}
                className="absolute right-6 p-4 rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-8">
            <div className="bg-white p-8 md:p-12 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 mb-4">
                {property.title}
              </h1>

              <div className="flex items-center text-gray-600 mb-6">
                <MapPin className="w-5 h-5 mr-2 text-[#ae884e]" />
                <span className="text-lg font-medium">{property.full_address}</span>
              </div>

              <div className="flex flex-wrap gap-6 border-y border-gray-100 py-6 mb-6">
                <div className="flex items-center text-gray-600">
                  <Bed className="w-6 h-6 mr-3 text-[#ae884e]" />
                  <span className="font-light text-lg">{property.bedrooms} Beds</span>
                </div>

                <div className="flex items-center text-gray-600">
                  <Bath className="w-6 h-6 mr-3 text-[#ae884e]" />
                  <span className="font-light text-lg">{property.bathrooms} Baths</span>
                </div>
              </div>

              <p className="text-gray-700 font-light leading-relaxed text-lg whitespace-pre-wrap">
                {property.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-3">
                  Price & Bills
                </h3>

                <div className="space-y-4">
                  <FeatureRow
                    label="Deposit"
                    value={`£${property.deposit?.toLocaleString() || "-"}`}
                    type="text"
                  />
                  <FeatureRow
                    label="Rent PCM"
                    value={`£${property.monthly_rent?.toLocaleString() || "-"}`}
                    type="text"
                  />
                  <FeatureRow label="Bills Included" value={property.bills_included} />
                  <FeatureRow label="DSS/LHA Covers Rent" value={property.dss_lha_covers_rent} />
                  <FeatureRow
                    label="Broadband"
                    value={property.broadband_info || "Ask Agent"}
                    type="text"
                  />
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-6 mt-8 border-b pb-3">
                  Availability
                </h3>

                <div className="space-y-4">
                  <FeatureRow
                    label="Available From"
                    value={property.available_from || "Ask Agent"}
                    type="text"
                  />
                  <FeatureRow
                    label="Preferred Minimum Tenancy"
                    value={property.preferred_min_tenancy || "-"}
                    type="text"
                  />
                  <FeatureRow label="Online Viewings" value={property.online_viewings} />
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-3">
                  Tenant Preference
                </h3>

                <div className="space-y-4">
                  <FeatureRow label="Student Friendly" value={property.student_friendly} />
                  <FeatureRow label="Families Allowed" value={property.families_allowed} />
                  <FeatureRow label="Pets Allowed" value={property.pets_allowed} />
                  <FeatureRow label="Smokers Allowed" value={property.smokers_allowed} />
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-6 mt-8 border-b pb-3">
                  Features
                </h3>

                <div className="space-y-4">
                  <FeatureRow label="Garden" value={property.garden} />
                  <FeatureRow label="Parking" value={property.parking} />
                  <FeatureRow label="Fireplace" value={property.fireplace} />
                  <FeatureRow label="Furnishing" value={property.furnishing_status} type="text" />
                  <FeatureRow label="EPC Rating" value={property.epc_rating} type="text" />
                  <FeatureRow label="Council Tax Band" value={property.council_tax_band} type="text" />
                  <FeatureRow label="Heating" value={property.heating_type} type="text" />
                  <FeatureRow label="Tenure" value={property.tenure} type="text" />
                  <FeatureRow
                    label="Minimum Tenancy"
                    value={property.minimum_tenancy ? `${property.minimum_tenancy} months` : "-"}
                    type="text"
                  />
                </div>
              </div>
            </div>

            {property.agents && (
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-3">
                  Your Property Agent
                </h3>

                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                  <Image
                    src={
                      property.agents.photo ||
                      property.agents.avatar_url ||
                      "https://via.placeholder.com/150"
                    }
                    alt={property.agents.name}
                    width={96}
                    height={96}
                    unoptimized
                    className="w-24 h-24 rounded-full object-cover shadow-md"
                  />

                  <div className="flex-1 text-center md:text-left">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {property.agents.name}
                    </h4>
                    <p className="text-gray-500 text-sm font-light mt-1 mb-4">
                      {property.agents.bio}
                    </p>

                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                      {property.agents.phone && (
                        <a
                          href={`tel:${property.agents.phone}`}
                          className="flex items-center text-sm font-medium text-[#1c3053] bg-gray-50 px-4 py-2 rounded-xl hover:bg-[#ae884e] hover:text-white transition-all"
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          {property.agents.phone}
                        </a>
                      )}

                      {property.agents.email && (
                        <a
                          href={`mailto:${property.agents.email}`}
                          className="flex items-center text-sm font-medium text-[#1c3053] bg-gray-50 px-4 py-2 rounded-xl hover:bg-[#ae884e] hover:text-white transition-all"
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Email
                        </a>
                      )}

                      {property.agents.whatsapp && (
                        <a
                          href={`https://wa.me/${property.agents.whatsapp.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center text-sm font-medium text-[#1c3053] bg-gray-50 px-4 py-2 rounded-xl hover:bg-[#ae884e] hover:text-white transition-all"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-[#ae884e]" />
                Property Location
              </h3>

              <div className="w-full h-64 rounded-2xl overflow-hidden relative border border-gray-200 bg-gray-100 flex items-center justify-center">
                <iframe
                  title="map"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(
                    property.full_address || property.short_location || ""
                  )}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                />
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Have a question?</h3>
              <p className="text-gray-500 font-light mb-8">
                Send us a message about this property and we'll get back to you shortly.
              </p>

              {msgSuccess ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-green-900 mb-2">
                    Message Sent Successfully!
                  </h4>
                  <p className="text-green-700 font-light">
                    Thank you for your interest. Our team will contact you soon.
                  </p>
                  <button
                    onClick={() => setMsgSuccess(false)}
                    className="mt-6 text-sm font-medium text-green-800 hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleMessageSubmit} className="space-y-6">
                  {msgError && (
                    <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl font-medium">
                      {msgError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={msgName}
                        onChange={(e) => setMsgName(e.target.value)}
                        className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-[#ae884e] transition-colors"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={msgEmail}
                        onChange={(e) => setMsgEmail(e.target.value)}
                        className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-[#ae884e] transition-colors"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={msgPhone}
                      onChange={(e) => setMsgPhone(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-[#ae884e] transition-colors"
                      placeholder="+44 7000 000000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Message *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={msgText}
                      onChange={(e) => setMsgText(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-[#ae884e] transition-colors resize-none"
                      placeholder="I would like to know more about..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={msgLoading}
                    className="inline-flex items-center justify-center px-8 py-4 bg-[#1c3053] text-white rounded-xl font-medium hover:bg-[#ae884e] disabled:bg-gray-400 transition-all shadow-md"
                  >
                    {msgLoading ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="w-full lg:w-96 shrink-0">
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sticky top-28 space-y-6">
              <div className="text-center pb-6 border-b border-gray-100">
                <div
                  className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3 ${
                    property.availability_status === "Available"
                      ? "bg-green-100 text-green-800"
                      : "bg-orange-100 text-orange-800"
                  }`}
                >
                  {property.availability_status}
                </div>

                <p className="text-4xl font-bold text-[#1c3053]">
                  £{property.monthly_rent?.toLocaleString()}
                  <span className="text-sm font-normal text-gray-500"> pcm</span>
                </p>

                <div className="mt-4 text-xs text-gray-400 font-light">
                  Property reference:{" "}
                  <span className="font-medium text-gray-600">{property.property_ref}</span>
                </div>
              </div>

              {bookingConfirmed ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h4 className="font-semibold text-green-900 mb-1">Viewing Booked!</h4>
                  <p className="text-sm text-green-700 font-light">
                    Scheduled for {selectedDate} at {selectedTime}. We will contact you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <h3 className="font-semibold text-gray-900 text-lg flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-[#ae884e]" />
                    Schedule Viewing
                  </h3>

                  {bookingError && (
                    <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium">
                      {bookingError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Select Day
                    </label>
                    <input
                      type="date"
                      min={getLocalDateString()}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-900 focus:outline-none focus:border-[#ae884e]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Select Time
                    </label>
                    {availableSlots.length === 0 ? (
                      <div className="w-full p-3 rounded-xl border border-red-200 text-sm bg-red-50 text-red-600 font-medium">
                        No slots available on this date.
                      </div>
                    ) : (
                      <select
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full p-3 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-900 focus:outline-none focus:border-[#ae884e]"
                      >
                        {availableSlots.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-900 focus:outline-none focus:border-[#ae884e]"
                      placeholder="John Smith"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-900 focus:outline-none focus:border-[#ae884e]"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-900 focus:outline-none focus:border-[#ae884e]"
                      placeholder="+44 7000 000000"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={bookingLoading || availableSlots.length === 0}
                    className="w-full py-4 rounded-2xl font-medium text-[15px] bg-[#ae884e] text-white hover:bg-[#1c3053] disabled:bg-gray-300 transition-all shadow-lg"
                  >
                    {bookingLoading ? "Confirming..." : "Confirm Booking"}
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
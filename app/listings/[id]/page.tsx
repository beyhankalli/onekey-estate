"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
} from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";

type Agent = {
  id: string;
  name: string;
  photo?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  bio?: string | null;
};

type Property = {
  id: string;
  property_ref?: string | null;
  title: string;
  full_address?: string | null;
  short_location?: string | null;
  description?: string | null;
  monthly_rent?: number | null;
  weekly_rent?: number | null;
  deposit?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  bills_included?: boolean | null;
  dss_lha_covers_rent?: boolean | null;
  broadband_info?: string | null;
  available_from?: string | null;
  preferred_min_tenancy?: string | null;
  online_viewings?: boolean | null;
  student_friendly?: boolean | null;
  families_allowed?: boolean | null;
  pets_allowed?: boolean | null;
  smokers_allowed?: boolean | null;
  garden?: boolean | null;
  parking?: boolean | null;
  fireplace?: boolean | null;
  furnishing_status?: string | null;
  epc_rating?: string | null;
  availability_status?: string | null;
  floor_plan_2d?: string | null;
  has_3d_model?: boolean | null;
  model_3d_url?: string | null;
  agents?: Agent | null;
};

type PropertyImage = {
  id: string;
  property_id: string;
  url: string;
  image_type: string;
  display_order: number;
};

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const supabase = createClient();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isSaved = isInWishlist(id);

  const [property, setProperty] = useState<Property | null>(null);
  const [interiorImages, setInteriorImages] = useState<string[]>([]);
  const [exteriorImages, setExteriorImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<
    "interior" | "exterior" | "floorplan" | "3dtour"
  >("interior");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Booking
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedTime, setSelectedTime] = useState("");
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookingError, setBookingError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  // Message
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
      setLoading(true);

      const { data: propData, error: propError } = await supabase
        .from("properties")
        .select("*, agents(*)")
        .eq("id", id)
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

      if (!cancelled && imgData) {
        const images = imgData as PropertyImage[];

        setInteriorImages(
          images
            .filter((img) => img.image_type === "interior")
            .map((img) => img.url)
        );

        setExteriorImages(
          images
            .filter((img) => img.image_type === "exterior")
            .map((img) => img.url)
        );
      }

      if (!cancelled) {
        setLoading(false);
      }
    }

    if (id) {
      fetchProperty();
    }

    return () => {
      cancelled = true;
    };
  }, [id, router, supabase]);

  useEffect(() => {
    let cancelled = false;

    async function calculateAvailability() {
      if (!property?.agents?.id || !selectedDate) {
        setAvailableSlots([]);
        return;
      }

      setAvailabilityLoading(true);
      setBookingError("");

      const dateObj = new Date(`${selectedDate}T12:00:00`);

      if (dateObj.getDay() === 0) {
        setAvailableSlots([]);
        setSelectedTime("");
        setAvailabilityLoading(false);
        return;
      }

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

      const { data: blocks } = await supabase
        .from("blocked_dates")
        .select(
          "start_date, end_date, start_time, end_time, agent_id"
        )
        .lte("start_date", selectedDate)
        .gte("end_date", selectedDate)
        .or(
          `agent_id.is.null,agent_id.eq.${property.agents.id}`
        );

      if (cancelled) return;

      let isFullDayBlocked = false;
      const specificallyBlockedSlots: string[] = [];

      if (blocks && blocks.length > 0) {
        blocks.forEach((block) => {
          if (!block.start_time || !block.end_time) {
            isFullDayBlocked = true;
            return;
          }

          const blockStart = String(block.start_time).substring(0, 5);
          const blockEnd = String(block.end_time).substring(0, 5);

          allSlots.forEach((slot) => {
            if (slot >= blockStart && slot < blockEnd) {
              specificallyBlockedSlots.push(slot);
            }
          });
        });
      }

      if (isFullDayBlocked) {
        setAvailableSlots([]);
        setSelectedTime("");
        setAvailabilityLoading(false);
        return;
      }

      /*
       * Public users are not allowed to read bookings directly.
       * The SECURITY DEFINER RPC returns only the start times
       * required for availability checking.
       */
      const { data: bookedSlots, error: bookedSlotsError } =
        await supabase.rpc("get_agent_booked_slots", {
          p_agent_id: property.agents.id,
          p_date: selectedDate,
        });

      if (cancelled) return;

      if (bookedSlotsError) {
        console.error(
          "Availability check failed:",
          bookedSlotsError
        );

        setAvailableSlots([]);
        setSelectedTime("");
        setBookingError(
          "We couldn't check availability right now. Please try again."
        );
        setAvailabilityLoading(false);
        return;
      }

      const bookedTimes =
        bookedSlots?.map((slot: { start_time: string }) =>
          String(slot.start_time).substring(0, 5)
        ) || [];

      const freeSlots = allSlots.filter(
        (slot) =>
          !bookedTimes.includes(slot) &&
          !specificallyBlockedSlots.includes(slot)
      );

      if (cancelled) return;

      setAvailableSlots(freeSlots);

      if (freeSlots.length > 0) {
        if (!freeSlots.includes(selectedTime)) {
          setSelectedTime(freeSlots[0]);
        }
      } else {
        setSelectedTime("");
      }

      setAvailabilityLoading(false);
    }

    calculateAvailability();

    return () => {
      cancelled = true;
    };
  }, [selectedDate, property, supabase, selectedTime]);

  const handleBookingSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (
      !userName.trim() ||
      !userPhone.trim() ||
      !selectedDate ||
      !selectedTime
    ) {
      setBookingError(
        "Please fill in all required fields and select a valid time."
      );
      return;
    }

    if (!property?.agents?.id) {
      setBookingError(
        "No agent is currently assigned to this property. Viewing cannot be booked."
      );
      return;
    }

    if (!availableSlots.includes(selectedTime)) {
      setBookingError(
        "This time slot is no longer available. Please select another time."
      );
      return;
    }

    setBookingLoading(true);
    setBookingError("");

    try {
      const hour = parseInt(selectedTime.split(":")[0], 10);
      const endTime = `${String(hour + 1).padStart(2, "0")}:00:00`;

      const { error } = await supabase.from("bookings").insert([
        {
          property_id: property.id,
          agent_id: property.agents.id,
          viewing_date: selectedDate,
          start_time: `${selectedTime}:00`,
          end_time: endTime,
          customer_name: userName.trim(),
          customer_phone: userPhone.trim(),
          status: "pending",
        },
      ]);

      if (error) {
        if (error.code === "23505") {
          throw new Error(
            "This time slot was just booked by someone else. Please select another time."
          );
        }

        console.error("Booking error:", error);

        throw new Error(
          "We couldn't complete your booking. Please try again."
        );
      }

      setBookingConfirmed(true);
    } catch (err) {
      setBookingError(
        err instanceof Error
          ? err.message
          : "We couldn't complete your booking. Please try again."
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const handleMessageSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (
      !msgName.trim() ||
      !msgEmail.trim() ||
      !msgText.trim()
    ) {
      setMsgError("Please fill in all required fields.");
      return;
    }

    setMsgLoading(true);
    setMsgError("");
    setMsgSuccess(false);

    try {
      if (!property?.id) {
        throw new Error(
          "Property information is unavailable."
        );
      }

      const { error } = await supabase.from("messages").insert([
        {
          property_id: property.id,
          sender_name: msgName.trim(),
          sender_email: msgEmail.trim(),
          sender_phone: msgPhone.trim() || null,
          message: msgText.trim(),
        },
      ]);

      if (error) {
        console.error("Message error:", error);
        throw new Error(
          "Failed to send your message. Please try again."
        );
      }

      setMsgSuccess(true);
      setMsgName("");
      setMsgEmail("");
      setMsgPhone("");
      setMsgText("");
    } catch (error) {
      setMsgError(
        error instanceof Error
          ? error.message
          : "Failed to send your message. Please try again."
      );
    } finally {
      setMsgLoading(false);
    }
  };

  const handleShare = async () => {
    if (!property) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          url: window.location.href,
        });
      } catch {
        // User cancelled the native share dialog.
      }
    } else {
      try {
        await navigator.clipboard.writeText(
          window.location.href
        );

        setCopied(true);

        setTimeout(() => setCopied(false), 2000);
      } catch {
        setCopied(false);
      }
    }
  };

  const currentList =
    activeTab === "interior"
      ? interiorImages
      : activeTab === "exterior"
        ? exteriorImages
        : activeTab === "floorplan" &&
            property?.floor_plan_2d
          ? [property.floor_plan_2d]
          : [];

  const currentImage = currentList[currentIndex] || "";

  const isVideo = (url: string) =>
    /\.(mp4|webm|mov)$/i.test(url);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (currentList.length > 1) {
      setCurrentIndex((prev) =>
        prev === 0 ? currentList.length - 1 : prev - 1
      );
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (currentList.length > 1) {
      setCurrentIndex((prev) =>
        prev === currentList.length - 1 ? 0 : prev + 1
      );
    }
  };

  const FeatureRow = ({
    label,
    value,
    type = "bool",
  }: {
    label: string;
    value: unknown;
    type?: "bool" | "text";
  }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
      <span className="text-gray-500 text-sm">
        {label}
      </span>

      {type === "bool" ? (
        value ? (
          <Check className="w-5 h-5 text-green-600" />
        ) : (
          <X className="w-5 h-5 text-red-500" />
        )
      ) : (
        <span className="font-medium text-gray-900 text-sm">
          {String(value || "-")}
        </span>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center text-gray-500">
        Loading property...
      </div>
    );
  }

  if (!property) {
    return null;
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-4 flex justify-between items-center">
        <Link
          href="/listings"
          className="inline-flex items-center text-[#1c3053] hover:text-[#ae884e] transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Properties
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleWishlist(id)}
            className={`inline-flex items-center px-4 py-2 rounded-xl border transition-all text-sm font-medium shadow-sm ${
              isSaved
                ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Heart
              fill={isSaved ? "currentColor" : "none"}
              className={`w-4 h-4 mr-2 ${
                isSaved
                  ? "text-red-500"
                  : "text-gray-400"
              }`}
            />

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm mb-10 overflow-hidden p-4">
          <div className="flex gap-3 mb-4 overflow-x-auto pb-2 scrollbar-hide justify-start md:justify-center">
            <button
              onClick={() => {
                setActiveTab("interior");
                setCurrentIndex(0);
              }}
              className={`px-5 py-2.5 rounded-full font-medium transition-all ${
                activeTab === "interior"
                  ? "bg-[#1c3053] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Interior ({interiorImages.length})
            </button>

            <button
              onClick={() => {
                setActiveTab("exterior");
                setCurrentIndex(0);
              }}
              className={`px-5 py-2.5 rounded-full font-medium transition-all ${
                activeTab === "exterior"
                  ? "bg-[#1c3053] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Exterior ({exteriorImages.length})
            </button>

            {property.floor_plan_2d && (
              <button
                onClick={() => {
                  setActiveTab("floorplan");
                  setCurrentIndex(0);
                }}
                className={`px-5 py-2.5 rounded-full font-medium transition-all ${
                  activeTab === "floorplan"
                    ? "bg-[#1c3053] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                2D Floor Plan
              </button>
            )}

            {property.model_3d_url &&
              property.has_3d_model && (
                <button
                  onClick={() => {
                    setActiveTab("3dtour");
                    setCurrentIndex(0);
                  }}
                  className={`px-5 py-2.5 rounded-full font-medium transition-all ${
                    activeTab === "3dtour"
                      ? "bg-[#1c3053] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  3D Tour
                </button>
              )}
          </div>

          <div
            onClick={() =>
              activeTab !== "3dtour" &&
              currentImage &&
              setIsLightboxOpen(true)
            }
            className="w-full h-[300px] md:h-[550px] rounded-2xl overflow-hidden relative bg-gray-900 flex items-center justify-center cursor-pointer group"
          >
            {activeTab === "3dtour" ? (
              <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center relative">
                <model-viewer
                  src={property.model_3d_url || ""}
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
                  <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg pointer-events-none">
                    Use mouse to rotate & zoom 3D model
                  </div>
                </model-viewer>
              </div>
            ) : currentImage ? (
              <>
                {isVideo(currentImage) ? (
                  <video
                    src={currentImage}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <img
                    src={currentImage}
                    alt={property.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}

                {currentList.length > 1 && (
                  <>
                    <button
                      onClick={handlePrev}
                      aria-label="Previous image"
                      className="absolute left-4 p-3 rounded-full bg-black/50 text-white hover:bg-black/75 opacity-80 group-hover:opacity-100"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>

                    <button
                      onClick={handleNext}
                      aria-label="Next image"
                      className="absolute right-4 p-3 rounded-full bg-black/50 text-white hover:bg-black/75 opacity-80 group-hover:opacity-100"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}

                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 opacity-0 group-hover:opacity-100">
                  <Maximize2 className="w-3.5 h-3.5" />
                  Click to enlarge
                </div>
              </>
            ) : (
              <span className="text-gray-400">
                No media available
              </span>
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
              aria-label="Close image"
              className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X className="w-8 h-8" />
            </button>

            {currentList.length > 1 && (
              <button
                onClick={handlePrev}
                aria-label="Previous image"
                className="absolute left-6 p-4 rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}

            {isVideo(currentImage) ? (
              <video
                src={currentImage}
                controls
                autoPlay
                onClick={(e) => e.stopPropagation()}
                className="max-w-full max-h-[90vh] rounded-xl"
              />
            ) : (
              <img
                src={currentImage}
                alt={property.title}
                onClick={(e) => e.stopPropagation()}
                className="max-w-full max-h-[90vh] object-contain rounded-xl"
              />
            )}

            {currentList.length > 1 && (
              <button
                onClick={handleNext}
                aria-label="Next image"
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
                <span className="text-lg font-medium">
                  {property.full_address ||
                    property.short_location ||
                    "-"}
                </span>
              </div>

              <div className="flex flex-wrap gap-6 border-y border-gray-100 py-6 mb-6">
                <div className="flex items-center text-gray-600">
                  <Bed className="w-6 h-6 mr-3 text-[#ae884e]" />
                  <span className="font-light text-lg">
                    {property.bedrooms ?? "-"} Beds
                  </span>
                </div>

                <div className="flex items-center text-gray-600">
                  <Bath className="w-6 h-6 mr-3 text-[#ae884e]" />
                  <span className="font-light text-lg">
                    {property.bathrooms ?? "-"} Baths
                  </span>
                </div>
              </div>

              <p className="text-gray-700 font-light leading-relaxed text-lg whitespace-pre-wrap">
                {property.description ||
                  "No description available."}
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
                    value={
                      property.deposit
                        ? `£${property.deposit.toLocaleString()}`
                        : "-"
                    }
                    type="text"
                  />

                  <FeatureRow
                    label="Rent PCM"
                    value={
                      property.monthly_rent
                        ? `£${property.monthly_rent.toLocaleString()}`
                        : "-"
                    }
                    type="text"
                  />

                  <FeatureRow
                    label="Bills Included"
                    value={property.bills_included}
                  />

                  <FeatureRow
                    label="DSS/LHA Covers Rent"
                    value={property.dss_lha_covers_rent}
                  />

                  <FeatureRow
                    label="Broadband"
                    value={
                      property.broadband_info || "Ask Agent"
                    }
                    type="text"
                  />
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-6 mt-8 border-b pb-3">
                  Availability
                </h3>

                <div className="space-y-4">
                  <FeatureRow
                    label="Available From"
                    value={
                      property.available_from || "Ask Agent"
                    }
                    type="text"
                  />

                  <FeatureRow
                    label="Preferred Minimum Tenancy"
                    value={
                      property.preferred_min_tenancy || "-"
                    }
                    type="text"
                  />

                  <FeatureRow
                    label="Online Viewings"
                    value={property.online_viewings}
                  />
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-3">
                  Tenant Preference
                </h3>

                <div className="space-y-4">
                  <FeatureRow
                    label="Student Friendly"
                    value={property.student_friendly}
                  />

                  <FeatureRow
                    label="Families Allowed"
                    value={property.families_allowed}
                  />

                  <FeatureRow
                    label="Pets Allowed"
                    value={property.pets_allowed}
                  />

                  <FeatureRow
                    label="Smokers Allowed"
                    value={property.smokers_allowed}
                  />
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-6 mt-8 border-b pb-3">
                  Features
                </h3>

                <div className="space-y-4">
                  <FeatureRow
                    label="Garden"
                    value={property.garden}
                  />

                  <FeatureRow
                    label="Parking"
                    value={property.parking}
                  />

                  <FeatureRow
                    label="Fireplace"
                    value={property.fireplace}
                  />

                  <FeatureRow
                    label="Furnishing"
                    value={property.furnishing_status}
                    type="text"
                  />

                  <FeatureRow
                    label="EPC Rating"
                    value={property.epc_rating}
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
                  <img
                    src={
                      property.agents.photo ||
                      "https://via.placeholder.com/150"
                    }
                    alt={property.agents.name}
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
                          href={`https://wa.me/${property.agents.whatsapp.replace(
                            /[^0-9]/g,
                            ""
                          )}`}
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
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-[#ae884e]" />
                Property Location
              </h3>

              <div className="w-full h-64 rounded-2xl overflow-hidden relative border border-gray-200 bg-gray-100 flex items-center justify-center">
                <iframe
                  title="Property location map"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(
                    property.full_address ||
                      property.short_location ||
                      ""
                  )}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                />
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Have a question?
              </h3>

              <p className="text-gray-500 font-light mb-8">
                Send us a message about this property and we'll get
                back to you shortly.
              </p>

              {msgSuccess ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />

                  <h4 className="text-lg font-semibold text-green-900 mb-2">
                    Message Sent Successfully!
                  </h4>

                  <p className="text-green-700 font-light">
                    Thank you for your interest. Our team will
                    contact you soon.
                  </p>

                  <button
                    onClick={() => setMsgSuccess(false)}
                    className="mt-6 text-sm font-medium text-green-800 hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleMessageSubmit}
                  className="space-y-6"
                >
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
                        onChange={(e) =>
                          setMsgName(e.target.value)
                        }
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
                        onChange={(e) =>
                          setMsgEmail(e.target.value)
                        }
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
                      onChange={(e) =>
                        setMsgPhone(e.target.value)
                      }
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
                      onChange={(e) =>
                        setMsgText(e.target.value)
                      }
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
                    property.availability_status ===
                    "Available"
                      ? "bg-green-100 text-green-800"
                      : "bg-orange-100 text-orange-800"
                  }`}
                >
                  {property.availability_status ||
                    "Contact Agent"}
                </div>

                <p className="text-4xl font-bold text-[#1c3053]">
                  £{property.monthly_rent?.toLocaleString() || "-"}{" "}
                  <span className="text-sm font-normal text-gray-500">
                    pcm
                  </span>
                </p>

                <div className="mt-4 text-xs text-gray-400 font-light">
                  Property reference:{" "}
                  <span className="font-medium text-gray-600">
                    {property.property_ref || "-"}
                  </span>
                </div>
              </div>

              {bookingConfirmed ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />

                  <h4 className="font-semibold text-green-900 mb-1">
                    Viewing Booked!
                  </h4>

                  <p className="text-sm text-green-700 font-light">
                    Scheduled for {selectedDate} at{" "}
                    {selectedTime}. We will contact you shortly.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleBookingSubmit}
                  className="space-y-4"
                >
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
                      min={
                        new Date()
                          .toISOString()
                          .split("T")[0]
                      }
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedTime("");
                      }}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-900 focus:outline-none focus:border-[#ae884e]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Select Time
                    </label>

                    {availabilityLoading ? (
                      <div className="w-full p-3 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-500">
                        Checking availability...
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="w-full p-3 rounded-xl border border-red-200 text-sm bg-red-50 text-red-600 font-medium">
                        No slots available on this date.
                      </div>
                    ) : (
                      <select
                        value={selectedTime}
                        onChange={(e) =>
                          setSelectedTime(e.target.value)
                        }
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
                      onChange={(e) =>
                        setUserName(e.target.value)
                      }
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-900 focus:outline-none focus:border-[#ae884e]"
                      placeholder="John Smith"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>

                    <input
                      type="tel"
                      required
                      value={userPhone}
                      onChange={(e) =>
                        setUserPhone(e.target.value)
                      }
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-900 focus:outline-none focus:border-[#ae884e]"
                      placeholder="+44 7000 000000"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={
                      bookingLoading ||
                      availabilityLoading ||
                      availableSlots.length === 0 ||
                      !selectedTime
                    }
                    className="w-full py-4 rounded-2xl font-medium text-[15px] bg-[#ae884e] text-white hover:bg-[#1c3053] disabled:bg-gray-300 transition-all shadow-lg"
                  >
                    {bookingLoading
                      ? "Confirming..."
                      : "Confirm Booking"}
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
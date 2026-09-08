"use client";

import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Save,
  Upload,
  FileText,
  Box,
  X,
  Star,
  Video,
} from "lucide-react";
import Link from "next/link";

interface MediaItem {
  id: string;
  file: File;
  previewUrl: string;
  type: "interior" | "exterior";
}

export default function NewPropertyPage() {
  const router = useRouter();

  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [agents, setAgents] = useState<any[]>([]);

  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [newFloorPlan, setNewFloorPlan] = useState<File | null>(null);
  const [new3DModel, setNew3DModel] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    property_ref: "",
    title: "",
    full_address: "",
    short_location: "",
    postcode: "",

    monthly_rent: "",
    deposit: "",

    bedrooms: "1",
    bathrooms: "1",
    max_tenants: "",

    availability_status: "Available",
    available_from: "",

    preferred_min_tenancy: "",
    minimum_tenancy: "",

    description: "",
    is_featured: false,

    agent_id: "",

    epc_rating: "",
    furnishing_status: "Unfurnished",
    broadband_info: "",

    bills_included: false,
    dss_lha_covers_rent: false,

    pets_allowed: false,
    smokers_allowed: false,
    student_friendly: false,
    families_allowed: false,

    garden: false,
    parking: false,
    fireplace: false,
    online_viewings: false,

    council_tax_band: "",
    heating_type: "",
    tenure: "",

    status: "Published",

    virtual_tour_url: "",
  });

  useEffect(() => {
    async function fetchAgents() {
      const { data, error } = await supabase
        .from("agents")
        .select("id, name")
        .order("name", { ascending: true });

      if (!error && data) {
        setAgents(data);
      }
    }

    void fetchAgents();
  }, [supabase]);

  const uploadFileToSupabase = async (
    file: File,
    folder: string
  ) => {
    const fileExt = file.name.split(".").pop();

    const fileName = `${Math.random()
      .toString(36)
      .substring(2)}-${Date.now()}.${fileExt}`;

    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from("property-files")
      .upload(filePath, file);

    if (error) {
      throw error;
    }

    const { data } = supabase.storage
      .from("property-files")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleFilesSelected = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "interior" | "exterior"
  ) => {
    if (!e.target.files) {
      return;
    }

    const filesArray = Array.from(e.target.files);

    const newItems: MediaItem[] = filesArray.map((file) => ({
      id: Math.random().toString(36).substring(2),
      file,
      previewUrl: URL.createObjectURL(file),
      type,
    }));

    setMediaItems((prev) => [...prev, ...newItems]);

    e.target.value = "";
  };

  const handleRemoveMedia = (id: string) => {
    setMediaItems((prev) =>
      prev.filter((item) => item.id !== id)
    );
  };

  const handleSetMainMedia = (index: number) => {
    setMediaItems((prev) => {
      const items = [...prev];

      if (index < 0 || index >= items.length) {
        return prev;
      }

      const [selected] = items.splice(index, 1);

      if (!selected) {
        return prev;
      }

      return [selected, ...items];
    });
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setLoading(true);
    setUploadStatus("Saving property details...");

    try {
      const { data: propData, error: propError } =
        await supabase
          .from("properties")
          .insert([
            {
              property_ref:
                formData.property_ref.trim(),

              title:
                formData.title.trim(),

              full_address:
                formData.full_address.trim(),

              short_location:
                formData.short_location.trim(),

              postcode:
                formData.postcode.trim(),

              monthly_rent:
                parseFloat(formData.monthly_rent) || 0,

              deposit:
                parseFloat(formData.deposit) || 0,

              bedrooms:
                parseInt(formData.bedrooms) || 1,

              bathrooms:
                parseInt(formData.bathrooms) || 1,

              max_tenants:
                formData.max_tenants
                  ? parseInt(formData.max_tenants)
                  : null,

              availability_status:
                formData.availability_status,

              available_from:
                formData.available_from || null,

              preferred_min_tenancy:
                formData.preferred_min_tenancy.trim(),

              minimum_tenancy:
                formData.minimum_tenancy
                  ? parseInt(formData.minimum_tenancy)
                  : null,

              description:
                formData.description.trim(),

              is_featured:
                formData.is_featured,

              agent_id:
                formData.agent_id || null,

              epc_rating:
                formData.epc_rating.trim(),

              furnishing_status:
                formData.furnishing_status,

              broadband_info:
                formData.broadband_info.trim(),

              bills_included:
                formData.bills_included,

              dss_lha_covers_rent:
                formData.dss_lha_covers_rent,

              pets_allowed:
                formData.pets_allowed,

              smokers_allowed:
                formData.smokers_allowed,

              student_friendly:
                formData.student_friendly,

              families_allowed:
                formData.families_allowed,

              garden:
                formData.garden,

              parking:
                formData.parking,

              fireplace:
                formData.fireplace,

              online_viewings:
                formData.online_viewings,

              council_tax_band:
                formData.council_tax_band.trim(),

              heating_type:
                formData.heating_type.trim(),

              tenure:
                formData.tenure.trim(),

              status:
                formData.status,

              virtual_tour_url:
                formData.virtual_tour_url.trim() || null,
            },
          ])
          .select()
          .single();

      if (propError) {
        throw propError;
      }

      if (!propData?.id) {
        throw new Error(
          "Property was created but no property ID was returned."
        );
      }

      const propertyId = propData.id;

      let floorPlanUrl: string | null = null;
      let model3dUrl: string | null = null;

      if (newFloorPlan) {
        setUploadStatus(
          "Uploading 2D Floor Plan..."
        );

        floorPlanUrl =
          await uploadFileToSupabase(
            newFloorPlan,
            "floor-plans"
          );
      }

      if (new3DModel) {
        setUploadStatus(
          "Uploading 3D Model..."
        );

        model3dUrl =
          await uploadFileToSupabase(
            new3DModel,
            "models-3d"
          );
      }

      if (floorPlanUrl || model3dUrl) {
        const { error: mediaUpdateError } =
          await supabase
            .from("properties")
            .update({
              ...(floorPlanUrl
                ? {
                    floor_plan_2d:
                      floorPlanUrl,
                  }
                : {}),

              ...(model3dUrl
                ? {
                    model_3d_url:
                      model3dUrl,
                    has_3d_model: true,
                  }
                : {}),
            })
            .eq("id", propertyId);

        if (mediaUpdateError) {
          throw mediaUpdateError;
        }
      }

      if (mediaItems.length > 0) {
        setUploadStatus(
          "Uploading property photos..."
        );

        for (
          let i = 0;
          i < mediaItems.length;
          i++
        ) {
          const item = mediaItems[i];

          const url =
            await uploadFileToSupabase(
              item.file,
              item.type
            );

          const {
            error: imageError,
          } = await supabase
            .from("property_images")
            .insert([
              {
                property_id: propertyId,
                url,
                image_type: item.type,
                display_order: i,
              },
            ]);

          if (imageError) {
            throw imageError;
          }
        }
      }

      setLoading(false);
      setUploadStatus("");

      alert(
        "Property successfully created with organized media!"
      );

      router.push("/admin/properties");
      router.refresh();
    } catch (error: any) {
      console.error(
        "Error saving property:",
        error
      );

      alert(
        "Error saving property: " +
          (error?.message ||
            "Unknown error")
      );

      setLoading(false);
      setUploadStatus("");
    }
  };

  const CheckboxField = ({
    label,
    keyName,
  }: {
    label: string;
    keyName: keyof typeof formData;
  }) => (
    <label className="flex items-center gap-3 cursor-pointer min-h-10">
      <input
        type="checkbox"
        checked={
          formData[keyName] as boolean
        }
        onChange={(e) =>
          setFormData({
            ...formData,
            [keyName]: e.target.checked,
          })
        }
        className="w-5 h-5 accent-[#ae884e] rounded shrink-0"
      />

      <span className="text-sm font-medium text-gray-900">
        {label}
      </span>
    </label>
  );

  const inputClass =
    "w-full p-3 rounded-xl border border-gray-300 text-gray-900 font-medium bg-white outline-none focus:border-[#ae884e] focus:ring-1 focus:ring-[#ae884e]/20 placeholder:text-gray-400 transition";

  const sectionClass =
    "bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 space-y-6";

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/properties"
          className="p-2 rounded-xl bg-white border border-gray-100 text-gray-600 hover:bg-gray-50"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Add New Property
          </h1>

          <p className="text-gray-500 font-light mt-1">
            Create a new property listing with
            complete property, tenant and media
            details.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-8"
      >
        {/* BASIC INFORMATION */}
        <div className={sectionClass}>
          <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-100 pb-4">
            Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Reference *
              </label>

              <input
                type="text"
                required
                value={formData.property_ref}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    property_ref:
                      e.target.value,
                  })
                }
                className={inputClass}
                placeholder="e.g. OK-101"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Title *
              </label>

              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    title:
                      e.target.value,
                  })
                }
                className={inputClass}
                placeholder="e.g. Luxury 2 Bed Apartment"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Address *
              </label>

              <input
                type="text"
                required
                value={formData.full_address}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    full_address:
                      e.target.value,
                  })
                }
                className={inputClass}
                placeholder="Full property address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Short Location *
              </label>

              <input
                type="text"
                required
                value={formData.short_location}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    short_location:
                      e.target.value,
                  })
                }
                className={inputClass}
                placeholder="e.g. Halesowen"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Postcode *
              </label>

              <input
                type="text"
                required
                value={formData.postcode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    postcode:
                      e.target.value,
                  })
                }
                className={inputClass}
                placeholder="e.g. B63 2QQ"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign Agent
              </label>

              <select
                value={formData.agent_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    agent_id:
                      e.target.value,
                  })
                }
                className={inputClass}
              >
                <option value="">
                  -- Select an Agent --
                </option>

                {agents.map((agent) => (
                  <option
                    key={agent.id}
                    value={agent.id}
                  >
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ADVANCED PROPERTY DETAILS */}
        <div className={sectionClass}>
          <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-100 pb-4">
            Advanced Property Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Listing Status
              </label>

              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status:
                      e.target.value,
                  })
                }
                className={inputClass}
              >
                <option value="Draft">
                  Draft
                </option>

                <option value="Published">
                  Published
                </option>

                <option value="Archived">
                  Archived
                </option>
              </select>

              <p className="text-xs text-gray-400 mt-2">
                Controls whether the listing is
                published on the website.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Council Tax Band
              </label>

              <input
                type="text"
                placeholder="e.g. Band C"
                value={
                  formData.council_tax_band
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    council_tax_band:
                      e.target.value,
                  })
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heating Type
              </label>

              <input
                type="text"
                placeholder="e.g. Gas Central Heating"
                value={formData.heating_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    heating_type:
                      e.target.value,
                  })
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tenure
              </label>

              <input
                type="text"
                placeholder="e.g. Freehold / Leasehold"
                value={formData.tenure}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tenure:
                      e.target.value,
                  })
                }
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* PRICE / AVAILABILITY */}
        <div className={sectionClass}>
          <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-100 pb-4">
            Price, Bills & Availability
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rent PCM (£) *
              </label>

              <input
                type="number"
                min="0"
                required
                value={formData.monthly_rent}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    monthly_rent:
                      e.target.value,
                  })
                }
                className={inputClass}
                placeholder="e.g. 1200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deposit (£)
              </label>

              <input
                type="number"
                min="0"
                value={formData.deposit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deposit:
                      e.target.value,
                  })
                }
                className={inputClass}
                placeholder="e.g. 1200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Broadband Info
              </label>

              <input
                type="text"
                placeholder="e.g. Fibre Optic"
                value={formData.broadband_info}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    broadband_info:
                      e.target.value,
                  })
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Availability Status
              </label>

              <select
                value={
                  formData.availability_status
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    availability_status:
                      e.target.value,
                  })
                }
                className={inputClass}
              >
                <option value="Available">
                  Available
                </option>

                <option value="Let Agreed">
                  Let Agreed
                </option>

                <option value="Unavailable">
                  Unavailable
                </option>
              </select>

              <p className="text-xs text-gray-400 mt-2">
                Actual property availability.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available From
              </label>

              <input
                type="date"
                value={formData.available_from}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    available_from:
                      e.target.value,
                  })
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Tenancy (Months)
              </label>

              <input
                type="number"
                min="1"
                value={formData.minimum_tenancy}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minimum_tenancy:
                      e.target.value,
                  })
                }
                className={inputClass}
                placeholder="e.g. 6"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Minimum Tenancy
              </label>

              <input
                type="text"
                placeholder="e.g. 6 Months"
                value={
                  formData.preferred_min_tenancy
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    preferred_min_tenancy:
                      e.target.value,
                  })
                }
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            <CheckboxField
              label="Bills Included"
              keyName="bills_included"
            />

            <CheckboxField
              label="DSS/LHA Covers Rent"
              keyName="dss_lha_covers_rent"
            />

            <CheckboxField
              label="Online Viewings"
              keyName="online_viewings"
            />
          </div>
        </div>

        {/* FEATURES / TENANT PREFERENCES */}
        <div className={sectionClass}>
          <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-100 pb-4">
            Features & Tenant Preferences
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bedrooms
              </label>

              <input
                type="number"
                min="0"
                required
                value={formData.bedrooms}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bedrooms:
                      e.target.value,
                  })
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bathrooms
              </label>

              <input
                type="number"
                min="0"
                required
                value={formData.bathrooms}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bathrooms:
                      e.target.value,
                  })
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Tenants
              </label>

              <input
                type="number"
                min="1"
                value={formData.max_tenants}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_tenants:
                      e.target.value,
                  })
                }
                className={inputClass}
                placeholder="e.g. 4"
              />

              <p className="text-xs text-gray-400 mt-2">
                Maximum number of tenants allowed.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Furnishing
              </label>

              <select
                value={
                  formData.furnishing_status
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    furnishing_status:
                      e.target.value,
                  })
                }
                className={inputClass}
              >
                <option value="Furnished">
                  Furnished
                </option>

                <option value="Part-furnished">
                  Part-furnished
                </option>

                <option value="Unfurnished">
                  Unfurnished
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                EPC Rating
              </label>

              <input
                type="text"
                placeholder="e.g. D"
                value={formData.epc_rating}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    epc_rating:
                      e.target.value,
                  })
                }
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 pt-2">
            <CheckboxField
              label="Student Friendly"
              keyName="student_friendly"
            />

            <CheckboxField
              label="Families Allowed"
              keyName="families_allowed"
            />

            <CheckboxField
              label="Pets Allowed"
              keyName="pets_allowed"
            />

            <CheckboxField
              label="Smokers Allowed"
              keyName="smokers_allowed"
            />

            <CheckboxField
              label="Garden"
              keyName="garden"
            />

            <CheckboxField
              label="Parking"
              keyName="parking"
            />

            <CheckboxField
              label="Fireplace"
              keyName="fireplace"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>

            <textarea
              rows={6}
              value={formData.description}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description:
                    e.target.value,
                })
              }
              className={inputClass}
              placeholder="Describe the property, rooms, location, facilities and any important information..."
            />
          </div>

          <CheckboxField
            label="Mark as Featured Property (Show on Homepage)"
            keyName="is_featured"
          />
        </div>

        {/* MEDIA */}
        <div className={sectionClass}>
          <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-100 pb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#ae884e]" />
            Property Photo & Media Management
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add Interior Photos
              </label>

              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) =>
                  handleFilesSelected(
                    e,
                    "interior"
                  )
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add Exterior Photos
              </label>

              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) =>
                  handleFilesSelected(
                    e,
                    "exterior"
                  )
                }
                className={inputClass}
              />
            </div>
          </div>

          {mediaItems.length > 0 && (
            <div className="mt-6 space-y-3">
              <p className="text-sm font-semibold text-gray-800">
                Uploaded Media Queue (
                {mediaItems.length}
                ) —{" "}
                <span className="text-[#ae884e]">
                  First item is the Main Cover Image
                </span>
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {mediaItems.map(
                  (item, index) => (
                    <div
                      key={item.id}
                      className={`relative rounded-xl overflow-hidden border-2 bg-gray-50 group ${
                        index === 0
                          ? "border-[#ae884e] shadow-md"
                          : "border-gray-200"
                      }`}
                    >
                      <Image
                        src={item.previewUrl}
                        alt="Property preview"
                        width={400}
                        height={128}
                        unoptimized
                        className="w-full h-32 object-cover"
                      />

                      {index === 0 && (
                        <span className="absolute top-2 left-2 bg-[#ae884e] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                          <Star className="w-3 h-3 fill-current" />
                          Main Cover
                        </span>
                      )}

                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-2 flex justify-between items-center opacity-90 group-hover:opacity-100 transition-opacity">
                        <span className="text-[11px] text-white font-medium capitalize">
                          {item.type}
                        </span>

                        <div className="flex items-center gap-1">
                          {index !== 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                handleSetMainMedia(
                                  index
                                )
                              }
                              className="p-1 bg-white/80 hover:bg-white text-gray-800 rounded text-[10px] font-semibold px-1.5 transition-colors"
                              title="Set as Main Cover"
                            >
                              Make Main
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveMedia(
                                item.id
                              )
                            }
                            className="p-1 bg-red-600/80 hover:bg-red-600 text-white rounded transition-colors"
                            title="Remove image"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <FileText className="w-4 h-4 text-[#ae884e]" />
                2D Floor Plan
              </label>

              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) =>
                  setNewFloorPlan(
                    e.target.files?.[0] ||
                      null
                  )
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Box className="w-4 h-4 text-[#ae884e]" />
                3D Model (.glb/.gltf)
              </label>

              <input
                type="file"
                accept=".glb,.gltf"
                onChange={(e) =>
                  setNew3DModel(
                    e.target.files?.[0] ||
                      null
                  )
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Video className="w-4 h-4 text-[#ae884e]" />
                Virtual Tour URL
              </label>

              <input
                type="url"
                placeholder="https://my.matterport.com/show/?m=..."
                value={
                  formData.virtual_tour_url
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    virtual_tour_url:
                      e.target.value,
                  })
                }
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* SAVE */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[#1c3053] text-white py-4 rounded-xl font-medium hover:bg-[#ae884e] transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />

          {loading
            ? uploadStatus || "Saving..."
            : "Save Property"}
        </button>
      </form>
    </div>
  );
}
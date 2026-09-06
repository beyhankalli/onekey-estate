import { Property, Agent } from "@/types";

const agentSarah: Agent = {
  id: "agent-1",
  name: "Sarah Jenkins",
  photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
  phone: "+44 20 7946 0011",
  whatsapp: "+44 7700 900111",
  email: "sarah.j@onekeyestate.co.uk",
  bio: "Senior Lettings Negotiator with over 8 years of experience in Central London premium properties."
};

const agentMichael: Agent = {
  id: "agent-2",
  name: "Michael Chen",
  photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80",
  phone: "+44 20 7946 0022",
  whatsapp: "+44 7700 900222",
  email: "michael.c@onekeyestate.co.uk",
  bio: "Property Manager specialising in family homes and modern apartments in West London."
};

export const propertiesData: Property[] = [
  {
    id: "prop-001",
    propertyRef: "3015767",
    title: "Luxury 3 Bed Penthouse",
    fullAddress: "12 Riverside Way, Canary Wharf, London, E14 9AA",
    shortLocation: "Canary Wharf, London",
    postcode: "E14 9AA",
    monthlyRent: 4500,
    weeklyRent: 1038.46,
    deposit: 5192,
    bedrooms: 3,
    bathrooms: 2,
    maxTenants: 4,
    availabilityStatus: "Available",
    availableFrom: "2026-10-01",
    furnishingStatus: "Furnished",
    billsIncluded: false,
    petsAllowed: true,
    smokersAllowed: false,
    epcRating: "B",
    description: "An exceptional three-bedroom penthouse apartment offering spectacular river views. The property benefits from a large open-plan living area, floor-to-ceiling windows, and a private terrace.",
    interiorImages: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687931-cebf004f9814?auto=format&fit=crop&w=1200&q=80"
    ],
    exteriorImages: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80"
    ],
    floorPlan2D: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80",
    has3DModel: true,
    lat: 51.5054,
    lng: -0.0235,
    agent: agentSarah,
    isFeatured: true,
    createdAt: "2026-08-15"
  },
  {
    id: "prop-002",
    propertyRef: "3015768",
    title: "Modern 2 Bed Apartment",
    fullAddress: "Apartment 14, The Beacon, Stratford, E20 1AB",
    shortLocation: "Stratford, E20",
    postcode: "E20 1AB",
    monthlyRent: 2200,
    weeklyRent: 507.69,
    deposit: 2538,
    bedrooms: 2,
    bathrooms: 1,
    maxTenants: 3,
    availabilityStatus: "Available",
    availableFrom: "Today",
    furnishingStatus: "Unfurnished",
    billsIncluded: true,
    petsAllowed: false,
    smokersAllowed: false,
    epcRating: "A",
    description: "A bright and spacious two-bedroom apartment located in the heart of Stratford. Includes access to a residents' gym and 24-hour concierge service. No 3D model available for this property.",
    interiorImages: [
      "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80"
    ],
    exteriorImages: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"
    ],
    floorPlan2D: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80",
    has3DModel: false,
    lat: 51.5423,
    lng: -0.0031,
    agent: agentMichael,
    isFeatured: true,
    createdAt: "2026-09-01"
  },
  {
    id: "prop-003",
    propertyRef: "3015769",
    title: "Cozy Studio Flat",
    fullAddress: "Flat 4, Rosewood Court, Richmond, TW9 2ZZ",
    shortLocation: "Richmond, London",
    postcode: "TW9 2ZZ",
    monthlyRent: 1500,
    weeklyRent: 346.15,
    deposit: 1730,
    bedrooms: 1,
    bathrooms: 1,
    maxTenants: 1,
    availabilityStatus: "Let Agreed",
    availableFrom: "2026-11-01",
    furnishingStatus: "Furnished",
    billsIncluded: false,
    petsAllowed: true,
    smokersAllowed: false,
    epcRating: "C",
    description: "Charming studio apartment near Richmond Park. Features only photos (No 2D floor plan, No 3D tour). Perfect for a single professional.",
    interiorImages: [
      "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=1200&q=80"
    ],
    exteriorImages: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80"
    ],
    has3DModel: false,
    lat: 51.4613,
    lng: -0.3037,
    agent: agentSarah,
    isFeatured: false,
    createdAt: "2026-09-04"
  },
  {
    id: "prop-004",
    propertyRef: "3015770",
    title: "4 Bed Detached Family Home",
    fullAddress: "45 Willow Drive, Hampstead, NW3 6FG",
    shortLocation: "Hampstead, NW3",
    postcode: "NW3 6FG",
    monthlyRent: 6500,
    weeklyRent: 1500.00,
    deposit: 7500,
    bedrooms: 4,
    bathrooms: 3,
    maxTenants: 6,
    availabilityStatus: "Available",
    availableFrom: "2026-09-15",
    furnishingStatus: "Part-furnished",
    billsIncluded: false,
    petsAllowed: true,
    smokersAllowed: false,
    epcRating: "C",
    description: "A stunning family home featuring a large private garden, double garage, and spacious living areas. Only photos and 3D Tour available (No 2D floor plan).",
    interiorImages: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
    ],
    exteriorImages: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80"
    ],
    has3DModel: true,
    lat: 51.5559,
    lng: -0.1760,
    agent: agentMichael,
    isFeatured: true,
    createdAt: "2026-09-05"
  }
];
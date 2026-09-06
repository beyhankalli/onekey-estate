export interface Agent {
  id: string;
  name: string;
  photo: string;
  phone: string;
  whatsapp: string;
  email: string;
  bio: string;
}

export interface Property {
  id: string;
  propertyRef: string;
  title: string;
  fullAddress: string;
  shortLocation: string;
  postcode: string;
  monthlyRent: number;
  weeklyRent: number;
  deposit: number;
  bedrooms: number;
  bathrooms: number;
  maxTenants: number;
  availabilityStatus: 'Available' | 'Let Agreed' | 'Unavailable';
  availableFrom: string;
  furnishingStatus: string;
  billsIncluded: boolean;
  petsAllowed: boolean;
  smokersAllowed: boolean;
  epcRating: string;
  description: string;
  interiorImages: string[];
  exteriorImages: string[];
  floorPlan2D?: string; // İsteğe bağlı
  has3DModel?: boolean; // İsteğe bağlı
  model3DUrl?: string;  // İsteğe bağlı
  lat: number;
  lng: number;
  agent: Agent;
  isFeatured: boolean;
  createdAt: string;
}
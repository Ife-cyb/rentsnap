export interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  images: string[];
  amenities: string[];
  description: string;
  landlord: {
    name: string;
    avatar: string;
    rating: number;
  };
  coordinates: {
    lat: number;
    lng: number;
  };
  available: string;
  petFriendly: boolean;
  furnished: boolean;
  parking: boolean;
  matchScore?: number;
}

export interface UserPreferences {
  budget: {
    min: number;
    max: number;
  };
  bedrooms: number[];
  location: {
    lat: number;
    lng: number;
    radius: number;
  };
  amenities: string[];
  petFriendly: boolean;
  furnished: boolean;
  parking: boolean;
}

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'tenant' | 'landlord';
  preferences?: UserPreferences;
}

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';
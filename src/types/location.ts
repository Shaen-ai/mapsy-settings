export interface BusinessHours {
  mon?: string;
  tue?: string;
  wed?: string;
  thu?: string;
  fri?: string;
  sat?: string;
  sun?: string;
}

export interface Location {
  id?: string | number;  // Support both MongoDB string IDs and numeric IDs
  _id?: string;  // MongoDB's _id field
  name: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  business_hours?: BusinessHours;
  category: 'restaurant' | 'store' | 'office' | 'service' | 'other';
  image_url?: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
  updated_at?: string;
}
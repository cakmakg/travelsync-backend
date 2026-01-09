// User & Auth Types
export interface User {
  _id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'staff';
  organization_id: string;
  phone?: string;
  avatar?: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  organization_name: string;
  organization_type: 'HOTEL' | 'AGENCY';
  phone?: string;
}

// Organization Types
export interface Organization {
  _id: string;
  name: string;
  type: 'HOTEL' | 'AGENCY';
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  timezone: string;
  currency: string;
  subscription: {
    plan: 'free' | 'basic' | 'pro' | 'enterprise';
    status: 'active' | 'inactive' | 'trial';
    trial_ends_at?: string;
  };
}

// Property Types
export interface Property {
  _id: string;
  organization_id: string;
  name: string;
  code: string;
  description?: string;
  property_type: 'hotel' | 'resort' | 'hostel' | 'apartment' | 'villa';
  star_rating?: number;
  address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  amenities: string[];
  images: string[];
  check_in_time: string;
  check_out_time: string;
  cancellation_policy: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Room Type
export interface RoomType {
  _id: string;
  property_id: string;
  name: string;
  code: string;
  description?: string;
  max_occupancy: {
    adults: number;
    children: number;
    infants: number;
  };
  bed_configuration: string;
  size_sqm?: number;
  amenities: string[];
  images: string[];
  total_quantity: number;
  is_active: boolean;
}

// Rate Plan
export interface RatePlan {
  _id: string;
  property_id: string;
  name: string;
  code: string;
  description?: string;
  meal_plan: 'RO' | 'BB' | 'HB' | 'FB' | 'AI';
  cancellation_policy: 'flexible' | 'moderate' | 'strict' | 'non_refundable';
  min_nights?: number;
  max_nights?: number;
  is_refundable: boolean;
  is_active: boolean;
}

// Reservation
export interface Reservation {
  _id: string;
  property_id: string;
  booking_reference: string;
  guest: {
    name: string;
    email: string;
    phone: string;
  };
  check_in_date: string;
  check_out_date: string;
  nights: number;
  guests: {
    adults: number;
    children: number;
    infants: number;
  };
  rooms_requested: number;
  room_type_id: string;
  rate_plan_id: string;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  source: 'direct' | 'phone' | 'email' | 'ota' | 'agency';
  currency: string;
  subtotal: number;
  tax: number;
  total_with_tax: number;
  special_requests?: string;
  created_at: string;
  updated_at: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    message: string;
    details?: any;
  };
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Dashboard Stats
export interface DashboardStats {
  total_properties: number;
  active_reservations: number;
  todays_checkins: number;
  todays_checkouts: number;
  occupancy_rate: number;
  total_revenue: number;
}

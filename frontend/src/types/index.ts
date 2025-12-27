// ============================================
// AUTHENTICATION & USER TYPES
// ============================================

export type UserRole = 'admin' | 'manager' | 'staff';

export interface UserPermissions {
  reservations: string[];
  prices: string[];
  inventory: string[];
  reports: string[];
}

export interface User {
  _id: string;
  organization_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  permissions: UserPermissions;
  phone?: string;
  avatar?: string;
  is_active: boolean;
  last_login?: string;
  preferences?: {
    language: string;
    notifications: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
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
}

// ============================================
// ORGANIZATION TYPES
// ============================================

export type OrganizationType = 'HOTEL' | 'AGENCY';
export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'trial' | 'suspended' | 'cancelled';

export interface Organization {
  _id: string;
  type: OrganizationType;
  name: string;
  country: string;
  timezone: string;
  currency: string;
  language: string;
  subscription: {
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    period: 'monthly' | 'yearly';
    max_properties: number;
    max_users: number;
  };
  settings: {
    date_format: string;
    time_format: string;
    week_start: string;
  };
  contact: {
    email: string;
    phone?: string;
    website?: string;
  };
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// PROPERTY TYPES
// ============================================

export type PropertyType = 'hotel' | 'resort' | 'apartment' | 'hostel' | 'villa' | 'guesthouse';

export interface PropertyAddress {
  street: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Property {
  _id: string;
  organization_id: string;
  name: string;
  code: string;
  address: PropertyAddress;
  star_rating: number;
  property_type: PropertyType;
  total_rooms: number;
  total_floors?: number;
  amenities: string[];
  check_in_time: string;
  check_out_time: string;
  contact: {
    email: string;
    phone?: string;
    website?: string;
  };
  currency: string;
  timezone: string;
  tax_rate: number;
  tax_included: boolean;
  images?: string[];
  description?: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// ROOM TYPE TYPES
// ============================================

export interface RoomType {
  _id: string;
  property_id: string;
  code: string;
  name: string;
  capacity: {
    adults: number;
    children: number;
    total: number;
  };
  bed_configuration: string;
  size_sqm?: number;
  total_quantity: number;
  amenities: string[];
  extra_bed_available: boolean;
  extra_bed_price?: number;
  images?: string[];
  description?: string;
  is_active: boolean;
  is_bookable: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// RATE PLAN TYPES
// ============================================

export type RateType = 'public' | 'package' | 'corporate' | 'promo' | 'group';
export type MealPlan = 'RO' | 'BB' | 'HB' | 'FB' | 'AI';
export type CancellationType = 'flexible' | 'moderate' | 'strict' | 'non_refundable';

export interface CancellationPolicy {
  type: CancellationType;
  free_cancellation_until?: number;
  penalty_percentage?: number;
  no_show_penalty?: number;
}

export interface RatePlan {
  _id: string;
  property_id: string;
  code: string;
  name: string;
  rate_type: RateType;
  meal_plan: MealPlan;
  cancellation_policy: CancellationPolicy;
  is_derived: boolean;
  base_rate_plan_id?: string;
  markup_percentage?: number;
  min_nights?: number;
  max_nights?: number;
  min_advance_booking?: number;
  max_advance_booking?: number;
  valid_from?: string;
  valid_until?: string;
  description?: string;
  is_active: boolean;
  is_public: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// PRICE TYPES
// ============================================

export type PriceSource = 'MANUAL' | 'SYSTEM' | 'CHANNEL_MANAGER' | 'API';

export interface Price {
  _id: string;
  property_id: string;
  room_type_id: string;
  rate_plan_id: string;
  date: string;
  amount: number;
  currency: string;
  source: PriceSource;
  is_available: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// INVENTORY TYPES
// ============================================

export interface Inventory {
  _id: string;
  property_id: string;
  room_type_id: string;
  date: string;
  allotment: number;
  sold: number;
  available: number;
  stop_sell: boolean;
  closed: boolean;
  overbooking_allowed: boolean;
  min_nights_override?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// RESERVATION TYPES
// ============================================

export type ReservationStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
export type ReservationSource = 'DIRECT' | 'PHONE' | 'EMAIL' | 'OTA' | 'AGENCY' | 'GDS';
export type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'BANK_TRANSFER' | 'INVOICE';
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUNDED';
export type CommissionStatus = 'PENDING' | 'INVOICED' | 'PAID';

export interface Guest {
  name: string;
  email?: string;
  phone?: string;
  country?: string;
  special_requests?: string;
}

export interface PriceBreakdown {
  date: string;
  amount: number;
}

export interface Reservation {
  _id: string;
  property_id: string;
  room_type_id: string;
  rate_plan_id: string;
  created_by_user_id: string;
  booking_reference: string;
  idempotency_key?: string;
  guest: Guest;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  guests: {
    adults: number;
    children: number;
    total: number;
  };
  total_price: number;
  total_with_tax: number;
  currency: string;
  price_breakdown?: PriceBreakdown[];
  status: ReservationStatus;
  source: ReservationSource;
  agency_id?: string;
  agency_booking_ref?: string;
  commission?: {
    percentage: number;
    amount: number;
    currency: string;
    status: CommissionStatus;
  };
  payment?: {
    method: PaymentMethod;
    status: PaymentStatus;
    paid_amount: number;
    transaction_id?: string;
  };
  confirmed_at?: string;
  checked_in_at?: string;
  checked_out_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// AGENCY TYPES
// ============================================

export type AgencyType = 'OTA' | 'TOUR_OPERATOR' | 'TRAVEL_AGENCY' | 'CORPORATE' | 'GDS';
export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';

export interface Agency {
  _id: string;
  organization_id: string;
  code: string;
  name: string;
  type: AgencyType;
  contact: {
    email: string;
    phone?: string;
    website?: string;
  };
  address?: {
    street?: string;
    city?: string;
    country?: string;
    postal_code?: string;
  };
  commission: {
    default_percentage: number;
    property_rates?: Record<string, number>;
  };
  payment: {
    method: PaymentMethod;
    payment_terms_days: number;
    currency: string;
  };
  is_active: boolean;
  stats?: {
    total_bookings: number;
    total_revenue: number;
    total_commission: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AgencyContract {
  _id: string;
  property_id: string;
  agency_id: string;
  valid_from: string;
  valid_to: string;
  commission_percentage: number;
  allotment?: {
    has_allotment: boolean;
    rooms_per_day?: number;
    release_days?: number;
  };
  rate_plan_id?: string;
  payment_terms?: {
    method: PaymentMethod;
    net_days: number;
  };
  status: ContractStatus;
  is_active: boolean;
  cancellation_policy?: {
    free_cancellation_days: number;
    penalty_percentage: number;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface DashboardMetrics {
  totalReservations: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  occupancyRate: number;
  revenue: {
    today: number;
    thisMonth: number;
    thisYear: number;
  };
  pendingReservations: number;
}

export interface OccupancyStats {
  date: string;
  occupancyRate: number;
  totalRooms: number;
  occupiedRooms: number;
}

export interface RevenueStats {
  date: string;
  revenue: number;
  bookings: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

# TravelSync - Database Schema & ERD

## 📊 Database Technology: MongoDB

**Why MongoDB for MVP:**
- Flexible schema for rapid iteration
- Good fit for nested data (reservations, room details)
- Easier to scale horizontally
- Native JSON support for API responses
- Strong geospatial queries (future: location-based features)

---

## 🗂 Collections Overview

### Core Collections (MVP - Hotel Module)
1. **users** - All system users (hotel staff, admins, agency staff)
2. **hotels** - Hotel profiles and settings
3. **rooms** - Room inventory per hotel
4. **reservations** - Booking records
5. **pricing_rules** - Dynamic pricing configurations
6. **notifications** - System notifications
7. **audit_logs** - Activity tracking

### Phase 2 Collections (Agency Module)
8. **agencies** - Travel agency profiles
9. **agency_hotels** - Agency-Hotel relationships (partnerships)
10. **offers** - Travel packages/offers created by agencies
11. **offer_items** - Hotels/services included in offers
12. **agency_customers** - Customer CRM for agencies

### Future Collections (Phase 3 - Traveler Module)
- travelers
- bookings (end-user bookings)
- reviews
- payments
- wishlists

---

## 📐 Complete Entity Relationship Diagram (ERD)

### Phase 1: Hotel Module (MVP)

```
┌─────────────────┐
│     USERS       │
│─────────────────│
│ _id (PK)        │
│ email           │
│ password_hash   │
│ role            │───┐ Values: 'super_admin' | 'hotel_admin' | 
│ hotel_id (FK)   │   │         'hotel_staff' | 'agency_admin' | 
│ agency_id (FK)  │   │         'agency_staff'
│ first_name      │   │
│ last_name       │   │
│ phone           │   │
│ is_active       │   │
│ created_at      │   │
│ updated_at      │   │
└─────────────────┘   │
         │            │
         │ 1:N        │
         │            │
         ▼            │
┌─────────────────────┐
│       HOTELS        │◄──┘
│─────────────────────│
│ _id (PK)            │
│ name                │
│ slug                │
│ email               │
│ phone               │
│ address             │
│ city                │
│ country             │
│ postal_code         │
│ coordinates         │
│ star_rating         │
│ total_rooms         │
│ amenities[]         │
│ images[]            │
│ subscription_tier   │
│ subscription_status │
│ is_active           │
│ created_at          │
│ updated_at          │
└─────────────────────┘
          │
          │ 1:N
          │
          ▼
┌─────────────────────┐
│       ROOMS         │
│─────────────────────│
│ _id (PK)            │
│ hotel_id (FK)       │
│ room_number         │
│ room_type           │
│ floor               │
│ capacity            │
│ bed_configuration   │
│ base_price          │
│ size_sqm            │
│ amenities[]         │
│ images[]            │
│ is_active           │
│ created_at          │
│ updated_at          │
└─────────────────────┘
          │
          │ 1:N
          │
          ▼
┌─────────────────────────┐
│     RESERVATIONS        │
│─────────────────────────│
│ _id (PK)                │
│ hotel_id (FK)           │
│ room_id (FK)            │
│ agency_id (FK)          │──┐ NULL if direct booking
│ offer_id (FK)           │  │ NULL if not from offer
│ booking_reference       │  │
│ guest_name              │  │
│ guest_email             │  │
│ guest_phone             │  │
│ guest_country           │  │
│ check_in_date           │  │
│ check_out_date          │  │
│ nights                  │  │
│ guests_count            │  │
│ total_price             │  │
│ price_per_night         │  │
│ commission_rate         │  │ For agency bookings
│ commission_amount       │  │
│ currency                │  │
│ status                  │  │
│ source                  │  │
│ special_requests        │  │
│ notes                   │  │
│ created_by (FK→users)   │  │
│ created_at              │  │
│ updated_at              │  │
│ cancelled_at            │  │
└─────────────────────────┘  │
                              │
┌─────────────────────────┐  │
│    PRICING_RULES        │  │
│─────────────────────────│  │
│ _id (PK)                │  │
│ hotel_id (FK)           │  │
│ rule_name               │  │
│ rule_type               │  │
│ conditions              │  │
│ price_adjustment        │  │
│ is_active               │  │
│ start_date              │  │
│ end_date                │  │
│ created_at              │  │
│ updated_at              │  │
└─────────────────────────┘  │
                              │
┌─────────────────────────┐  │
│     NOTIFICATIONS       │  │
│─────────────────────────│  │
│ _id (PK)                │  │
│ user_id (FK)            │  │
│ hotel_id (FK)           │  │
│ agency_id (FK)          │  │
│ type                    │  │
│ title                   │  │
│ message                 │  │
│ link                    │  │
│ is_read                 │  │
│ created_at              │  │
└─────────────────────────┘  │
                              │
┌─────────────────────────┐  │
│      AUDIT_LOGS         │  │
│─────────────────────────│  │
│ _id (PK)                │  │
│ user_id (FK)            │  │
│ hotel_id (FK)           │  │
│ agency_id (FK)          │  │
│ action                  │  │
│ entity_type             │  │
│ entity_id               │  │
│ changes                 │  │
│ ip_address              │  │
│ user_agent              │  │
│ created_at              │  │
└─────────────────────────┘  │
```

---

### Phase 2: Agency Module

```
┌─────────────────────────┐
│       AGENCIES          │
│─────────────────────────│
│ _id (PK)                │
│ name                    │
│ slug                    │
│ legal_name              │
│ registration_number     │
│ email                   │
│ phone                   │
│ website                 │
│ address                 │
│ city                    │
│ country                 │
│ postal_code             │
│ logo_url                │
│ description             │
│ specializations[]       │ e.g., ['luxury', 'adventure', 'family']
│ languages[]             │ e.g., ['en', 'de', 'fr']
│ commission_rate         │ Default commission (e.g., 15%)
│ subscription_tier       │
│ subscription_status     │
│ is_verified             │
│ is_active               │
│ created_at              │
│ updated_at              │
└──────────┬──────────────┘
           │
           │ 1:N
           │
           ▼
┌─────────────────────────┐
│       USERS             │◄────┐
│─────────────────────────│     │
│ _id (PK)                │     │
│ agency_id (FK)          │─────┘
│ role                    │ 'agency_admin' | 'agency_staff'
│ ... (same as above)     │
└─────────────────────────┘
           │
           │ M:N (through agency_hotels)
           │
           ▼
┌─────────────────────────┐
│    AGENCY_HOTELS        │
│─────────────────────────│
│ _id (PK)                │
│ agency_id (FK)          │───┐
│ hotel_id (FK)           │◄──┼──┐
│ partnership_status      │   │  │ 'pending' | 'active' | 'suspended'
│ commission_rate         │   │  │ Override default commission
│ contract_start_date     │   │  │
│ contract_end_date       │   │  │
│ payment_terms           │   │  │ e.g., 'net_30', 'net_60'
│ notes                   │   │  │
│ is_active               │   │  │
│ created_at              │   │  │
│ updated_at              │   │  │
└─────────────────────────┘   │  │
           │                   │  │
           │                   │  │
┌──────────┴──────┐           │  │
│                 │           │  │
▼                 ▼           │  │
┌──────────┐  ┌──────────┐   │  │
│ AGENCIES │  │  HOTELS  │◄──┘  │
└──────────┘  └────┬─────┘      │
                   │             │
                   └─────────────┘

           ┌─────────────────────────┐
           │       OFFERS            │
           │─────────────────────────│
           │ _id (PK)                │
           │ agency_id (FK)          │
           │ offer_name              │
           │ offer_type              │ 'hotel_only' | 'package' | 'tour'
           │ description             │
           │ destination             │
           │ duration_days           │
           │ duration_nights         │
           │ min_guests              │
           │ max_guests              │
           │ base_price              │
           │ currency                │
           │ commission_included     │ Boolean
           │ valid_from              │
           │ valid_until             │
           │ inclusions[]            │ ['breakfast', 'airport_transfer']
           │ exclusions[]            │ ['flights', 'visa']
           │ terms_conditions        │
           │ images[]                │
           │ status                  │ 'draft' | 'active' | 'expired'
           │ is_featured             │
           │ view_count              │
           │ booking_count           │
           │ created_by (FK→users)   │
           │ created_at              │
           │ updated_at              │
           └──────────┬──────────────┘
                      │
                      │ 1:N
                      │
                      ▼
           ┌─────────────────────────┐
           │     OFFER_ITEMS         │
           │─────────────────────────│
           │ _id (PK)                │
           │ offer_id (FK)           │
           │ hotel_id (FK)           │
           │ room_id (FK)            │ NULL if hotel-level
           │ item_type               │ 'accommodation' | 'service' | 'activity'
           │ name                    │ e.g., "3 nights at Hotel X"
           │ description             │
           │ quantity                │ e.g., 3 nights
           │ price                   │
           │ included_in_base_price  │ Boolean
           │ is_mandatory            │
           │ sort_order              │
           │ created_at              │
           │ updated_at              │
           └─────────────────────────┘

           ┌─────────────────────────┐
           │   AGENCY_CUSTOMERS      │
           │─────────────────────────│
           │ _id (PK)                │
           │ agency_id (FK)          │
           │ customer_type           │ 'individual' | 'corporate'
           │ first_name              │
           │ last_name               │
           │ company_name            │ For corporate
           │ email                   │
           │ phone                   │
           │ country                 │
           │ date_of_birth           │
           │ passport_number         │
           │ nationality             │
           │ preferences             │ JSON: travel preferences
           │ tags[]                  │ ['vip', 'frequent', 'high_value']
           │ total_bookings          │
           │ total_spent             │
           │ average_booking_value   │
           │ last_booking_date       │
           │ notes                   │
           │ created_by (FK→users)   │
           │ created_at              │
           │ updated_at              │
           └─────────────────────────┘
```

---

### Complete System Relationships

```
                    ┌──────────────┐
                    │    USERS     │
                    └───┬──────┬───┘
                        │      │
              ┌─────────┘      └─────────┐
              │                          │
              ▼                          ▼
        ┌──────────┐              ┌──────────┐
        │  HOTELS  │──────M:N────►│ AGENCIES │
        └────┬─────┘              └────┬─────┘
             │         (via              │
             │    AGENCY_HOTELS)         │
             │                           │
             ├─────► ROOMS               ├─────► OFFERS
             │         │                 │         │
             │         │                 │         │
             └─────────┴────► RESERVATIONS ◄──────┘
                              (can be from         
                           agency or direct)       
```

---

## 📋 Detailed Schema Definitions

### 1. Users Collection

```typescript
interface IUser {
  _id: ObjectId;
  email: string;                    // unique, lowercase
  password_hash: string;             // bcrypt hashed
  role: 'super_admin' | 'hotel_admin' | 'hotel_staff';
  hotel_id?: ObjectId;               // null for super_admin
  
  // Profile
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  
  // Settings
  language: 'en' | 'de';             // default: 'en'
  timezone: string;                  // default: 'Europe/Berlin'
  
  // Status
  is_active: boolean;                // default: true
  is_email_verified: boolean;        // default: false
  last_login_at?: Date;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}

// Indexes
{
  email: 1,                          // unique
  hotel_id: 1,
  'email,hotel_id': 1                // compound
}
```

### 2. Hotels Collection

```typescript
interface IHotel {
  _id: ObjectId;
  name: string;
  slug: string;                      // unique, url-friendly
  
  // Contact
  email: string;
  phone: string;
  website?: string;
  
  // Location
  address: {
    street: string;
    city: string;
    state?: string;
    country: string;                 // ISO code (DE, AT, CH)
    postal_code: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  
  // Hotel Details
  star_rating: 1 | 2 | 3 | 4 | 5;
  total_rooms: number;
  description?: string;
  amenities: string[];               // ['wifi', 'parking', 'pool']
  images: {
    url: string;
    alt: string;
    is_primary: boolean;
  }[];
  
  // Business Settings
  check_in_time: string;             // '14:00'
  check_out_time: string;            // '11:00'
  cancellation_policy?: string;
  currency: string;                  // 'EUR', 'USD'
  tax_rate: number;                  // 7% VAT in Germany
  
  // Subscription
  subscription_tier: 'free' | 'basic' | 'pro' | 'enterprise';
  subscription_status: 'trial' | 'active' | 'suspended' | 'cancelled';
  trial_ends_at?: Date;
  subscription_ends_at?: Date;
  
  // Status
  is_active: boolean;
  is_verified: boolean;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}

// Indexes
{
  slug: 1,                           // unique
  'address.city': 1,
  'address.country': 1,
  subscription_status: 1
}
```

### 3. Rooms Collection

```typescript
interface IRoom {
  _id: ObjectId;
  hotel_id: ObjectId;
  
  // Room Identity
  room_number: string;               // '101', 'A-205'
  room_type: 'single' | 'double' | 'suite' | 'deluxe' | 'family';
  floor: number;
  
  // Capacity
  capacity: {
    adults: number;
    children: number;
    total: number;
  };
  bed_configuration: string;         // '1 King Bed', '2 Single Beds'
  
  // Pricing
  base_price: number;                // per night in hotel currency
  
  // Details
  size_sqm?: number;
  description?: string;
  amenities: string[];               // ['balcony', 'city_view', 'minibar']
  images: {
    url: string;
    alt: string;
  }[];
  
  // Status
  is_active: boolean;                // can be booked
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}

// Indexes
{
  hotel_id: 1,
  'hotel_id,room_number': 1,         // unique compound
  room_type: 1,
  is_active: 1
}
```

### 4. Reservations Collection

```typescript
interface IReservation {
  _id: ObjectId;
  hotel_id: ObjectId;
  room_id: ObjectId;
  
  // Booking Reference
  booking_reference: string;         // unique: 'BK-20251026-ABC123'
  
  // Guest Information
  guest: {
    name: string;
    email: string;
    phone: string;
    country: string;                 // ISO code
    special_requests?: string;
  };
  
  // Stay Details
  check_in_date: Date;               // YYYY-MM-DD
  check_out_date: Date;
  nights: number;                    // calculated
  guests: {
    adults: number;
    children: number;
  };
  
  // Pricing
  price_per_night: number;
  total_price: number;               // before tax
  tax_amount: number;
  total_with_tax: number;
  currency: string;                  // 'EUR'
  
  // Status
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
  
  // Source
  source: 'direct' | 'phone' | 'email' | 'ota' | 'agency';
  
  // Internal Notes
  notes?: string;                    // staff notes
  
  // Metadata
  created_by: ObjectId;              // user who created
  confirmed_at?: Date;
  checked_in_at?: Date;
  checked_out_at?: Date;
  cancelled_at?: Date;
  cancellation_reason?: string;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}

// Indexes
{
  booking_reference: 1,              // unique
  hotel_id: 1,
  room_id: 1,
  'check_in_date,check_out_date': 1,
  status: 1,
  'hotel_id,check_in_date': 1,       // compound for availability queries
  'guest.email': 1
}
```

### 5. Pricing Rules Collection

```typescript
interface IPricingRule {
  _id: ObjectId;
  hotel_id: ObjectId;
  
  // Rule Configuration
  rule_name: string;                 // 'Weekend Discount', 'High Season'
  rule_type: 'seasonal' | 'occupancy' | 'day_of_week' | 'advance_booking' | 'length_of_stay';
  
  // Conditions (flexible based on rule_type)
  conditions: {
    // For seasonal
    season?: 'spring' | 'summer' | 'fall' | 'winter';
    
    // For occupancy
    occupancy_threshold?: number;    // 70 (means if occupancy > 70%)
    
    // For day_of_week
    days?: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
    
    // For advance_booking
    days_in_advance?: number;        // 30 days
    
    // For length_of_stay
    min_nights?: number;             // minimum stay
  };
  
  // Price Adjustment
  adjustment: {
    type: 'percentage' | 'fixed';
    value: number;                   // 10 (means +10% or +10 EUR)
    direction: 'increase' | 'decrease';
  };
  
  // Applicability
  room_types?: string[];             // empty = all room types
  start_date?: Date;                 // rule valid from
  end_date?: Date;                   // rule valid until
  
  // Priority
  priority: number;                  // higher number = higher priority
  
  // Status
  is_active: boolean;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}

// Indexes
{
  hotel_id: 1,
  is_active: 1,
  'hotel_id,is_active,priority': 1   // compound for rule evaluation
}
```

### 6. Notifications Collection

```typescript
interface INotification {
  _id: ObjectId;
  user_id: ObjectId;
  hotel_id?: ObjectId;
  
  // Content
  type: 'reservation' | 'payment' | 'system' | 'alert' | 'reminder';
  title: string;
  message: string;
  link?: string;                     // deep link to related entity
  
  // Status
  is_read: boolean;                  // default: false
  read_at?: Date;
  
  // Timestamp
  created_at: Date;
}

// Indexes
{
  user_id: 1,
  is_read: 1,
  'user_id,created_at': -1           // compound, descending
}
```

### 7. Audit Logs Collection

```typescript
interface IAuditLog {
  _id: ObjectId;
  user_id?: ObjectId;                // null for system actions
  hotel_id?: ObjectId;
  
  // Action Details
  action: 'create' | 'update' | 'delete' | 'login' | 'logout';
  entity_type: 'user' | 'hotel' | 'room' | 'reservation' | 'pricing_rule';
  entity_id: ObjectId;
  
  // Changes (for update actions)
  changes?: {
    field: string;
    old_value: any;
    new_value: any;
  }[];
  
  // Request Context
  ip_address?: string;
  user_agent?: string;
  
  // Timestamp
  created_at: Date;
}

// Indexes
{
  entity_type: 1,
  entity_id: 1,
  user_id: 1,
  created_at: -1,                    // descending for recent first
  'hotel_id,created_at': -1
}
```

---

## 🏢 Phase 2: Agency Module Schemas

### 8. Agencies Collection

```typescript
interface IAgency {
  _id: ObjectId;
  
  // Basic Info
  name: string;                      // "TravelPro GmbH"
  slug: string;                      // unique, url-friendly
  legal_name: string;                // Official registered name
  registration_number?: string;      // Tax/VAT ID
  
  // Contact
  email: string;
  phone: string;
  website?: string;
  
  // Location
  address: {
    street: string;
    city: string;
    state?: string;
    country: string;                 // ISO code
    postal_code: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  
  // Branding
  logo_url?: string;
  description?: string;
  
  // Specialization
  specializations: ('luxury' | 'budget' | 'adventure' | 'family' | 'corporate' | 'honeymoon' | 'groups')[];
  languages: string[];               // ['en', 'de', 'fr']
  
  // Business Settings
  default_commission_rate: number;   // 15 (percentage)
  payment_terms: 'net_30' | 'net_60' | 'prepaid';
  currency: string;                  // 'EUR'
  
  // Statistics
  total_hotels: number;              // count from agency_hotels
  total_bookings: number;
  total_revenue: number;
  
  // Subscription
  subscription_tier: 'free' | 'basic' | 'pro' | 'enterprise';
  subscription_status: 'trial' | 'active' | 'suspended' | 'cancelled';
  trial_ends_at?: Date;
  subscription_ends_at?: Date;
  
  // Verification
  is_verified: boolean;              // verified by admin
  verified_at?: Date;
  verified_by?: ObjectId;            // admin user
  
  // Status
  is_active: boolean;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}

// Indexes
{
  slug: 1,                           // unique
  'address.city': 1,
  'address.country': 1,
  subscription_status: 1,
  is_verified: 1
}
```

### 9. Agency Hotels Collection (Junction Table)

```typescript
interface IAgencyHotel {
  _id: ObjectId;
  agency_id: ObjectId;
  hotel_id: ObjectId;
  
  // Partnership Status
  partnership_status: 'pending' | 'active' | 'suspended' | 'terminated';
  
  // Commission Agreement
  commission_rate: number;           // Override agency default (e.g., 12%)
  commission_type: 'percentage' | 'fixed';
  
  // Contract Details
  contract_start_date: Date;
  contract_end_date?: Date;
  payment_terms: 'net_30' | 'net_60' | 'prepaid';
  
  // Inventory Access
  room_access: 'all' | 'selected';
  allowed_room_types?: string[];     // if room_access = 'selected'
  min_rooms_guarantee?: number;      // minimum rooms to book per month
  
  // Pricing
  markup_percentage?: number;        // Agency's markup on top of hotel price
  discount_percentage?: number;      // Special discount from hotel to agency
  
  // Restrictions
  blackout_dates?: Date[];           // dates agency cannot book
  min_nights?: number;
  max_nights?: number;
  
  // Performance
  total_bookings: number;
  total_revenue: number;
  cancellation_rate: number;
  
  // Notes
  notes?: string;
  
  // Metadata
  initiated_by: 'agency' | 'hotel';
  approved_by?: ObjectId;            // hotel admin who approved
  approved_at?: Date;
  
  // Status
  is_active: boolean;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}

// Indexes
{
  agency_id: 1,
  hotel_id: 1,
  'agency_id,hotel_id': 1,           // unique compound
  partnership_status: 1,
  'agency_id,partnership_status': 1
}
```

### 10. Offers Collection

```typescript
interface IOffer {
  _id: ObjectId;
  agency_id: ObjectId;
  
  // Offer Details
  offer_name: string;                // "Romantic Munich Getaway"
  offer_type: 'hotel_only' | 'package' | 'tour' | 'custom';
  description: string;
  highlights: string[];              // Key selling points
  
  // Destination
  destination: {
    country: string;
    city: string;
    region?: string;
  };
  
  // Duration
  duration_days: number;             // 3 days
  duration_nights: number;           // 2 nights
  flexible_duration: boolean;        // can customer adjust?
  
  // Capacity
  min_guests: number;                // 1
  max_guests: number;                // 4
  guest_types: ('adults' | 'children' | 'infants')[];
  
  // Pricing
  base_price: number;                // per person
  currency: string;
  pricing_type: 'per_person' | 'per_group';
  child_discount_percentage?: number;
  
  // Commission
  commission_included: boolean;      // true if commission already in price
  commission_rate?: number;
  
  // Validity
  valid_from: Date;
  valid_until: Date;
  booking_deadline?: Date;           // book by X date
  
  // Travel Dates
  travel_season: 'spring' | 'summer' | 'fall' | 'winter' | 'all_year';
  available_dates?: Date[];          // specific departure dates (for tours)
  blackout_dates?: Date[];
  
  // Inclusions/Exclusions
  inclusions: string[];              // ['accommodation', 'breakfast', 'airport_transfer']
  exclusions: string[];              // ['flights', 'visa', 'insurance']
  
  // Terms
  terms_conditions?: string;
  cancellation_policy: string;
  payment_schedule: string;          // "50% upfront, 50% 7 days before"
  
  // Media
  images: {
    url: string;
    alt: string;
    is_primary: boolean;
  }[];
  video_url?: string;
  brochure_url?: string;
  
  // Marketing
  tags: string[];                    // ['romantic', 'luxury', 'city_break']
  is_featured: boolean;
  is_published: boolean;
  seo_title?: string;
  seo_description?: string;
  
  // Status
  status: 'draft' | 'active' | 'expired' | 'archived';
  
  // Analytics
  view_count: number;
  inquiry_count: number;
  booking_count: number;
  conversion_rate: number;           // bookings / views * 100
  
  // Metadata
  created_by: ObjectId;              // agency user
  last_modified_by?: ObjectId;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
  published_at?: Date;
}

// Indexes
{
  agency_id: 1,
  status: 1,
  'agency_id,status': 1,
  'destination.city': 1,
  'destination.country': 1,
  valid_until: 1,
  is_featured: 1,
  tags: 1                            // array index for tag searches
}
```

### 11. Offer Items Collection

```typescript
interface IOfferItem {
  _id: ObjectId;
  offer_id: ObjectId;
  
  // Item Identity
  item_type: 'accommodation' | 'service' | 'activity' | 'transport' | 'meal' | 'insurance';
  
  // Hotel Link (for accommodation)
  hotel_id?: ObjectId;
  room_id?: ObjectId;                // null if hotel-level booking
  
  // Item Details
  name: string;                      // "3 Nights at Hotel Bergblick"
  description?: string;
  
  // Quantity & Duration
  quantity: number;                  // 3 (nights), 1 (tour), etc.
  unit: 'night' | 'day' | 'person' | 'item';
  
  // Timing
  day_number?: number;               // Day 1, Day 2, etc.
  start_time?: string;               // "09:00"
  duration_minutes?: number;
  
  // Pricing
  unit_price: number;
  total_price: number;               // quantity * unit_price
  included_in_base_price: boolean;   // or optional add-on?
  is_mandatory: boolean;
  
  // External Provider
  provider_name?: string;            // "City Tours Co."
  provider_contact?: string;
  booking_reference?: string;
  
  // Display
  sort_order: number;                // display order in itinerary
  icon?: string;                     // icon identifier
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}

// Indexes
{
  offer_id: 1,
  'offer_id,sort_order': 1,
  hotel_id: 1,
  item_type: 1
}
```

### 12. Agency Customers Collection (CRM)

```typescript
interface IAgencyCustomer {
  _id: ObjectId;
  agency_id: ObjectId;
  
  // Customer Type
  customer_type: 'individual' | 'corporate';
  
  // Personal Info
  first_name: string;
  last_name: string;
  full_name: string;                 // concatenated
  title?: 'Mr' | 'Mrs' | 'Ms' | 'Dr';
  
  // Corporate (if applicable)
  company_name?: string;
  job_title?: string;
  company_size?: 'small' | 'medium' | 'large';
  
  // Contact
  email: string;
  phone: string;
  alternate_phone?: string;
  preferred_contact_method: 'email' | 'phone' | 'whatsapp';
  
  // Address
  address?: {
    street: string;
    city: string;
    state?: string;
    country: string;
    postal_code: string;
  };
  
  // Travel Documents
  date_of_birth?: Date;
  passport_number?: string;
  passport_expiry?: Date;
  nationality: string;
  visa_requirements?: string[];
  
  // Preferences
  preferences: {
    room_type?: ('single' | 'double' | 'suite')[];
    bed_type?: ('single' | 'double' | 'king')[];
    floor_preference?: 'low' | 'high' | 'any';
    special_needs?: string[];        // ['wheelchair_access', 'allergy_friendly']
    dietary_restrictions?: string[];
    interests?: string[];            // ['culture', 'adventure', 'beach']
    budget_range?: {
      min: number;
      max: number;
      currency: string;
    };
  };
  
  // Segmentation
  tags: string[];                    // ['vip', 'frequent', 'high_value', 'corporate']
  customer_segment: 'bronze' | 'silver' | 'gold' | 'platinum';
  
  // Lifetime Value
  total_bookings: number;
  total_spent: number;
  average_booking_value: number;
  total_nights_booked: number;
  
  // Engagement
  first_booking_date?: Date;
  last_booking_date?: Date;
  last_contact_date?: Date;
  next_follow_up_date?: Date;
  
  // Communication
  marketing_consent: boolean;
  communication_preferences: {
    newsletter: boolean;
    promotions: boolean;
    trip_reminders: boolean;
  };
  
  // Internal Notes
  notes?: string;
  internal_tags?: string[];          // ['difficult', 'patient', 'detail_oriented']
  
  // Referrals
  referred_by?: ObjectId;            // another customer
  referral_count: number;
  
  // Metadata
  source: 'website' | 'walk_in' | 'phone' | 'referral' | 'social_media' | 'event';
  created_by: ObjectId;              // agency user
  assigned_to?: ObjectId;            // account manager
  
  // Status
  is_active: boolean;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}

// Indexes
{
  agency_id: 1,
  email: 1,
  'agency_id,email': 1,              // unique compound
  phone: 1,
  customer_segment: 1,
  tags: 1,                           // array index
  'agency_id,total_spent': -1,      // top spenders
  'agency_id,last_booking_date': -1 // recent customers
}
```

---

## 🔗 Updated Relationships (Complete System)

## 🔗 Updated Relationships (Complete System)

### One-to-Many (1:N)

1. **Hotel → Users**
   - One hotel has many staff users
   - Cascade: If hotel deleted, deactivate users

2. **Agency → Users**
   - One agency has many staff users
   - Cascade: If agency deleted, deactivate users

3. **Hotel → Rooms**
   - One hotel has many rooms
   - Cascade: If hotel deleted, soft delete rooms

4. **Hotel → Reservations**
   - One hotel has many reservations
   - Cascade: Keep reservations for audit even if hotel deleted

5. **Room → Reservations**
   - One room has many reservations
   - Cascade: Cannot delete room if active reservations exist

6. **Hotel → Pricing Rules**
   - One hotel has many pricing rules
   - Cascade: Delete rules if hotel deleted

7. **Agency → Offers**
   - One agency creates many offers
   - Cascade: Archive offers if agency deleted

8. **Offer → Offer Items**
   - One offer contains many items (hotels, services, activities)
   - Cascade: Delete items if offer deleted

9. **Agency → Customers**
   - One agency has many customers
   - Cascade: Keep customers for audit even if agency deleted

10. **Agency → Reservations**
    - One agency makes many reservations (through hotels)
    - Cascade: Keep reservations for commission tracking

### Many-to-Many (M:N)

1. **Hotels ↔ Agencies** (via agency_hotels)
   - One hotel can partner with many agencies
   - One agency can partner with many hotels
   - Junction table: `agency_hotels` stores partnership details

2. **Offers ↔ Hotels** (via offer_items)
   - One offer can include multiple hotels
   - One hotel can be in multiple offers
   - Junction table: `offer_items` stores which hotels are in which offers

### Optional Foreign Keys

- **Reservations.agency_id** - NULL if direct booking (not through agency)
- **Reservations.offer_id** - NULL if booking not from a package offer
- **Users.hotel_id** - NULL if user is agency staff or super admin
- **Users.agency_id** - NULL if user is hotel staff or super admin

---

## 🎯 Key Business Queries (Optimized with Indexes)

### Hotel Module Queries

#### 1. Check Room Availability
```javascript
// Find available rooms for date range
db.rooms.aggregate([
  { $match: { hotel_id: hotelId, is_active: true } },
  { $lookup: {
      from: 'reservations',
      let: { roomId: '$_id' },
      pipeline: [
        { $match: {
          $expr: { $eq: ['$room_id', '$$roomId'] },
          status: { $in: ['confirmed', 'checked_in'] },
          $or: [
            { check_in_date: { $lte: checkOut }, check_out_date: { $gt: checkIn } }
          ]
        }}
      ],
      as: 'reservations'
    }
  },
  { $match: { 'reservations': { $size: 0 } } }
])
```

#### 2. Calculate Occupancy Rate
```javascript
// Hotel occupancy for a date range
db.reservations.aggregate([
  { $match: {
    hotel_id: hotelId,
    status: { $in: ['confirmed', 'checked_in', 'checked_out'] },
    check_in_date: { $lte: endDate },
    check_out_date: { $gte: startDate }
  }},
  { $group: {
    _id: null,
    total_nights: { $sum: '$nights' }
  }}
])
// occupancy_rate = (total_nights / (total_rooms * days)) * 100
```

#### 3. Revenue Analytics
```javascript
// Monthly revenue by room type
db.reservations.aggregate([
  { $match: {
    hotel_id: hotelId,
    status: { $ne: 'cancelled' },
    check_in_date: { $gte: startDate, $lte: endDate }
  }},
  { $lookup: {
    from: 'rooms',
    localField: 'room_id',
    foreignField: '_id',
    as: 'room'
  }},
  { $unwind: '$room' },
  { $group: {
    _id: '$room.room_type',
    total_revenue: { $sum: '$total_with_tax' },
    booking_count: { $sum: 1 }
  }}
])
```

---

### Agency Module Queries

#### 4. Find Hotels Available for Agency Partnership
```javascript
// Hotels not yet partnered with this agency
db.hotels.aggregate([
  { $match: { 
    is_active: true,
    'address.country': { $in: ['DE', 'AT', 'CH'] } // Target markets
  }},
  { $lookup: {
    from: 'agency_hotels',
    let: { hotelId: '$_id' },
    pipeline: [
      { $match: {
        $expr: { 
          $and: [
            { $eq: ['$hotel_id', '$$hotelId'] },
            { $eq: ['$agency_id', agencyId] }
          ]
        }
      }}
    ],
    as: 'partnership'
  }},
  { $match: { partnership: { $size: 0 } } }, // No existing partnership
  { $project: {
    name: 1,
    city: '$address.city',
    star_rating: 1,
    total_rooms: 1
  }}
])
```

#### 5. Agency Commission Report
```javascript
// Calculate total commission earned
db.reservations.aggregate([
  { $match: {
    agency_id: agencyId,
    status: { $in: ['confirmed', 'checked_in', 'checked_out'] },
    check_in_date: { $gte: startDate, $lte: endDate }
  }},
  { $group: {
    _id: { 
      year: { $year: '$check_in_date' },
      month: { $month: '$check_in_date' }
    },
    total_bookings: { $sum: 1 },
    total_revenue: { $sum: '$total_price' },
    total_commission: { $sum: '$commission_amount' }
  }},
  { $sort: { '_id.year': 1, '_id.month': 1 } }
])
```

#### 6. Top Performing Hotels for Agency
```javascript
// Which hotels generate most bookings/revenue for this agency
db.reservations.aggregate([
  { $match: {
    agency_id: agencyId,
    status: { $ne: 'cancelled' },
    created_at: { $gte: last90Days }
  }},
  { $group: {
    _id: '$hotel_id',
    booking_count: { $sum: 1 },
    total_revenue: { $sum: '$total_price' },
    avg_booking_value: { $avg: '$total_price' }
  }},
  { $lookup: {
    from: 'hotels',
    localField: '_id',
    foreignField: '_id',
    as: 'hotel'
  }},
  { $unwind: '$hotel' },
  { $sort: { total_revenue: -1 } },
  { $limit: 10 }
])
```

#### 7. Customer Lifetime Value (CLV)
```javascript
// Top customers by total spend
db.reservations.aggregate([
  { $match: {
    agency_id: agencyId,
    status: { $in: ['confirmed', 'checked_in', 'checked_out'] }
  }},
  { $lookup: {
    from: 'agency_customers',
    localField: 'guest_email',
    foreignField: 'email',
    as: 'customer'
  }},
  { $unwind: '$customer' },
  { $group: {
    _id: '$customer._id',
    customer_name: { $first: '$customer.full_name' },
    total_bookings: { $sum: 1 },
    total_spent: { $sum: '$total_price' },
    avg_booking_value: { $avg: '$total_price' },
    first_booking: { $min: '$check_in_date' },
    last_booking: { $max: '$check_in_date' }
  }},
  { $sort: { total_spent: -1 } },
  { $limit: 50 }
])
```

#### 8. Offer Performance Analytics
```javascript
// Track which offers convert best
db.reservations.aggregate([
  { $match: {
    agency_id: agencyId,
    offer_id: { $ne: null },
    created_at: { $gte: last30Days }
  }},
  { $group: {
    _id: '$offer_id',
    booking_count: { $sum: 1 },
    total_revenue: { $sum: '$total_price' }
  }},
  { $lookup: {
    from: 'offers',
    localField: '_id',
    foreignField: '_id',
    as: 'offer'
  }},
  { $unwind: '$offer' },
  { $project: {
    offer_name: '$offer.offer_name',
    booking_count: 1,
    total_revenue: 1,
    view_count: '$offer.view_count',
    conversion_rate: {
      $multiply: [
        { $divide: ['$booking_count', '$offer.view_count'] },
        100
      ]
    }
  }},
  { $sort: { conversion_rate: -1 } }
])
```

#### 9. Hotel Availability for Offer Creation
```javascript
// Find hotels with rooms available for specific dates
db.agency_hotels.aggregate([
  { $match: {
    agency_id: agencyId,
    partnership_status: 'active'
  }},
  { $lookup: {
    from: 'hotels',
    localField: 'hotel_id',
    foreignField: '_id',
    as: 'hotel'
  }},
  { $unwind: '$hotel' },
  { $lookup: {
    from: 'rooms',
    let: { hotelId: '$hotel._id' },
    pipeline: [
      { $match: {
        $expr: { $eq: ['$hotel_id', '$$hotelId'] },
        is_active: true
      }},
      { $lookup: {
        from: 'reservations',
        let: { roomId: '$_id' },
        pipeline: [
          { $match: {
            $expr: { $eq: ['$room_id', '$$roomId'] },
            status: { $in: ['confirmed', 'checked_in'] },
            check_in_date: { $lte: checkOutDate },
            check_out_date: { $gt: checkInDate }
          }}
        ],
        as: 'overlapping'
      }},
      { $match: { overlapping: { $size: 0 } } }
    ],
    as: 'available_rooms'
  }},
  { $match: { 'available_rooms.0': { $exists: true } } }, // Has at least 1 available room
  { $project: {
    hotel_name: '$hotel.name',
    hotel_city: '$hotel.address.city',
    available_room_count: { $size: '$available_rooms' },
    commission_rate: 1
  }}
])
```

---

## 🔒 Data Security & Privacy

### GDPR Compliance
- Guest data: encrypted at rest
- Personal data retention: 2 years post-checkout
- Right to be forgotten: anonymize guest data on request
- Data export: provide JSON export of user/guest data

### Field-Level Encryption
- `password_hash` - bcrypt (cost factor: 12)
- `guest.email` - optionally encrypted
- `guest.phone` - optionally encrypted

### Soft Deletes
- Hotels, Rooms, Users: use `is_active: false` instead of deletion
- Reservations: keep all records for accounting/audit

---

## 📊 Sample Data for Development

```javascript
// Sample Hotel
{
  name: "Hotel Bergblick",
  slug: "hotel-bergblick-munich",
  email: "info@bergblick.de",
  phone: "+49 89 1234567",
  address: {
    street: "Leopoldstraße 15",
    city: "Munich",
    country: "DE",
    postal_code: "80802"
  },
  star_rating: 4,
  total_rooms: 25,
  currency: "EUR",
  tax_rate: 7
}

// Sample Room
{
  hotel_id: ObjectId("..."),
  room_number: "201",
  room_type: "double",
  floor: 2,
  capacity: { adults: 2, children: 1, total: 3 },
  base_price: 120,
  amenities: ["balcony", "city_view", "wifi"]
}

// Sample Reservation
{
  hotel_id: ObjectId("..."),
  room_id: ObjectId("..."),
  booking_reference: "BK-20251026-XYZ789",
  guest: {
    name: "Hans Müller",
    email: "hans@example.de",
    phone: "+49 151 12345678",
    country: "DE"
  },
  check_in_date: ISODate("2025-11-15"),
  check_out_date: ISODate("2025-11-18"),
  nights: 3,
  guests: { adults: 2, children: 0 },
  price_per_night: 120,
  total_price: 360,
  currency: "EUR",
  status: "confirmed"
}
```

---

## 🚀 Migration Strategy

### Phase 1: MVP Collections
1. users
2. hotels
3. rooms
4. reservations

### Phase 2: Enhancement Collections
5. pricing_rules
6. notifications
7. audit_logs

### Phase 3: Expansion Collections (Post-MVP)
8. agencies
9. offers
10. travelers
11. payments
12. reviews

---

**Document Status:** Ready for Implementation  
**Last Updated:** October 26, 2025  
**Next Step:** API Design Document
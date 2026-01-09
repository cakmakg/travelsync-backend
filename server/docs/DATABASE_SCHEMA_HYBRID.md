# TravelSync - Hybrid Database Schema (MongoDB + Best Practices)

## 🎯 Design Philosophy

**Core Principles:**
1. **MongoDB as foundation** - Keep existing setup, no migration
2. **Multi-tenant from day 1** - Organization-based separation
3. **Professional hotel concepts** - Rate plans, inventory, meal plans
4. **Future-proof** - Ready for agencies and PMS integrations
5. **MVP-focused** - No over-engineering, add complexity later

**Changes from Original:**
- ✅ Keep: MongoDB, JWT auth, REST API, simple structure
- ✅ Add: Organizations (multi-tenant), Rate Plans, Audit logs
- ❌ Skip: Event outbox, OAuth2, GraphQL, PMS skeleton (Phase 2)

---

## 🗂 Collections Overview

### Phase 1: MVP (Week 1-12)

**Core:**
1. `organizations` - Multi-tenant container (Hotel/Agency)
2. `users` - All system users
3. `roles` - RBAC permissions (simplified)

**Hotel Operations:**
4. `properties` - Hotel profiles (replaces `hotels`)
5. `room_types` - Room templates (replaces `rooms`)
6. `rate_plans` - Pricing strategies (NEW)
7. `prices` - Daily prices by rate plan (NEW)
8. `inventory` - Daily room availability (NEW)
9. `reservations` - Bookings

**Supporting:**
10. `audit_logs` - Activity tracking
11. `notifications` - User notifications

### Phase 2: Agency Module (Week 13-24)
12. `agency_clients` - Customer CRM
13. `agency_hotels` - Hotel partnerships
14. `rfx_requests` - Quote requests
15. `offers` - Travel packages
16. `offer_items` - Package components
17. `contracts` - Agency-Hotel agreements

### Phase 3: Future
18. `travelers` - B2C users
19. `trips` - Travel plans
20. `payments` - Transactions
21. `integrations` - PMS/OTA connections

---

## 📐 Complete ERD (ASCII)

```
┌─────────────────────┐
│   ORGANIZATIONS     │
│─────────────────────│
│ _id (PK)            │
│ type: HOTEL/AGENCY  │
│ name                │
│ country             │
│ timezone            │
│ currency            │
│ subscription        │
└──────────┬──────────┘
           │
           │ 1:N
           │
           ▼
┌─────────────────────┐
│       USERS         │
│─────────────────────│
│ _id (PK)            │
│ organization_id (FK)│
│ email               │
│ role                │
│ permissions[]       │
└─────────────────────┘

┌─────────────────────┐
│    PROPERTIES       │   (Hotels)
│─────────────────────│
│ _id (PK)            │
│ organization_id (FK)│───┐
│ name                │   │ Must be type='HOTEL'
│ city, country       │   │
│ star_rating         │   │
│ amenities[]         │   │
└──────────┬──────────┘   │
           │              │
           │ 1:N          │
           │              │
           ▼              │
┌─────────────────────┐   │
│    ROOM_TYPES       │   │
│─────────────────────│   │
│ _id (PK)            │   │
│ property_id (FK)    │───┘
│ code: 'STD','DLX'   │
│ name                │
│ capacity            │
│ base_amenities[]    │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │           │
     │ 1:N       │ 1:N
     │           │
     ▼           ▼
┌──────────┐  ┌──────────────┐
│ RATE_    │  │  INVENTORY   │
│ PLANS    │  │──────────────│
│──────────│  │ property_id  │
│ _id (PK) │  │ room_type_id │
│ property │  │ date         │
│ name     │  │ allotment    │
│ meal_plan│  │ sold         │
└────┬─────┘  │ available    │
     │        │ stop_sell    │
     │        └──────────────┘
     │ 1:N
     │
     ▼
┌─────────────────────┐
│      PRICES         │
│─────────────────────│
│ _id (PK)            │
│ property_id (FK)    │
│ room_type_id (FK)   │
│ rate_plan_id (FK)   │
│ date                │
│ amount              │
│ currency            │
│ source: MANUAL/AI   │
└─────────────────────┘
           │
           │ Used by
           │
           ▼
┌─────────────────────────┐
│     RESERVATIONS        │
│─────────────────────────│
│ _id (PK)                │
│ property_id (FK)        │
│ room_type_id (FK)       │
│ rate_plan_id (FK)       │
│ organization_id (FK)    │ Agency if booked by agency
│ booking_reference       │
│ guest_name              │
│ check_in_date           │
│ check_out_date          │
│ nights                  │
│ total_amount            │
│ source: DIRECT/AGENCY   │
│ status                  │
│ idempotency_key         │ NEW: prevent duplicates
│ external_ref            │ OTA/PMS ID
└─────────────────────────┘

┌─────────────────────────┐
│      AUDIT_LOGS         │
│─────────────────────────│
│ _id (PK)                │
│ user_id (FK)            │
│ organization_id (FK)    │
│ action                  │
│ entity_type             │
│ entity_id               │
│ changes                 │
│ ip_address              │
│ created_at              │
└─────────────────────────┘
```

---

## 📋 Detailed Schema Definitions

### 1. Organizations (NEW - Multi-tenant)

```typescript
interface IOrganization {
  _id: ObjectId;
  
  // Type determines what features are available
  type: 'HOTEL' | 'AGENCY';
  
  // Basic Info
  name: string;
  legal_name?: string;
  registration_number?: string; // Tax ID
  
  // Location
  country: string; // ISO code: 'DE', 'AT', 'CH'
  timezone: string; // 'Europe/Berlin'
  
  // Settings
  currency: string; // 'EUR', 'USD'
  date_format: 'DD/MM/YYYY' | 'MM/DD/YYYY';
  language: 'en' | 'de';
  
  // Contact
  email: string;
  phone: string;
  
  // Subscription
  subscription: {
    tier: 'free' | 'basic' | 'pro' | 'enterprise';
    status: 'trial' | 'active' | 'suspended' | 'cancelled';
    trial_ends_at?: Date;
    current_period_end?: Date;
  };
  
  // Limits (based on tier)
  limits: {
    max_properties: number; // For hotel chains
    max_users: number;
    max_reservations_per_month: number;
  };
  
  // Status
  is_active: boolean;
  is_verified: boolean;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}

// Indexes
db.organizations.createIndex({ type: 1 });
db.organizations.createIndex({ 'subscription.status': 1 });
db.organizations.createIndex({ country: 1 });
```

### 2. Users (Updated)

```typescript
interface IUser {
  _id: ObjectId;
  organization_id: ObjectId; // NEW: Links to organization
  
  // Auth
  email: string; // unique
  password_hash: string;
  
  // Profile
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  
  // Role & Permissions
  role: 'org_admin' | 'org_staff'; // Simplified for MVP
  // Phase 2: Add fine-grained permissions
  permissions?: string[]; // ['booking:read', 'booking:create', 'price:write']
  
  // Preferences
  language: 'en' | 'de';
  timezone: string;
  
  // Status
  is_active: boolean;
  is_email_verified: boolean;
  last_login_at?: Date;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}

// Indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ organization_id: 1 });
db.users.createIndex({ organization_id: 1, role: 1 });
```

### 3. Properties (Renamed from Hotels)

```typescript
interface IProperty {
  _id: ObjectId;
  organization_id: ObjectId; // Must be type='HOTEL'
  
  // Basic Info
  name: string;
  code?: string; // Internal code: 'MUC-01'
  
  // Location
  address: {
    street: string;
    city: string;
    state?: string;
    country: string;
    postal_code: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  
  // Hotel Details
  star_rating: 1 | 2 | 3 | 4 | 5;
  property_type: 'hotel' | 'aparthotel' | 'hostel' | 'resort';
  chain?: string; // Hotel chain name
  
  // Capacity
  total_rooms: number;
  total_floors?: number;
  
  // Amenities
  amenities: string[]; // ['wifi', 'parking', 'pool', 'spa', 'gym']
  
  // Check-in/out
  check_in_time: string; // '14:00'
  check_out_time: string; // '11:00'
  
  // Policies
  cancellation_policy?: string;
  child_policy?: string;
  pet_policy?: string;
  
  // Financial
  currency: string; // 'EUR'
  tax_rate: number; // 7 for Germany VAT
  
  // Media
  images: {
    url: string;
    alt: string;
    is_primary: boolean;
  }[];
  
  // Status
  is_active: boolean;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}

// Indexes
db.properties.createIndex({ organization_id: 1 });
db.properties.createIndex({ 'address.city': 1 });
db.properties.createIndex({ 'address.country': 1 });
db.properties.createIndex({ star_rating: 1 });
```

### 4. Room Types (Renamed from Rooms)

```typescript
interface IRoomType {
  _id: ObjectId;
  property_id: ObjectId;
  
  // Identification
  code: string; // 'STD', 'DLX', 'SUI', 'FAM'
  name: string; // 'Standard Room', 'Deluxe Room', 'Suite'
  
  // Physical Attributes
  floor?: number;
  size_sqm?: number;
  view?: 'city' | 'garden' | 'sea' | 'mountain';
  
  // Capacity
  capacity: {
    adults: number;
    children: number;
    infants: number;
    total: number;
  };
  
  // Beds
  bed_configuration: string; // '1 King Bed', '2 Single Beds'
  bed_types: ('single' | 'double' | 'king' | 'queen')[];
  extra_bed_available: boolean;
  
  // Amenities (room-specific)
  amenities: string[]; // ['balcony', 'minibar', 'safe', 'bathtub']
  
  // Inventory (total rooms of this type)
  total_quantity: number; // How many rooms of this type exist
  
  // Media
  images: {
    url: string;
    alt: string;
  }[];
  
  // Status
  is_active: boolean;
  is_bookable: boolean;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}

// Indexes
db.room_types.createIndex({ property_id: 1 });
db.room_types.createIndex({ property_id: 1, code: 1 });
db.room_types.createIndex({ is_active: 1, is_bookable: 1 });
```

### 5. Rate Plans (NEW - Professional)

```typescript
interface IRatePlan {
  _id: ObjectId;
  property_id: ObjectId;
  
  // Plan Identity
  code: string; // 'BAR', 'NRF', 'PKG'
  name: string; // 'Best Available Rate', 'Non-Refundable', 'Package'
  
  // Type
  rate_type: 'public' | 'negotiated' | 'package' | 'promotion';
  
  // Meal Plan
  meal_plan: 'RO' | 'BB' | 'HB' | 'FB' | 'AI';
  // RO = Room Only
  // BB = Bed & Breakfast
  // HB = Half Board (breakfast + dinner)
  // FB = Full Board (all meals)
  // AI = All Inclusive
  
  // Cancellation
  cancellation_policy: {
    type: 'flexible' | 'moderate' | 'strict' | 'non_refundable';
    free_cancellation_until: number; // days before check-in
    penalty_amount?: number; // fixed amount
    penalty_percentage?: number; // % of total
    no_show_penalty: number; // % of total
  };
  
  // Pricing Strategy
  is_derived: boolean; // derived from base rate?
  base_rate_plan_id?: ObjectId; // if derived
  markup_percentage?: number; // if derived: +10% from base
  
  // Restrictions
  min_nights?: number;
  max_nights?: number;
  min_advance_booking?: number; // days
  max_advance_booking?: number; // days
  applicable_days?: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
  
  // Availability
  valid_from?: Date;
  valid_until?: Date;
  
  // Status
  is_active: boolean;
  is_public: boolean; // visible to agencies/public
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}

// Indexes
db.rate_plans.createIndex({ property_id: 1 });
db.rate_plans.createIndex({ property_id: 1, code: 1 });
db.rate_plans.createIndex({ is_active: 1, is_public: 1 });
db.rate_plans.createIndex({ meal_plan: 1 });
```

### 6. Prices (NEW - Daily Rates)

```typescript
interface IPrice {
  _id: ObjectId;
  property_id: ObjectId;
  room_type_id: ObjectId;
  rate_plan_id: ObjectId;
  
  // Date
  date: Date; // YYYY-MM-DD
  
  // Pricing
  amount: number; // per room per night
  currency: string; // 'EUR'
  
  // Source tracking
  source: 'MANUAL' | 'AI' | 'PMS' | 'BULK_UPLOAD';
  updated_by?: ObjectId; // user who updated
  
  // Constraints
  min_occupancy?: number; // minimum guests for this price
  max_occupancy?: number;
  
  // Status
  is_available: boolean; // can be booked at this price
  
  // Metadata
  created_at: Date;
  updated_at: Date;
}

// Indexes (CRITICAL for performance)
db.prices.createIndex({ 
  property_id: 1, 
  room_type_id: 1, 
  rate_plan_id: 1, 
  date: 1 
}, { unique: true });
db.prices.createIndex({ date: 1 });
db.prices.createIndex({ property_id: 1, date: 1 });
```

### 7. Inventory (NEW - Availability Management)

```typescript
interface IInventory {
  _id: ObjectId;
  property_id: ObjectId;
  room_type_id: ObjectId;
  
  // Date
  date: Date; // YYYY-MM-DD
  
  // Availability
  allotment: number; // total rooms available (e.g., 10)
  sold: number; // rooms booked (e.g., 7)
  available: number; // remaining = allotment - sold (e.g., 3)
  
  // Controls
  stop_sell: boolean; // manual block on bookings
  closed: boolean; // closed for this date
  
  // Restrictions
  min_stay?: number; // minimum nights
  max_stay?: number;
  closed_to_arrival?: boolean; // can't check-in on this date
  closed_to_departure?: boolean; // can't check-out on this date
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}

// Indexes
db.inventory.createIndex({ 
  property_id: 1, 
  room_type_id: 1, 
  date: 1 
}, { unique: true });
db.inventory.createIndex({ date: 1 });
db.inventory.createIndex({ available: 1 }); // for availability queries
```

### 8. Reservations (Updated)

```typescript
interface IReservation {
  _id: ObjectId;
  property_id: ObjectId;
  room_type_id: ObjectId;
  rate_plan_id: ObjectId; // NEW
  organization_id?: ObjectId; // NEW: agency if booked by agency
  
  // Booking Identity
  booking_reference: string; // 'BK-20251026-ABC123'
  idempotency_key?: string; // NEW: prevent duplicate bookings
  external_ref?: string; // NEW: OTA/PMS booking ID
  
  // Guest Info
  guest: {
    name: string;
    email: string;
    phone: string;
    country: string;
    special_requests?: string;
  };
  
  // Stay Details
  check_in_date: Date;
  check_out_date: Date;
  nights: number;
  
  // Guests
  guests: {
    adults: number;
    children: number;
    infants?: number;
  };
  
  // Pricing
  price_per_night: number;
  total_price: number; // before tax
  tax_amount: number;
  total_with_tax: number;
  currency: string;
  
  // Commission (if agency booking)
  commission?: {
    rate: number; // percentage
    amount: number;
  };
  
  // Source
  source: 'DIRECT' | 'PHONE' | 'EMAIL' | 'OTA' | 'AGENCY' | 'PMS';
  channel?: string; // 'Booking.com', 'Expedia'
  
  // Status
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
  
  // Meal Plan (from rate_plan)
  meal_plan: string;
  
  // Payment
  payment_status?: 'unpaid' | 'partially_paid' | 'paid' | 'refunded';
  payment_method?: string;
  
  // Notes
  notes?: string; // internal notes
  
  // Metadata
  created_by: ObjectId;
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
db.reservations.createIndex({ booking_reference: 1 }, { unique: true });
db.reservations.createIndex({ idempotency_key: 1 }, { unique: true, sparse: true });
db.reservations.createIndex({ property_id: 1 });
db.reservations.createIndex({ property_id: 1, check_in_date: 1 });
db.reservations.createIndex({ property_id: 1, status: 1 });
db.reservations.createIndex({ organization_id: 1 }); // agency bookings
db.reservations.createIndex({ 'guest.email': 1 });
db.reservations.createIndex({ external_ref: 1 }, { sparse: true });
```

### 9. Audit Logs (NEW)

```typescript
interface IAuditLog {
  _id: ObjectId;
  user_id?: ObjectId; // null for system actions
  organization_id: ObjectId;
  
  // Action
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
  entity_type: 'user' | 'property' | 'room_type' | 'reservation' | 'price' | 'rate_plan';
  entity_id: ObjectId;
  
  // Changes (for UPDATE)
  changes?: {
    field: string;
    old_value: any;
    new_value: any;
  }[];
  
  // Request Context
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  
  // Timestamp
  created_at: Date;
}

// Indexes
db.audit_logs.createIndex({ organization_id: 1, created_at: -1 });
db.audit_logs.createIndex({ entity_type: 1, entity_id: 1 });
db.audit_logs.createIndex({ user_id: 1, created_at: -1 });
db.audit_logs.createIndex({ created_at: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL
```

---

## 🔄 Data Relationships

### 1:N Relationships

```
Organization → Users (1:N)
Organization → Properties (1:N)  [if type='HOTEL']

Property → Room Types (1:N)
Property → Rate Plans (1:N)
Property → Reservations (1:N)

Room Type → Inventory (1:N by date)
Room Type → Prices (1:N by date & rate plan)

Rate Plan → Prices (1:N by date & room type)
```

### Composite Keys (Unique Together)

```
Prices: (property_id + room_type_id + rate_plan_id + date)
Inventory: (property_id + room_type_id + date)
```

---

## 🎯 Key Business Queries

### 1. Check Availability (Critical Path)

```javascript
// Find available room types for check-in/out dates
async function checkAvailability(propertyId, checkIn, checkOut) {
  const dates = getDatesInRange(checkIn, checkOut);
  
  // Get room types with sufficient inventory for ALL dates
  const available = await db.inventory.aggregate([
    {
      $match: {
        property_id: propertyId,
        date: { $in: dates },
        available: { $gt: 0 },
        stop_sell: false,
        closed: false
      }
    },
    {
      $group: {
        _id: '$room_type_id',
        min_available: { $min: '$available' },
        date_count: { $sum: 1 }
      }
    },
    {
      $match: {
        date_count: dates.length, // Must have inventory for ALL dates
        min_available: { $gt: 0 }
      }
    }
  ]);
  
  return available;
}
```

### 2. Get Prices for Date Range

```javascript
// Get best available rates
async function getPrices(propertyId, roomTypeId, dates) {
  const prices = await db.prices.find({
    property_id: propertyId,
    room_type_id: roomTypeId,
    date: { $in: dates },
    is_available: true
  }).populate('rate_plan_id');
  
  // Group by rate plan
  return _.groupBy(prices, 'rate_plan_id');
}
```

### 3. Create Reservation with Inventory Update

```javascript
async function createReservation(data) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // 1. Create reservation
    const reservation = await Reservation.create([data], { session });
    
    // 2. Update inventory (decrease available)
    const dates = getDatesInRange(data.check_in_date, data.check_out_date);
    
    await Inventory.updateMany(
      {
        property_id: data.property_id,
        room_type_id: data.room_type_id,
        date: { $in: dates }
      },
      {
        $inc: { sold: 1, available: -1 }
      },
      { session }
    );
    
    // 3. Audit log
    await AuditLog.create([{
      user_id: data.created_by,
      organization_id: data.organization_id,
      action: 'CREATE',
      entity_type: 'reservation',
      entity_id: reservation[0]._id
    }], { session });
    
    await session.commitTransaction();
    return reservation[0];
    
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

---

## 🚀 Migration Path (From Old to New Schema)

### Week 1-2: Add New Collections

```javascript
// 1. Create organizations from existing hotels
await Hotel.find().forEach(async (hotel) => {
  const org = await Organization.create({
    type: 'HOTEL',
    name: hotel.name,
    country: hotel.address.country,
    timezone: 'Europe/Berlin',
    currency: hotel.currency,
    subscription: hotel.subscription
  });
  
  hotel.organization_id = org._id;
  await hotel.save();
});

// 2. Update users with organization_id
await User.updateMany(
  { hotel_id: { $exists: true } },
  [{ $set: { organization_id: '$hotel_id' } }]
);

// 3. Rename hotels → properties
db.hotels.renameCollection('properties');

// 4. Rename rooms → room_types
db.rooms.renameCollection('room_types');
```

### Week 3-4: Add Rate Plans & Prices

```javascript
// Create default "Best Available Rate" for all properties
await Property.find().forEach(async (property) => {
  const ratePlan = await RatePlan.create({
    property_id: property._id,
    code: 'BAR',
    name: 'Best Available Rate',
    rate_type: 'public',
    meal_plan: 'BB',
    cancellation_policy: {
      type: 'flexible',
      free_cancellation_until: 1
    },
    is_active: true,
    is_public: true
  });
  
  // Migrate existing room base_prices to prices collection
  const roomTypes = await RoomType.find({ property_id: property._id });
  
  for (const roomType of roomTypes) {
    // Create prices for next 365 days
    const pricesData = [];
    for (let i = 0; i < 365; i++) {
      const date = moment().add(i, 'days').toDate();
      pricesData.push({
        property_id: property._id,
        room_type_id: roomType._id,
        rate_plan_id: ratePlan._id,
        date,
        amount: roomType.base_price,
        currency: property.currency,
        source: 'MANUAL',
        is_available: true
      });
    }
    
    await Price.insertMany(pricesData);
  }
});
```

---

## ✅ Summary: What Changed

### ✅ Added (Good from PostgreSQL approach)
- Organizations (multi-tenant)
- Rate Plans (professional pricing)
- Prices (daily rates separate from rooms)
- Inventory (availability tracking)
- Audit Logs (compliance)
- Idempotency keys (reliability)

### ✅ Kept (Your original approach)
- MongoDB database
- Simple JWT auth
- REST API only
- Direct implementation

### ❌ Skipped (Too complex for MVP)
- PostgreSQL migration
- Event Outbox + Kafka
- OAuth2/OIDC
- GraphQL
- PMS/OTA integration skeleton

### 🎯 Result
**Best of both worlds:** Professional hotel concepts + MongoDB flexibility + MVP speed

---

**Document Status:** Ready for Implementation  
**Next Step:** Updated API endpoints for new schema
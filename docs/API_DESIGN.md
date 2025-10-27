# TravelSync - API Design Document (Hybrid Schema)

## 🌐 API Overview

**API Type:** RESTful  
**Base URL:** `https://api.travelsync.io/v1`  
**Authentication:** JWT (JSON Web Tokens)  
**Response Format:** JSON  
**API Version:** v1  
**Database:** MongoDB (Hybrid Schema with Professional Hotel Concepts)

**Key Changes from Original:**
- Multi-tenant with Organizations
- Rate Plans + Prices (professional pricing)
- Inventory management
- Idempotency support
- Audit logging

---

## 🔐 Authentication

### Authentication Flow

```
1. POST /auth/register    → Create account
2. POST /auth/login       → Get access token
3. Use token in header    → Authorization: Bearer <token>
4. POST /auth/refresh     → Refresh expired token
5. POST /auth/logout      → Invalidate token
```

### Token Structure

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

**Token Payload:**
```json
{
  "user_id": "507f1f77bcf86cd799439011",
  "email": "user@hotel.com",
  "role": "hotel_admin",
  "hotel_id": "507f1f77bcf86cd799439012",
  "iat": 1635724800,
  "exp": 1635728400
}
```

---

## 📋 API Endpoints

### 🔒 Auth Endpoints

#### 1. Register New User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "admin@hotel.com",
  "password": "SecurePass123!",
  "first_name": "Max",
  "last_name": "Müller",
  "hotel_name": "Hotel Bergblick",
  "phone": "+49 89 1234567"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "user_id": "507f1f77bcf86cd799439011",
    "email": "admin@hotel.com",
    "hotel_id": "507f1f77bcf86cd799439012"
  }
}
```

#### 2. Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@hotel.com",
  "password": "SecurePass123!"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600,
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "admin@hotel.com",
      "first_name": "Max",
      "last_name": "Müller",
      "role": "hotel_admin",
      "hotel_id": "507f1f77bcf86cd799439012"
    }
  }
}
```

#### 3. Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 4. Logout
```http
POST /auth/logout
Authorization: Bearer <access_token>
```

---

### 🏨 Hotel Endpoints

#### 1. Get Hotel Profile
```http
GET /hotels/me
Authorization: Bearer <access_token>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "name": "Hotel Bergblick",
    "slug": "hotel-bergblick-munich",
    "email": "info@bergblick.de",
    "phone": "+49 89 1234567",
    "address": {
      "street": "Leopoldstraße 15",
      "city": "Munich",
      "country": "DE",
      "postal_code": "80802"
    },
    "star_rating": 4,
    "total_rooms": 25,
    "currency": "EUR",
    "subscription_tier": "pro",
    "subscription_status": "active"
  }
}
```

#### 2. Update Hotel Profile
```http
PATCH /hotels/me
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "phone": "+49 89 7654321",
  "amenities": ["wifi", "parking", "pool", "spa"],
  "check_in_time": "15:00",
  "check_out_time": "11:00"
}
```

#### 3. Upload Hotel Images
```http
POST /hotels/me/images
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

{
  "image": <file>,
  "is_primary": true,
  "alt": "Hotel Exterior View"
}
```

---

### 🏢 Organization Endpoints (NEW)

#### 1. Get Current Organization
```http
GET /organizations/me
Authorization: Bearer <access_token>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "type": "HOTEL",
    "name": "Hotel Bergblick",
    "country": "DE",
    "timezone": "Europe/Berlin",
    "currency": "EUR",
    "subscription": {
      "tier": "pro",
      "status": "active",
      "current_period_end": "2026-01-26T00:00:00Z"
    }
  }
}
```

#### 2. Update Organization Settings
```http
PATCH /organizations/me
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "language": "de",
  "date_format": "DD/MM/YYYY",
  "timezone": "Europe/Berlin"
}
```

---

### 🏨 Property Endpoints (Renamed from Hotel)

#### 1. Get All Properties
```http
GET /properties?page=1&limit=20
Authorization: Bearer <access_token>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "properties": [
      {
        "id": "507f1f77bcf86cd799439012",
        "organization_id": "507f1f77bcf86cd799439011",
        "name": "Hotel Bergblick",
        "code": "MUC-01",
        "address": {
          "street": "Leopoldstraße 15",
          "city": "Munich",
          "country": "DE",
          "postal_code": "80802"
        },
        "star_rating": 4,
        "total_rooms": 25,
        "currency": "EUR"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 1,
      "total_items": 1
    }
  }
}
```

#### 2. Create Property
```http
POST /properties
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Hotel Alpina",
  "code": "BER-02",
  "address": {
    "street": "Kurfürstendamm 50",
    "city": "Berlin",
    "country": "DE",
    "postal_code": "10707"
  },
  "star_rating": 4,
  "total_rooms": 45,
  "amenities": ["wifi", "parking", "gym", "spa"],
  "check_in_time": "15:00",
  "check_out_time": "11:00"
}
```

---

### 🛏️ Room Type Endpoints (Renamed from Room)

#### 1. Get All Room Types
```http
GET /properties/:propertyId/room-types
Authorization: Bearer <access_token>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "room_types": [
      {
        "id": "507f1f77bcf86cd799439013",
        "property_id": "507f1f77bcf86cd799439012",
        "code": "STD",
        "name": "Standard Room",
        "capacity": {
          "adults": 2,
          "children": 1,
          "total": 3
        },
        "bed_configuration": "1 King Bed",
        "size_sqm": 28,
        "total_quantity": 15,
        "amenities": ["balcony", "city_view", "wifi"],
        "is_active": true,
        "is_bookable": true
      },
      {
        "id": "507f1f77bcf86cd799439014",
        "code": "DLX",
        "name": "Deluxe Room",
        "capacity": {
          "adults": 2,
          "children": 2,
          "total": 4
        },
        "bed_configuration": "1 King + 1 Sofa Bed",
        "size_sqm": 35,
        "total_quantity": 8,
        "amenities": ["balcony", "mountain_view", "wifi", "minibar"]
      }
    ]
  }
}
```

#### 2. Create Room Type
```http
POST /properties/:propertyId/room-types
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "code": "SUI",
  "name": "Junior Suite",
  "capacity": {
    "adults": 4,
    "children": 2
  },
  "bed_configuration": "1 King + 2 Single Beds",
  "size_sqm": 55,
  "total_quantity": 3,
  "amenities": ["balcony", "mountain_view", "wifi", "minibar", "bathtub"],
  "extra_bed_available": true
}
```

#### 3. Update Room Type
```http
PATCH /properties/:propertyId/room-types/:roomTypeId
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "total_quantity": 4,
  "amenities": ["balcony", "mountain_view", "wifi", "minibar", "bathtub", "safe"]
}
```

---

### 💰 Rate Plan Endpoints (NEW)

#### 1. Get All Rate Plans
```http
GET /properties/:propertyId/rate-plans?is_active=true
Authorization: Bearer <access_token>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "rate_plans": [
      {
        "id": "507f1f77bcf86cd799439020",
        "property_id": "507f1f77bcf86cd799439012",
        "code": "BAR",
        "name": "Best Available Rate",
        "rate_type": "public",
        "meal_plan": "BB",
        "cancellation_policy": {
          "type": "flexible",
          "free_cancellation_until": 1,
          "penalty_percentage": 100,
          "no_show_penalty": 100
        },
        "is_active": true,
        "is_public": true
      },
      {
        "id": "507f1f77bcf86cd799439021",
        "code": "NRF",
        "name": "Non-Refundable Rate",
        "rate_type": "public",
        "meal_plan": "BB",
        "cancellation_policy": {
          "type": "non_refundable",
          "free_cancellation_until": 0,
          "penalty_percentage": 100,
          "no_show_penalty": 100
        },
        "is_derived": true,
        "base_rate_plan_id": "507f1f77bcf86cd799439020",
        "markup_percentage": -10
      }
    ]
  }
}
```

#### 2. Create Rate Plan
```http
POST /properties/:propertyId/rate-plans
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "code": "HB",
  "name": "Half Board Package",
  "rate_type": "package",
  "meal_plan": "HB",
  "cancellation_policy": {
    "type": "moderate",
    "free_cancellation_until": 3,
    "penalty_percentage": 50,
    "no_show_penalty": 100
  },
  "min_nights": 2,
  "is_active": true,
  "is_public": true
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Rate plan created successfully",
  "data": {
    "id": "507f1f77bcf86cd799439022",
    "code": "HB",
    "name": "Half Board Package",
    "meal_plan": "HB"
  }
}
```

#### 3. Update Rate Plan
```http
PATCH /properties/:propertyId/rate-plans/:ratePlanId
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "is_active": false,
  "valid_until": "2025-12-31"
}
```

---

### 💵 Price Endpoints (NEW)

#### 1. Get Prices for Date Range
```http
GET /properties/:propertyId/prices?room_type_id=:roomTypeId&rate_plan_id=:ratePlanId&date_from=2025-11-01&date_to=2025-11-30
Authorization: Bearer <access_token>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "prices": [
      {
        "id": "507f1f77bcf86cd799439030",
        "property_id": "507f1f77bcf86cd799439012",
        "room_type_id": "507f1f77bcf86cd799439013",
        "rate_plan_id": "507f1f77bcf86cd799439020",
        "date": "2025-11-01",
        "amount": 120.00,
        "currency": "EUR",
        "source": "MANUAL",
        "is_available": true
      },
      {
        "date": "2025-11-02",
        "amount": 120.00
      }
    ],
    "summary": {
      "min_price": 120.00,
      "max_price": 180.00,
      "avg_price": 142.50
    }
  }
}
```

#### 2. Bulk Update Prices
```http
PUT /properties/:propertyId/prices/bulk
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "room_type_id": "507f1f77bcf86cd799439013",
  "rate_plan_id": "507f1f77bcf86cd799439020",
  "date_from": "2025-12-01",
  "date_to": "2025-12-31",
  "amount": 135.00,
  "currency": "EUR",
  "source": "MANUAL"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Prices updated successfully",
  "data": {
    "updated_count": 31,
    "date_range": {
      "from": "2025-12-01",
      "to": "2025-12-31"
    }
  }
}
```

#### 3. Get AI Price Suggestions (Enhanced)
```http
POST /properties/:propertyId/prices/suggest
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "room_type_id": "507f1f77bcf86cd799439013",
  "rate_plan_id": "507f1f77bcf86cd799439020",
  "date_from": "2025-12-20",
  "date_to": "2025-12-27"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "date": "2025-12-20",
        "current_price": 120.00,
        "suggested_price": 156.00,
        "change_percentage": 30,
        "reasoning": "High season (Christmas) + Weekend premium",
        "confidence": 0.85,
        "applied_rules": [
          {
            "rule_name": "Christmas Premium",
            "adjustment": "+25%"
          },
          {
            "rule_name": "Weekend Boost",
            "adjustment": "+5%"
          }
        ],
        "market_data": {
          "occupancy_rate": 85,
          "demand_level": "high",
          "competitor_avg_price": 150.00
        }
      }
    ],
    "summary": {
      "total_revenue_increase": 528.00,
      "avg_suggested_price": 145.71
    }
  }
}
```

---

### 📦 Inventory Endpoints (NEW)

#### 1. Get Inventory for Date Range
```http
GET /properties/:propertyId/inventory?room_type_id=:roomTypeId&date_from=2025-11-01&date_to=2025-11-30
Authorization: Bearer <access_token>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "inventory": [
      {
        "id": "507f1f77bcf86cd799439040",
        "property_id": "507f1f77bcf86cd799439012",
        "room_type_id": "507f1f77bcf86cd799439013",
        "date": "2025-11-01",
        "allotment": 15,
        "sold": 8,
        "available": 7,
        "stop_sell": false,
        "closed": false
      },
      {
        "date": "2025-11-02",
        "allotment": 15,
        "sold": 12,
        "available": 3,
        "stop_sell": false
      }
    ],
    "summary": {
      "avg_occupancy_rate": 65.5,
      "total_available": 187
    }
  }
}
```

#### 2. Bulk Update Inventory
```http
PUT /properties/:propertyId/inventory/bulk
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "room_type_id": "507f1f77bcf86cd799439013",
  "date_from": "2025-12-01",
  "date_to": "2025-12-31",
  "allotment": 15,
  "stop_sell": false
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Inventory updated successfully",
  "data": {
    "updated_count": 31
  }
}
```

#### 3. Check Availability (Enhanced)
```http
POST /properties/:propertyId/availability/check
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "check_in": "2025-12-24",
  "check_out": "2025-12-27",
  "rooms": 2,
  "guests": {
    "adults": 4,
    "children": 2
  }
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "is_available": true,
    "available_room_types": [
      {
        "room_type_id": "507f1f77bcf86cd799439013",
        "room_type_name": "Standard Room",
        "available_quantity": 5,
        "rates": [
          {
            "rate_plan_id": "507f1f77bcf86cd799439020",
            "rate_plan_name": "Best Available Rate",
            "meal_plan": "BB",
            "total_price": 936.00,
            "price_per_night": 156.00,
            "currency": "EUR",
            "cancellation_policy": "flexible"
          },
          {
            "rate_plan_id": "507f1f77bcf86cd799439021",
            "rate_plan_name": "Non-Refundable Rate",
            "meal_plan": "BB",
            "total_price": 842.40,
            "price_per_night": 140.40,
            "currency": "EUR",
            "cancellation_policy": "non_refundable",
            "savings": 93.60
          }
        ]
      }
    ]
  }
}
```

---

### 📅 Reservation Endpoints (Updated)

#### 1. Get All Rooms
```http
GET /rooms?page=1&limit=20&room_type=double&is_active=true
Authorization: Bearer <access_token>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "rooms": [
      {
        "id": "507f1f77bcf86cd799439013",
        "room_number": "201",
        "room_type": "double",
        "floor": 2,
        "capacity": {
          "adults": 2,
          "children": 1,
          "total": 3
        },
        "base_price": 120,
        "bed_configuration": "1 King Bed",
        "size_sqm": 28,
        "amenities": ["balcony", "city_view", "wifi"],
        "is_active": true
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 2,
      "total_items": 25,
      "items_per_page": 20
    }
  }
}
```

#### 2. Create New Room
```http
POST /rooms
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "room_number": "301",
  "room_type": "suite",
  "floor": 3,
  "capacity": {
    "adults": 4,
    "children": 2
  },
  "base_price": 250,
  "bed_configuration": "1 King + 1 Queen Bed",
  "size_sqm": 45,
  "amenities": ["balcony", "city_view", "wifi", "minibar", "jacuzzi"]
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Room created successfully",
  "data": {
    "id": "507f1f77bcf86cd799439014",
    "room_number": "301",
    "room_type": "suite",
    "base_price": 250
  }
}
```

#### 3. Get Single Room
```http
GET /rooms/:roomId
Authorization: Bearer <access_token>
```

#### 4. Update Room
```http
PATCH /rooms/:roomId
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "base_price": 135,
  "amenities": ["balcony", "city_view", "wifi", "minibar"]
}
```

#### 5. Delete Room (Soft Delete)
```http
DELETE /rooms/:roomId
Authorization: Bearer <access_token>
```

#### 6. Check Room Availability
```http
GET /rooms/:roomId/availability?check_in=2025-11-15&check_out=2025-11-18
Authorization: Bearer <access_token>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "room_id": "507f1f77bcf86cd799439013",
    "is_available": false,
    "blocked_dates": [
      {
        "check_in": "2025-11-15",
        "check_out": "2025-11-18",
        "reason": "reserved",
        "reservation_id": "507f1f77bcf86cd799439020"
      }
    ]
  }
}
```

---

### 📅 Reservation Endpoints (Updated)

#### 1. Get All Reservations
```http
GET /reservations?page=1&limit=20&status=confirmed&check_in_from=2025-11-01&property_id=:propertyId
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `property_id` - Filter by property
- `status` (pending|confirmed|checked_in|checked_out|cancelled|no_show)
- `check_in_from` (YYYY-MM-DD)
- `check_in_to` (YYYY-MM-DD)
- `room_type_id` - Filter by room type
- `rate_plan_id` - Filter by rate plan
- `source` (DIRECT|PHONE|EMAIL|OTA|AGENCY)
- `guest_email` - Search by guest email

**Response 200:**
```json
{
  "success": true,
  "data": {
    "reservations": [
      {
        "id": "507f1f77bcf86cd799439020",
        "booking_reference": "BK-20251026-ABC123",
        "property": {
          "id": "507f1f77bcf86cd799439012",
          "name": "Hotel Bergblick"
        },
        "room_type": {
          "id": "507f1f77bcf86cd799439013",
          "code": "STD",
          "name": "Standard Room"
        },
        "rate_plan": {
          "id": "507f1f77bcf86cd799439020",
          "code": "BAR",
          "name": "Best Available Rate",
          "meal_plan": "BB"
        },
        "guest": {
          "name": "Hans Müller",
          "email": "hans@example.de",
          "phone": "+49 151 12345678",
          "country": "DE"
        },
        "check_in_date": "2025-11-15",
        "check_out_date": "2025-11-18",
        "nights": 3,
        "guests": {
          "adults": 2,
          "children": 0
        },
        "total_price": 360.00,
        "total_with_tax": 384.60,
        "currency": "EUR",
        "status": "confirmed",
        "source": "DIRECT",
        "created_at": "2025-10-26T10:30:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 87
    }
  }
}
```

#### 2. Create New Reservation (Enhanced)
```http
POST /reservations
Authorization: Bearer <access_token>
Idempotency-Key: unique-client-generated-key-12345
Content-Type: application/json

{
  "property_id": "507f1f77bcf86cd799439012",
  "room_type_id": "507f1f77bcf86cd799439013",
  "rate_plan_id": "507f1f77bcf86cd799439020",
  "guest": {
    "name": "Anna Schmidt",
    "email": "anna@example.de",
    "phone": "+49 151 98765432",
    "country": "DE",
    "special_requests": "Late check-in around 10 PM"
  },
  "check_in_date": "2025-12-01",
  "check_out_date": "2025-12-05",
  "guests": {
    "adults": 2,
    "children": 1
  },
  "source": "PHONE",
  "notes": "Customer called directly"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Reservation created successfully",
  "data": {
    "id": "507f1f77bcf86cd799439021",
    "booking_reference": "BK-20251026-XYZ789",
    "status": "pending",
    "total_price": 480.00,
    "total_with_tax": 513.60,
    "currency": "EUR",
    "meal_plan": "BB",
    "confirmation_email_sent": true,
    "inventory_updated": true
  }
}
```

**Error Response (Duplicate - Idempotency):**
```json
{
  "success": true,
  "message": "Reservation already exists (idempotency key matched)",
  "data": {
    "id": "507f1f77bcf86cd799439021",
    "booking_reference": "BK-20251026-XYZ789",
    "created_at": "2025-10-26T08:15:00Z"
  }
}
```

#### 3. Get Single Reservation
```http
GET /reservations/:reservationId
Authorization: Bearer <access_token>
```

**Response includes:**
- Full guest details
- Room type details
- Rate plan details
- Price breakdown
- Audit trail (who created, modified)

#### 4. Update Reservation
```http
PATCH /reservations/:reservationId
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "status": "confirmed",
  "notes": "Guest requested upper floor"
}
```

#### 5. Cancel Reservation
```http
POST /reservations/:reservationId/cancel
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "cancellation_reason": "Guest requested cancellation"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Reservation cancelled successfully",
  "data": {
    "id": "507f1f77bcf86cd799439021",
    "status": "cancelled",
    "cancelled_at": "2025-10-26T14:30:00Z"
  }
}
```

#### 6. Check-in Guest
```http
POST /reservations/:reservationId/check-in
Authorization: Bearer <access_token>
```

#### 7. Check-out Guest
```http
POST /reservations/:reservationId/check-out
Authorization: Bearer <access_token>
```

---

### 💰 Pricing Endpoints

#### 1. Get Pricing Rules
```http
GET /pricing-rules?is_active=true
Authorization: Bearer <access_token>
```

#### 2. Create Pricing Rule
```http
POST /pricing-rules
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "rule_name": "Weekend Premium",
  "rule_type": "day_of_week",
  "conditions": {
    "days": ["fri", "sat"]
  },
  "adjustment": {
    "type": "percentage",
    "value": 20,
    "direction": "increase"
  },
  "priority": 10,
  "is_active": true
}
```

#### 3. Get Dynamic Price Suggestion
```http
POST /pricing/suggest
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "room_id": "507f1f77bcf86cd799439013",
  "check_in_date": "2025-12-24",
  "check_out_date": "2025-12-26"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "room_id": "507f1f77bcf86cd799439013",
    "base_price": 120.00,
    "suggested_price": 156.00,
    "price_change_percentage": 30,
    "applied_rules": [
      {
        "rule_name": "Christmas Premium",
        "adjustment": "+30%"
      }
    ],
    "reasoning": "High season (Christmas) + Weekend premium",
    "occupancy_rate": 85,
    "market_demand": "high"
  }
}
```

---

### 📊 Analytics Endpoints

#### 1. Dashboard Overview
```http
GET /analytics/dashboard?date_from=2025-10-01&date_to=2025-10-31
Authorization: Bearer <access_token>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_reservations": 87,
      "total_revenue": 12450.00,
      "average_occupancy_rate": 68.5,
      "average_daily_rate": 143.10,
      "revenue_per_available_room": 98.06
    },
    "reservations_by_status": {
      "confirmed": 45,
      "checked_in": 12,
      "checked_out": 25,
      "cancelled": 5
    },
    "revenue_trend": [
      { "date": "2025-10-01", "revenue": 350.00 },
      { "date": "2025-10-02", "revenue": 480.00 }
    ],
    "top_room_types": [
      { "room_type": "double", "bookings": 35, "revenue": 5600.00 },
      { "room_type": "suite", "bookings": 12, "revenue": 4200.00 }
    ]
  }
}
```

#### 2. Occupancy Report
```http
GET /analytics/occupancy?date_from=2025-11-01&date_to=2025-11-30
Authorization: Bearer <access_token>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "total_rooms": 25,
    "total_days": 30,
    "total_room_nights": 750,
    "occupied_room_nights": 520,
    "occupancy_rate": 69.33,
    "daily_occupancy": [
      { "date": "2025-11-01", "occupied_rooms": 18, "occupancy_rate": 72 },
      { "date": "2025-11-02", "occupied_rooms": 16, "occupancy_rate": 64 }
    ]
  }
}
```

#### 3. Revenue Report
```http
GET /analytics/revenue?date_from=2025-11-01&date_to=2025-11-30&group_by=day
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `group_by` (day|week|month)

---

### 🔔 Notification Endpoints

#### 1. Get Notifications
```http
GET /notifications?is_read=false&limit=50
Authorization: Bearer <access_token>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "507f1f77bcf86cd799439030",
        "type": "reservation",
        "title": "New Reservation",
        "message": "New booking for Room 201 by Hans Müller",
        "link": "/reservations/507f1f77bcf86cd799439020",
        "is_read": false,
        "created_at": "2025-10-26T10:30:00Z"
      }
    ],
    "unread_count": 5
  }
}
```

#### 2. Mark as Read
```http
PATCH /notifications/:notificationId/read
Authorization: Bearer <access_token>
```

#### 3. Mark All as Read
```http
POST /notifications/mark-all-read
Authorization: Bearer <access_token>
```

---

### 👥 User Management Endpoints

#### 1. Get Hotel Staff
```http
GET /users?role=hotel_staff
Authorization: Bearer <access_token>
```

#### 2. Invite New Staff Member
```http
POST /users/invite
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "email": "staff@hotel.com",
  "first_name": "Maria",
  "last_name": "Weber",
  "role": "hotel_staff"
}
```

#### 3. Update User
```http
PATCH /users/:userId
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "first_name": "Maria",
  "phone": "+49 151 11111111"
}
```

#### 4. Deactivate User
```http
DELETE /users/:userId
Authorization: Bearer <access_token>
```

---

## 🚨 Error Responses

### Standard Error Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      },
      {
        "field": "check_in_date",
        "message": "Check-in date must be in the future"
      }
    ]
  }
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource (e.g., room already booked) |
| 422 | Unprocessable Entity | Business logic error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Maintenance mode |

### Common Error Codes

```typescript
enum ErrorCode {
  // Auth
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Business Logic
  ROOM_NOT_AVAILABLE = 'ROOM_NOT_AVAILABLE',
  RESERVATION_NOT_FOUND = 'RESERVATION_NOT_FOUND',
  CANNOT_CANCEL_CHECKED_IN = 'CANNOT_CANCEL_CHECKED_IN',
  
  // System
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR'
}
```

---

## 🔒 Rate Limiting

**Limits:**
- Authentication endpoints: 5 requests/minute
- Standard endpoints: 100 requests/minute
- Analytics endpoints: 20 requests/minute

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1635728400
```

---

## 🧪 Testing with Postman

### Environment Variables
```json
{
  "base_url": "http://localhost:5000/api/v1",
  "access_token": "{{dynamic_token}}",
  "hotel_id": "{{dynamic_hotel_id}}"
}
```

### Pre-request Script (Auto Token)
```javascript
// Auto-inject token from login response
if (pm.response.json().data?.access_token) {
  pm.environment.set("access_token", pm.response.json().data.access_token);
}
```

---

## 📝 API Versioning Strategy

**Current:** `/api/v1/...`  
**Future:** `/api/v2/...`

**Deprecation Policy:**
- Minimum 6 months notice
- Old version supported for 12 months
- Clear migration guides provided

---

## 🔐 Security Best Practices

1. **Always use HTTPS** in production
2. **Validate all inputs** server-side
3. **Never expose internal IDs** in errors
4. **Log all sensitive actions** (audit_logs)
5. **Implement CORS** properly
6. **Use helmet.js** for security headers
7. **Sanitize user inputs** against XSS/SQL injection

---

## 📚 API Documentation Tools

**Recommended:** Swagger/OpenAPI 3.0

```yaml
openapi: 3.0.0
info:
  title: TravelSync API
  version: 1.0.0
  description: Hotel automation platform API
servers:
  - url: https://api.travelsync.io/v1
    description: Production
  - url: http://localhost:5000/api/v1
    description: Development
```

---

**Document Status:** Ready for Implementation  
**Last Updated:** October 26, 2025  
**Next Step:** Technology Stack Documentation
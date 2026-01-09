# 🎯 TravelSync - Controllers & Services

**Status:** ✅ Complete  
**Architecture:** MVC + Service Layer  
**DRY Principle:** ✅ Implemented

---

## 📁 Proje Yapısı

```
src/
├── controllers/
│   ├── base.controller.js           ✅ DRY Base Controller
│   ├── organization.controller.js   ✅ Simple CRUD
│   ├── user.controller.js           ✅ Simple CRUD + Auth
│   ├── property.controller.js       ✅ Simple CRUD
│   ├── roomType.controller.js       ✅ Simple CRUD
│   ├── ratePlan.controller.js       ✅ Simple CRUD
│   ├── price.controller.js          ✅ Complex + Bulk Operations
│   ├── inventory.controller.js      ✅ Complex + Availability
│   ├── reservation.controller.js    ✅ Complex + Service Layer
│   └── index.js                     ✅ Exports
│
└── services/
    └── reservation.service.js       ✅ Business Logic
```

---

## 🎨 Architecture Pattern

### BaseController (DRY)

Tüm controller'lar `BaseController`'ı extend eder. Bu sayede:

- ✅ CRUD operations tek yerden yönetiliyor
- ✅ Error handling standardize
- ✅ Pagination otomatik
- ✅ Soft delete built-in
- ✅ Audit logging otomatik

```javascript
class MyController extends BaseController {
  constructor() {
    super(Model, 'model_name');
    this.searchFields = ['name', 'code'];
    this.populateFields = 'relation_field';
  }
  
  // Custom validations
  validateCreate = async (data) => { ... }
  validateUpdate = async (data, existing) => { ... }
  
  // Custom endpoints
  myCustomEndpoint = async (req, res) => { ... }
}
```

---

## 📦 Controller'lar

### 1️⃣ Organization Controller

**Endpoint Base:** `/api/v1/organizations`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all organizations |
| GET | `/:id` | Get organization by ID |
| POST | `/` | Create organization |
| PUT | `/:id` | Update organization |
| DELETE | `/:id` | Soft delete organization |
| GET | `/:id/stats` | Get statistics |
| PUT | `/:id/subscription` | Update subscription |
| GET | `/active` | Get active organizations |

**Features:**
- Multi-tenant container
- Subscription management
- Statistics

---

### 2️⃣ User Controller

**Endpoint Base:** `/api/v1/users`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all users |
| GET | `/:id` | Get user by ID |
| POST | `/` | Create user |
| PUT | `/:id` | Update user |
| DELETE | `/:id` | Soft delete user |
| PUT | `/:id/password` | Update password |
| PUT | `/:id/role` | Update role |
| GET | `/:id/permissions` | Check permission |
| GET | `/organization` | Get users by organization |

**Features:**
- Password hashing (bcrypt)
- Role-based access control
- Permission checking
- Password update

---

### 3️⃣ Property Controller

**Endpoint Base:** `/api/v1/properties`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all properties |
| GET | `/:id` | Get property by ID |
| POST | `/` | Create property |
| PUT | `/:id` | Update property |
| DELETE | `/:id` | Soft delete property |
| GET | `/city/:city` | Get by city |
| GET | `/country/:country` | Get by country |
| GET | `/rating/:rating` | Get by star rating |
| PUT | `/:id/amenities` | Update amenities |
| GET | `/:id/address` | Get full address |
| GET | `/:id/stats` | Get statistics |

**Features:**
- Location filtering
- Amenities management
- Star rating
- Statistics

---

### 4️⃣ RoomType Controller

**Endpoint Base:** `/api/v1/room-types`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all room types |
| GET | `/:id` | Get room type by ID |
| POST | `/` | Create room type |
| PUT | `/:id` | Update room type |
| DELETE | `/:id` | Soft delete room type |
| GET | `/property/:propertyId` | Get by property |
| GET | `/property/:propertyId/bookable` | Get bookable types |
| PUT | `/:id/toggle-active` | Toggle active status |
| PUT | `/:id/toggle-bookable` | Toggle bookable status |
| PUT | `/:id/amenities` | Update amenities |
| GET | `/:id/stats` | Get statistics |

**Features:**
- Capacity management
- Bookability control
- Amenities
- Statistics

---

### 5️⃣ RatePlan Controller

**Endpoint Base:** `/api/v1/rate-plans`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all rate plans |
| GET | `/:id` | Get rate plan by ID |
| POST | `/` | Create rate plan |
| PUT | `/:id` | Update rate plan |
| DELETE | `/:id` | Soft delete rate plan |
| GET | `/property/:propertyId` | Get by property |
| GET | `/property/:propertyId/public` | Get public plans |
| GET | `/base/:baseRatePlanId/derived` | Get derived plans |
| PUT | `/:id/toggle-active` | Toggle active status |
| PUT | `/:id/toggle-public` | Toggle public status |
| GET | `/:id/check-validity` | Check validity for date |
| PUT | `/:id/cancellation-policy` | Update cancellation policy |
| GET | `/:id/stats` | Get statistics |

**Features:**
- Derived rates (BAR → NRF)
- Meal plans
- Cancellation policies
- Validity checks

---

### 6️⃣ Price Controller

**Endpoint Base:** `/api/v1/prices`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all prices |
| GET | `/:id` | Get price by ID |
| POST | `/` | Create price |
| PUT | `/:id` | Update price |
| DELETE | `/:id` | Soft delete price |
| GET | `/:propertyId/:roomTypeId/:ratePlanId/range` | Get for date range |
| GET | `/:propertyId/:roomTypeId/:ratePlanId/summary` | Get price summary |
| POST | `/bulk-upsert` | Bulk upsert prices |
| PUT | `/:propertyId/:roomTypeId/:ratePlanId/bulk-update` | Bulk update date range |
| GET | `/:propertyId/:roomTypeId/:ratePlanId/date` | Get for specific date |
| GET | `/property/:propertyId` | Get by property |
| DELETE | `/:propertyId/:roomTypeId/:ratePlanId/range` | Delete date range |

**Features:**
- Daily rate management
- Bulk operations
- Date range queries
- Price summary (min, max, avg)

---

### 7️⃣ Inventory Controller

**Endpoint Base:** `/api/v1/inventory`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all inventory |
| GET | `/:id` | Get inventory by ID |
| POST | `/` | Create inventory |
| PUT | `/:id` | Update inventory |
| DELETE | `/:id` | Soft delete inventory |
| GET | `/:propertyId/:roomTypeId/range` | Get for date range |
| GET | `/:propertyId/:roomTypeId/availability` | Check availability |
| PUT | `/:propertyId/:roomTypeId/bulk-update` | Bulk update |
| POST | `/:propertyId/:roomTypeId/increment-sold` | Increment sold |
| POST | `/:propertyId/:roomTypeId/decrement-sold` | Decrement sold |
| PUT | `/:propertyId/:roomTypeId/toggle-stop-sell` | Toggle stop sell |
| GET | `/:propertyId/:roomTypeId/date` | Get for specific date |
| GET | `/:propertyId/:roomTypeId/calendar` | Get availability calendar |

**Features:**
- Real-time availability
- Sold tracking
- Stop sell management
- Bulk operations
- Calendar view

---

### 8️⃣ Reservation Controller

**Endpoint Base:** `/api/v1/reservations`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all reservations |
| GET | `/:id` | Get reservation by ID |
| POST | `/` | Create reservation |
| PUT | `/:id` | Update reservation |
| DELETE | `/:id` | Soft delete reservation |
| POST | `/:id/cancel` | Cancel reservation |
| POST | `/:id/check-in` | Check-in guest |
| POST | `/:id/check-out` | Check-out guest |
| GET | `/today/check-ins` | Get today's arrivals |
| GET | `/today/check-outs` | Get today's departures |
| GET | `/status/:status` | Get by status |
| GET | `/date-range` | Get by date range |
| GET | `/reference/:bookingReference` | Get by booking reference |
| GET | `/stats` | Get statistics |

**Features:**
- Availability checking
- Price calculation
- Inventory management
- Status tracking
- Check-in/out
- Cancellation

**Service Layer:**
- `reservation.service.js` handles complex business logic

---

## 🔐 Authentication & Authorization

### Authentication Middleware

```javascript
const { authenticate } = require('../middlewares/auth.middleware');

// Protect route
router.get('/', authenticate, controller.getAll);
```

### Authorization Middleware

```javascript
const { authorize, checkPermission } = require('../middlewares/auth.middleware');

// Role-based
router.post('/', authenticate, authorize('admin'), controller.create);

// Permission-based
router.post('/', authenticate, checkPermission('reservations', 'create'), controller.create);
```

---

## 📊 Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "pages": 10,
      "limit": 10
    }
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "details": "Additional details"
  }
}
```

---

## 🎯 Pagination

Tüm GET endpoints pagination destekler:

```
GET /api/v1/resources?page=1&limit=10&sort=-created_at
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sort`: Sort field (prefix with `-` for descending)
- `search`: Search query (searches in searchFields)

---

## 🔍 Filtering

Tüm query parameters otomatik filter olarak kullanılır:

```
GET /api/v1/properties?star_rating=5&country=DE
```

---

## 🚀 Kurulum

### 1. Dosyaları Kopyala

```bash
# Controllers
cp base.controller.js src/controllers/
cp organization.controller.js src/controllers/
cp user.controller.js src/controllers/
cp property.controller.js src/controllers/
cp roomType.controller.js src/controllers/
cp ratePlan.controller.js src/controllers/
cp price.controller.js src/controllers/
cp inventory.controller.js src/controllers/
cp reservation.controller.js src/controllers/
cp index.js src/controllers/

# Services
mkdir -p src/services
cp reservation.service.js src/services/
```

### 2. Dependencies

Zaten yüklü olmalı:

```json
{
  "bcrypt": "^5.1.1",
  "mongoose": "^8.0.0"
}
```

### 3. Test Et

```bash
npm run dev
```

---

## 🧪 Örnek Kullanım

### Organization Controller

```javascript
// Import
const { organizationController } = require('./controllers');

// Use in route
router.get('/', authenticate, organizationController.getAll);
```

### Custom Validation

```javascript
class MyController extends BaseController {
  validateCreate = async (data) => {
    if (data.email && !data.email.includes('@')) {
      return 'Invalid email format';
    }
    return null;
  };
}
```

### Custom Endpoint

```javascript
class MyController extends BaseController {
  myEndpoint = async (req, res) => {
    try {
      // Your logic here
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
}
```

---

## ✅ Checklist

Backend hazır mı?

- [x] Base controller oluşturuldu
- [x] 8 adet controller oluşturuldu
- [x] 1 adet service oluşturuldu
- [x] Index file hazır
- [x] DRY principle uygulandı
- [x] Error handling standardize edildi
- [x] Pagination implemented
- [x] Soft delete implemented
- [x] Audit logging implemented

**Sıradaki Adım:** Routes oluştur! 🛣️

---

## 📝 Notlar

### BaseController Features

- ✅ Automatic CRUD operations
- ✅ Pagination & filtering
- ✅ Search functionality
- ✅ Soft delete
- ✅ Audit logging
- ✅ Multi-tenant support
- ✅ Error handling
- ✅ Validation hooks

### Service Layer

Sadece **complex business logic** için kullanılır:

- ✅ Reservation (availability, pricing, inventory)
- ⏳ Price (AI suggestions - optional)
- ⏳ Analytics (reporting - optional)

**Simple CRUD** için service layer gereksiz!

---

## 🎉 Tamamlandı!

Tüm controller'lar hazır ve best practice'lere uygun!

**Sıradaki adımlar:**
1. ✅ Controllers - DONE!
2. ⏳ Routes - Tüm endpoint'leri tanımla
3. ⏳ Middlewares - Validation, permissions
4. ⏳ Testing - Postman collection

Hazırsan routes'a geçelim! 🚀
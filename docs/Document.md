# 🚀 TravelSync - Hızlı Referans (Güncel)

**Tarih:** 26 Ekim 2025  
**Sprint:** 1 - Week 1  
**Durum:** Backend hazır, Model'ler çalışıyor ✅

---

## ⚡ HIZLI BAŞLANGIÇ

### Proje Çalıştır

```bash
cd travelsync-backend
npm run dev
```

**Göreceksin:**
```
✅ MongoDB connected successfully
🏨 TravelSync API Server
Port: 5000
```

### Test Et

```bash
# Model'leri test et
node src/test-models.js

# Health check
curl http://localhost:5000/health
```

---

## 📚 GÜNCEL DOKÜMANLAR

### 🎯 Mutlaka Oku

| Dosya | Ne İçin | Link |
|-------|---------|------|
| **MODELS_GUIDE.md** | Model kullanımı, examples | [Aç](computer:///mnt/user-data/outputs/MODELS_GUIDE.md) |
| **DATABASE_SCHEMA_HYBRID.md** | Tüm collection'lar, fields | [Aç](computer:///mnt/user-data/outputs/DATABASE_SCHEMA_HYBRID.md) |
| **database-erd.html** | Visual ERD diagram | [Aç](computer:///mnt/user-data/outputs/database-erd.html) |

### 📖 Referans

| Dosya | Ne İçin | Link |
|-------|---------|------|
| API_DESIGN.md | Endpoint'ler, request/response | [Aç](computer:///mnt/user-data/outputs/API_DESIGN.md) |
| ROADMAP.md | 14 haftalık plan | [Aç](computer:///mnt/user-data/outputs/ROADMAP.md) |
| BACKEND_SETUP_GUIDE.md | Kurulum adımları | [Aç](computer:///mnt/user-data/outputs/BACKEND_SETUP_GUIDE.md) |

---

## 🏗️ PROJE YAPISI

```
travelsync-backend/
├── src/
│   ├── config/
│   │   └── database.js           ✅ MongoDB bağlantısı
│   ├── helpers/
│   │   ├── passwordEncrypt.js    ✅ Password hash
│   │   └── emailValidation.js    ✅ Email validation
│   ├── models/                   ✅ 9 model hazır
│   │   ├── Organization.js
│   │   ├── User.js
│   │   ├── Property.js
│   │   ├── RoomType.js
│   │   ├── RatePlan.js
│   │   ├── Price.js
│   │   ├── Inventory.js
│   │   ├── Reservation.js
│   │   └── AuditLog.js
│   ├── server.js                 ✅ Express app
│   └── test-models.js            ✅ Test script
├── .env                          ✅ Environment vars
├── package.json                  ✅ Dependencies
└── nodemon.json                  ✅ Dev config
```

---

## 💻 MODEL'LER (9 adet)

### 1. Organization - Multi-tenant

```javascript
const { Organization } = require('./models');

const org = await Organization.create({
  type: 'HOTEL',
  name: 'Hotel Bergblick',
  country: 'DE',
  timezone: 'Europe/Berlin',
  currency: 'EUR',
});
```

### 2. User - Staff

```javascript
const user = await User.create({
  organization_id: org._id,
  email: 'admin@hotel.com',
  password: 'secret123', // Auto-hashed
  first_name: 'Hans',
  last_name: 'Müller',
  role: 'admin',
});
```

### 3. Property - Hotels

```javascript
const property = await Property.create({
  organization_id: org._id,
  name: 'Hotel Bergblick Munich',
  code: 'MUC-01',
  address: {
    street: 'Leopoldstraße 15',
    city: 'Munich',
    country: 'DE',
  },
  star_rating: 4,
  total_rooms: 25,
});
```

### 4. RoomType - Templates

```javascript
const roomType = await RoomType.create({
  property_id: property._id,
  code: 'STD',
  name: 'Standard Room',
  capacity: { adults: 2, children: 1 },
  total_quantity: 15,
});
```

### 5. RatePlan - Pricing

```javascript
const ratePlan = await RatePlan.create({
  property_id: property._id,
  code: 'BAR',
  name: 'Best Available Rate',
  meal_plan: 'BB',
  cancellation_policy: {
    type: 'flexible',
    free_cancellation_until: 1,
  },
});
```

### 6. Price - Daily Rates

```javascript
await Price.create({
  property_id: property._id,
  room_type_id: roomType._id,
  rate_plan_id: ratePlan._id,
  date: new Date('2025-12-01'),
  amount: 120.00,
  currency: 'EUR',
});

// Bulk update
await Price.bulkUpdatePrices(
  property._id,
  roomType._id,
  ratePlan._id,
  startDate,
  endDate,
  135.00
);
```

### 7. Inventory - Availability

```javascript
await Inventory.create({
  property_id: property._id,
  room_type_id: roomType._id,
  date: new Date('2025-12-01'),
  allotment: 15,
  sold: 0,
  // available: 15 (auto-calculated)
});

// Check availability
const available = await Inventory.checkAvailability(
  property._id,
  roomType._id,
  checkIn,
  checkOut,
  2 // rooms needed
);
```

### 8. Reservation - Bookings

```javascript
const reservation = await Reservation.create({
  property_id: property._id,
  room_type_id: roomType._id,
  rate_plan_id: ratePlan._id,
  created_by_user_id: user._id,
  guest: {
    name: 'Anna Schmidt',
    email: 'anna@example.de',
    phone: '+49 151 12345678',
  },
  check_in_date: new Date('2025-12-24'),
  check_out_date: new Date('2025-12-27'),
  guests: { adults: 2, children: 1 },
  total_price: 375.00,
  // booking_reference: auto-generated
  // nights: auto-calculated
});

// Actions
await reservation.confirm();
await reservation.checkIn();
await reservation.checkOut();
await reservation.cancel('reason');
```

### 9. AuditLog - Tracking

```javascript
await AuditLog.logAction({
  organization_id: org._id,
  user_id: user._id,
  action: 'CREATE',
  entity_type: 'reservation',
  entity_id: reservation._id,
  changes: { before: null, after: {...} },
});
```

---

## 🎯 SONRAKI ADIMLAR

### Şimdi Yapılacak (Auth System)

1. **JWT Utilities** (15 dk)
   - `src/utils/jwt.util.js`
   - Token generation/verification

2. **Auth Middleware** (10 dk)
   - `src/middlewares/auth.middleware.js`
   - Protect routes

3. **Auth Controller** (20 dk)
   - `src/controllers/auth.controller.js`
   - Register, Login, Logout logic

4. **Auth Routes** (15 dk)
   - `src/routes/auth.routes.js`
   - POST /auth/register
   - POST /auth/login
   - GET /auth/me

**Toplam:** ~1 saat

---

## 🔧 YAYIN BİLGİLERİ

### Environment Variables (.env)

```env
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/travelsync

# JWT
JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-secret-here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Bcrypt
BCRYPT_ROUNDS=12
```

### Scripts (package.json)

```json
{
  "dev": "nodemon",
  "start": "node src/server.js"
}
```

---

## 📊 İLERLEME

```
Sprint 1 - Week 1
█████░░░░░░░░░░░░░░░ 25%

Tamamlanan:
✅ Proje planlama
✅ Backend kurulum
✅ Database schema
✅ 9 Model oluşturuldu
✅ Model'ler test edildi

Sıradaki:
⏳ Auth system
⏳ Routes & Controllers
⏳ API testing
```

---

## 💡 HIZLI KOMUTLAR

```bash
# Proje çalıştır
npm run dev

# Model test
node src/test-models.js

# MongoDB Compass
# Connection: mongodb://localhost:27017

# Health check
curl http://localhost:5000/health

# Logs temizle (terminal)
clear # veya cls (Windows)
```

---

## 🆘 SORUN GİDERME

### MongoDB bağlanamıyor

```bash
# Docker container kontrol
docker ps

# Yoksa başlat
docker start travelsync-mongo

# Veya yeni oluştur
docker run -d --name travelsync-mongo -p 27017:27017 mongo:7.0
```

### Port zaten kullanımda

```env
# .env dosyasında port değiştir
PORT=5001
```

### Model'ler import edilemiyor

```bash
# Dosya yolunu kontrol et
ls src/models/

# index.js var mı?
cat src/models/index.js
```

---

## 📞 YARDIM

**Dokümanlarda ara:**
- Model kullanımı → MODELS_GUIDE.md
- API endpoints → API_DESIGN.md
- Database schema → DATABASE_SCHEMA_HYBRID.md
- Kurulum → BACKEND_SETUP_GUIDE.md

**Sonraki adım:**
Auth system oluşturalım mı? Söyle başlayalım! 🚀
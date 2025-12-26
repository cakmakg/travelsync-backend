# 🧹 Code Refactoring Plan - Temiz Kod ve Best Practices

**Tarih:** 26 Ekim 2025  
**Durum:** 📋 Planlama aşaması  
**Hedef:** Clean Code, DRY, Node.js Best Practices

---

## 📊 MEVCUT DURUM ANALİZİ

### ❌ Tespit Edilen Sorunlar

#### 1. **Tekrarlanan Kod (DRY İhlali)**
- ✅ Response formatting her controller'da tekrar ediyor
- ✅ Error handling her controller'da tekrar ediyor
- ✅ Validation logic tekrarlanıyor
- ✅ Try-catch blokları her yerde aynı
- ✅ Status code'lar manuel yazılıyor

#### 2. **Uzun Controller Dosyaları**
- ❌ `reservation.js` - 475 satır
- ❌ `user.js` - 443 satır
- ❌ `agency.js` - 321 satır
- ❌ `agencyContract.js` - 327 satır

#### 3. **Eksik Helper Functions**
- ❌ Response helper yok
- ❌ Error handler middleware yok
- ❌ Validation middleware yok
- ❌ Query builder helper yok

#### 4. **Dosya Yapısı Karışık**
- ❌ `helper/` ve `utils/` ayrı (birleştirilmeli)
- ❌ `service/` ve `services/` ayrı (birleştirilmeli)
- ❌ Helper dosyaları düzensiz

#### 5. **Error Handling Tutarsız**
- ❌ Bazı yerlerde `res.status(500).json(...)`
- ❌ Bazı yerlerde `res.status(400).json(...)`
- ❌ Error message formatları farklı

#### 6. **Validation Eksik**
- ❌ Controller'larda manuel validation
- ❌ Validation middleware yok
- ❌ Validation helper yok

---

## 🎯 REFACTORING PLANI

### Phase 1: Helper Functions & Utilities (Öncelik: YÜKSEK)

#### 1.1. Response Helper
**Dosya:** `src/utils/response.js`

**İçerik:**
- `success()` - Success response
- `error()` - Error response
- `created()` - 201 Created response
- `notFound()` - 404 Not Found response
- `badRequest()` - 400 Bad Request response
- `unauthorized()` - 401 Unauthorized response
- `forbidden()` - 403 Forbidden response

**Kullanım:**
```javascript
// Önceki:
res.status(200).json({
  success: true,
  data: items,
  pagination: { ... }
});

// Sonraki:
return res.success(items, { pagination: { ... } });
```

#### 1.2. Error Handler Middleware
**Dosya:** `src/middlewares/errorHandler.js`

**İçerik:**
- Centralized error handling
- Error logging
- Error response formatting
- Development vs Production error messages

**Kullanım:**
```javascript
// Önceki:
try {
  // code
} catch (error) {
  res.status(500).json({ success: false, error: { message: error.message } });
}

// Sonraki:
// Try-catch gerekmez, errorHandler middleware yakalar
```

#### 1.3. Validation Helper
**Dosya:** `src/utils/validation.js`

**İçerik:**
- Common validation functions
- MongoDB ID validation
- Email validation
- Date validation
- etc.

#### 1.4. Query Builder Helper
**Dosya:** `src/utils/queryBuilder.js`

**İçerik:**
- Pagination helper
- Filter helper
- Search helper
- Sort helper

---

### Phase 2: Middleware'ler (Öncelik: YÜKSEK)

#### 2.1. Error Handler Middleware
**Dosya:** `src/middlewares/errorHandler.js`

#### 2.2. Validation Middleware
**Dosya:** `src/middlewares/validation.js`

**İçerik:**
- Request validation
- Schema validation
- Parameter validation

#### 2.3. Async Handler Middleware
**Dosya:** `src/middlewares/asyncHandler.js`

**İçerik:**
- Async function wrapper
- Automatic error catching

#### 2.4. Security Middleware (NEW)
**Dosya:** `src/middlewares/security.js` (optional)

**İçerik & Recommendations:**
- `helmet()` to add secure headers (HSTS, CSP basics)
- Rate limiting with `express-rate-limit` (use Redis-backed store for production counters; env-driven limits: `RATE_LIMIT_WINDOW`, `RATE_LIMIT_MAX`)
- Input sanitization: `express-mongo-sanitize` to prevent NoSQL injection, and `xss-clean` to mitigate XSS
- Enforce HTTPS redirection in production and set secure cookie flags (`SameSite`, `secure`)
- Centralize CORS config (whitelist) in `src/server.js` using `CORS_ORIGIN` env

**Usage:**
- Add `app.use(security());` early in the middleware chain
- Document configuration in `ENVIRONMENT.md` (or README)

**Testing:**
- Add automated tests for rate-limit enforcement, header presence, and sanitization edge cases
- Include `npm audit` and optional Snyk checks in CI

*Rationale: centralizing security middleware reduces duplication and ensures consistent protection across endpoints.*

**Kullanım:**
```javascript
// Önceki:
getAll: async (req, res) => {
  try {
    // code
  } catch (error) {
    // error handling
  }
}

// Sonraki:
getAll: asyncHandler(async (req, res) => {
  // code (try-catch gerekmez)
})
```

---

### Phase 3: Controller Refactoring (Öncelik: ORTA)

#### 3.1. BaseController İyileştirme
**Dosya:** `src/controllers/base.js`

**İyileştirmeler:**
- Response helper kullan
- Error handler middleware kullan
- Async handler kullan
- Kod kısaltma

#### 3.2. Controller'ları Kısaltma
**Hedef:**
- Her controller max 200 satır
- Complex logic service layer'a taşı
- Custom endpoints sadeleştir

#### 3.3. Controller Method'ları Bölme
**Örnek:**
```javascript
// Önceki: reservation.js - 475 satır
// Sonraki:
// - reservation.controller.js (100 satır) - CRUD
// - reservation.actions.js (150 satır) - Custom actions (checkIn, checkOut, cancel)
```

---

### Phase 4: Service Layer Refactoring (Öncelik: ORTA)

#### 4.1. Base Service
**Dosya:** `src/services/base.service.js`

**İçerik:**
- Common service methods
- Transaction helper
- Error handling

#### 4.2. Service'leri Bölme
**Örnek:**
```javascript
// Önceki: reservation.service.js - 531 satır
// Sonraki:
// - reservation.service.js (200 satır) - Core logic
// - reservation.validation.service.js (100 satır) - Validation
// - reservation.calculation.service.js (100 satır) - Price/commission calculation
```

---

### Phase 5: Dosya Yapısı Düzenleme (Öncelik: DÜŞÜK)

#### 5.1. Helper/Utils Birleştirme
**Önceki:**
```
src/
├── helper/
│   ├── Emailvalidation.js
│   └── Passwordencrypt.js
└── utils/
    └── jwt.js
```

**Sonraki:**
```
src/
└── utils/
    ├── jwt.js
    ├── email.js
    ├── password.js
    ├── response.js
    ├── validation.js
    └── queryBuilder.js
```

#### 5.2. Service Klasörü Düzenleme
**Önceki:**
```
src/
├── service/ (boş)
└── services/
    └── reservation.service.js
```

**Sonraki:**
```
src/
└── services/
    ├── base.service.js
    ├── reservation.service.js
    └── ...
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Helper Functions ✅
- [ ] Response helper oluştur
- [ ] Error handler middleware oluştur
- [ ] Validation helper oluştur
- [ ] Query builder helper oluştur
- [ ] Test et

### Phase 2: Middleware'ler ✅
- [ ] Error handler middleware
- [ ] Validation middleware
- [ ] Async handler middleware
- [ ] server.js'e ekle
- [ ] Test et

### Phase 3: Controller Refactoring ✅
- [ ] BaseController'ı iyileştir
- [ ] Response helper kullan
- [ ] Async handler kullan
- [ ] Controller'ları kısalt
- [ ] Test et

### Phase 4: Service Layer Refactoring ✅
- [ ] Base service oluştur
- [ ] Service'leri böl
- [ ] Transaction helper ekle
- [ ] Test et

### Phase 5: Dosya Yapısı Düzenleme ✅
- [ ] Helper/Utils birleştir
- [ ] Service klasörü düzenle
- [ ] Eski dosyaları temizle
- [ ] Test et

---

## 🚀 BAŞLANGIÇ ADIMLARI

### Adım 1: Response Helper Oluştur (EN ÖNEMLİ)

**Neden?**
- Tüm controller'larda response formatting tekrar ediyor
- 313 adet `res.status().json()` kullanımı var
- Standart response formatı yok

**Fayda:**
- Kod tekrarını %80 azaltır
- Response formatı standardize olur
- Bakım kolaylaşır

### Adım 2: Error Handler Middleware

**Neden?**
- Tüm controller'larda try-catch tekrar ediyor
- Error handling tutarsız
- Error logging merkezi değil

**Fayda:**
- Try-catch bloklarını kaldırır
- Error handling standardize olur
- Error logging merkezi olur

### Adım 3: Async Handler Middleware

**Neden?**
- Async function'lar için try-catch gerekiyor
- Kod tekrarı var

**Fayda:**
- Try-catch bloklarını kaldırır
- Kod temizlenir

---

## 📊 BEKLENEN SONUÇLAR

### Kod Satırı Azalması
- **Reservation Controller:** 475 → ~200 satır (%58 azalma)
- **User Controller:** 443 → ~200 satır (%55 azalma)
- **Agency Controller:** 321 → ~150 satır (%53 azalma)

### Kod Tekrarı Azalması
- **Response formatting:** %80 azalma
- **Error handling:** %90 azalma
- **Validation:** %70 azalma

### Bakım Kolaylığı
- ✅ Standart response formatı
- ✅ Merkezi error handling
- ✅ Merkezi validation
- ✅ Temiz kod yapısı

---

## 🎯 ÖNCELİK SIRASI

1. **Response Helper** (1 saat) - EN ÖNEMLİ
2. **Error Handler Middleware** (1 saat)
3. **Async Handler Middleware** (30 dakika)
4. **Controller Refactoring** (2-3 saat)
5. **Service Refactoring** (2-3 saat)
6. **Dosya Yapısı Düzenleme** (1 saat)

**Toplam Süre:** ~8-10 saat

---

## 📝 NOTLAR

### Node.js Best Practices
- ✅ Express.js async/await pattern
- ✅ Error handling middleware
- ✅ Response formatting helper
- ✅ Validation middleware
- ✅ Service layer separation
- ✅ DRY principle

### Clean Code Principles
- ✅ Single Responsibility Principle
- ✅ Don't Repeat Yourself (DRY)
- ✅ Keep It Simple, Stupid (KISS)
- ✅ You Aren't Gonna Need It (YAGNI)

---

**Durum:** 📋 Plan hazır, implementation'a başlanabilir  
**Sonraki:** Response Helper oluştur! 🚀


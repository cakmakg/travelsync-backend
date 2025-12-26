# 🔍 Otel-Agency İlişki Analizi ve Mantık Hataları

**Tarih:** 26 Ekim 2025  
**Durum:** ⚠️ Mantık hataları tespit edildi

---

## 📊 MEVCUT DURUM

### ✅ Doğru Olanlar

1. **Organization Model** ✅
   - `type: ['HOTEL', 'AGENCY']` - Multi-tenant yapı doğru
   - Hotel'ler ve Agency'ler ayrı organization'lar

2. **Property Model** ✅
   - `organization_id` var - Property bir HOTEL organization'ına ait
   - Property = Otel (sadece isim farklı)

3. **Agency Model** ✅
   - `organization_id` var - Agency bir AGENCY organization'ına ait
   - Commission ayarları var (default_percentage, property_rates)

4. **AgencyContract Model** ✅
   - `property_id` ve `agency_id` var
   - Commission, allotment, payment terms var

---

## ❌ MANTIK HATALARI

### 1. Reservation Model - Gereksiz `organization_id`

**Sorun:**
```javascript
// Reservation.js
organization_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Organization',
  default: null,
  comment: 'If booking is made by an agency',
},
agency_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Agency',
  index: true,
},
```

**Problem:**
- `organization_id` ve `agency_id` aynı anda var
- Hangisi kullanılmalı? Karışıklık yaratıyor
- `organization_id` gereksiz çünkü:
  - Agency booking: `agency_id` → Agency → `organization_id` (agency'nin org'u)
  - Direct booking: `property_id` → Property → `organization_id` (hotel'in org'u)

**Çözüm:**
- `organization_id` kaldırılmalı
- Organization ID'yi computed property olarak al:
  - Agency booking: `agency.organization_id`
  - Direct booking: `property.organization_id`

---

### 2. AgencyContract Model - Gereksiz `organization_id`

**Sorun:**
```javascript
// AgencyContract.js
organization_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Organization',
  required: [true, 'Organization ID is required'],
  index: true,
},
property_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Property',
  required: [true, 'Property ID is required'],
  index: true,
},
agency_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Agency',
  required: [true, 'Agency ID is required'],
  index: true,
},
```

**Problem:**
- `organization_id` gereksiz çünkü:
  - `property_id` → Property → `organization_id` (hotel'in org'u)
  - `agency_id` → Agency → `organization_id` (agency'nin org'u)
- Hangi organization? Hotel'in mi, agency'nin mi?
- Karışıklık yaratıyor

**Çözüm:**
- `organization_id` kaldırılmalı
- Hotel'in organization'ı: `property.organization_id`
- Agency'nin organization'ı: `agency.organization_id`

---

### 3. Property Model - İsim Karışıklığı

**Sorun:**
- Model adı "Property" ama kullanıcı "otel modeli" diye soruyor
- Property = Otel (aynı şey)

**Çözüm:**
- Property modeli zaten var ✅
- Sadece açıklama ekle: "Property = Hotel/Otel"

---

## 🎯 DOĞRU MANTIK

### Senaryo 1: Direct Booking (Hotel'den direkt)

```
Guest → Hotel Organization → Property → Reservation
                                      ↓
                                 property_id
                                 (organization_id: property.organization_id)
```

**Reservation:**
- `property_id` ✅
- `organization_id` ❌ (property'den alınabilir)
- `agency_id` ❌ (null)

---

### Senaryo 2: Agency Booking (Agency'den)

```
Guest → Agency Organization → Agency → Reservation
                                        ↓
                                   agency_id
                                   property_id
                                   (organization_id: agency.organization_id VEYA property.organization_id?)
```

**Reservation:**
- `property_id` ✅
- `agency_id` ✅
- `organization_id` ❌ (Hangi org? Agency'nin mi, hotel'in mi?)

**Sorun:** Reservation hangi organization'a ait?
- **Agency booking yapan organization:** `agency.organization_id`
- **Rezervasyon yapılan hotel'in organization'ı:** `property.organization_id`

**Çözüm:** Reservation her zaman **hotel'in organization'ına** ait olmalı:
- Reservation → Property → Organization (Hotel)
- Agency sadece "source" (kaynak)

---

### Senaryo 3: AgencyContract

```
Agency Organization → Agency → AgencyContract ← Property ← Hotel Organization
```

**AgencyContract:**
- `property_id` ✅ (Hotel'in property'si)
- `agency_id` ✅ (Agency)
- `organization_id` ❌ (Hangi org? Gereksiz)

**Çözüm:**
- `organization_id` kaldır
- Hotel'in org'u: `property.organization_id`
- Agency'nin org'u: `agency.organization_id`

---

## ✅ ÖNERİLEN DÜZELTMELER

### 1. Reservation Model Düzeltmesi

**Önceki:**
```javascript
organization_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Organization',
  default: null,
  comment: 'If booking is made by an agency',
},
agency_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Agency',
  index: true,
},
```

**Sonraki:**
```javascript
// organization_id KALDIRILDI
// Organization ID'yi property'den al:
// - property_id → Property → organization_id (hotel'in org'u)

agency_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Agency',
  index: true,
  // Agency booking ise dolu, direct booking ise null
},
```

**Virtual Property Ekle:**
```javascript
// Reservation'ın organization_id'sini hesapla
ReservationSchema.virtual('organization_id').get(function() {
  // Reservation her zaman hotel'in organization'ına ait
  // Property'den organization_id'yi al
  return this.property_id?.organization_id;
});
```

**Veya Service Layer'da:**
```javascript
// reservation.service.js
const property = await Property.findById(property_id);
const organization_id = property.organization_id; // Hotel'in org'u
```

---

### 2. AgencyContract Model Düzeltmesi

**Önceki:**
```javascript
organization_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Organization',
  required: [true, 'Organization ID is required'],
  index: true,
},
```

**Sonraki:**
```javascript
// organization_id KALDIRILDI
// Hotel'in org'u: property.organization_id
// Agency'nin org'u: agency.organization_id
```

**Index Güncelle:**
```javascript
// Önceki:
AgencyContractSchema.index({ property_id: 1, agency_id: 1 }, { unique: true });

// Sonraki: Aynı (organization_id index'i kaldırılacak)
```

---

### 3. Reservation Service Düzeltmesi

**Önceki:**
```javascript
// reservation.service.js
const [reservation] = await Reservation.create([{
  ...data,
  organization_id: agency_id ? agency.organization_id : property.organization_id, // ❌
  agency_id: agency_id || undefined,
  ...
}]);
```

**Sonraki:**
```javascript
// reservation.service.js
// organization_id kaldırıldı
// Property'den organization_id alınacak (hotel'in org'u)
const property = await Property.findById(property_id);
const organization_id = property.organization_id; // Hotel'in org'u

const [reservation] = await Reservation.create([{
  ...data,
  // organization_id yok - property'den alınacak
  agency_id: agency_id || undefined,
  ...
}]);
```

---

## 📊 GÜNCEL İLİŞKİ ŞEMASI

### Doğru Yapı:

```
┌─────────────────┐
│ ORGANIZATIONS   │
│ type: HOTEL     │
└────────┬────────┘
         │
         │ 1:N
         │
         ▼
┌─────────────────┐
│   PROPERTIES    │ (Hotel/Otel)
│ organization_id │
└────────┬────────┘
         │
         │ 1:N
         │
         ▼
┌─────────────────┐
│  RESERVATIONS   │
│  property_id    │ ✅
│  agency_id      │ ✅ (nullable)
│  organization_id│ ❌ KALDIRILDI
└─────────────────┘

┌─────────────────┐
│ ORGANIZATIONS   │
│ type: AGENCY    │
└────────┬────────┘
         │
         │ 1:N
         │
         ▼
┌─────────────────┐
│    AGENCIES     │
│ organization_id │
└────────┬────────┘
         │
         │ 1:N
         │
         ▼
┌─────────────────┐
│  RESERVATIONS   │
│  agency_id      │ ✅
└─────────────────┘

┌─────────────────┐
│ AGENCY_CONTRACTS│
│ property_id     │ ✅
│ agency_id       │ ✅
│ organization_id │ ❌ KALDIRILDI
└─────────────────┘
```

---

## 🔧 YAPILACAK DEĞİŞİKLİKLER

### 1. Reservation Model
- [ ] `organization_id` field'ını kaldır
- [ ] Virtual property ekle (opsiyonel)
- [ ] Service layer'da property'den organization_id al

### 2. AgencyContract Model
- [ ] `organization_id` field'ını kaldır
- [ ] Index'leri güncelle
- [ ] Controller'ları güncelle

### 3. Reservation Service
- [ ] `organization_id` kullanımını kaldır
- [ ] Property'den organization_id al
- [ ] Multi-tenant filter'ı düzelt

### 4. AgencyContract Controller
- [ ] `organization_id` validation'ını kaldır
- [ ] Property'den organization_id al

### 5. Documentation
- [ ] İlişki şemasını güncelle
- [ ] API dokümantasyonunu güncelle

---

## 🎯 SONUÇ

### Tespit Edilen Hatalar:
1. ❌ Reservation.organization_id gereksiz
2. ❌ AgencyContract.organization_id gereksiz
3. ⚠️ Property modeli var (sadece isim karışıklığı)

### Çözüm:
1. ✅ Reservation'dan `organization_id` kaldır
2. ✅ AgencyContract'tan `organization_id` kaldır
3. ✅ Organization ID'yi property/agency'den al
4. ✅ Multi-tenant filter'ı düzelt

### Mantık:
- **Reservation** → Property → Organization (Hotel) - Reservation her zaman hotel'in org'una ait
- **Agency** → Organization (Agency) - Agency kendi org'una ait
- **AgencyContract** → Property (Hotel) + Agency - Contract'ta org yok, property ve agency'den alınır

---

**Durum:** ⚠️ Mantık hataları tespit edildi, düzeltmeler gerekli  
**Sonraki:** Reservation ve AgencyContract modellerini düzelt! 🚀


# ✅ Otel-Agency İlişki Düzeltmeleri - Tamamlandı

**Tarih:** 26 Ekim 2025  
**Durum:** ✅ Tüm mantık hataları düzeltildi

---

## 🔧 YAPILAN DÜZELTMELER

### 1. ✅ Reservation Model - `organization_id` Kaldırıldı

**Sorun:**
- Reservation'da gereksiz `organization_id` field'ı vardı
- Karışıklık yaratıyordu (agency'nin org'u mu, hotel'in org'u mu?)

**Çözüm:**
- `organization_id` field'ı kaldırıldı
- Reservation her zaman hotel'in organization'ına ait (property.organization_id)
- Not eklendi: "Reservation always belongs to hotel's organization"

**Değişiklik:**
```javascript
// Önceki:
organization_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Organization',
  default: null,
  comment: 'If booking is made by an agency',
},

// Sonraki:
// Note: organization_id is not stored here.
// Reservation always belongs to hotel's organization (property.organization_id)
// For agency bookings, use agency_id field
```

---

### 2. ✅ AgencyContract Model - `organization_id` Kaldırıldı

**Sorun:**
- AgencyContract'ta gereksiz `organization_id` field'ı vardı
- Hangi organization? Hotel'in mi, agency'nin mi?

**Çözüm:**
- `organization_id` field'ı kaldırıldı
- Hotel'in org'u: `property.organization_id`
- Agency'nin org'u: `agency.organization_id`
- Not eklendi

**Değişiklik:**
```javascript
// Önceki:
organization_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Organization',
  required: [true, 'Organization ID is required'],
  index: true,
},

// Sonraki:
// Note: organization_id is not stored here.
// Hotel's organization: property.organization_id
// Agency's organization: agency.organization_id
```

---

### 3. ✅ Reservation Service - Multi-tenant Filter Düzeltildi

#### 3.1. `getAllReservations`
**Sorun:**
- `organization_id` field'ı kullanılıyordu (artık yok)

**Çözüm:**
- Property'den organization_id alınıyor
- Property ID varsa validate ediliyor
- Property ID yoksa tüm properties için filter yapılıyor

**Değişiklik:**
```javascript
// Önceki:
const query = { organization_id: user.organization_id };

// Sonraki:
const Property = require('../models').Property;
const query = {};

if (property_id) {
  const property = await Property.findById(property_id);
  if (property.organization_id.toString() !== user.organization_id.toString()) {
    throw new Error('Property does not belong to your organization');
  }
  query.property_id = property_id;
} else {
  const properties = await Property.find({ organization_id: user.organization_id });
  const propertyIds = properties.map(p => p._id);
  query.property_id = { $in: propertyIds };
}
```

#### 3.2. `getReservationById`
**Sorun:**
- `organization_id` field'ı kullanılıyordu

**Çözüm:**
- Reservation populate ediliyor (property_id)
- Property'nin organization_id'si kontrol ediliyor

**Değişiklik:**
```javascript
// Önceki:
const reservation = await Reservation.findOne({
  _id: id,
  organization_id: user.organization_id,
});

// Sonraki:
const reservation = await Reservation.findById(id).populate('property_id');

if (reservation.property_id.organization_id.toString() !== user.organization_id.toString()) {
  throw new Error('Reservation not found');
}
```

#### 3.3. `updateReservation`
**Sorun:**
- `organization_id` field'ı kullanılıyordu

**Çözüm:**
- Property'den organization_id kontrol ediliyor

#### 3.4. `cancelReservation`
**Sorun:**
- `organization_id` field'ı kullanılıyordu

**Çözüm:**
- Property'den organization_id kontrol ediliyor
- Transaction içinde abort ediliyor

#### 3.5. `checkInReservation` & `checkOutReservation`
**Sorun:**
- `organization_id` field'ı kullanılıyordu

**Çözüm:**
- Property'den organization_id kontrol ediliyor

#### 3.6. `createReservation`
**Sorun:**
- Property validation yoktu

**Çözüm:**
- Property validation eklendi
- Property'nin user'ın organization'ına ait olduğu kontrol ediliyor
- Transaction içinde abort ediliyor

**Değişiklik:**
```javascript
// Yeni eklendi:
// 1. Validate property belongs to user's organization (WITHIN TRANSACTION)
const Property = require('../models').Property;
const property = await Property.findById(property_id).session(session);
if (!property) {
  await session.abortTransaction();
  throw new Error('Property not found');
}
if (property.organization_id.toString() !== user.organization_id.toString()) {
  await session.abortTransaction();
  throw new Error('Property does not belong to your organization');
}
```

---

### 4. ✅ AgencyContract Controller - Multi-tenant Filter Düzeltildi

#### 4.1. `getAll`
**Sorun:**
- `organization_id` field'ı kullanılıyordu

**Çözüm:**
- Property'lerden organization_id alınıyor
- Property ID varsa validate ediliyor

**Değişiklik:**
```javascript
// Önceki:
const query = { organization_id: req.user.organization_id };

// Sonraki:
const query = {};
const properties = await Property.find({ organization_id: req.user.organization_id });
const propertyIds = properties.map(p => p._id);
query.property_id = { $in: propertyIds };

if (property_id) {
  const property = await Property.findById(property_id);
  if (property.organization_id.toString() !== req.user.organization_id.toString()) {
    return res.status(400).json({ error: 'Property not found or does not belong to your organization' });
  }
  query.property_id = property_id;
}
```

#### 4.2. `getById`, `update`, `delete`, `activate`, `suspend`
**Sorun:**
- `organization_id` field'ı kullanılıyordu

**Çözüm:**
- Property'den organization_id kontrol ediliyor
- Populate ile property.organization_id alınıyor

**Değişiklik:**
```javascript
// Önceki:
const contract = await AgencyContract.findOne({
  _id: req.params.id,
  organization_id: req.user.organization_id,
});

// Sonraki:
const contract = await AgencyContract.findById(req.params.id).populate('property_id');

if (contract.property_id.organization_id.toString() !== req.user.organization_id.toString()) {
  return res.status(404).json({ error: 'Contract not found' });
}
```

#### 4.3. `create`
**Sorun:**
- `organization_id` field'ı kullanılıyordu

**Çözüm:**
- Property validation eklendi
- Property'nin user'ın organization'ına ait olduğu kontrol ediliyor

**Değişiklik:**
```javascript
// Önceki:
const contractData = {
  ...req.body,
  organization_id: req.user.organization_id,
};

// Sonraki:
const contractData = {
  ...req.body,
  // organization_id removed - property.organization_id is used for multi-tenant
};

// Validate property belongs to user's organization
const property = await Property.findById(contractData.property_id);
if (property.organization_id.toString() !== req.user.organization_id.toString()) {
  return res.status(400).json({ error: 'Property does not belong to your organization' });
}
```

---

## 📊 DOĞRU MANTIK

### Reservation
- **Reservation → Property → Organization (Hotel)**
- Reservation her zaman hotel'in organization'ına ait
- Agency booking ise: `agency_id` field'ı dolu
- Direct booking ise: `agency_id` field'ı null

### AgencyContract
- **AgencyContract → Property (Hotel) + Agency**
- Hotel'in org'u: `property.organization_id`
- Agency'nin org'u: `agency.organization_id`
- Contract'ta organization_id yok

### Multi-tenant Filter
- Reservation: Property'den organization_id alınır
- AgencyContract: Property'den organization_id alınır
- Property: Doğrudan organization_id field'ı var

---

## ✅ KONTROL LİSTESİ

### Models
- [x] Reservation.organization_id kaldırıldı
- [x] AgencyContract.organization_id kaldırıldı
- [x] Not'lar eklendi

### Services
- [x] getAllReservations - Property'den organization_id alınıyor
- [x] getReservationById - Property'den organization_id kontrol ediliyor
- [x] updateReservation - Property'den organization_id kontrol ediliyor
- [x] cancelReservation - Property'den organization_id kontrol ediliyor
- [x] checkInReservation - Property'den organization_id kontrol ediliyor
- [x] checkOutReservation - Property'den organization_id kontrol ediliyor
- [x] createReservation - Property validation eklendi

### Controllers
- [x] AgencyContract.getAll - Property'den organization_id alınıyor
- [x] AgencyContract.getById - Property'den organization_id kontrol ediliyor
- [x] AgencyContract.create - Property validation eklendi
- [x] AgencyContract.update - Property'den organization_id kontrol ediliyor
- [x] AgencyContract.delete - Property'den organization_id kontrol ediliyor
- [x] AgencyContract.activate - Property'den organization_id kontrol ediliyor
- [x] AgencyContract.suspend - Property'den organization_id kontrol ediliyor

---

## 🎯 SONUÇ

### Önceki Durum:
- ❌ Reservation'da gereksiz `organization_id`
- ❌ AgencyContract'ta gereksiz `organization_id`
- ❌ Karışıklık (hangi org?)
- ❌ Multi-tenant filter hatalı

### Şimdiki Durum:
- ✅ Reservation'da `organization_id` yok (property'den alınıyor)
- ✅ AgencyContract'ta `organization_id` yok (property'den alınıyor)
- ✅ Mantık net: Reservation → Property → Organization (Hotel)
- ✅ Multi-tenant filter düzeltildi
- ✅ Property validation eklendi

---

## 📝 ÖNEMLİ NOTLAR

### Reservation
- Reservation her zaman hotel'in organization'ına ait
- Agency booking: `agency_id` field'ı dolu
- Direct booking: `agency_id` field'ı null
- Organization ID: `property.organization_id`

### AgencyContract
- Hotel'in org'u: `property.organization_id`
- Agency'nin org'u: `agency.organization_id`
- Contract'ta organization_id yok

### Multi-tenant Security
- Tüm query'lerde property.organization_id kontrol ediliyor
- Property validation eklendi
- Transaction içinde abort ediliyor

---

**Durum:** ✅ Tüm mantık hataları düzeltildi!  
**Sonraki:** Test et ve production'a al! 🚀


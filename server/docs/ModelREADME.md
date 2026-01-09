# 🔧 TravelSync - Model Güncellemeleri

Bu dosya, controller'ların çalışması için model'lere eklenmesi gereken field'ları içerir.

---

## ✅ YAPILMASI GEREKENLER

### 1️⃣ User Model (`src/models/User.js`)

**Eklenecek field:**

```javascript
// Preferences kısmından sonra, schema'nın sonuna ekle:

// Soft delete
deleted_at: {
  type: Date,
  default: null,
  index: true,
},
```

**Tam konum:** Line 125'ten sonra, `}` parantezinden önce

---

### 2️⃣ Organization Model (`src/models/Organization.js`)

**Eklenecek field:**

```javascript
// notes kısmından sonra, schema'nın sonuna ekle:

// Soft delete
deleted_at: {
  type: Date,
  default: null,
  index: true,
},
```

**Tam konum:** `notes` field'ından sonra, schema closing `}` öncesinde

---

### 3️⃣ Diğer Model'ler

Aşağıdaki model'lerde `deleted_at` field'ı zaten var (README'den):

✅ Property  
✅ RoomType  
✅ RatePlan  
✅ Price  
✅ Inventory  
✅ Reservation  

Bu model'leri oluştururken zaten eklemişsindir.

---

## 🎯 Controller'lar İçin Yapılan Düzenlemeler

### ✅ 1. User Controller

**Düzeltilen:**
- ✅ `hasPermission(resource, action)` - 2 parametre kullanımı
- ✅ Password field selection - `.select('+password')`
- ✅ Password hashing - Model pre-save hook'u kullanıyor

### ✅ 2. Base Controller

**Düzeltilen:**
- ✅ `useOrganizationFilter` flag eklendi
- ✅ Organization filtering optional yapıldı

### ✅ 3. Tüm Controller'lar

**Düzeltilen:**
- ✅ Organization controller: `useOrganizationFilter = false`
- ✅ Diğer controller'lar: `useOrganizationFilter = false` (property hariç)
- ✅ Property, User controller: `useOrganizationFilter = true`

---

## 📋 Kontrol Listesi

Model'leri güncelledikten sonra:

- [ ] User.js'e `deleted_at` eklendi
- [ ] Organization.js'e `deleted_at` eklendi
- [ ] Backend restart edildi (`npm run dev`)
- [ ] Postman'da test edildi

---

## 🧪 Test Senaryoları

### 1. User CRUD

```bash
# Create user
POST /api/v1/users
{
  "email": "test@example.com",
  "password": "password123",
  "first_name": "Test",
  "last_name": "User",
  "role": "staff"
}

# Get users
GET /api/v1/users

# Update user
PUT /api/v1/users/:id
{
  "first_name": "Updated"
}

# Soft delete
DELETE /api/v1/users/:id

# Restore
POST /api/v1/users/:id/restore
```

### 2. Permission Check

```bash
# Check permission
GET /api/v1/users/:id/permissions?resource=reservations&action=create
```

### 3. Organization CRUD

```bash
# Create organization
POST /api/v1/organizations
{
  "type": "HOTEL",
  "name": "Test Hotel",
  "country": "DE",
  "timezone": "Europe/Berlin",
  "currency": "EUR"
}

# Get organizations
GET /api/v1/organizations
```

---

## ⚠️ Önemli Notlar

### Permission System

**Senin sistem:**
```javascript
user.permissions.reservations.create === true
```

**Controller kullanımı:**
```javascript
user.hasPermission('reservations', 'create')
```

Bu ikisi uyumlu! ✅

### Password Handling

**Pre-save hook** model'de var:
```javascript
set: (password) => passwordEncrypt(password)
```

Controller sadece plain password gönderiyor, hash otomatik. ✅

### Soft Delete

**Tüm controller'lar soft delete kullanıyor:**
- DELETE → `deleted_at` set ediliyor
- GET → `deleted_at: null` filter otomatik

---


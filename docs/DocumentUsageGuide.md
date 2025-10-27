# 📚 TravelSync Dokümanları - Kullanım Rehberi

Bu rehber, hazırladığımız tüm dokümanların **nerede** ve **ne zaman** kullanılacağını gösterir.

---

## 📁 Dosya Listesi ve Kullanım Yerleri

### 🏗️ Backend Setup Dosyaları (ŞUAN KULLAN)

#### 1. Configuration Files (Root dizinine kopyala)

| Dosya | Nereye Kopyala | Ne İşe Yarar |
|-------|----------------|--------------|
| **package.json** | `travelsync-backend/` | npm dependencies tanımı |
| **tsconfig.json** | `travelsync-backend/` | TypeScript konfigürasyonu |
| **.env.example** | `travelsync-backend/` | Environment variables template |
| **.gitignore** | `travelsync-backend/` | Git'e gitmeyecek dosyalar |
| **.eslintrc.json** | `travelsync-backend/` | Code linting kuralları |
| **.prettierrc.json** | `travelsync-backend/` | Code formatting kuralları |
| **nodemon.json** | `travelsync-backend/` | Development server config |

**Kullanım:**
```bash
cd travelsync-backend
# Her dosyayı root'a kopyala
cp /path/to/package.json .
cp /path/to/tsconfig.json .
# ... diğerleri
```

#### 2. Source Code Files (src/ klasörüne kopyala)

| Dosya | Nereye Kopyala | Ne İşe Yarar |
|-------|----------------|--------------|
| **server.ts** | `src/` | Main application entry point |
| **database.ts** | `src/config/` | MongoDB connection setup |
| **errorHandler.ts** | `src/middlewares/` | Global error handling |
| **notFoundHandler.ts** | `src/middlewares/` | 404 handler |

**Kullanım:**
```bash
cd travelsync-backend
cp /path/to/server.ts src/
cp /path/to/database.ts src/config/
cp /path/to/errorHandler.ts src/middlewares/
cp /path/to/notFoundHandler.ts src/middlewares/
```

---

### 📖 Documentation Files (Referans için kullan)

#### 1. DATABASE_SCHEMA_HYBRID.md ⭐ **ANA REFERANS**

**Kullanım Zamanı:** Model oluştururken (Week 1-6)

**Nasıl kullanılır:**
1. **Organization.ts** oluştururken → Section 1'e bak
2. **User.ts** oluştururken → Section 2'ye bak
3. **Property.ts** oluştururken → Section 3'e bak
4. **RoomType.ts** oluştururken → Section 4'e bak
5. **RatePlan.ts** oluştururken → Section 5'e bak
6. **Price.ts** oluştururken → Section 6'ya bak
7. **Inventory.ts** oluştururken → Section 7'ye bak
8. **Reservation.ts** oluştururken → Section 8'e bak

**Örnek:**
```typescript
// Organization.ts oluşturuyorsun
// DATABASE_SCHEMA_HYBRID.md → Section 1'i aç
// Interface'i kopyala, Mongoose schema'ya çevir
```

**Nereye koy:** Bilgisayarında ayrı bir klasörde sakla, her zaman açık tut.

---

#### 2. API_DESIGN.md ⭐ **API REF ERANS**

**Kullanım Zamanı:** Route ve Controller oluştururken

**Nasıl kullanılır:**
1. **auth.routes.ts** oluştururken → Auth Endpoints bölümüne bak
2. **organization.routes.ts** → Organization Endpoints
3. **property.routes.ts** → Property Endpoints
4. **roomType.routes.ts** → Room Type Endpoints
5. **ratePlan.routes.ts** → Rate Plan Endpoints
6. **price.routes.ts** → Price Endpoints
7. **inventory.routes.ts** → Inventory Endpoints
8. **reservation.routes.ts** → Reservation Endpoints

**Örnek:**
```typescript
// auth.routes.ts oluşturuyorsun
// API_DESIGN.md → Auth Endpoints bölümünü aç
// POST /auth/register endpoint'ini kopyala
// Request/Response format'ını gör
```

**Nereye koy:** VS Code'da yan pencerede açık tut.

---

#### 3. ROADMAP.md ⭐ **PLAN TAKİBİ**

**Kullanım Zamanı:** Her sprint başında ve günlük

**Nasıl kullanılır:**
1. **Sprint 1** (Week 1-2): Organizations & Auth
   - Checklist'i takip et
   - Her gün hangi dosyayı oluşturacağını gör
   
2. **Sprint 2** (Week 3-4): Properties, Room Types, Rate Plans
   - Sırayla ilerle
   
3. **Sprint 3** (Week 5-6): Prices, Inventory
   - Business logic implementation

**Nereye koy:** Notion veya Trello'ya kopyala, checklist yap.

---

#### 4. PROJECT_CHARTER.md

**Kullanım Zamanı:** 
- Proje başlangıcı (scope belirleme)
- Yatırımcıya sunum
- Ekip toplantıları

**Nasıl kullanılır:**
- MVP scope'u görmek için
- Timeline takibi
- Success metrics

**Nereye koy:** GitHub README'ye link ver.

---

#### 5. README.md

**Kullanım Zamanı:**
- GitHub repository oluştururken
- Yeni developer onboarding
- Public documentation

**Nasıl kullanılır:**
```bash
# GitHub'da travelsync-backend repo'su oluşturduktan sonra
cp README.md travelsync-backend/
git add README.md
git commit -m "Add README"
git push
```

**Nereye koy:** Repository root'una.

---

#### 6. TECH_STACK.md

**Kullanım Zamanı:**
- Teknoloji kararları alırken
- Yeni tool eklerken
- Architecture review

**Nasıl kullanılır:**
- Package seçimi yaparken referans
- Alternative'leri görmek için

**Nereye koy:** `docs/` klasörüne.

---

#### 7. DATABASE_SCHEMA.md (Original with Agency)

**Kullanım Zamanı:** Phase 2'de (Agency module)

**Nasıl kullanılır:**
- Week 13+ başladığında
- Agency module'ü implement ederken
- Agency-Hotel relationships için

**Nereye koy:** `docs/` klasörüne, şimdilik arşivde.

---

## 🗂️ Önerilen Klasör Yapısı

```
📁 travelsync/
├── 📁 backend/                      # Backend kod
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   └── ...
│
├── 📁 frontend/                     # Frontend kod (henüz yok)
│
├── 📁 docs/                         # Tüm dokümanlar buraya
│   ├── DATABASE_SCHEMA_HYBRID.md   ⭐ Her zaman aç
│   ├── API_DESIGN.md               ⭐ Her zaman aç
│   ├── ROADMAP.md                  ⭐ Her gün kontrol
│   ├── PROJECT_CHARTER.md
│   ├── TECH_STACK.md
│   ├── DATABASE_SCHEMA.md
│   └── BACKEND_SETUP_GUIDE.md
│
└── README.md                        # Ana README
```

---

## 📝 Workflow: Yeni Feature Geliştirirken

### Örnek: User Model Oluşturma

**1. ROADMAP.md'yi aç**
```markdown
Sprint 1 → Week 1 → Day 1-2
- [ ] Create User model
```

**2. DATABASE_SCHEMA_HYBRID.md'yi aç**
```typescript
// Section 2: Users Collection
// Interface'i kopyala
interface IUser {
  _id: ObjectId;
  organization_id: ObjectId;
  email: string;
  // ...
}
```

**3. VS Code'da src/models/User.ts oluştur**
```typescript
// DATABASE_SCHEMA'dan aldığın interface'i
// Mongoose schema'ya çevir
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  // ...
});
```

**4. API_DESIGN.md'yi aç**
```typescript
// Auth Endpoints bölümünü bul
POST /auth/register
// Request/Response format'ını gör
```

**5. src/routes/auth.routes.ts oluştur**
```typescript
// API_DESIGN'dan endpoint'leri ekle
router.post('/register', authController.register);
router.post('/login', authController.login);
```

**6. ROADMAP'te işaretle**
```markdown
- [x] Create User model  ✅ DONE
```

---

## 🎯 Günlük Rutini

### Her Sabah:

1. **ROADMAP.md** aç → Bugün ne yapacağını gör
2. **DATABASE_SCHEMA_HYBRID.md** + **API_DESIGN.md** yan pencerede aç
3. Checklist'i takip et

### Development Sırasında:

1. Model oluşturuyorsan → **DATABASE_SCHEMA_HYBRID.md**
2. Route/Controller → **API_DESIGN.md**
3. Business logic → **DATABASE_SCHEMA_HYBRID.md** (Queries section)

### Her Akşam:

1. **ROADMAP.md** → Tamamladıklarını işaretle ✅
2. Commit yap: `git commit -m "feat: implement User model"`
3. Yarın için notlar al

---

## 🆘 Hangi Dokümana Bakmalıyım?

| Sorun / İhtiyaç | Dokuman |
|----------------|---------|
| **Model field'ları neler?** | DATABASE_SCHEMA_HYBRID.md |
| **API endpoint nasıl olmalı?** | API_DESIGN.md |
| **Bu hafta ne yapacağım?** | ROADMAP.md |
| **Hangi package'leri kullanayım?** | TECH_STACK.md |
| **MongoDB connection nasıl?** | database.ts (kod dosyası) |
| **Error handling nasıl?** | errorHandler.ts (kod dosyası) |
| **JWT nasıl implement edilir?** | API_DESIGN.md → Auth section |
| **Pricing logic nasıl çalışmalı?** | DATABASE_SCHEMA_HYBRID.md → Queries |
| **Inventory update nasıl?** | DATABASE_SCHEMA_HYBRID.md → Business queries |

---

## 🎓 Doküman Kullanım İpuçları

### 1. Split Screen Kullan

```
┌─────────────────┬─────────────────┐
│                 │                 │
│   VS Code       │  Documentation  │
│   (kod yazıyor) │  (referans)     │
│                 │                 │
└─────────────────┴─────────────────┘
```

### 2. Bookmark'la

Browser'da bu dokümanları bookmark'la:
- DATABASE_SCHEMA_HYBRID.md
- API_DESIGN.md
- ROADMAP.md

### 3. Print/PDF Yap (Opsiyonel)

Önemli section'ları print et veya PDF yap:
- Database schemas
- API endpoints
- Roadmap checklist

### 4. Notion'a Aktar

ROADMAP.md'yi Notion'a aktar → Task management:
- [ ] Sprint 1 - Week 1 - Day 1
- [ ] Create Organization model
- [ ] Create User model
- ...

---

## ✅ Quick Checklist

Backend kurulumu yapıyorsan:

- [ ] **package.json** → `travelsync-backend/` kopyalandı
- [ ] **tsconfig.json** → `travelsync-backend/` kopyalandı
- [ ] **.env.example** → `.env` olarak kopyalandı ve düzenlendi
- [ ] **server.ts** → `src/` kopyalandı
- [ ] **database.ts** → `src/config/` kopyalandı
- [ ] **errorHandler.ts** → `src/middlewares/` kopyalandı
- [ ] `npm install` çalıştırıldı
- [ ] `npm run dev` çalışıyor

Dokümanlar hazır:

- [ ] **docs/** klasörü oluşturuldu
- [ ] Tüm .md dosyaları docs/'a kopyalandı
- [ ] DATABASE_SCHEMA_HYBRID.md bookmark'landı
- [ ] API_DESIGN.md bookmark'landı
- [ ] ROADMAP.md Notion/Trello'ya aktarıldı

---

## 🚀 Şimdi Ne Yapacaksın?

### Seçenek 1: Backend Kurulumunu Tamamla
👉 **BACKEND_SETUP_GUIDE.md**'yi takip et

### Seçenek 2: İlk Model'i Oluştur
👉 **Organization.ts** oluşturmaya başla (ben sana yardım edebilirim)

### Seçenek 3: Dokümanları İncele
👉 DATABASE_SCHEMA_HYBRID.md ve API_DESIGN.md'yi oku

**Hangisini yapmak istersin?** 🎯
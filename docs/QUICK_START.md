# Refresh Token Blacklist - Quick Start Guide

## 🚀 5 Dakika Setup

### 1. Model Kontrolü
TokenBlacklist model otomatik MongoDB'ye collection oluşturacak:
```bash
npm start
# Logs'ta göreceksin: "TokenBlacklist model loaded"
```

### 2. Test: Logout Flow
```bash
# Terminal 1: API Server
npm start

# Terminal 2: Test
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePass123!"
  }'

# Response'tan access_token ve refresh_token kopyala

# Logout yap
curl -X POST http://localhost:5000/api/v1/auth/logout \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "<refresh_token>"
  }'

# Response: 200 OK

# Şimdi refresh token'ı kullanmaya çalış
curl -X POST http://localhost:5000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "<refresh_token>"
  }'

# Expected Response: 401 "Token has been revoked"
# ✅ SUCCESS!
```

### 3. Admin Endpoints Test

**Cleanup Token Blacklist:**
```bash
curl -X POST http://localhost:5000/api/v1/admin/tokens/cleanup \
  -H "Authorization: Bearer <super_admin_token>"
```

**User Tokens Revoke:**
```bash
curl -X POST http://localhost:5000/api/v1/admin/users/USER_ID/revoke-tokens \
  -H "Authorization: Bearer <super_admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "security_incident",
    "notes": "Suspicious login detected"
  }'
```

**Token Stats:**
```bash
curl -X GET http://localhost:5000/api/v1/admin/users/USER_ID/token-stats \
  -H "Authorization: Bearer <super_admin_token>"
```

---

## 📋 Neler Eklendi?

| Bileşen | Dosya | Amaç |
|---------|-------|------|
| Model | `server/models/TokenBlacklist.js` | Token blacklist storage |
| Service | `server/services/token.service.js` | Blacklist operations |
| Middleware | `server/middlewares/tokenValidation.js` | Token validation |
| Script | `server/scripts/cleanupBlacklist.js` | Database cleanup |
| Docs | `docs/TOKEN_BLACKLIST_SYSTEM.md` | Detaylı dokumentasyon |

---

## 🔑 Key Files Değişiklikleri

### `server/controllers/auth.js`
- ✅ `logout()` - Refresh token blacklist'e ekle
- ✅ `refreshToken()` - Blacklist kontrol yap

### `server/services/user.service.js`
- ✅ `updatePassword()` - Tüm token'lar revoke et

### `server/routes/auth.js`
- ✅ `/refresh` - Middleware eklendi

---

## 🧪 Development Mode Commands

```bash
# Start dev server
npm run dev

# Run tests
npm test

# Manual cleanup
node server/scripts/cleanupBlacklist.js

# View logs
tail -f logs/app.log
```

---

## 📊 Database İşlemler

### Blacklist Entry Görüntüle
```javascript
// MongoDB CLI
use travelsync
db.tokenbracklists.find({ user_id: ObjectId("...") }).pretty()

// Count entries
db.tokenbracklists.countDocuments()

// Expired entries (silinecekler)
db.tokenbracklists.find({ expires_at: { $lt: new Date() } })
```

### TTL Index Kontrol
```javascript
db.tokenbracklists.getIndexes()
// expires_at index'inde expireAfterSeconds: 0 görülecek
```

---

## ⚠️ Sık Sorulan Sorular

### S: Logout sonrası kullanıcı ne yapabilir?
**C**: Sadece login yapabilir. Yeni tokens almak için login gerekir.

### S: Blacklist entries ne kadar kalır?
**C**: TTL index ile token'ın expiry time'ına kadar (default 7 gün).

### S: Admin token revoke'den sonra ne olur?
**C**: Etkilenen user'ın tüm token'ları invalid. Login gerekli.

### S: Redis integration ne zaman?
**C**: Opsiyonel. Performans için gelecekte eklenebilir.

### S: Production'a deploy nasıl?
**C**: Normal deploy. MongoDB TTL index otomatik create olur.

---

## 🛠️ Troubleshooting

### Problem: "TokenBlacklist model not found"
```bash
# Çözüm: Models index.js'i kontrol et
grep -n TokenBlacklist server/models/index.js

# Olmalı:
# TokenBlacklist: require('./TokenBlacklist'),
```

### Problem: Refresh token still works after logout
```bash
# Debug: Blacklist'i kontrol et
db.tokenbracklists.findOne({ token: "..." })

# Eğer boşsa: Token eklenmiş mi kontrol et
# Logs'ta hata var mı kontrol et
```

### Problem: Cleanup script hata veriyor
```bash
# Full error mesajı gör
node server/scripts/cleanupBlacklist.js --verbose

# MongoDB connection kontrol
mongodb://localhost:27017/travelsync erişebiliyor mu?
```

---

## 🔐 Security Checklist

- [ ] Logout endpoint'e refresh_token gönderiliyor
- [ ] Password change'den sonra login gerekli
- [ ] Admin revoke'den sonra user tekrar login yapıyor
- [ ] Token stats admin panelinde görülüyor
- [ ] TTL cleanup otomatik çalışıyor

---

## 📞 Support

**Docs**: `docs/TOKEN_BLACKLIST_SYSTEM.md`  
**Implementation**: `docs/IMPLEMENTATION_SUMMARY.md`  
**Code**: `server/services/token.service.js`

---

## ✅ Production Readiness

- [x] Model implement edildi
- [x] Service implement edildi
- [x] Middleware implement edildi
- [x] Controllers updated
- [x] Routes updated
- [x] Admin endpoints added
- [x] Scripts added
- [x] Documentation complete
- [ ] Tests written
- [ ] Staging tested
- [ ] Production deployed

**Status**: 🟢 Ready for testing & deployment

---

Generated: 17 Jan 2026  
Version: 1.0

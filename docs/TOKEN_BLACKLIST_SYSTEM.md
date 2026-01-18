# Refresh Token Blacklist Sistemi - Implementasyon Dokümanı

## 📋 Genel Bakış

Refresh token blacklist sistemi, logout sonrasında eski token'ların kullanılmasını engeller. Bu, session hijacking saldırılarına karşı güvenlik ekler.

## 🏗️ Mimarisi

### 1. **TokenBlacklist Model** (`server/models/TokenBlacklist.js`)
- MongoDB collection'ında invalidated token'ları saklar
- TTL (Time-To-Live) index ile otomatik cleanup
- Komut indexler:
  - `token` (unique): Hızlı lookup
  - `user_id`: User başına token'ları bulmak
  - `expires_at` (TTL): 1 gün sonra otomatik silinir

### 2. **Token Service** (`server/services/token.service.js`)
Token'ları blacklist'e ekleme ve kontrol işlemlerini yönetir:
- `blacklistRefreshToken()`: Token'ı blacklist'e ekle
- `isTokenBlacklisted()`: Token blacklist'te var mı kontrol et
- `revokeUserTokens()`: Bir user'ın tüm token'larını iptal et
- `cleanupExpiredBlacklist()`: Süresi geçen token'ları sil

### 3. **JWT Utilities** (`server/utils/jwt.js`)
- `verifyRefreshTokenWithBlacklist()`: JWT doğrula + blacklist kontrol

### 4. **Token Validation Middleware** (`server/middlewares/tokenValidation.js`)
- Refresh endpoint'e eklenmiş
- İlave bir güvenlik katmanı

## 🔄 Akış

```
┌─────────────────┐
│  User Login     │
├─────────────────┤
│ Access Token    │ (15 dakika)
│ Refresh Token   │ (7 gün) → Veritabanında saklanmaz
└─────────────────┘
         │
         ├─→ Access Token Expiry
         │
         ├─→ POST /auth/refresh (Refresh Token ile)
         │
         ├─→ Middleware Check: Blacklist'te var mı?
         │
         ├─→ YES: Reddet ❌
         │
         └─→ NO: Yeni tokens döndür ✅
```

## 🚀 Implementasyon Detayları

### Logout Akışı
```javascript
POST /auth/logout
{
  "refresh_token": "eyJhbGc..."
}

// Yapılanlar:
1. Audit log kaydı
2. Refresh token'ı TokenBlacklist'e ekle
3. 200 OK dönü
```

### Refresh Token Kontrol
```javascript
POST /auth/refresh
{
  "refresh_token": "eyJhbGc..."
}

// Yapılanlar:
1. Middleware: Blacklist kontrolü
2. JWT doğrula (signature + expiry)
3. User aktif kontrol et
4. Yeni tokens ver
```

### Parola Değişimi
Parola değiştirildiğinde:
1. Yeni parola hash'lenir
2. **Tüm user token'ları revoke edilir** (güvenlik)
3. Kullanıcı yeniden login yapmalı

## 🛠️ Admin Endpoints

### 1. Token Blacklist Cleanup
```
POST /api/v1/admin/tokens/cleanup
Authorization: Bearer <super_admin_token>

Response:
{
  "success": true,
  "data": {
    "deleted_count": 42,
    "acknowledged": true
  },
  "message": "Cleaned up 42 expired blacklist entries"
}
```

### 2. User Tokens Revoke (Emergency)
```
POST /api/v1/admin/users/:id/revoke-tokens
Authorization: Bearer <super_admin_token>

Body:
{
  "reason": "security_incident",  // logout, password_changed, admin_revoke, security
  "notes": "Suspicious activity detected"
}

Response:
{
  "success": true,
  "data": {
    "success": true,
    "revoked_count": 5,
    "message": "Revoked 5 active token(s)"
  }
}
```

### 3. User Token İstatistikleri
```
GET /api/v1/admin/users/:id/token-stats
Authorization: Bearer <super_admin_token>

Response:
{
  "success": true,
  "data": {
    "user_id": "507f1f77bcf86cd799439011",
    "user_email": "user@example.com",
    "token_revocation_stats": [
      { "_id": "logout", "count": 10 },
      { "_id": "password_changed", "count": 2 }
    ]
  }
}
```

## 🔐 Güvenlik Özellikleri

### ✅ Implemented
- [x] Logout sonrası token invalidation
- [x] Parola değişimi = tüm token'lar revoke
- [x] TTL ile otomatik cleanup
- [x] Blacklist kontrol middleware
- [x] Audit logging
- [x] Admin emergency token revoke
- [x] JWT JWT signature + blacklist çift katman kontrol

### 🚧 İlave Güvenlik (Opsiyonel)
- [ ] Redis caching blacklist (performans için)
- [ ] Token rotation strategy (her refresh'te yeni refresh token)
- [ ] Device-specific token tracking
- [ ] Geographic anomaly detection

## 📊 Veritabanı Şeması

```
TokenBlacklist
├── _id: ObjectId
├── token: String (unique, indexed)
├── user_id: ObjectId (ref: User)
├── organization_id: ObjectId (ref: Organization)
├── token_type: String (refresh, access, password_reset)
├── reason: String (logout, password_changed, admin_revoke, etc)
├── expires_at: Date (TTL index)
├── revoked_at: Date
├── ip_address: String
├── user_agent: String
├── notes: String
├── created_at: Date
└── updated_at: Date

Indexes:
- token (unique, ascending)
- user_id, token_type (compound)
- organization_id, revoked_at (compound)
- expires_at (TTL: 0 = auto-delete)
```

## 🧹 Cleanup Stratejisi

### Otomatik (TTL Index)
- MongoDB TTL index `expires_at` tarihinde otomatik siler
- **Fayda**: Veritabanı self-cleaning

### Manual
```bash
# Script ile
node server/scripts/cleanupBlacklist.js

# Admin endpoint ile
POST /api/v1/admin/tokens/cleanup
```

### Cron Job (Recommended)
```javascript
// package.json scripts
"cleanup:tokens": "node server/scripts/cleanupBlacklist.js"

// pm2 ile periyodik çalıştırma
"pm2": {
  "cron": "0 2 * * * npm run cleanup:tokens"
}
```

## 📈 Performans Notları

### Current Implementation
- **Database Queries**: 1 query per token check
- **Latency**: ~5-10ms (network + DB)
- **Storage**: ~1KB per blacklist entry

### İleri Optimization (Gelecek)
```javascript
// Redis caching
const redisClient = require('redis').createClient();

// Blacklist entry'yi 7 gün Redis'te cache et
await redisClient.setex(`blacklist:${token}`, 604800, 'true');
```

## 🧪 Test Senaryoları

### 1. Normal Logout
```bash
1. Login → access_token + refresh_token
2. POST /logout (refresh_token gönder)
3. POST /refresh (aynı refresh_token)
   ❌ Expected: 401 "Token has been revoked"
```

### 2. Parola Değişimi
```bash
1. Login → refresh_token_1
2. PUT /users/:id/password (yeni parola)
3. POST /refresh (refresh_token_1)
   ❌ Expected: 401 "Token has been revoked"
```

### 3. Emergency Revoke
```bash
1. Admin: POST /admin/users/:id/revoke-tokens
2. User: POST /refresh
   ❌ Expected: 401 "Token has been revoked"
```

## 🚨 Hata Yönetimi

| Senaryo | Response | HTTP Code |
|---------|----------|-----------|
| Blacklist'te token | "Token has been revoked" | 401 |
| Invalid JWT | "Invalid or expired token" | 401 |
| DB error | "Token validation failed" | 401 |
| Expired TTL | Auto-deleted from DB | - |

## 📝 Audit Logging

Her işlem kaydedilir:
- User logout
- Token revoke
- Parola değişimi (tüm token'lar revoke)
- Admin token revoke
- TTL cleanup

## 🔗 İlgili Files

```
server/
├── models/
│   ├── TokenBlacklist.js (✨ YENİ)
│   └── index.js (güncellenmiş)
├── services/
│   ├── token.service.js (✨ YENİ)
│   └── user.service.js (güncellenmiş)
├── middlewares/
│   ├── tokenValidation.js (✨ YENİ)
│   └── auth.js (kullanılıyor)
├── controllers/
│   ├── auth.js (güncellenmiş)
│   └── admin.js (güncellenmiş)
├── routes/
│   ├── auth.js (güncellenmiş)
│   └── admin.js (güncellenmiş)
├── utils/
│   └── jwt.js (güncellenmiş)
├── scripts/
│   └── cleanupBlacklist.js (✨ YENİ)
└── .env.example (güncellenmiş)
```

## ✅ Checklist

- [x] TokenBlacklist model oluştur
- [x] Token service oluştur
- [x] JWT utils güncelle (blacklist check)
- [x] Auth controller güncelle (logout + refresh)
- [x] User service güncelle (parola değişimi)
- [x] Admin endpoints ekle
- [x] Middleware oluştur
- [x] Cleanup script oluştur
- [x] Dokumentasyon yaz
- [ ] Tests yaz
- [ ] Frontend'de logout implement et
- [ ] Production deployment

## 🎯 Sonraki Adımlar

1. **Tests Yazma**
   ```bash
   npm test -- auth.test.js
   npm test -- token.service.test.js
   ```

2. **Redis Integration** (Opsiyonel)
   - Performans iyileştirmesi için

3. **Frontend Update**
   - Logout endpoint'e refresh_token gönder
   - Token refresh logicini implement et

4. **Monitoring**
   - Blacklist entry sayısını monit et
   - Cleanup job'ı kontrol et

## 📞 Support

Sorular veya sorunlar için:
- Backend team'e başvur
- `server/services/token.service.js` dökümantasyonunu oku
- Tests çalıştır: `npm test`

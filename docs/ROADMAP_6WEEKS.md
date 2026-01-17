# 🗺️ TravelSync Entegre Yol Haritası

**Süre:** 6 Hafta  
**Strateji:** Backend ve Frontend paralel geliştirme  
**Hedef:** Almanya pazarında satılabilir bir ürün

---

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Faz 1: Güvenlik ve Temel (Hafta 1-2)](#faz-1-güvenlik-ve-temel-hafta-1-2)
3. [Faz 2: Almanya Uyumu (Hafta 3-4)](#faz-2-almanya-uyumu-hafta-3-4)
4. [Faz 3: Büyüme Özellikleri (Hafta 5-6)](#faz-3-büyüme-özellikleri-hafta-5-6)
5. [Teknik Aksiyon Listesi](#teknik-aksiyon-listesi)
6. [Sonraki Adımlar](#sonraki-adımlar)

---

## Genel Bakış

```
Hafta 1-2          Hafta 3-4          Hafta 5-6
┌──────────┐      ┌──────────┐      ┌──────────┐
│   FAZ 1  │ ──▶  │   FAZ 2  │ ──▶  │   FAZ 3  │
│ Güvenlik │      │  Almanya │      │  Büyüme  │
│ + Temel  │      │  Uyumu   │      │Özellikleri│
└──────────┘      └──────────┘      └──────────┘
     │                  │                  │
     ▼                  ▼                  ▼
 ✅ Güvenli API    ✅ GoBD Rapor     ✅ Flash Offer
 ✅ Login/Register ✅ PMS Connector  ✅ WhatsApp
 ✅ Auth State     ✅ Wizard Setup   ✅ Mobil UI
```

---

## Faz 1: Güvenlik ve Temel (Hafta 1-2)

> **Hedef:** Sistemi saldırılara karşı korumalı hale getirmek ve Frontend iskeletini kurmak.

### Backend Görevleri

| Görev | Dosya | Detay |
|-------|-------|-------|
| 🛡️ **Güvenlik Kalkanı** | `server/server.js` | `express-rate-limit`, `express-mongo-sanitize`, `xss-clean` eklenmeli |
| 🧹 **Controller Temizliği** | `server/controllers/reservation.js` | İş mantığı → service'e taşınmalı, `asyncHandler` kullanılmalı |

### Frontend Görevleri

| Görev | Klasör | Detay |
|-------|--------|-------|
| 🏗️ **Proje Kurulumu** | `frontend/` | Tailwind CSS + Shadcn/UI entegrasyonu |
| 🔐 **Auth & State** | `frontend/src/store/` | Redux Toolkit ile `authSlice`, sade Login/Register |

### Çıktılar

- [x] Güvenli bir API (rate limit, sanitization)
- [x] Çalışan Login/Register ekranı
- [x] Sihirbaz mantığına uygun sade tasarım

---

## Faz 2: Almanya Uyumu (Hafta 3-4)

> **Hedef:** Rakiplerde olmayan "Yerel Uyumluluk" özelliklerini eklemek.

### Backend Görevleri

| Görev | Dosya | Detay |
|-------|-------|-------|
| 📄 **GoBD PDF Motoru** | `server/services/pdf.service.js` | `audit.service.js` verilerinden değiştirilemez PDF (jsPDF) |
| 🔌 **PMS Connector** | `server/services/pms.service.js` | Protel/SIHOT simülasyonu (gerçek entegrasyon öncesi) |

### Frontend Görevleri

| Görev | Dosya | Detay |
|-------|-------|-------|
| 🧙 **Kurulum Sihirbazı** | `frontend/src/components/Wizard/` | 3 adım: Otel → PMS → Eşleştirme |
| 📋 **GoBD Paneli** | `frontend/src/pages/dashboard/` | Büyük yeşil "Vergi Raporu İndir" butonu |

### Çıktılar

- [x] "Vergi dairesinden korkmuyorum" dedirten raporlama
- [x] Kolay kurulum ekranı (Wizard)
- [x] PMS bağlantı altyapısı

---

## Faz 3: Büyüme Özellikleri (Hafta 5-6)

> **Hedef:** Otelciye para kazandıracak "Flaş İndirim" özelliğini eklemek.

### Backend Görevleri

| Görev | Dosya | Detay |
|-------|-------|-------|
| 📱 **WhatsApp Motoru** | `server/services/whatsapp.service.js` | Twilio / WhatsApp Cloud API |
| ⚡ **Flash Offer API** | `server/controllers/flashOffer.js` | Acentelere WhatsApp mesajı atan endpoint |

### Frontend Görevleri

| Görev | Dosya | Detay |
|-------|-------|-------|
| 🚨 **Flash İndirim UI** | `frontend/src/components/FlashOffer/` | "Acil Oda Sat" butonu + modal |
| 📲 **Mobil Optimizasyon** | Tüm sayfalar | Responsive test, tek tıkla rezervasyon |

### Çıktılar

- [x] Otelcinin cebinden oda satabildiği sistem
- [x] Acentenin WhatsApp'tan oda alabildiği akış
- [x] Mobil-first deneyim

---

## Teknik Aksiyon Listesi

### 1. server/server.js - Güvenlik Güncellemesi

```javascript
// ============================================
// GÜVENLİK KATMANI - EKLENMESİ GEREKEN KODLAR
// ============================================

const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

// Rate Limiting - API koruma
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // IP başına 100 istek
  message: {
    success: false,
    message: 'Çok fazla istek gönderildi, lütfen 15 dakika bekleyin.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware sırası
app.use(helmet()); // Zaten var - yapılandırılmalı
app.use('/api/', limiter); // YENİ
app.use(mongoSanitize()); // YENİ - NoSQL injection
app.use(xss()); // YENİ - XSS koruması
```

### 2. Dashboard Yeniden Tasarımı

```
┌─────────────────────────────────────────────────────────────┐
│  TravelSync Dashboard                           🔔  👤      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ 🚨              │  │ 📄              │  │ 🔗          │ │
│  │ FLAŞ İNDİRİM   │  │ GoBD RAPORU    │  │ PMS         │ │
│  │ BAŞLAT         │  │ İNDİR          │  │ SENKRONİZE  │ │
│  │                │  │                │  │             │ │
│  │ [Kırmızı]      │  │ [Yeşil]        │  │ [Mavi]      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│                                                             │
│  ────────────────────────────────────────────────────────── │
│                                                             │
│  📊 Bugünün Özeti                                           │
│  ┌──────────────┬──────────────┬──────────────┐            │
│  │ 🛎️ Giriş     │ 🚪 Çıkış     │ 📈 Doluluk  │            │
│  │    12        │    8         │    78%       │            │
│  └──────────────┴──────────────┴──────────────┘            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3. PDF Servisi Kurulumu

```bash
# Gerekli paket
npm install pdfmake
```

```javascript
// server/services/pdf.service.js
const PdfPrinter = require('pdfmake');

class PdfService {
  async generateGoBDReport(organizationId, dateRange) {
    // 1. AuditLog verilerini çek
    const auditLogs = await AuditLog.find({
      organization_id: organizationId,
      created_at: { $gte: dateRange.start, $lte: dateRange.end }
    }).sort({ created_at: 1 });

    // 2. PDF oluştur
    const docDefinition = {
      content: [
        { text: 'GoBD Uyumlu Rapor', style: 'header' },
        { text: `Oluşturma: ${new Date().toISOString()}` },
        // ... log tablosu
      ],
      styles: { header: { fontSize: 18, bold: true } }
    };

    return printer.createPdfKitDocument(docDefinition);
  }
}
```

---

## Sonraki Adımlar

### Hemen Başlanacaklar (Faz 1)

| # | Görev | Öncelik | Tahmini Süre |
|---|-------|---------|--------------|
| 1 | `server.js` güvenlik eklemeleri | 🔴 P0 | 2 saat |
| 2 | `reservation.js` refactoring | 🔴 P0 | 4 saat |
| 3 | Frontend proje yapılandırması | 🟠 P1 | 3 saat |
| 4 | Auth sayfaları (Login/Register) | 🟠 P1 | 6 saat |

### Kurulacak Paketler

```bash
# Backend güvenlik paketleri
npm install express-rate-limit express-mongo-sanitize xss-clean

# PDF oluşturma
npm install pdfmake jspdf

# WhatsApp entegrasyonu (Faz 3)
npm install twilio
```

---

## 📅 Haftalık Takip Tablosu

| Hafta | Backend | Frontend | Test | Milestone |
|-------|---------|----------|------|-----------|
| 1 | 🔴 Güvenlik | 🟠 Proje kurulumu | - | Güvenli API |
| 2 | 🔴 Refactoring | 🟠 Auth sayfaları | - | Login/Register çalışıyor |
| 3 | 🟠 PDF Service | 🟠 Wizard | - | GoBD raporu indirilir |
| 4 | 🟠 PMS Connector | 🟠 Dashboard | - | Wizard tamamlandı |
| 5 | 🟡 WhatsApp | 🟡 Flash Offer UI | - | WhatsApp gönderilir |
| 6 | 🟡 Flash API | 🟡 Mobil test | 🔴 E2E | MVP hazır |

---

## ✅ Başarı Kriterleri

| Faz | Kriter | Ölçüm |
|-----|--------|-------|
| 1 | API güvenli | Rate limit çalışıyor, injection koruması aktif |
| 1 | Auth çalışıyor | Kullanıcı giriş/kayıt yapabiliyor |
| 2 | GoBD raporu | PDF indirilebiliyor, değiştirilemez format |
| 2 | Kurulum kolay | Wizard 3 adımda tamamlanıyor |
| 3 | Flash Offer | WhatsApp mesajı acentelere ulaşıyor |
| 3 | Mobil deneyim | Tüm sayfalar responsive |

---

**Son Güncelleme:** 15 Ocak 2026  
**Versiyon:** 2.0 (6 Haftalık Plan)  
**Durum:** Aktif - Faz 1 Başlangıcı

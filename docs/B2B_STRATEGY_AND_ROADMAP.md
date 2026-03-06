# 🚀 TravelSync: B2B Architecture, Strategy & Vision Report

**Tarih:** 24 Şubat 2026  
**Odak:** B2B Acente - Otel Köprülemesi, Küçük İşletme İhtiyaçları, GoBD Uyumluluğu ve 2026 Trendleri

---

## 1. Stratejik Konumlandırma & Vizyon
TravelSync, sıradan bir rezervasyon sistemi veya B2C pazaryeri değildir. **TravelSync, Oteller (Tedarikçi) ile Acenteleri (Satıcı) birbirine bağlayan "Akıllı Stok ve Profesyonel Teklif (B2B Bridge)" motorudur.**
Küçük otellerin ve yerel acentelerin dijitalleşememe sorununu çözen, minimalist, teknolojik ve Avrupa/Almanya yasal süreçlerine (GoBD) %100 uyumlu bir altyapı sunar.

### Satış Akışı: Acenta Kendi Markasıyla Nasıl Satış Yapar?
En sık sorulan soru: *"Bizim satışımız nerede olacak?"*
**TravelSync, son kullanıcıya (B2C) satış yapmaz.** Acente, TravelSync platformunu kullanarak otel stoklarına ulaşır, üzerine kendi kâr marjını koyar ve otel odasını ya da özel "Paket (Oda + Uçak + Transfer)" teklifini oluşturur.

Satış tamamen **Acentenin kendi kanallarından** gerçekleşir:
- **Kendi Web Sitesi:** TravelSync API veya Widget entegrasyonu ile.
- **Ajans İçi (Ofis) & Telefon:** Müşteriyle yüz yüze veya telefonda anında PDF teklifi oluşturarak.
- **WhatsApp Business:** Sistemden tek tıkla müşteriye özel link / PDF göndererek.
- **Sosyal Medya (Instagram vb.):** Hızlı kampanya (Flash Offer) görsellerini paylaşarak.
Acente kendi markasını büyütür, TravelSync arka planda kusursuz bir operasyon ve teklif yönetimi sağlar.

---

## 2. Teknik Mimari (Tech Stack)
Yatırımcı ve teknik ekipler için uygulamanın iskeleti en modern ve güvenilir teknolojilerle oluşturulmuştur:
- **Backend Environtment:** Node.js (v20+) & Express.js. Asenkron mimari ile saniyede binlerce isteği bloklanmadan işleyebilir.
- **Database:** MongoDB. (Hybrid Data Model).
- **Core Technologies:** CommonJS modül yapısı.
- **Frontend / Client:** React (Next.js - planlanmış) ve TailwindCSS kombinasyonu ile minimalist, hızlı dashboard'lar.
- **PDF Engine:** Sunucu tarafında ağır dependency (Puppeteer vs) olmadan saniyeler içinde Native PDF (pdfmake) üretimi.
Backend altyapısının **%85'i halihazırda tamamlanmış**, test edilebilir (Reservation, Package Builder, Security) durumdadır.

---

## 3. Fiyatlandırma Stratejisi (Pricing Model)
Tedarikçiyi (Oteli) sisteme ücretsiz çekerek satıcı (Acente) havuzunu büyütmeye dayalı, Almanya pazarında kanıtlanmış "Freemium / Tiered" ödeme modeli:

| Plan | Hedef Kitle | Aylık Ücret | İçerik / Limitler |
|---|---|---|---|
| **Hotel Free** | Tüm Oteller | **€0** | Sınırsız stok ve fiyat yayınlama, temel acente ağına erişim. |
| **Basic** | Yerel Acenteler | **€49/ay** | Sınırsız arama, anında tekil PDF teklifi oluşturma, temel raporlar. |
| **Pro** | Gelişen Acenteler | **€99/ay** | Package Builder (Oda+Uçuş), Flash Offer Push bildirimleri, Komisyon Raporları. |
| **Enterprise** | Büyük Tur Operatörleri | **€199/ay** | Kendi sitesine White-label API entegrasyonu, özel PMS entegrasyon desteği. |

*Bu model, otel sayısının hızla artmasını sağlayarak acenteler için platformu vazgeçilmez kılar.*

---

## 4. Başarı Metrikleri (KPI & 2026 Hedefleri)
Projenin başarıya ulaştığını kanıtlamak için 3-6-12 aylık hedefler:

1. **Giriş (3. Ay Sonu):** 
   - 30 Otel + 15 Acenta (Türkiye veya Almanya Pilot Bölge)
   - *Hedef:* Sistemin hatasız çalıştığını sahada kanıtlamak.
2. **Büyüme (6. Ay Sonu):** 
   - 80 Otel + 40 Acenta
   - *Hedef:* Basic ve Pro paket satışlarının başlaması, MRR (Aylık Düzenli Gelir) oluşumu.
3. **Ölçeklenme (12. Ay Sonu):**
   - 200 Otel + 100 Acenta
   - *Hedef MRR:* Minimum **€35.000 - €45.000** bandına oturması.

---

## 5. GoBD & DSGVO (GDPR) Uyumu
Özellikle DACH (Almanya, Avusturya, İsviçre) bölgesinde en kritik gereklilik yasal uyumdur.
- **GoBD Uyumu:** Sistemdeki tüm işlemler (rezervasyon, iptal, fiyat değişimi) `audit_logs` koleksiyonu ile **değiştirilemez (immutable)** şekilde tutulur. İstendiğinde mali müşavir veya vergi dairesi için tek tıkla SHA-256 hash imzalı, değiştirilmemiş GoBD sertifikalı PDF dökümü alınır.
- **DSGVO Uyumu:** Seyahat edenlerin kişisel verileri şifrelenir (Encryption), "unutulma hakkı" çerçevesinde anonimize edilerek silinir (Hard delete yerine Data Masking).

---

## 6. Riskler ve Mitigasyon (Risk Planı)

| Risk Sınıfı | Olası Senaryo | Mitigasyon (Çözüm) Stratejisi |
|---|---|---|
| **Teknik** | Mevcut PMS (Protel vb.) sistemleriyle entegrasyon süresinin uzaması. | API yazılana kadar oteller için "Extranet (Manuel Panel)" kullanılabilir tutuldu. |
| **Ticari / Churn** | Acentelerin veya otellerin platformu aktif kullanmayı bırakması. | "Checkout Feedback" ve "Flash Offer WhatsApp" gibi otomasyonlarla kullanıcıya sürekli satış ve yorum kazandırarak platforma bağımlı kılmak. |
| **Rekabet** | Hotelbeds, Traffics gibi devlerin pazarı kapatması. | Devlerin hantal yapısına karşı, küçük acenteye **Özel PDF Teklif Motoru** ve **Paketleme Sihirbazı** gibi butik hizmetler vererek niş bir sadakat oluşturmak. |

### Kısa Rekabet Karşılaştırması
- **Traffics / Bewotec:** Çok büyük, entegrasyonu aylar süren, pahalı ve eskimiş arayüzler.
- **TravelSync:** 24 saatte kurulabilen, SaaS tabanlı, mobil dostu (WhatsApp entegre), modern Node/React mimarisi ile uçan hız.

---

## 7. Güncellenmiş 6 Haftalık Odaklı "Development Roadmap"

- **[x] Hafta 1-2:** Foundation & Core Inventory (MongoDB modelleri, JWT, Temel CRUD, Security Hardening).
- **[x] Hafta 3:** Acente-Otel Bağlantısı, Rezervasyon Opsiyonlama (Hold/Lock işlemleri ve Auto-Expire Cron).
- **[x] Hafta 4:** Package Builder (PDF Teklif Motoru) ve Otomatik Check-Out Feedback Emailleri. Müşteri tutundurma.
- **[x] Hafta 5 (GÜNCEL):** Sürdürülebilirlik Puanı (Yeşil Otel özellikleri, Karbon Filtreleri). 2026 Trendlerinin adaptasyonu.
- **[ ] Hafta 6:** Frontend Admin Panel entegrasyonları, White-label Agency API uçlarının dokümantasyonu ve Canlıya Çıkış (Deployment - Render/AWS).

🚀 *Bu evrak, teknik ekibin, satış yöneticilerinin ve potansiyel yatırımcıların rehberidir.*

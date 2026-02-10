# 🏨 TravelSync — Hotel Automation Platform

### AI-Powered B2B Hotel Management & Dynamic Pricing

![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js)
![Express](https://img.shields.io/badge/Express-4.18-000000?style=for-the-badge&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?style=for-the-badge&logo=mongodb)
![Mongoose](https://img.shields.io/badge/Mongoose-8-880000?style=for-the-badge&logo=mongoose)
![JWT](https://img.shields.io/badge/JWT-Auth-FB015B?style=for-the-badge&logo=jsonwebtokens)
![Redis](https://img.shields.io/badge/Redis-Caching-DC382D?style=for-the-badge&logo=redis)
![Zod](https://img.shields.io/badge/Zod-Validation-3068B7?style=for-the-badge&logo=zod)
![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

**Enterprise-grade hotel automation platform** for hotels and travel agencies.  
Intelligent reservation management, AI-powered dynamic pricing, and automated B2B workflows — all in one backend.

[🌐 Live API](https://travelsync-backend.onrender.com) · [📖 Documentation](#-documentation) · [️ Security](#%EF%B8%8F-security) · [🗺️ Roadmap](#%EF%B8%8F-roadmap)

---

## 🎬 Demo

<p align="center">
  <video src="./assets/demo.mp4" width="720" controls>
    Your browser does not support the video tag.
  </video>
</p>

<!-- Video dosyanızı docs/assets/demo.mp4 olarak yerleştirin -->
<!-- Desteklenen formatlar: .mp4, .webm, .mov -->

---

## 🎯 What is TravelSync?

TravelSync is a **B2B SaaS platform** that eliminates manual workflows in the tourism industry. It connects hotels and travel agencies through a centralized, AI-driven backend — reducing operational costs, optimizing revenue, and streamlining daily operations.

| Problem | TravelSync Solution |
|---|---|
| ❌ Manual reservation tracking | ✅ Centralized booking engine with status workflows |
| ❌ Inefficient pricing decisions | ✅ AI-powered dynamic pricing (occupancy, season, demand) |
| ❌ Time-consuming agency contracts | ✅ Automated B2B contract & commission management |
| ❌ Disconnected systems | ✅ Single API for properties, rooms, rates & inventory |

---

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 🏢 Multi-Tenant Architecture
- Organization-based data isolation (HOTEL / AGENCY)
- Multi-property support for hotel chains
- Role-based access control (admin, staff)

### 🛏️ Property & Room Management
- Hotel profiles, star ratings, amenities
- Room type templates (Standard, Deluxe, Suite)
- Capacity, bed configuration, quantity tracking

### 💰 Dynamic Pricing AI
- AI suggestions based on occupancy & seasonality
- Day-of-week & historical demand analysis
- Confidence scoring & revenue impact calculations
- Bulk price updates for date ranges

</td>
<td width="50%">

### 📦 Inventory & Availability
- Real-time allotment tracking per room type
- Stop-sell controls & overbooking prevention
- Automatic updates on booking / cancellation

### 📅 Reservation Engine
- Full lifecycle: create → confirm → check-in → check-out
- Idempotent bookings (duplicate prevention)
- Multi-channel source tracking (direct, OTA, agency)
- Transaction-based with MongoDB sessions

### 🏢 Agency & B2B Module
- Agency registration & profile management
- Contract management with commission tracking
- B2B booking workflows & performance analytics

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js 20 LTS |
| **Framework** | Express.js 4.18 (CommonJS) |
| **Database** | MongoDB 8 + Mongoose 8 ODM |
| **Authentication** | JWT (access + refresh tokens) |
| **Validation** | Zod, express-validator |
| **Security** | Helmet, CORS, bcrypt, express-mongo-sanitize, hpp, xss-clean |
| **Rate Limiting** | express-rate-limit + Redis (ioredis) |
| **Logging** | Morgan (HTTP) + Winston (application) |
| **Email** | Nodemailer |
| **Payments** | Stripe |
| **PDF** | pdfmake |
| **Testing** | Jest + Supertest + mongodb-memory-server |
| **Code Quality** | ESLint + Prettier |



## 📡 API Overview


All protected endpoints require a JWT token:
```
Authorization: Bearer <access_token>
```

| Module | Endpoints | Description |
|---|---|---|
| **Auth** | `POST /auth/register` · `login` · `refresh` · `logout` · `GET /auth/me` | Registration, login, token management |
| **Properties** | `GET` · `POST` · `PUT` · `DELETE /properties` | Hotel CRUD operations |
| **Room Types** | `GET` · `POST` · `PUT` · `DELETE /room-types` | Room template management |
| **Rate Plans** | `GET` · `POST` · `PUT` · `DELETE /rate-plans` | Pricing strategy management |
| **Prices** | `GET /prices` · `PUT /prices/bulk` | Daily rate & bulk updates |
| **Inventory** | `GET` · `PUT /inventory/bulk` · `POST /inventory/check` | Availability & allotment control |
| **Reservations** | `GET` · `POST` · `PUT` · `cancel` · `check-in` · `check-out` | Full booking lifecycle |
| **Agencies** | `GET` · `POST` · `PUT` · `DELETE /agencies` | Travel agency management |
| **Contracts** | `GET` · `POST` · `PUT` · `DELETE` · `activate` · `suspend` | B2B contract management |
| **AI Pricing** | `POST /ai/pricing/suggestions` · `apply` · `GET analytics` | AI-driven price optimization |

> [!NOTE]
> For detailed request/response schemas, see [API_DESIGN.md](./API_DESIGN.md).

---


### Data Models (11)

| Model | Purpose |
|---|---|
| `Organization` | Multi-tenant root entity (HOTEL / AGENCY) |
| `User` | Staff accounts with role-based access |
| `Property` | Hotel profiles & configurations |
| `RoomType` | Room templates (capacity, amenities) |
| `RatePlan` | Pricing strategies (BAR, NRF, meal plans) |
| `Price` | Daily rates with AI source tracking |
| `Inventory` | Real-time availability per room type |
| `Reservation` | Bookings with full lifecycle |
| `Agency` | Travel agency profiles |
| `AgencyContract` | Hotel ↔ Agency contracts & commissions |
| `AuditLog` | Activity tracking for compliance |

---

## 🛡️ Security

| Feature | Status | Details |
|---|---|---|
| JWT Authentication | ✅ | Access + refresh token flow |
| Password Hashing | ✅ | bcrypt with salt rounds |
| Security Headers | ✅ | Helmet middleware |
| CORS Protection | ✅ | Configurable allowed origins |
| Input Sanitization | ✅ | express-mongo-sanitize, xss-clean |
| Rate Limiting | ✅ | express-rate-limit + Redis backend |
| HPP Protection | ✅ | HTTP parameter pollution prevention |
| Multi-Tenant Isolation | ✅ | Organization-based data separation |
| Audit Logging | ✅ | Critical operation tracking |
| Idempotency | ✅ | Duplicate operation prevention |

> [!IMPORTANT]
> Never commit your `.env` file. Use strong, random secrets (min 32 chars) and rotate JWT keys regularly.

---


```

| Phase | Focus | Status |
|---|---|---|
| **Phase 1** | Backend MVP — Models, APIs, Auth, AI Pricing | ✅ Complete |
| **Phase 2** | Analytics & Reporting — Dashboard, occupancy, revenue | 🔄 In Progress |
| **Phase 3** | Frontend — React + TypeScript + Tailwind | ⏳ Planned |
| **Phase 4** | Integrations — Stripe, Email, SMS, PMS | ⏳ Planned |
| **Phase 5** | B2C Module — Traveler registration, trips, reviews | ⏳ Future |



## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](../LICENSE) file for details.

---

<p align="center">
  <b>Made with ❤️ for the tourism industry</b><br/>
  <sub>TravelSync — Automate. Optimize. Grow.</sub>
</p>

# 🏨 TravelSync - Hotel Automation Platform

> AI-powered hotel management platform with intelligent reservation management, dynamic pricing, and automated workflows for B2B operations.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-4.18-lightgrey)](https://expressjs.com/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Current Status](#current-status)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Roadmap](#roadmap)
- [Documentation](#documentation)

---

## 🎯 Overview

TravelSync is a **B2B SaaS platform** designed to automate manual workflows in the tourism industry. The platform focuses on hotels and travel agencies, eliminating repetitive tasks through intelligent automation.

### The Problem

Hotels and travel agencies waste countless hours on:
- ❌ Manual reservation tracking across multiple channels
- ❌ Inefficient pricing decisions (missing revenue opportunities)
- ❌ Time-consuming agency contract management
- ❌ Disconnected systems (PMS, spreadsheets, email)

### The Solution

TravelSync provides:
- ✅ **Centralized Dashboard** - Manage all reservations and properties in one place
- ✅ **Dynamic Pricing AI** - AI-powered price suggestions based on occupancy, season, and demand
- ✅ **Agency Management** - B2B contracts, commissions, and booking automation
- ✅ **Analytics** - Real-time insights on occupancy, revenue, and trends
- ✅ **Automation** - Reduce manual work by 50%+ with smart workflows

---

## 📊 Current Status

**Version:** 1.0.0 (Backend MVP)
**Progress:** 80% Complete
**Last Updated:** December 26, 2025

### ✅ Completed Features

#### Core Infrastructure (100%)
- ✅ Express.js server with CommonJS
- ✅ MongoDB connection with Mongoose
- ✅ Multi-tenant architecture (Organization-based)
- ✅ JWT authentication & authorization
- ✅ Error handling & logging
- ✅ CORS, Helmet, compression middleware

#### Database & Models (100%)
11 production-ready models:
- ✅ Organization (Multi-tenant)
- ✅ User (Staff accounts with roles)
- ✅ Property (Hotels)
- ✅ RoomType (Room templates)
- ✅ RatePlan (Pricing strategies)
- ✅ Price (Daily rates with timezone support)
- ✅ Inventory (Availability tracking)
- ✅ Reservation (Bookings with transactions)
- ✅ Agency (Travel agencies)
- ✅ AgencyContract (Hotel-Agency contracts)
- ✅ AuditLog (Activity tracking)

#### API Endpoints (100%)
- ✅ Authentication (register, login, refresh, logout)
- ✅ Property management (CRUD)
- ✅ Room type management (CRUD)
- ✅ Rate plan management (CRUD)
- ✅ Price management (bulk updates)
- ✅ Inventory management (allotment, stop-sell)
- ✅ Reservation management (create, cancel, check-in/out)
- ✅ Agency management (CRUD, contracts)
- ✅ Agency contract management (commission tracking)

#### AI Features (50%)
- ✅ Dynamic Pricing AI (baseline model)
- ✅ Occupancy-based pricing
- ✅ Seasonality detection
- ✅ Day-of-week pricing
- ✅ Historical demand analysis
- ⏳ ML model (planned)

#### Code Quality (80%)
- ✅ TypeScript cleanup completed
- ✅ Duplicate index fixes
- ✅ Agency-Hotel relationship fixes
- ⏳ Code refactoring (planned)
- ⏳ Helper functions (planned)

### ⏳ In Progress / Planned

#### High Priority
- [ ] **Code Refactoring** - Response helpers, error handler middleware, async handler
- [ ] **MongoDB Replica Set** - For transaction support
- [ ] **Security Hardening** - Rate limiting, input sanitization, CORS whitelist
- [ ] **Postman Collection** - API testing suite

#### Medium Priority
- [ ] Analytics & Reporting endpoints
- [ ] Email notifications (Resend/Nodemailer)
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Unit & integration tests

#### Low Priority
- [ ] Frontend (React + TypeScript + Tailwind)
- [ ] Advanced AI pricing (ML model)
- [ ] Real-time notifications

### ❌ Not Included in MVP
- **B2C (Traveler) Module** - Postponed to Phase 4
  - Skeleton models created but routes are disabled
  - Focus is on B2B (Hotels + Agencies)

---

## ✨ Features

### MVP Features (Current Focus)

#### 🏢 Multi-tenant Architecture
- Organization-based separation (HOTEL/AGENCY types)
- Logical data isolation with single database
- Multi-property support for hotel chains
- Role-based access control (admin, staff)

#### 🏨 Property Management
- Hotel profile management (name, location, amenities)
- Multi-property support within organization
- Star rating, property type classification
- Check-in/out times, cancellation policies

#### 🛏️ Room Type Management
- Room templates (Standard, Deluxe, Suite)
- Capacity, bed configuration, amenities
- Total quantity tracking per type
- Professional categorization (code + name)

#### 💰 Rate Plan Management
- Multiple pricing strategies (BAR, NRF)
- Meal plan options (RO, BB, HB, FB, AI)
- Cancellation policies (flexible, strict, non-refundable)
- Derived rate plans with percentage adjustments
- Min/max night restrictions

#### 💵 Dynamic Pricing AI
- Daily price management per room type + rate plan
- Bulk price updates for date ranges
- **AI-powered price suggestions** based on:
  - Occupancy levels (high/medium/low)
  - Seasonality (summer, winter, holidays)
  - Day of week (weekend premium)
  - Historical demand patterns
- Confidence scoring for suggestions
- Price source tracking (MANUAL vs AI)
- Revenue impact calculations

#### 📦 Inventory Management
- Real-time availability tracking
- Allotment management per room type
- Stop-sell controls
- Automatic inventory updates on booking/cancellation
- **Overbooking prevention** with transaction support

#### 📅 Reservation Management
- Create, view, update, cancel reservations
- Guest information management
- Check-in/check-out workflows
- **Idempotent booking** (prevent duplicates)
- Status tracking (pending, confirmed, checked-in, checked-out, cancelled)
- Multi-channel source tracking (direct, phone, email, OTA, agency)
- **Transaction-based booking** (MongoDB sessions)
- Commission tracking for agency bookings
- Price calculation with timezone support

#### 🏢 Agency Management
- Agency registration & profile management
- Hotel-Agency contract management
- Commission rate & payment terms
- Contract validity periods
- **B2B booking workflows**
- Agency statistics & performance tracking

#### 🔐 Security & Compliance
- JWT-based authentication
- Role-based authorization
- Password hashing (bcrypt)
- Audit logging for critical operations
- Idempotency support
- Multi-tenant data isolation
- CORS protection
- Security headers (Helmet)

### 🚀 Upcoming Features

#### Phase 1: Code Quality & Security (1-2 weeks)
- Response helper utilities
- Error handler middleware
- Async handler wrapper
- Input validation & sanitization
- Rate limiting (express-rate-limit + Redis)
- Security middleware consolidation

#### Phase 2: Analytics & Reporting (2-3 weeks)
- Dashboard overview (arrivals, departures, revenue)
- Occupancy reports (daily, weekly, monthly)
- Revenue reports with trends
- ADR (Average Daily Rate) calculation
- RevPAR (Revenue per Available Room)
- Booking source analysis

#### Phase 3: Integrations (4-6 weeks)
- Email service (Resend/SendGrid)
- Payment gateways (Stripe)
- SMS notifications (Twilio)
- PMS integrations (optional)

---

## 🛠 Tech Stack

### Backend (Current Implementation)
- **Runtime:** Node.js 20 LTS
- **Framework:** Express.js (CommonJS)
- **Database:** MongoDB 7.0 with Mongoose ODM
- **Authentication:** JWT (access + refresh tokens)
- **Security:** Helmet, CORS, bcrypt, express-validator
- **Logging:** Morgan (HTTP) + Winston (application)
- **Compression:** compression middleware
- **Utilities:** date-fns, validator

### Planned Additions
- **Caching:** Redis (Upstash) for rate limiting & sessions
- **Email:** Resend or Nodemailer
- **Testing:** Jest + Supertest
- **Documentation:** Swagger/OpenAPI
- **Monitoring:** Sentry (error tracking)

### Infrastructure
- **Database:** MongoDB Atlas (M0 free tier or M10)
- **Replica Set:** Required for transactions
- **Backend Hosting:** Railway or Render
- **Cache:** Upstash Redis (free tier)
- **Email:** Resend (free tier)

### Development Tools
- **Version Control:** Git + GitHub
- **API Testing:** Postman
- **Database GUI:** MongoDB Compass
- **Code Quality:** ESLint + Prettier
- **Container:** Docker + Docker Compose (optional)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 20+** ([Download](https://nodejs.org/))
- **MongoDB 7.0+** - Local or [Atlas](https://www.mongodb.com/cloud/atlas)
  - ⚠️ **Replica Set required** for transactions
- **Git**
- **MongoDB Compass** (optional, for database GUI)

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/travelsync-backend.git
cd travelsync-backend
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Environment Setup

Create `.env` file in the root directory:

```env
# Server
NODE_ENV=development
PORT=8000

# Database (MongoDB Replica Set for transactions)
MONGODB_URI=mongodb://localhost:27017,localhost:27018,localhost:27019/travelsync?replicaSet=rs0
# Or use MongoDB Atlas (automatically uses replica set):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/travelsync

# JWT
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars-long
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS (comma-separated origins)
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Rate Limiting (future)
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Email (future)
# RESEND_API_KEY=your-resend-api-key
# FROM_EMAIL=noreply@travelsync.io
```

#### 4. Database Setup

**Option A: MongoDB Atlas (Recommended for production)**

1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create M0 (free) or M10 cluster
3. Create database user
4. Whitelist IP (0.0.0.0/0 or specific IPs)
5. Get connection string
6. Update `MONGODB_URI` in `.env`

**Option B: Local MongoDB with Replica Set**

See [docs/MONGODB_TRANSACTIONS_REPLICA_SET.md](./MONGODB_TRANSACTIONS_REPLICA_SET.md) for detailed setup.

Quick setup with Docker:
```bash
# See docs/MONGODB_TRANSACTIONS_REPLICA_SET.md for docker-compose.yml
docker-compose up -d
```

#### 5. Run the Application

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

#### 6. Verify Installation

- **Health Check:** http://localhost:8000/health
- **API Base:** http://localhost:8000/api/v1

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-26T10:00:00.000Z",
  "uptime": 123.45,
  "environment": "development"
}
```

#### 7. Create First Admin Account

Use Postman or curl:

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hotel.com",
    "password": "SecurePassword123!",
    "first_name": "John",
    "last_name": "Doe",
    "organization_name": "Grand Hotel",
    "organization_type": "HOTEL"
  }'
```

---

## 📁 Project Structure

```
travelsync-backend/
├── src/
│   ├── config/
│   │   └── database.js              # MongoDB connection
│   ├── controllers/
│   │   ├── base.js                  # BaseController (DRY pattern)
│   │   ├── auth.js                  # Authentication
│   │   ├── organization.js          # Organizations
│   │   ├── property.js              # Properties (Hotels)
│   │   ├── roomType.js              # Room Types
│   │   ├── ratePlan.js              # Rate Plans
│   │   ├── price.js                 # Prices
│   │   ├── inventory.js             # Inventory
│   │   ├── reservation.js           # Reservations
│   │   ├── agency.js                # Agencies
│   │   ├── agencyContract.js        # Agency Contracts
│   │   └── ai/
│   │       └── pricingAI.js         # AI Pricing
│   ├── middlewares/
│   │   ├── auth.js                  # JWT authentication
│   │   ├── asyncHandler.js          # Async error handler (planned)
│   │   └── errorHandler.js          # Error handler (planned)
│   ├── models/
│   │   ├── index.js                 # Model exports
│   │   ├── Organization.js          # Organizations
│   │   ├── User.js                  # Users
│   │   ├── Property.js              # Properties
│   │   ├── RoomType.js              # Room Types
│   │   ├── RatePlan.js              # Rate Plans
│   │   ├── Price.js                 # Prices
│   │   ├── Inventory.js             # Inventory
│   │   ├── Reservation.js           # Reservations
│   │   ├── Agency.js                # Agencies
│   │   ├── AgencyContract.js        # Agency Contracts
│   │   ├── AuditLog.js              # Audit Logs
│   │   ├── Payment.js               # Payments (B2C - disabled)
│   │   ├── Review.js                # Reviews (B2C - disabled)
│   │   ├── Traveler.js              # Travelers (B2C - disabled)
│   │   ├── Trip.js                  # Trips (B2C - disabled)
│   │   └── Wishlist.js              # Wishlists (B2C - disabled)
│   ├── routes/
│   │   ├── index.js                 # Route aggregator
│   │   ├── auth.js                  # Auth routes
│   │   ├── organization.js          # Organization routes
│   │   ├── property.js              # Property routes
│   │   ├── roomType.js              # Room type routes
│   │   ├── ratePlan.js              # Rate plan routes
│   │   ├── price.js                 # Price routes
│   │   ├── inventory.js             # Inventory routes
│   │   ├── reservation.js           # Reservation routes
│   │   ├── agency.js                # Agency routes
│   │   ├── agencyContract.js        # Agency contract routes
│   │   └── ai/
│   │       └── pricing.routes.js    # AI pricing routes
│   ├── services/
│   │   ├── reservation.service.js   # Reservation business logic
│   │   └── pricingAI.service.js     # AI pricing service
│   ├── utils/
│   │   ├── jwt.js                   # JWT utilities
│   │   ├── email.js                 # Email utilities (planned)
│   │   ├── password.js              # Password utilities
│   │   ├── response.js              # Response helpers (planned)
│   │   ├── validation.js            # Validation helpers (planned)
│   │   └── queryBuilder.js          # Query builder (planned)
│   └── server.js                    # Express app entry
├── docs/                            # Documentation
│   ├── README.md                    # This file
│   ├── PROJE_ANALIZ_VE_DEVAM_PLANI.md  # Detailed project plan
│   ├── ROADMAP.md                   # Development roadmap
│   ├── CODE_REFACTORING_PLAN.md     # Refactoring guide
│   ├── AI_INTEGRATION_SUMMARY.md    # AI pricing documentation
│   ├── MONGODB_TRANSACTIONS_REPLICA_SET.md  # Transaction setup
│   ├── TYPESCRIPT_CLEANUP_SUMMARY.md  # TypeScript cleanup notes
│   ├── AGENCY_HOTEL_FIXES_SUMMARY.md  # Agency fixes
│   ├── DUPLICATE_INDEX_FINAL_STATUS.md  # Index fixes
│   ├── DATABASE_SCHEMA.md           # Original schema
│   ├── DATABASE_SCHEMA_HYBRID.md    # Professional schema
│   ├── API_DESIGN.md                # API documentation
│   ├── TECH_STACK.md                # Technology decisions
│   └── PROJECT_CHARTER.md           # Project charter
├── .env.example                     # Example environment variables
├── .gitignore
├── package.json
└── README.md                        # Project overview
```

---

## 📡 API Documentation

### Base URL
```
Development: http://localhost:8000/api/v1
Production:  https://api.travelsync.io/v1
```

### Authentication

All protected endpoints require JWT token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

### Core Endpoints

**Authentication**
```http
POST   /api/v1/auth/register        # Register new hotel + admin
POST   /api/v1/auth/login           # Login
POST   /api/v1/auth/refresh         # Refresh access token
POST   /api/v1/auth/logout          # Logout
GET    /api/v1/auth/me              # Get current user
```

**Properties (Hotels)**
```http
GET    /api/v1/properties           # List properties
GET    /api/v1/properties/:id       # Get property
POST   /api/v1/properties           # Create property
PUT    /api/v1/properties/:id       # Update property
DELETE /api/v1/properties/:id       # Delete property
```

**Room Types**
```http
GET    /api/v1/room-types           # List room types
GET    /api/v1/room-types/:id       # Get room type
POST   /api/v1/room-types           # Create room type
PUT    /api/v1/room-types/:id       # Update room type
DELETE /api/v1/room-types/:id       # Delete room type
```

**Rate Plans**
```http
GET    /api/v1/rate-plans           # List rate plans
GET    /api/v1/rate-plans/:id       # Get rate plan
POST   /api/v1/rate-plans           # Create rate plan
PUT    /api/v1/rate-plans/:id       # Update rate plan
DELETE /api/v1/rate-plans/:id       # Delete rate plan
```

**Prices**
```http
GET    /api/v1/prices               # List prices (with filters)
PUT    /api/v1/prices/bulk          # Bulk update prices
```

**Inventory**
```http
GET    /api/v1/inventory            # List inventory
PUT    /api/v1/inventory/bulk       # Bulk update inventory
POST   /api/v1/inventory/check      # Check availability
```

**Reservations**
```http
GET    /api/v1/reservations         # List reservations
GET    /api/v1/reservations/:id     # Get reservation
POST   /api/v1/reservations         # Create reservation
PUT    /api/v1/reservations/:id     # Update reservation
POST   /api/v1/reservations/:id/cancel     # Cancel reservation
POST   /api/v1/reservations/:id/check-in   # Check-in
POST   /api/v1/reservations/:id/check-out  # Check-out
```

**Agencies**
```http
GET    /api/v1/agencies             # List agencies
GET    /api/v1/agencies/:id         # Get agency
POST   /api/v1/agencies             # Create agency
PUT    /api/v1/agencies/:id         # Update agency
DELETE /api/v1/agencies/:id         # Delete agency
```

**Agency Contracts**
```http
GET    /api/v1/agency-contracts     # List contracts
GET    /api/v1/agency-contracts/:id # Get contract
POST   /api/v1/agency-contracts     # Create contract
PUT    /api/v1/agency-contracts/:id # Update contract
DELETE /api/v1/agency-contracts/:id # Delete contract
POST   /api/v1/agency-contracts/:id/activate  # Activate
POST   /api/v1/agency-contracts/:id/suspend   # Suspend
```

**AI Pricing**
```http
POST   /api/v1/ai/pricing/suggestions  # Get AI price suggestions
POST   /api/v1/ai/pricing/apply        # Apply AI suggestions
GET    /api/v1/ai/pricing/analytics    # Get pricing analytics
```

For detailed API documentation, see [docs/API_DESIGN.md](./API_DESIGN.md)

---

## 🔒 Security

### Current Implementation

- ✅ **JWT Authentication** - Access + refresh tokens
- ✅ **Password Hashing** - bcrypt with salt rounds
- ✅ **Security Headers** - Helmet middleware
- ✅ **CORS Protection** - Configurable origins
- ✅ **Multi-tenant Isolation** - Organization-based data separation
- ✅ **Audit Logging** - Track critical operations
- ✅ **Idempotency** - Prevent duplicate operations

### Planned Security Enhancements

- [ ] **Rate Limiting** - Express-rate-limit + Redis store
- [ ] **Input Sanitization** - express-mongo-sanitize, xss-clean
- [ ] **HTTPS Enforcement** - Production-only
- [ ] **Secure Cookies** - SameSite=strict, secure flag
- [ ] **CORS Whitelist** - Environment-based allowed origins
- [ ] **Content Security Policy** - Basic CSP headers
- [ ] **Dependency Audit** - npm audit + Snyk integration
- [ ] **Security Testing** - Automated security tests

### Security Recommendations

1. **Environment Variables**
   - Never commit `.env` files
   - Use strong, random secrets (min 32 chars)
   - Rotate JWT secrets regularly

2. **MongoDB**
   - Enable authentication
   - Use replica set for production
   - Whitelist specific IPs
   - Regular backups

3. **Production Deployment**
   - Use HTTPS only
   - Set `NODE_ENV=production`
   - Enable rate limiting
   - Monitor error logs (Sentry)
   - Regular security updates

See [docs/CODE_REFACTORING_PLAN.md](./CODE_REFACTORING_PLAN.md) for security middleware implementation details.

---

## 🗺️ Roadmap

### Current Phase: Backend MVP (80% Complete)

**Completed:**
- ✅ Core infrastructure & database
- ✅ All models & API endpoints
- ✅ JWT authentication
- ✅ Multi-tenant architecture
- ✅ Agency module with contracts
- ✅ AI dynamic pricing (baseline)
- ✅ Code cleanup (TypeScript, duplicate indexes)

**In Progress:**
- ⏳ Code refactoring (helpers, middleware)
- ⏳ MongoDB replica set setup
- ⏳ Security hardening

### Phase 1: Code Quality & Testing (1-2 Weeks)

- [ ] Response helper utilities
- [ ] Error handler middleware
- [ ] Async handler wrapper
- [ ] Validation helpers
- [ ] Security middleware (rate limiting, sanitization)
- [ ] Postman collection
- [ ] Unit & integration tests

### Phase 2: Analytics & Features (2-3 Weeks)

- [ ] Analytics endpoints (dashboard, occupancy, revenue)
- [ ] Email notifications (Resend)
- [ ] API documentation (Swagger)
- [ ] Advanced AI pricing (ML model)

### Phase 3: Frontend (4-6 Weeks)

- [ ] React + TypeScript + Tailwind setup
- [ ] Redux Toolkit state management
- [ ] Dashboard UI
- [ ] Property & reservation management
- [ ] Pricing calendar
- [ ] Analytics charts

### Phase 4: Integrations (Post-MVP)

- [ ] PMS integrations
- [ ] Payment gateways (Stripe)
- [ ] SMS notifications (Twilio)
- [ ] Calendar sync (Google Calendar, iCal)

### Phase 5: B2C Module (Future)

- [ ] Traveler registration
- [ ] Trip planning
- [ ] Reviews & ratings
- [ ] Wishlist

See [docs/ROADMAP.md](./ROADMAP.md) for detailed sprint planning.

---

## 📚 Documentation

### Getting Started
- [README.md](./README.md) - This file
- [TECH_STACK.md](./TECH_STACK.md) - Technology decisions
- [PROJECT_CHARTER.md](./PROJECT_CHARTER.md) - Project goals & scope

### Architecture & Design
- [DATABASE_SCHEMA_HYBRID.md](./DATABASE_SCHEMA_HYBRID.md) - Professional schema
- [API_DESIGN.md](./API_DESIGN.md) - API documentation
- [MONGODB_TRANSACTIONS_REPLICA_SET.md](./MONGODB_TRANSACTIONS_REPLICA_SET.md) - Transaction setup

### Development Plans
- [PROJE_ANALIZ_VE_DEVAM_PLANI.md](./PROJE_ANALIZ_VE_DEVAM_PLANI.md) - Detailed project analysis (Turkish)
- [ROADMAP.md](./ROADMAP.md) - Development roadmap
- [CODE_REFACTORING_PLAN.md](./CODE_REFACTORING_PLAN.md) - Refactoring guide

### Feature Documentation
- [AI_INTEGRATION_SUMMARY.md](./AI_INTEGRATION_SUMMARY.md) - AI pricing documentation
- [AI_QUICK_START.md](./AI_QUICK_START.md) - AI pricing quick start
- [AI_INTEGRATION_PLAN.md](./AI_INTEGRATION_PLAN.md) - AI integration plan

### Fixes & Changes
- [TYPESCRIPT_CLEANUP_SUMMARY.md](./TYPESCRIPT_CLEANUP_SUMMARY.md) - TypeScript cleanup
- [AGENCY_HOTEL_FIXES_SUMMARY.md](./AGENCY_HOTEL_FIXES_SUMMARY.md) - Agency module fixes
- [DUPLICATE_INDEX_FINAL_STATUS.md](./DUPLICATE_INDEX_FINAL_STATUS.md) - Index optimization
- [B2C_MODULE_SKELETON.md](./B2C_MODULE_SKELETON.md) - B2C module status

---

## 🧪 Testing

### Manual Testing

Use Postman for API testing:

1. Import collection (to be created)
2. Set environment variables
3. Test authentication flow
4. Test CRUD operations
5. Test edge cases

### Automated Testing (Planned)

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

Test coverage goals:
- Unit tests: 80%+
- Integration tests: 70%+
- E2E tests: Key user flows

---

## 🚀 Deployment

### Prerequisites

- MongoDB Atlas cluster (M0 or M10)
- Railway/Render account
- Domain name (optional)

### Environment Variables (Production)

```env
NODE_ENV=production
PORT=8000
MONGODB_URI=mongodb+srv://...
JWT_ACCESS_SECRET=<long-random-secret>
JWT_REFRESH_SECRET=<long-random-secret>
CORS_ORIGIN=https://app.travelsync.io
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### Deployment Steps

1. **MongoDB Atlas Setup**
   - Create M10 cluster (replica set included)
   - Configure IP whitelist
   - Create database user
   - Get connection string

2. **Railway Deployment**
   - Connect GitHub repository
   - Add environment variables
   - Deploy!

3. **Domain Setup**
   - Point domain to Railway
   - Enable HTTPS
   - Configure DNS

See detailed deployment guide (to be created) for step-by-step instructions.

---

## 📝 Scripts

```bash
# Development
npm run dev              # Start with nodemon (auto-reload)
npm start                # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format with Prettier

# Testing
npm test                 # Run tests (planned)
npm run test:watch       # Watch mode (planned)
npm run test:coverage    # Coverage report (planned)
```

---

## 🤝 Contributing

This is currently a solo developer project. Contributions will be welcomed after MVP launch.

### Development Workflow

1. Create feature branch from `main`
2. Make changes
3. Test thoroughly
4. Commit with meaningful messages
5. Create pull request

### Code Style

- Follow existing code patterns
- Use CommonJS (require/module.exports)
- Write clear comments
- Update documentation

---

## 📞 Support

- **Email:** support@travelsync.io
- **GitHub Issues:** [Create an issue](https://github.com/yourusername/travelsync-backend/issues)
- **Documentation:** [docs/](./docs/)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

## 🙏 Acknowledgments

- Express.js team for the framework
- MongoDB team for the database
- All open-source contributors
- Tourism industry professionals for feedback

---

## ⭐ Project Status

**Current Version:** 1.0.0-beta
**Status:** Active Development
**Last Updated:** December 26, 2025
**Next Milestone:** Code Refactoring & Security Hardening

---

**Made with ❤️ for the tourism industry**

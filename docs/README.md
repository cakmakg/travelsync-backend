# 🏨 TravelSync - Hotel Automation Platform

> AI-powered tourism automation platform connecting hotels, agencies, and travelers through intelligent reservation management, dynamic pricing, and automated workflows.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green)](https://www.mongodb.com/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

TravelSync is a **B2B SaaS platform** designed to automate manual workflows in the tourism industry. Starting with hotels, the platform eliminates repetitive tasks like reservation management, pricing updates, and reporting through AI-powered automation.

### The Problem

Hotels and travel agencies waste countless hours on:
- ❌ Manual reservation tracking across multiple channels
- ❌ Inefficient pricing decisions (missing revenue opportunities)
- ❌ Time-consuming offer creation for agencies
- ❌ Disconnected systems (PMS, OTA, email, spreadsheets)

### The Solution

TravelSync provides:
- ✅ **Centralized Dashboard** - Manage all reservations in one place
- ✅ **Dynamic Pricing** - AI-powered price suggestions based on occupancy, season, and demand
- ✅ **Analytics** - Real-time insights on occupancy, revenue, and trends
- ✅ **Automation** - Reduce manual work by 50%+ with smart workflows

---

## ✨ Features

### MVP (Current Focus - Hotel Module with Professional Schema)

#### 🏢 Multi-tenant Organizations
- Organization-based separation (HOTEL/AGENCY types)
- Single database with logical separation
- Subscription management per organization
- Multi-property support for hotel chains

#### 🏨 Property Management
- Hotel profile management (name, location, amenities, images)
- Multi-property support within one organization
- Star rating, property type classification
- Check-in/out times, cancellation policies

#### 🛏️ Room Type Management
- Room templates (Standard, Deluxe, Suite, etc.)
- Capacity, bed configuration, amenities
- Total quantity tracking per type
- Professional categorization (code + name)

#### 💰 Rate Plan Management
- Multiple pricing strategies per property
- Meal plan options (RO, BB, HB, FB, AI)
- Cancellation policies (flexible, moderate, strict, non-refundable)
- Derived rate plans (e.g., Non-refundable at -10% from BAR)
- Min/max night restrictions

#### 💵 Dynamic Pricing
- Daily price management per room type + rate plan
- Bulk price updates for date ranges
- AI-powered price suggestions based on:
  - Occupancy levels
  - Seasonality
  - Day of week
  - Local events
- Price source tracking (MANUAL vs AI)

#### 📦 Inventory Management
- Real-time availability tracking
- Allotment management per room type
- Stop-sell controls
- Automatic inventory updates on booking/cancellation
- Overbooking prevention

#### 📅 Reservation Management
- Create, view, update, cancel reservations
- Guest information management
- Check-in/check-out workflows
- Booking reference generation (idempotent)
- Status tracking (pending, confirmed, checked-in, checked-out, cancelled)
- Multi-channel source tracking (direct, phone, email, OTA, agency)
- Transaction-based booking (MongoDB sessions)
- Commission tracking (for agency bookings)

#### 📊 Analytics & Reporting
- Dashboard overview (today's check-ins/outs, revenue, occupancy)
- Occupancy rate tracking (daily, weekly, monthly)
- Revenue reports with trends
- Average Daily Rate (ADR) calculation
- Revenue per Available Room (RevPAR)
- Reservations by source/rate plan breakdown
- Top performing room types

#### 🔔 Notifications
- Email notifications (booking, cancellation)
- In-app notification center
- Configurable notification preferences

#### 🔐 Security & Compliance
- Multi-user access with roles (org admin, staff)
- Audit logging for all critical operations
- Idempotency support (prevent duplicate bookings)
- GDPR-ready data handling

### 🚀 Planned Features (Post-MVP)

#### Phase 2: Integrations (Month 4-6)
- PMS integration (Opera, Mews, Clock)
- OTA channels (Booking.com, Expedia)
- Payment gateways (Stripe, PayPal)
- Email automation (Resend, SendGrid)

#### Phase 3: Agency Module (Month 7-9)
- Agency registration & CRM
- Hotel discovery & search
- AI-powered offer builder
- Multi-hotel packages
- Commission management

#### Phase 4: Traveler Module (Month 10-12)
- AI travel planner
- Personalized recommendations
- Itinerary builder
- Local deals finder

---

## 🛠 Tech Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **State Management:** Redux Toolkit
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts
- **Icons:** Lucide React
- **Notifications:** Sonner
- **Build Tool:** Vite

### Backend
- **Runtime:** Node.js 20 LTS
- **Framework:** Express.js with TypeScript
- **Database:** MongoDB with Mongoose ODM
- **Caching:** Redis (Upstash)
- **Authentication:** JWT (JSON Web Tokens)
- **Validation:** express-validator / Zod
- **Security:** Helmet, CORS, bcrypt
- **Logging:** Winston + Morgan

### Infrastructure
- **Frontend Hosting:** Vercel
- **Backend Hosting:** Railway
- **Database:** MongoDB Atlas
- **Cache:** Upstash Redis
- **Storage:** Cloudflare R2 (S3-compatible)
- **Email:** Resend
- **Monitoring:** Sentry (error tracking)

### Development Tools
- **Version Control:** Git + GitHub
- **API Testing:** Postman
- **Database GUI:** MongoDB Compass
- **Container:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Code Quality:** ESLint + Prettier

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ ([Download](https://nodejs.org/))
- MongoDB 7.0+ (local or [Atlas](https://www.mongodb.com/cloud/atlas))
- Docker Desktop (optional but recommended)
- Git

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/travelsync.git
cd travelsync
```

#### 2. Install Dependencies

```bash
# Install root dependencies (if using monorepo)
npm install

# Install backend dependencies
cd apps/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

#### 3. Environment Setup

**Backend (.env)**

Create `apps/backend/.env`:

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/travelsync
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/travelsync

# Redis (optional for development)
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:5173

# Email (Resend)
RESEND_API_KEY=your-resend-api-key

# File Upload (Cloudflare R2 - optional for MVP)
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=travelsync-uploads
```

**Frontend (.env)**

Create `apps/frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

#### 4. Database Setup (Using Docker - Recommended)

```bash
# Start MongoDB + Redis containers
docker-compose up -d

# Verify containers are running
docker ps
```

Or use MongoDB Atlas (cloud):
1. Create free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

#### 5. Run the Application

**Option A: Run Separately**

```bash
# Terminal 1 - Backend
cd apps/backend
npm run dev

# Terminal 2 - Frontend
cd apps/frontend
npm run dev
```

**Option B: Run with Concurrently (if configured)**

```bash
# From root directory
npm run dev
```

#### 6. Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api/v1
- **API Health Check:** http://localhost:5000/api/v1/health

#### 7. Create First Admin Account

Navigate to http://localhost:5173/register and create your first hotel admin account.

---

## 📁 Project Structure

```
travelsync/
├── apps/
│   ├── backend/                    # Node.js + Express API
│   │   ├── src/
│   │   │   ├── config/            # Configuration (database, env)
│   │   │   ├── controllers/       # Route controllers
│   │   │   ├── middlewares/       # Auth, validation, error, multi-tenant
│   │   │   ├── models/            # Mongoose models
│   │   │   │   ├── Organization.ts
│   │   │   │   ├── User.ts
│   │   │   │   ├── Property.ts
│   │   │   │   ├── RoomType.ts
│   │   │   │   ├── RatePlan.ts
│   │   │   │   ├── Price.ts
│   │   │   │   ├── Inventory.ts
│   │   │   │   ├── Reservation.ts
│   │   │   │   ├── AuditLog.ts
│   │   │   │   └── Notification.ts
│   │   │   ├── routes/            # API routes
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── organizations.routes.ts
│   │   │   │   ├── properties.routes.ts
│   │   │   │   ├── roomTypes.routes.ts
│   │   │   │   ├── ratePlans.routes.ts
│   │   │   │   ├── prices.routes.ts
│   │   │   │   ├── inventory.routes.ts
│   │   │   │   ├── reservations.routes.ts
│   │   │   │   └── analytics.routes.ts
│   │   │   ├── services/          # Business logic
│   │   │   │   ├── reservationService.ts
│   │   │   │   ├── pricingService.ts
│   │   │   │   ├── inventoryService.ts
│   │   │   │   └── analyticsService.ts
│   │   │   ├── utils/             # Helper functions
│   │   │   ├── types/             # TypeScript types
│   │   │   └── server.ts          # Express app entry
│   │   ├── tests/                 # Backend tests
│   │   ├── .env.example           # Example environment variables
│   │   ├── tsconfig.json          # TypeScript config
│   │   └── package.json
│   │
│   └── frontend/                   # React + TypeScript SPA
│       ├── public/                # Static assets
│       ├── src/
│       │   ├── components/        # Reusable components
│       │   │   ├── common/        # Buttons, inputs, modals
│       │   │   ├── layout/        # Header, sidebar, footer
│       │   │   └── features/      # Feature-specific components
│       │   ├── pages/             # Page components
│       │   │   ├── auth/          # Login, register
│       │   │   ├── dashboard/     # Dashboard
│       │   │   ├── properties/    # Property management
│       │   │   ├── room-types/    # Room type management
│       │   │   ├── rate-plans/    # Rate plan management
│       │   │   ├── prices/        # Pricing management
│       │   │   ├── inventory/     # Inventory management
│       │   │   ├── reservations/  # Reservation management
│       │   │   └── settings/      # Settings pages
│       │   ├── store/             # Redux store
│       │   │   ├── slices/        # Redux slices
│       │   │   │   ├── authSlice.ts
│       │   │   │   ├── organizationSlice.ts
│       │   │   │   ├── propertySlice.ts
│       │   │   │   ├── reservationSlice.ts
│       │   │   │   └── uiSlice.ts
│       │   │   └── store.ts       # Store configuration
│       │   ├── services/          # API services
│       │   ├── hooks/             # Custom React hooks
│       │   ├── utils/             # Helper functions
│       │   ├── types/             # TypeScript types
│       │   ├── App.tsx            # Root component
│       │   └── main.tsx           # Entry point
│       ├── tests/                 # Frontend tests
│       ├── .env.example
│       ├── index.html
│       ├── tailwind.config.js
│       ├── tsconfig.json
│       └── package.json
│
├── packages/                       # Shared packages (optional)
│   ├── types/                     # Shared TypeScript types
│   └── utils/                     # Shared utilities
│
├── docs/                          # Documentation
│   ├── PROJECT_CHARTER.md
│   ├── DATABASE_SCHEMA.md         # Original MongoDB schema
│   ├── DATABASE_SCHEMA_HYBRID.md  # **NEW:** Professional schema
│   ├── API_DESIGN.md
│   ├── TECH_STACK.md
│   └── ROADMAP.md
│
├── .github/                       # GitHub-specific files
│   └── workflows/                 # CI/CD workflows
│       ├── backend-ci.yml
│       └── frontend-ci.yml
│
├── docker-compose.yml             # Local development setup
├── .gitignore
├── README.md
└── package.json                   # Root package.json (monorepo)
```

---

## 📡 API Documentation

### Base URL
```
Development: http://localhost:5000/api/v1
Production:  https://api.travelsync.io/v1
```

### Authentication
All protected endpoints require JWT token in the `Authorization` header:

```
Authorization: Bearer <your_access_token>
```

### Example Endpoints

**Authentication**
```http
POST /auth/register        # Register new hotel + admin
POST /auth/login           # Login
POST /auth/refresh         # Refresh access token
POST /auth/logout          # Logout
GET  /auth/me              # Get current user
```

**Rooms**
```http
GET    /rooms              # List all rooms (with filters)
GET    /rooms/:id          # Get single room
POST   /rooms              # Create room
PATCH  /rooms/:id          # Update room
DELETE /rooms/:id          # Delete room (soft)
```

**Reservations**
```http
GET    /reservations       # List all reservations
GET    /reservations/:id   # Get single reservation
POST   /reservations       # Create reservation
PATCH  /reservations/:id   # Update reservation
POST   /reservations/:id/cancel    # Cancel reservation
POST   /reservations/:id/check-in  # Check-in guest
POST   /reservations/:id/check-out # Check-out guest
```

**Analytics**
```http
GET /analytics/dashboard   # Dashboard overview stats
GET /analytics/occupancy   # Occupancy report
GET /analytics/revenue     # Revenue report
```

For full API documentation, see [API_DESIGN.md](./docs/API_DESIGN.md)

---

## 🚀 Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Import your repository
4. Set environment variables:
   - `VITE_API_URL=https://api.travelsync.io/v1`
5. Deploy!

### Backend (Railway)

1. Visit [railway.app](https://railway.app)
2. Create new project
3. Connect GitHub repository
4. Add environment variables (see `.env.example`)
5. Add MongoDB plugin (or use Atlas)
6. Deploy!

### Database (MongoDB Atlas)

1. Create free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create M0 (free) cluster
3. Create database user
4. Whitelist IP (0.0.0.0/0 for all IPs or specific IPs)
5. Get connection string
6. Update `MONGODB_URI` in Railway

For detailed deployment guide, see [DEPLOYMENT.md](./docs/DEPLOYMENT.md) (to be created)

---

## 🧪 Testing

### Run Backend Tests
```bash
cd apps/backend
npm test                  # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

### Run Frontend Tests
```bash
cd apps/frontend
npm test                  # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow existing code style
- Use TypeScript
- Write meaningful commit messages
- Add tests for new features
- Update documentation

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

- **Solo Developer:** [Your Name]
- **Contact:** your.email@example.com
- **Website:** https://travelsync.io

---

## 🙏 Acknowledgments

- React team for amazing framework
- MongoDB team for flexible database
- Vercel & Railway for deployment platforms
- All open-source contributors

---

## 📮 Support

- **Documentation:** [docs.travelsync.io](https://docs.travelsync.io)
- **Email:** support@travelsync.io
- **GitHub Issues:** [Create an issue](https://github.com/yourusername/travelsync/issues)

---

## 🗺️ Roadmap

- [x] MVP: Hotel Module (Rooms, Reservations, Analytics)
- [ ] Phase 2: PMS & OTA Integrations
- [ ] Phase 3: Agency Module
- [ ] Phase 4: Traveler Module (B2C)
- [ ] Phase 5: Mobile Apps

See [ROADMAP.md](./docs/ROADMAP.md) for detailed timeline.

---

## ⭐ Star History

If you find this project useful, please consider giving it a star! ⭐

---

**Made with ❤️ for the tourism industry**
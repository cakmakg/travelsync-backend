# TravelSync - Technology Stack Documentation

## 🎯 Stack Selection Philosophy

**Principles:**
1. **Developer Velocity** - Fast iteration for solo developer
2. **Type Safety** - TypeScript everywhere to catch bugs early
3. **Scalability** - Ready to scale from 10 to 1,000 hotels
4. **Cost Efficiency** - Free/low-cost tools for MVP, scalable pricing
5. **Modern Best Practices** - Industry-standard tools with strong communities

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────┐
│           Frontend (React SPA)                   │
│   React + TypeScript + Tailwind + Redux         │
│   Hosted on: Vercel                             │
└─────────────────┬───────────────────────────────┘
                  │ HTTPS/REST
                  ▼
┌─────────────────────────────────────────────────┐
│           Backend (Node.js API)                  │
│   Express + TypeScript + MongoDB                │
│   Hosted on: Railway / Render                   │
└─────────────────┬───────────────────────────────┘
                  │
      ┌───────────┼───────────┐
      ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ MongoDB  │ │  Redis   │ │  S3/R2   │
│ Database │ │  Cache   │ │  Storage │
│  Atlas   │ │  Upstash │ │Cloudflare│
└──────────┘ └──────────┘ └──────────┘
```

---

## 💻 Frontend Stack

### Core Technologies

#### 1. React 18 (with TypeScript)
**Why:**
- Component-based architecture perfect for dashboard UI
- Huge ecosystem and community
- You already know it
- Excellent performance with hooks

**Key Features to Use:**
- Functional components + hooks
- Context API for theme/auth
- React Router for navigation
- Code splitting for performance

**Alternatives Considered:**
- ❌ Vue.js - Smaller ecosystem for enterprise apps
- ❌ Angular - Too heavy for solo developer
- ❌ Svelte - Less mature ecosystem

---

#### 2. TypeScript
**Why:**
- Catch errors before runtime
- Better IDE autocomplete
- Self-documenting code
- Easier refactoring

**Configuration:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

#### 3. Tailwind CSS
**Why:**
- Rapid UI development
- Consistent design system
- No CSS files to manage
- Responsive utilities built-in
- Small bundle size (purges unused)

**With:**
- `@tailwindcss/forms` - Better form styling
- `@tailwindcss/typography` - Rich text rendering
- Custom color palette for brand

**Alternatives Considered:**
- ❌ Material-UI - Too opinionated, large bundle
- ❌ Chakra UI - Good but Tailwind is faster
- ❌ Bootstrap - Not modern enough

---

#### 4. Redux Toolkit
**Why:**
- Centralized state management
- Perfect for complex dashboard state
- Built-in DevTools
- RTK Query for API calls

**State Structure:**
```typescript
{
  auth: { user, token, isAuthenticated },
  hotel: { profile, stats },
  rooms: { list, filters, pagination },
  reservations: { list, filters, pagination },
  ui: { theme, notifications, modals }
}
```

**Alternative (Simpler Apps):**
- Zustand - Lighter, but Redux Toolkit better for complex state

---

#### 5. Additional Frontend Libraries

| Library | Purpose | Why |
|---------|---------|-----|
| **React Router v6** | Navigation | Standard, type-safe routing |
| **React Hook Form** | Form handling | Best performance, validation |
| **Zod** | Schema validation | Type-safe validation |
| **date-fns** | Date utilities | Lightweight, tree-shakeable |
| **Recharts** | Charts/Analytics | Simple, React-native charts |
| **React Query** | Server state (alternative to RTK Query) | Excellent caching |
| **Lucide React** | Icons | Modern, customizable SVG icons |
| **Sonner** | Toast notifications | Beautiful, accessible |

---

### Build Tools

#### Vite
**Why:**
- Lightning fast HMR
- Better than Create React App
- Modern ES modules
- TypeScript out of the box

**Alternatives:**
- ❌ Webpack - Slower, more config
- ❌ CRA - Deprecated, slow

---

## 🔧 Backend Stack

### Core Technologies

#### 1. Node.js 20 LTS
**Why:**
- JavaScript everywhere (same language as frontend)
- Huge package ecosystem (npm)
- Non-blocking I/O perfect for real-time features
- You already know it

---

#### 2. Express.js (with TypeScript)
**Why:**
- Minimalist, flexible
- Mature, battle-tested
- Huge middleware ecosystem
- Easy to learn

**Project Structure:**
```
src/
├── config/           # Environment, database config
├── controllers/      # Request handlers
├── middlewares/      # Auth, validation, error handling
├── models/           # Mongoose schemas
├── routes/           # API routes
├── services/         # Business logic
├── utils/            # Helpers
├── types/            # TypeScript types
└── server.ts         # Entry point
```

**Alternatives Considered:**
- ❌ NestJS - Too much boilerplate for MVP
- ❌ Fastify - Less ecosystem
- ❌ Koa - Too minimal

---

#### 3. MongoDB (with Mongoose)
**Why:**
- Flexible schema for MVP iteration
- JSON-like documents match JavaScript
- Easy to scale horizontally
- Geospatial queries built-in
- MongoDB Atlas (managed, free tier)

**Mongoose Benefits:**
- Schema validation
- Middleware (hooks)
- Population (joins)
- TypeScript support

**Alternatives:**
- ❌ PostgreSQL - More rigid schema, complex migrations
- ❌ MySQL - Old-school, less flexible
- ✅ PostgreSQL (Consider for v2 if complex relations needed)

---

#### 4. Redis (Upstash)
**Why:**
- Session storage
- API response caching
- Rate limiting
- Real-time features (Pub/Sub)

**Use Cases:**
```typescript
// Cache expensive queries
await redis.setex('hotel:123:stats', 3600, JSON.stringify(stats));

// Rate limiting
const requests = await redis.incr(`rate:${userId}`);
await redis.expire(`rate:${userId}`, 60);
```

---

#### 5. Additional Backend Libraries

| Library | Purpose | Why |
|---------|---------|-----|
| **jsonwebtoken** | JWT auth | Industry standard |
| **bcrypt** | Password hashing | Secure, proven |
| **express-validator** | Input validation | Chainable, clear |
| **helmet** | Security headers | Essential security |
| **cors** | CORS handling | Standard middleware |
| **morgan** | HTTP logging | Debug requests |
| **dotenv** | Environment variables | Configuration |
| **nodemailer** | Email sending | Reliable, flexible |
| **winston** | Logging | Structured logs |
| **joi** or **zod** | Schema validation | Type-safe validation |

---

## 🗄️ Database & Storage

### MongoDB Atlas
**Tier:** Free M0 (512 MB) → M10 (10 GB) as you grow  
**Why:**
- Managed service (no DevOps)
- Automatic backups
- Built-in monitoring
- Global clusters

### Redis - Upstash
**Tier:** Free (10,000 commands/day) → Pay-as-you-go  
**Why:**
- Serverless Redis
- Global edge network
- No credit card for free tier

### File Storage - Cloudflare R2
**Why:**
- S3-compatible API
- No egress fees (huge savings)
- Fast CDN included
- Free tier: 10 GB storage

**Alternative:**
- AWS S3 - More expensive egress

---

## 🚀 Hosting & Deployment

### Frontend - Vercel
**Tier:** Free (Hobby)  
**Why:**
- Zero-config deployment
- Automatic HTTPS
- Global CDN
- Preview deployments
- Git integration

**Alternatives:**
- Netlify - Similar, slightly less performant
- Cloudflare Pages - Good, but Vercel has better DX

### Backend - Railway
**Tier:** $5/month (includes $5 credit)  
**Why:**
- One-click deployments
- PostgreSQL, Redis included
- Auto-scaling
- Great developer experience

**Alternative:**
- Render - Free tier available
- Fly.io - More complex
- DigitalOcean App Platform - Less automation

### Domain - Namecheap
**Cost:** ~€10/year  
**Why:**
- Cheap
- No hidden fees
- Good UI

---

## 🔐 Authentication & Security

### JWT (JSON Web Tokens)
**Strategy:**
```typescript
{
  access_token: '15 min expiry',
  refresh_token: '7 days expiry',
  httpOnly: true,  // XSS protection
  secure: true,    // HTTPS only
  sameSite: 'strict'
}
```

### Security Stack
- **helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **express-mongo-sanitize** - NoSQL injection prevention
- **hpp** - HTTP parameter pollution protection

---

## 📧 Email Service

### Resend
**Tier:** Free (3,000 emails/month) → $20/month (50k emails)  
**Why:**
- Modern developer experience
- React Email templates
- Better than SendGrid UX
- Excellent deliverability

**Use Cases:**
- Registration confirmation
- Reservation confirmations
- Password reset
- Notification digests

**Alternative:**
- SendGrid - More enterprise, worse DX
- Postmark - Good but more expensive

---

## 🧪 Testing Stack (Post-MVP)

### Testing Libraries
- **Vitest** - Fast, Vite-native test runner
- **React Testing Library** - UI testing
- **Supertest** - API endpoint testing
- **MSW** - Mock Service Worker for API mocking

### Code Quality
- **ESLint** - Linting (with TypeScript rules)
- **Prettier** - Code formatting
- **Husky** - Git hooks (pre-commit)
- **lint-staged** - Run linters on staged files

---

## 📊 Monitoring & Analytics (Post-MVP)

### Application Monitoring
- **Sentry** - Error tracking (free tier: 5k errors/month)
- **LogRocket** - Session replay (optional)

### Analytics
- **Plausible** - Privacy-friendly analytics (€9/month)
  - Alternative: Google Analytics (free but privacy concerns)

### Uptime Monitoring
- **UptimeRobot** - Free (50 monitors)

---

## 🔄 CI/CD Pipeline

### GitHub Actions
**Why:**
- Free for public repos
- Integrated with GitHub
- Easy YAML configuration

**Workflow:**
```yaml
name: CI/CD
on: [push, pull_request]
jobs:
  test:
    - Lint code
    - Run tests
    - Build project
  deploy:
    - Deploy to Railway (backend)
    - Deploy to Vercel (frontend)
```

---

## 🛠️ Development Tools

### Required
- **VS Code** - IDE (with extensions)
  - ES7+ React snippets
  - Tailwind IntelliSense
  - ESLint
  - Prettier
- **Postman** - API testing
- **MongoDB Compass** - Database GUI
- **Git** - Version control
- **Docker Desktop** - Local development containers

### Optional but Recommended
- **Bruno** or **Hoppscotch** - Open-source Postman alternatives
- **TablePlus** - Multi-database GUI
- **Fig** - Terminal autocomplete

---

## 📦 Project Structure (Monorepo Option)

### Option 1: Separate Repos
```
travelsync-frontend/    (React)
travelsync-backend/     (Node.js)
```

### Option 2: Monorepo (Recommended)
```
travelsync/
├── apps/
│   ├── frontend/       (React app)
│   └── backend/        (Express API)
├── packages/
│   ├── types/          (Shared TypeScript types)
│   └── utils/          (Shared utilities)
├── docker-compose.yml
└── package.json        (workspace root)
```

**Monorepo Tool:** npm workspaces (no extra tool needed)

---

## 💰 Cost Breakdown (Monthly)

### MVP Phase (First 3 Months)
| Service | Tier | Cost |
|---------|------|------|
| Vercel | Hobby | Free |
| Railway | Starter | $5 |
| MongoDB Atlas | M0 | Free |
| Upstash Redis | Free | Free |
| Cloudflare R2 | Free | Free |
| Resend | Free | Free |
| Domain | Yearly | €1/mo |
| **Total** | | **~€6/month** |

### Production (10-50 Hotels)
| Service | Tier | Cost |
|---------|------|------|
| Vercel | Pro | $20 |
| Railway | Standard | $20 |
| MongoDB Atlas | M10 | $57 |
| Upstash Redis | Pay-as-you-go | $10 |
| Cloudflare R2 | Usage | $5 |
| Resend | Standard | $20 |
| Sentry | Team | $26 |
| **Total** | | **~€158/month** |

---

## 🔮 Future Tech Considerations (Post-MVP)

### When to Add:
- **GraphQL** - If frontend needs complex data fetching
- **WebSockets (Socket.io)** - Real-time features (live occupancy)
- **Bull Queue** - Background jobs (email sending, reports)
- **Elastic Search** - Advanced search if 100+ hotels
- **Python + FastAPI** - AI/ML features (pricing optimization)
- **React Native** - Mobile apps
- **Next.js** - If SEO becomes important (B2C traveler module)

---

## 📝 Tech Stack Summary (TL;DR)

**Frontend:**
React + TypeScript + Tailwind + Redux Toolkit + Vite → Deploy to Vercel

**Backend:**
Node.js + Express + TypeScript + MongoDB + Redis → Deploy to Railway

**Supporting:**
MongoDB Atlas (DB) + Upstash (Redis) + R2 (Storage) + Resend (Email)

**Development:**
VS Code + Postman + GitHub + Docker + GitHub Actions

**Total MVP Cost:** ~€6/month

---

## ✅ Decision Checklist

Before starting development, confirm:
- [ ] MongoDB Atlas account created
- [ ] GitHub repo initialized
- [ ] Vercel account connected to GitHub
- [ ] Railway account created
- [ ] Domain purchased (optional for MVP)
- [ ] Resend account for emails
- [ ] VS Code with extensions installed
- [ ] Node.js 20+ installed
- [ ] Docker Desktop installed (for local MongoDB)

---

**Document Status:** Approved  
**Last Updated:** October 26, 2025  
**Next Step:** Development Roadmap
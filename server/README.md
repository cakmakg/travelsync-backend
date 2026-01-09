# TravelSync Backend

Node.js/Express backend API for TravelSync platform.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

## Project Structure

```
server/
├── src/
│   ├── config/         # Database & app configuration
│   ├── controllers/    # Route handlers
│   ├── middlewares/    # Express middlewares
│   ├── models/         # Mongoose models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   └── server.js       # App entry point
├── docs/               # Documentation
├── __tests__/          # Test files
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new organization
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/me` - Get current user

### Properties
- `GET /api/v1/properties` - List properties
- `POST /api/v1/properties` - Create property
- `GET /api/v1/properties/:id` - Get property
- `PATCH /api/v1/properties/:id` - Update property

### Reservations
- `GET /api/v1/reservations` - List reservations
- `POST /api/v1/reservations` - Create reservation
- `GET /api/v1/reservations/:id` - Get reservation
- `POST /api/v1/reservations/:id/cancel` - Cancel reservation

### Room Types, Rate Plans, Prices, Inventory
See [API Documentation](./docs/README.md) for full details.

## Environment Variables

```env
PORT=8000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/travelsync
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

## Scripts

```bash
npm run dev      # Start development server
npm run start    # Start production server
npm run lint     # Run ESLint
npm test         # Run tests
```

## Documentation

- [Development Roadmap](./docs/ROADMAP.md)
- [Database Schema](./docs/DATABASE_SCHEMA.md)
- [AI Integration](./docs/AI_INTEGRATION_SUMMARY.md)

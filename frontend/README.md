# TravelSync Frontend

Modern hotel management platform frontend built with React, TypeScript, and Tailwind CSS.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Backend Setup

Make sure the backend server is running on `http://localhost:8000`

## 📦 Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **Redux Toolkit** - State management
- **React Router** - Routing
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Lucide React** - Icons
- **Sonner** - Toast notifications

## 🏗️ Project Structure

```
src/
├── components/          # Reusable components
│   ├── common/         # Common UI components
│   └── layout/         # Layout components
├── pages/              # Page components
│   ├── auth/          # Authentication pages
│   ├── dashboard/     # Dashboard
│   ├── properties/    # Properties management
│   └── reservations/  # Reservations management
├── store/             # Redux store
│   └── slices/        # Redux slices
├── services/          # API services
├── hooks/             # Custom hooks
├── utils/             # Utility functions
├── types/             # TypeScript types
└── assets/            # Static assets
```

## 🎨 Features

### Implemented
- ✅ Authentication (Login/Register)
- ✅ Dashboard with stats
- ✅ Properties management
- ✅ Reservations management
- ✅ Responsive sidebar navigation
- ✅ Toast notifications
- ✅ API integration with axios
- ✅ Redux state management
- ✅ Form validation with Zod

### Coming Soon
- 🚧 Room Types management
- 🚧 Rate Plans management
- 🚧 Dynamic Pricing calendar
- 🚧 Analytics dashboard
- 🚧 Agency management
- 🚧 Settings page

## 🔐 Authentication

The app uses JWT-based authentication with automatic token refresh.

Tokens are stored in localStorage:
- `accessToken` - Short-lived access token (15 min)
- `refreshToken` - Long-lived refresh token (7 days)

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start dev server

# Production
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
```

## 📝 Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

## 🎯 Usage

### Login

```
Email: admin@hotel.com
Password: your_password
```

### Register

1. Navigate to `/register`
2. Fill in hotel and personal information
3. Submit to create account
4. Automatically logged in and redirected to dashboard

## 🔄 State Management

Redux Toolkit is used for global state management:

- `authSlice` - Authentication state
- `propertiesSlice` - Properties data
- `reservationsSlice` - Reservations data
- `uiSlice` - UI state (sidebar, theme, notifications)

## 📱 Responsive Design

The app is fully responsive and works on:
- Desktop (1024px+)
- Tablet (768px - 1024px)
- Mobile (< 768px)

## 🐛 Troubleshooting

### CORS Error
Make sure backend CORS is configured to allow `http://localhost:3000`

### API Connection Failed
Check that backend is running on `http://localhost:8000`

### Build Errors
Delete `node_modules` and reinstall:
```bash
rm -rf node_modules
npm install
```

## 📄 License

MIT

## 👨‍💻 Author

TravelSync Team

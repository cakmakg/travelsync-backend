import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Layout
import { MainLayout, ProtectedRoute, PublicRoute } from './components/layout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Main Pages
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { PropertiesListPage } from './pages/properties/PropertiesListPage';
import { ReservationsListPage } from './pages/reservations/ReservationsListPage';

// Not Found Page
function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="mt-4 text-xl text-gray-600">Page not found</p>
        <a
          href="/dashboard"
          className="mt-6 inline-block rounded-lg bg-primary-600 px-6 py-3 text-white hover:bg-primary-700"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}

// Unauthorized Page
function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">403</h1>
        <p className="mt-4 text-xl text-gray-600">Access Denied</p>
        <p className="mt-2 text-gray-500">You don't have permission to view this page.</p>
        <a
          href="/dashboard"
          className="mt-6 inline-block rounded-lg bg-primary-600 px-6 py-3 text-white hover:bg-primary-700"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Properties */}
            <Route path="/properties" element={<PropertiesListPage />} />
            <Route path="/properties/new" element={<div className="p-6"><h1 className="text-2xl font-semibold">Create Property</h1><p className="text-gray-500 mt-2">Coming soon...</p></div>} />
            <Route path="/properties/:id" element={<div className="p-6"><h1 className="text-2xl font-semibold">Property Details</h1><p className="text-gray-500 mt-2">Coming soon...</p></div>} />
            <Route path="/properties/:id/edit" element={<div className="p-6"><h1 className="text-2xl font-semibold">Edit Property</h1><p className="text-gray-500 mt-2">Coming soon...</p></div>} />

            {/* Room Types */}
            <Route path="/room-types" element={<div className="p-6"><h1 className="text-2xl font-semibold">Room Types</h1><p className="text-gray-500 mt-2">Coming soon...</p></div>} />

            {/* Reservations */}
            <Route path="/reservations" element={<ReservationsListPage />} />
            <Route path="/reservations/new" element={<div className="p-6"><h1 className="text-2xl font-semibold">New Reservation</h1><p className="text-gray-500 mt-2">Coming soon...</p></div>} />
            <Route path="/reservations/:id" element={<div className="p-6"><h1 className="text-2xl font-semibold">Reservation Details</h1><p className="text-gray-500 mt-2">Coming soon...</p></div>} />

            {/* Pricing */}
            <Route path="/pricing" element={<div className="p-6"><h1 className="text-2xl font-semibold">Pricing</h1><p className="text-gray-500 mt-2">Manage your room prices and rate plans.</p></div>} />

            {/* Inventory */}
            <Route path="/inventory" element={<div className="p-6"><h1 className="text-2xl font-semibold">Inventory</h1><p className="text-gray-500 mt-2">Manage room availability and allotments.</p></div>} />

            {/* Agencies */}
            <Route path="/agencies" element={<div className="p-6"><h1 className="text-2xl font-semibold">Agencies</h1><p className="text-gray-500 mt-2">Manage travel agencies and tour operators.</p></div>} />

            {/* Contracts */}
            <Route path="/contracts" element={<div className="p-6"><h1 className="text-2xl font-semibold">Contracts</h1><p className="text-gray-500 mt-2">Manage agency contracts and commissions.</p></div>} />

            {/* Analytics */}
            <Route path="/analytics" element={<div className="p-6"><h1 className="text-2xl font-semibold">Analytics</h1><p className="text-gray-500 mt-2">View reports and insights.</p></div>} />

            {/* Users */}
            <Route path="/users" element={<div className="p-6"><h1 className="text-2xl font-semibold">Users</h1><p className="text-gray-500 mt-2">Manage team members and permissions.</p></div>} />

            {/* Settings */}
            <Route path="/settings" element={<div className="p-6"><h1 className="text-2xl font-semibold">Settings</h1><p className="text-gray-500 mt-2">Configure your account and organization.</p></div>} />
          </Route>

          {/* Error Pages */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/404" element={<NotFoundPage />} />

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Router>

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#374151',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;

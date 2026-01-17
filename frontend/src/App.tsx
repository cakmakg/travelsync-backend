import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { Toaster } from 'sonner';

// Layouts
import MainLayout from './components/layout/MainLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import PropertiesPage from './pages/properties/PropertiesPage';
import ReservationsPage from './pages/reservations/ReservationsPage';
import RoomTypesPage from './pages/room-types/RoomTypesPage';

// Hotel Pages
import PricingPage from './pages/pricing/PricingPage';
import AgenciesPage from './pages/agencies/AgenciesPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import SettingsPage from './pages/settings/SettingsPage';

// Agency Pages
import FlashOffersPage from './pages/agency/FlashOffersPage';
import ContractsPage from './pages/agency/ContractsPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import OrganizationsPage from './pages/admin/OrganizationsPage';
import UsersManagementPage from './pages/admin/UsersManagementPage';


function App() {
  return (
    <Provider store={store}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            }
          />
          <Route
            path="/properties"
            element={
              <MainLayout>
                <PropertiesPage />
              </MainLayout>
            }
          />
          <Route
            path="/reservations"
            element={
              <MainLayout>
                <ReservationsPage />
              </MainLayout>
            }
          />

          {/* Room Types */}
          <Route
            path="/room-types"
            element={
              <MainLayout>
                <RoomTypesPage />
              </MainLayout>
            }
          />

          {/* Agency Routes */}
          <Route
            path="/flash-offers"
            element={
              <MainLayout>
                <FlashOffersPage />
              </MainLayout>
            }
          />
          <Route
            path="/contracts"
            element={
              <MainLayout>
                <ContractsPage />
              </MainLayout>
            }
          />
          <Route
            path="/hotels"
            element={
              <MainLayout>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-gray-900">Browse Hotels</h2>
                  <p className="text-gray-600 mt-2">Coming soon...</p>
                </div>
              </MainLayout>
            }
          />
          <Route
            path="/commission"
            element={
              <MainLayout>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-gray-900">Commission Reports</h2>
                  <p className="text-gray-600 mt-2">Coming soon...</p>
                </div>
              </MainLayout>
            }
          />

          {/* Hotel Pages */}
          <Route
            path="/pricing"
            element={
              <MainLayout>
                <PricingPage />
              </MainLayout>
            }
          />
          <Route
            path="/agencies"
            element={
              <MainLayout>
                <AgenciesPage />
              </MainLayout>
            }
          />
          <Route
            path="/analytics"
            element={
              <MainLayout>
                <AnalyticsPage />
              </MainLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <MainLayout>
                <SettingsPage />
              </MainLayout>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <MainLayout>
                <AdminDashboard />
              </MainLayout>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <MainLayout>
                <AdminDashboard />
              </MainLayout>
            }
          />
          <Route
            path="/admin/organizations"
            element={
              <MainLayout>
                <OrganizationsPage />
              </MainLayout>
            }
          />
          <Route
            path="/admin/users"
            element={
              <MainLayout>
                <UsersManagementPage />
              </MainLayout>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        {/* Toast notifications */}
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </Provider>
  );
}

export default App;

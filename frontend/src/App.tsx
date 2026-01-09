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

          {/* Placeholder routes */}
          <Route
            path="/room-types"
            element={
              <MainLayout>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-gray-900">Room Types</h2>
                  <p className="text-gray-600 mt-2">Coming soon...</p>
                </div>
              </MainLayout>
            }
          />
          <Route
            path="/pricing"
            element={
              <MainLayout>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-gray-900">Pricing</h2>
                  <p className="text-gray-600 mt-2">Coming soon...</p>
                </div>
              </MainLayout>
            }
          />
          <Route
            path="/agencies"
            element={
              <MainLayout>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-gray-900">Agencies</h2>
                  <p className="text-gray-600 mt-2">Coming soon...</p>
                </div>
              </MainLayout>
            }
          />
          <Route
            path="/analytics"
            element={
              <MainLayout>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
                  <p className="text-gray-600 mt-2">Coming soon...</p>
                </div>
              </MainLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <MainLayout>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                  <p className="text-gray-600 mt-2">Coming soon...</p>
                </div>
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

import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { MobileNav } from './components/MobileNav';

// Pages
import { LandingPage } from './pages/LandingPage';
import { FindParkingPage } from './pages/FindParkingPage';
import { ParkingDetailPage } from './pages/ParkingDetailPage';
import { DriverDashboardPage } from './pages/DriverDashboardPage';
import { BookingsPage } from './pages/BookingsPage';
import { SavedParkingPage } from './pages/SavedParkingPage';
import { VehicleGaragePage } from './pages/VehicleGaragePage';
import { QRCheckInPage } from './pages/QRCheckInPage';
import { MessagingPage } from './pages/MessagingPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { OwnerDashboardPage } from './pages/OwnerDashboardPage';
import { AddParkingSpacePage } from './pages/AddParkingSpacePage';
import { AvailabilityCalendarPage } from './pages/AvailabilityCalendarPage';
import { EarningsPage } from './pages/EarningsPage';
import { AdminPanelPage } from './pages/AdminPanelPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';

function MainLayout() {
  const location = useLocation();
  const { theme } = useTheme();
  const isLoginPage = location.pathname === '/login';
  const isLandingPage = location.pathname === '/';
  const hideFooter = isLoginPage || location.pathname === '/add-space';

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 selection:bg-emerald-500 selection:text-black ${
        theme === 'dark' ? 'bg-[#0b0f17] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Hide Header on Login Page */}
      {!isLoginPage && <Navbar />}

      <div className={`flex-1 ${isLoginPage || isLandingPage ? '' : 'pb-20 md:pb-0'}`}>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/find" element={<FindParkingPage />} />
          <Route path="/parking/:id" element={<ParkingDetailPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Driver Workflow */}
          <Route path="/dashboard" element={<DriverDashboardPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/saved" element={<SavedParkingPage />} />
          <Route path="/vehicles" element={<VehicleGaragePage />} />
          <Route path="/qr-checkin" element={<QRCheckInPage />} />
          <Route path="/messages" element={<MessagingPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* Owner Workflow */}
          <Route path="/owner" element={<OwnerDashboardPage />} />
          <Route path="/owner/calendar" element={<AvailabilityCalendarPage />} />
          <Route path="/owner/earnings" element={<EarningsPage />} />
          <Route path="/add-space" element={<AddParkingSpacePage />} />

          {/* Admin Workflow */}
          <Route path="/admin" element={<AdminPanelPage />} />

          {/* Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>

      {/* Hide Footer on Login Page and Add Space Wizard */}
      {!hideFooter && <Footer />}

      {/* Hide Mobile Bottom Nav on Login Page and Landing Page */}
      {!isLoginPage && !isLandingPage && <MobileNav />}
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <FavoritesProvider>
            <NotificationProvider>
              <MainLayout />
            </NotificationProvider>
          </FavoritesProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;


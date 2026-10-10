import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Sparkles, Navigation, Globe, Phone, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const Footer: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const logoTarget = !user ? '/' : user.role === 'admin' ? '/admin' : user.role === 'owner' ? '/owner' : '/dashboard';

  return (
    <footer
      className={`border-t text-sm mt-auto transition-colors duration-200 ${
        isDark
          ? 'bg-[#080c14] border-slate-800/80 text-slate-400'
          : 'bg-white border-slate-200 text-slate-600 shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to={logoTarget} className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700">
                <span className="font-extrabold text-white text-base">P</span>
              </div>
              <span className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Park<span className="text-emerald-500">Share</span>
              </span>
            </Link>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} max-w-sm text-xs sm:text-sm leading-relaxed`}>
              ParkShare is the peer-to-peer urban parking marketplace connecting drivers with verified local spaces. Save time, eliminate emissions from cruising for parking, and monetize unused driveways.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                MongoDB Atlas Active
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20">
                Database: parkshare
              </span>
              <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>ISO 27001 Certified</span>
            </div>
          </div>

          {/* Drivers */}
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
              Drivers
            </h4>
            <ul className={`space-y-2.5 text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <li>
                <Link to="/find" className="hover:text-emerald-500 transition-colors">Find Parking</Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-emerald-500 transition-colors">Active Reservations</Link>
              </li>
              <li>
                <Link to="/qr-checkin" className="hover:text-emerald-500 transition-colors">Scan QR Check-in</Link>
              </li>
              <li>
                <Link to="/vehicles" className="hover:text-emerald-500 transition-colors">Vehicle Garage</Link>
              </li>
              <li>
                <Link to="/saved" className="hover:text-emerald-500 transition-colors">Saved Locations</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-emerald-500 transition-colors">Sign In / Switch Account</Link>
              </li>
            </ul>
          </div>

          {/* Space Owners */}
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
              Space Owners
            </h4>
            <ul className={`space-y-2.5 text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <li>
                <Link to="/add-space" className="hover:text-emerald-500 transition-colors">List Your Parking</Link>
              </li>
              <li>
                <Link to="/owner" className="hover:text-emerald-500 transition-colors">Owner Dashboard</Link>
              </li>
              <li>
                <Link to="/owner/calendar" className="hover:text-emerald-500 transition-colors">Manage Calendar</Link>
              </li>
              <li>
                <Link to="/owner/earnings" className="hover:text-emerald-500 transition-colors">Earnings & Payouts</Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-emerald-500 transition-colors">Admin Portal</Link>
              </li>
            </ul>
          </div>

          {/* Platform & Trust */}
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
              Trust & Safety
            </h4>
            <ul className={`space-y-2.5 text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <li className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-500" /> ₹5,00,000 Host Protection
              </li>
              <li className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" /> Verified Host Badges
              </li>
              <li className="flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-blue-500" /> Real-time GPS Navigation
              </li>
              <li className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-purple-500" /> 24/7 Driver Support
              </li>
            </ul>
          </div>
        </div>

        <div className={`border-t mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs ${isDark ? 'border-slate-800/80 text-slate-500' : 'border-slate-200 text-slate-500'}`}>
          <p>© {new Date().getFullYear()} ParkShare Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className={`cursor-pointer ${isDark ? 'hover:text-slate-400' : 'hover:text-slate-700'}`}>Privacy Policy</span>
            <span className={`cursor-pointer ${isDark ? 'hover:text-slate-400' : 'hover:text-slate-700'}`}>Terms of Service</span>
            <span className={`cursor-pointer ${isDark ? 'hover:text-slate-400' : 'hover:text-slate-700'}`}>Security Safeguards</span>
            <span className={`cursor-pointer ${isDark ? 'hover:text-slate-400' : 'hover:text-slate-700'}`}>Cookie Preferences</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

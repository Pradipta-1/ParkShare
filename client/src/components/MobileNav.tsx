import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  CalendarCheck2,
  Car,
  Bookmark,
  Layers,
  PlusCircle,
  Calendar,
  DollarSign,
  CheckCircle,
  Shield,
  FileCheck,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const MobileNav: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const location = useLocation();

  // Do not render bottom nav on landing page or login page
  if (location.pathname === '/' || location.pathname === '/login') {
    return null;
  }

  const isAdminSection = Boolean(
    (user && user.role === 'admin') ||
    location.pathname.startsWith('/admin')
  );

  const isOwnerSection = Boolean(
    !isAdminSection &&
    ((user && user.role === 'owner') ||
      location.pathname.startsWith('/owner') ||
      location.pathname === '/add-space')
  );

  const currentAdminTab = location.pathname.startsWith('/admin')
    ? (new URLSearchParams(location.search).get('tab') || 'overview')
    : '';

  const adminNavItems = [
    { to: '/admin?tab=overview', tab: 'overview', label: 'Console', icon: Shield },
    { to: '/admin?tab=verification', tab: 'verification', label: 'Verify', icon: FileCheck },
    { to: '/admin?tab=users', tab: 'users', label: 'Users', icon: Users },
    { to: '/admin?tab=disputes', tab: 'disputes', label: 'Disputes', icon: AlertTriangle },
  ];

  const ownerNavItems = [
    { to: '/owner', label: 'Overview', icon: Layers },
    { to: '/add-space', label: 'List Space', icon: PlusCircle },
    { to: '/owner/calendar', label: 'Calendar', icon: Calendar },
    { to: '/owner/earnings', label: 'Earnings', icon: DollarSign },
    { to: '/messages', label: 'Inquiries', icon: CheckCircle },
  ];

  const driverNavItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/find', label: 'Find', icon: Compass },
    { to: '/bookings', label: 'Bookings', icon: CalendarCheck2 },
    { to: '/vehicles', label: 'Vehicles', icon: Car },
    { to: '/saved', label: 'Saved', icon: Bookmark },
  ];

  const navItems = isAdminSection ? adminNavItems : isOwnerSection ? ownerNavItems : driverNavItems;

  return (
    <nav
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-lg border-t px-2 py-2 transition-colors duration-200 ${
        isDark
          ? 'bg-[#0d131f]/95 border-slate-800/90 shadow-2xl'
          : 'bg-white/95 border-slate-200 shadow-lg shadow-slate-900/10'
      }`}
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isAdminActive = isAdminSection && 'tab' in item && item.tab === currentAdminTab;

          if (isAdminSection) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
                  isAdminActive
                    ? 'text-purple-600 dark:text-purple-400 font-bold'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="truncate max-w-[70px] text-center">{item.label}</span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="truncate max-w-[68px] text-center">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

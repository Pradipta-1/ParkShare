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

  const checkIsActive = (item: (typeof navItems)[number]) => {
    if (isAdminSection && 'tab' in item) {
      return item.tab === currentAdminTab;
    }
    const pathname = location.pathname;
    if (item.to === '/dashboard') return pathname === '/dashboard';
    if (item.to === '/find') return pathname === '/find' || pathname.startsWith('/parking');
    if (item.to === '/bookings') return pathname.startsWith('/bookings');
    if (item.to === '/vehicles') return pathname.startsWith('/vehicles');
    if (item.to === '/saved') return pathname.startsWith('/saved');
    if (item.to === '/owner') return pathname === '/owner';
    if (item.to === '/add-space') return pathname === '/add-space';
    if (item.to === '/owner/calendar') return pathname.startsWith('/owner/calendar');
    if (item.to === '/owner/earnings') return pathname.startsWith('/owner/earnings');
    if (item.to === '/messages') return pathname.startsWith('/messages');
    return pathname === item.to;
  };

  return (
    <nav
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-lg border-t px-1 py-1.5 transition-colors duration-200 ${
        isDark
          ? 'bg-[#0d131f]/95 border-slate-800/90 shadow-2xl'
          : 'bg-white/95 border-slate-200 shadow-lg shadow-slate-900/10'
      }`}
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = checkIsActive(item);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex flex-col items-center justify-center flex-1 py-0.5 group relative transition-all"
            >
              {/* Active Indication Block around Icon */}
              <div
                className={`px-3 py-1 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? isAdminSection
                      ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/40 shadow-xs'
                      : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/40 shadow-xs'
                    : isDark
                    ? 'text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800/40'
                    : 'text-slate-500 group-hover:text-slate-800 group-hover:bg-slate-100/50'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-105 stroke-[2.5]' : 'stroke-2'}`} />
              </div>

              {/* Indication Color Label */}
              <span
                className={`text-[10px] truncate max-w-[68px] text-center mt-0.5 transition-colors ${
                  isActive
                    ? isAdminSection
                      ? 'text-purple-600 dark:text-purple-400 font-black'
                      : 'text-emerald-600 dark:text-emerald-400 font-black'
                    : isDark
                    ? 'text-slate-400 group-hover:text-slate-200 font-medium'
                    : 'text-slate-500 group-hover:text-slate-800 font-medium'
                }`}
              >
                {item.label}
              </span>

              {/* Active Indication Mark (Dot indicator) */}
              {isActive && (
                <span
                  className={`w-1 h-1 rounded-full mt-0.5 animate-in fade-in zoom-in duration-150 ${
                    isAdminSection ? 'bg-purple-500' : 'bg-emerald-500'
                  }`}
                />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

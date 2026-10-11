import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  MapPin,
  Bell,
  User as UserIcon,
  ChevronDown,
  LogOut,
  Car,
  Shield,
  Layers,
  Sparkles,
  PlusCircle,
  X,
  CheckCircle2,
  FileCheck,
  AlertTriangle,
  Users,
  LayoutDashboard,
  Compass,
  CalendarCheck2,
  Calendar,
  DollarSign,
  Building,
  Repeat,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeToggle } from './ThemeToggle';
import { ProfileSettingsModal } from './ProfileSettingsModal';
import { UserRole } from '../types';

export const Navbar: React.FC = () => {
  const { user, role, demoLogin, logout } = useAuth();
  const { isDark } = useTheme();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setShowUserMenu(false);
    setShowNotifMenu(false);
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  const isLandingPage = location.pathname === '/';
  const isAdminPage = location.pathname.startsWith('/admin');
  const isAdminView = Boolean(isAdminPage || (user && user.role === 'admin'));
  const isOwnerView = Boolean(
    !isAdminView &&
    (location.pathname.startsWith('/owner') ||
      location.pathname === '/add-space' ||
      (user && user.role === 'owner'))
  );
  const isDriverView = Boolean(!isAdminView && !isOwnerView);
  const isDriverPage = Boolean(
    isDriverView ||
    location.pathname === '/dashboard' ||
    location.pathname === '/find' ||
    location.pathname === '/bookings' ||
    location.pathname === '/vehicles' ||
    location.pathname === '/saved' ||
    location.pathname === '/qr-checkin' ||
    location.pathname.startsWith('/parking/') ||
    (user && user.role === 'driver')
  );
  const isOwnerPage = Boolean(
    isOwnerView ||
    location.pathname.startsWith('/owner') ||
    location.pathname === '/add-space' ||
    (user && user.role === 'owner')
  );
  const isAdminSection = Boolean(isAdminPage || isAdminView);
  const hideMobileMenu = isLandingPage || isDriverPage || isOwnerPage || isAdminSection;
  const currentAdminTab = isAdminPage ? (new URLSearchParams(location.search).get('tab') || 'overview') : '';

  const getLogoDestination = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin';
    if (isOwnerView) return '/owner';
    return '/dashboard';
  };

  return (
    <>
      <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isDark
          ? isScrolled
            ? 'bg-[#0b0f17]/90 backdrop-blur-md border-b border-slate-800/80 shadow-lg shadow-black/30 py-2 sm:py-3'
            : 'bg-[#0b0f17]/60 backdrop-blur-sm border-b border-slate-800/40 py-2.5 sm:py-4'
          : isScrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-md shadow-slate-900/5 py-2 sm:py-3'
            : 'bg-white/85 backdrop-blur-sm border-b border-slate-200/60 py-2.5 sm:py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2">
          {/* Logo */}
          <Link to={getLogoDestination()} className="flex items-center gap-2 sm:gap-2.5 group shrink-0">
            <div className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <span className="font-extrabold text-white text-base sm:text-xl tracking-tight flex items-center">
                P
                <span className="w-1.5 h-1.5 rounded-full bg-slate-900 ml-0.5"></span>
              </span>
              <div className="absolute -top-1 -right-1 w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75"></div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className={`text-base sm:text-xl font-bold tracking-tight transition-colors ${isDark ? 'text-white group-hover:text-emerald-400' : 'text-slate-900 group-hover:text-emerald-600'}`}>
                  Park<span className="text-emerald-500">Share</span>
                </span>
                <span className="text-[9px] sm:text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 tracking-wider">
                  Live
                </span>
              </div>
              <span className={`text-[10px] -mt-0.5 sm:-mt-1 hidden sm:inline ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>P2P Smart Mobility</span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {/* Center links removed for admin as requested */}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Optimized Light / Dark Theme Switcher */}
            <ThemeToggle className="scale-90 sm:scale-100" />

            {/* Notification Center Bell - Hidden on Landing Page */}
            {user && location.pathname !== '/' && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifMenu(!showNotifMenu)}
                  className={`relative p-2 rounded-xl transition-colors border cursor-pointer ${
                    isDark
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800/60 border-slate-800'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
                  }`}
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-slate-950 ring-2 ring-emerald-400/20">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowNotifMenu(false)}
                    />
                    <div className={`fixed left-3 right-3 sm:left-auto sm:right-0 sm:absolute top-16 sm:top-full mt-2 sm:w-96 max-w-md mx-auto sm:mx-0 rounded-2xl border shadow-2xl z-50 overflow-hidden ${
                      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-slate-900/10'
                    }`}>
                      <div className={`p-3.5 border-b flex items-center justify-between ${
                        isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-100 bg-slate-50'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Notifications</span>
                          {unreadCount > 0 && (
                            <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        <Link
                          to="/notifications"
                          onClick={() => setShowNotifMenu(false)}
                          className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          View All
                        </Link>
                      </div>
                      <div className={`max-h-80 overflow-y-auto divide-y ${isDark ? 'divide-slate-800/50' : 'divide-slate-100'}`}>
                        {notifications.length === 0 ? (
                          <div className={`p-6 text-center text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            No new notifications
                          </div>
                        ) : (
                          notifications.slice(0, 4).map((notif) => {
                            const isUnread = !notif.read && !(notif as any).isRead;
                            return (
                              <div
                                key={notif.id}
                                onClick={() => {
                                  markAsRead(notif.id);
                                  setShowNotifMenu(false);
                                  if (notif.link) {
                                    navigate(notif.link);
                                  } else if (notif.conversationId) {
                                    navigate(`/messages?bookingId=${notif.conversationId}`);
                                  }
                                }}
                                className={`p-3 text-xs cursor-pointer transition-colors flex items-start gap-2.5 ${
                                  isDark
                                    ? !isUnread ? 'hover:bg-slate-800/50' : 'bg-slate-800/20 hover:bg-slate-800/50'
                                    : !isUnread ? 'hover:bg-slate-50' : 'bg-slate-50/80 hover:bg-slate-100'
                                }`}
                              >
                                <div
                                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                    isUnread ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-slate-400'
                                  }`}
                                />
                                <div className="flex-1">
                                  <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{notif.title}</p>
                                  <p className={`mt-0.5 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{notif.message}</p>
                                  <span className="text-[10px] text-slate-500 mt-1 block">{notif.dateGroup || 'Today'}</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                      <div className={`p-2.5 border-t text-center ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                        <Link
                          to="/notifications"
                          onClick={() => setShowNotifMenu(false)}
                          className={`text-xs font-medium ${isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                          Open Notification Center →
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* User Profile / Dashboard Menu */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center gap-2 p-1.5 pl-2.5 pr-2 rounded-xl border transition-colors text-left cursor-pointer ${
                    isDark
                      ? 'bg-slate-800/70 hover:bg-slate-800 border-slate-700/60'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200'
                  }`}
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-emerald-500/50"
                  />
                  <div className="hidden sm:block text-xs">
                    <div className={`font-semibold leading-tight truncate max-w-[90px] ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{user.name}</div>
                    <div className="text-[10px] text-emerald-500 capitalize font-medium">{user.role}</div>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className={`absolute right-0 mt-2 w-64 rounded-2xl border shadow-2xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 ${
                      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-slate-900/10'
                    }`}>
                      <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-100 bg-slate-50'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Signed in as</p>
                        <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.email}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {user.role} Account
                          </span>
                          <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {user.role === 'admin'
                              ? 'Admin ID: #1001'
                              : user.role === 'owner'
                              ? 'Host ID: #8921'
                              : 'Driver ID: #4412'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-1 space-y-0.5">
                        <Link
                          to="/settings"
                          onClick={() => setShowUserMenu(false)}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold transition-colors text-left cursor-pointer ${
                            isDark ? 'text-slate-200 hover:bg-slate-800 hover:text-white' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <span className="flex items-center gap-2.5">
                            <Settings className="w-4 h-4 text-emerald-500" />
                            <span>Profile Settings</span>
                          </span>
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            Edit
                          </span>
                        </Link>

                        <Link
                          to="/login"
                          onClick={() => setShowUserMenu(false)}
                          className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs transition-colors text-left ${
                            isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <Repeat className="w-4 h-4 text-slate-400" /> Switch / Demo Roles
                        </Link>
                      </div>

                      {/* Prominent High-Contrast Sign Out Button */}
                      <div className={`p-2 border-t mt-1 ${isDark ? 'border-slate-800/80 bg-slate-950/30' : 'border-slate-100 bg-slate-50/60'}`}>
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserMenu(false);
                            logout();
                            navigate('/login');
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isDark
                              ? 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25'
                              : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/90 shadow-xs'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                            <span>Sign Out</span>
                          </span>
                          <span className={`text-[10px] font-medium ${isDark ? 'text-rose-400/80' : 'text-rose-600/80'}`}>
                            End session
                          </span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <Link
                  to="/login?mode=signin"
                  className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg sm:rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isDark ? 'text-slate-200 hover:text-white hover:bg-slate-800/60' : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  <span>Log in</span>
                  <span className="hidden sm:inline-block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Testing accounts
                  </span>
                </Link>
                <Link
                  to="/login?mode=signup"
                  className="px-3 sm:px-4 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg sm:rounded-xl transition-all shadow-md shadow-emerald-500/20 whitespace-nowrap"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile menu trigger - hidden on mobile view in landing page and driver/customer pages */}
            {!hideMobileMenu && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`md:hidden p-2 rounded-xl border transition-colors cursor-pointer ${
                  isDark
                    ? 'text-slate-300 hover:bg-slate-800 border-slate-800'
                    : 'text-slate-700 hover:bg-slate-100 border-slate-200'
                }`}
                aria-label="Open mobile menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile dropdown drawer */}
        {mobileMenuOpen && !hideMobileMenu && (
          <div className={`md:hidden pt-4 pb-3 border-t mt-3 space-y-2 transition-colors ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
            {isAdminView ? (
              <div className="space-y-1">
                <Link
                  to="/admin?tab=overview"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                    currentAdminTab === 'overview'
                      ? 'text-purple-400 bg-purple-500/20 font-bold'
                      : isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Admin Console
                </Link>
                <Link
                  to="/admin?tab=verification"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                    currentAdminTab === 'verification'
                      ? 'text-purple-400 bg-purple-500/20 font-bold'
                      : isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Verifications Queue
                </Link>
                <Link
                  to="/admin?tab=users"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                    currentAdminTab === 'users'
                      ? 'text-purple-400 bg-purple-500/20 font-bold'
                      : isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Users & Accounts
                </Link>
                <Link
                  to="/admin?tab=disputes"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                    currentAdminTab === 'disputes'
                      ? 'text-purple-400 bg-purple-500/20 font-bold'
                      : isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Dispute Tickets
                </Link>
              </div>
            ) : isOwnerView ? (
              <div className="space-y-1">
                <Link
                  to="/owner"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                >
                  Host Overview
                </Link>
                <Link
                  to="/add-space"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium hover:text-emerald-500 ${
                    isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  List New Space
                </Link>
                <Link
                  to="/owner/calendar"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium hover:text-emerald-500 ${
                    isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Availability Calendar
                </Link>
                <Link
                  to="/owner/earnings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium hover:text-emerald-500 ${
                    isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Earnings & Payouts
                </Link>
                <Link
                  to="/messages"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium hover:text-emerald-500 ${
                    isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Driver Inquiries
                </Link>
              </div>
            ) : location.pathname === '/' || !user ? (
              <div className="space-y-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20"
                >
                  Sign In / Log In
                </Link>
                <Link
                  to="/login?mode=signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                    isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  Create Free Account
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20"
                >
                  Dashboard
                </Link>
                <Link
                  to="/find"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium hover:text-emerald-500 ${
                    isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Find Parking
                </Link>
                <Link
                  to="/bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium hover:text-emerald-500 ${
                    isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  My Bookings
                </Link>
                <Link
                  to="/vehicles"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium hover:text-emerald-500 ${
                    isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  My Vehicles
                </Link>
                <Link
                  to="/saved"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium hover:text-emerald-500 ${
                    isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Saved Spots
                </Link>
                <Link
                  to="/qr-checkin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium hover:text-emerald-500 ${
                    isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  QR Check-in & Scanner
                </Link>
              </div>
            )}

            <div className={`pt-2 border-t space-y-1.5 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark ? 'text-slate-200 hover:bg-slate-800 hover:text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                Sign In / Switch Account
              </Link>
              {user && (
                <>
                  <Link
                    to="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                      isDark
                        ? 'text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-800'
                        : 'text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-emerald-500" />
                      <span>Profile Settings</span>
                    </span>
                    <span className="text-xs text-emerald-500 font-bold">Edit</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                      isDark
                        ? 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25'
                        : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 shadow-xs'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span>Sign Out</span>
                    </span>
                    <span className={`text-xs font-normal ${isDark ? 'text-rose-400/80' : 'text-rose-600/80'}`}>({user.name})</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>

    <ProfileSettingsModal
      isOpen={showSettingsModal}
      onClose={() => setShowSettingsModal(false)}
    />
  </>
);
};

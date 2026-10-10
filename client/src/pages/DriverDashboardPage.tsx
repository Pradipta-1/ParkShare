import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Compass,
  CalendarCheck2,
  Bookmark,
  Car,
  Bell,
  MapPin,
  QrCode,
  Navigation,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  X,
  Search,
  Plus,
  Sparkles,
  Zap,
  Wifi,
  Sun,
  Moon,
  Sunset,
  Copy,
  Check,
  RotateCcw,
  CreditCard,
  Settings,
} from 'lucide-react';
import { LiveTimer } from '../components/LiveTimer';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { Booking, Vehicle } from '../types';
import { api } from '../services/api';

export const DriverDashboardPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { isDark } = useTheme();
  const { favoriteSpaces } = useFavorites();
  const { notifications, markAsRead } = useNotifications();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [showTopupModal, setShowTopupModal] = useState<boolean>(false);
  const [topupAmount, setTopupAmount] = useState<number>(250);
  const [topupMethod, setTopupMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [isTopupProcessing, setIsTopupProcessing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [demoPassSimulated, setDemoPassSimulated] = useState<boolean>(false);

  // Calculate dynamic time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', icon: <Sun className="w-5 h-5 text-amber-400" /> };
    if (hour < 17) return { text: 'Good afternoon', icon: <Sunset className="w-5 h-5 text-amber-400" /> };
    return { text: 'Good evening', icon: <Moon className="w-5 h-5 text-cyan-400" /> };
  };

  const greetingInfo = getGreeting();

  useEffect(() => {
    if (user && user.role === 'owner') {
      navigate('/owner', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const bRes = await api.getBookings();
        if (bRes.success) {
          setBookings(bRes.data);
          const active = bRes.data.find((b) => b.bookingStatus === 'active' || b.bookingStatus === 'confirmed') || null;
          setActiveBooking(active);
        }
        const vRes = await api.getVehicles();
        if (vRes.success) {
          setVehicles(vRes.data);
        }
      } catch {
        // Fallback
      }
    };
    loadDashboardData();

    const handleBookingSync = () => {
      loadDashboardData();
    };
    window.addEventListener('parkshare_booking_created', handleBookingSync);
    window.addEventListener('parkshare_booking_cancelled', handleBookingSync);
    return () => {
      window.removeEventListener('parkshare_booking_created', handleBookingSync);
      window.removeEventListener('parkshare_booking_cancelled', handleBookingSync);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleTopup = (amountToAdd?: number) => {
    const amt = amountToAdd || topupAmount;
    if (amt <= 0) return;
    setIsTopupProcessing(true);
    setTimeout(() => {
      const current = user?.walletBalance || 0;
      updateUser({ walletBalance: current + amt });
      setIsTopupProcessing(false);
      setShowTopupModal(false);
      showToast(`₹${amt} added successfully to your ParkShare Wallet!`);
    }, 600);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    showToast('Gate Pass ID copied to clipboard');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/find?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/find');
    }
  };

  // Mock sample active booking for demonstration/preview if no real active booking
  const simulatedBooking: Booking = {
    id: 'demo_live_pass_01',
    bookingCode: 'PS-LIVE-8921',
    parkingId: 'park_allotted_1',
    parkingTitle: 'Park Street (Mother Teresa Sarani) Bay',
    parkingAddress: '78 Park Street, Near Mullick Bazar Crossing, Kolkata',
    parkingImage: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80',
    parkingLocation: { lat: 22.5512, lng: 88.3619 },
    userId: user?.id || 'usr_driver_1',
    userName: user?.name || 'Rahul Sen',
    userPhone: user?.phone || '+91 98301 23456',
    ownerId: 'usr_owner_1',
    vehicle: {
      id: 'veh_1',
      numberPlate: 'WB-02-AK-9821',
      brand: 'Honda',
      model: 'City',
      type: 'Car',
    },
    date: new Date().toISOString().split('T')[0],
    arrivalTime: '02:00 PM',
    departureTime: '05:00 PM',
    durationHours: 3,
    pricePerHour: 50,
    subtotal: 150,
    serviceFee: 15,
    totalAmount: 165,
    paymentStatus: 'paid',
    bookingStatus: 'active',
    paymentMethod: 'wallet',
    qrCodeData: 'PARKSHARE-AUTH:PS-LIVE-8921:BAY-P24:WB02AK9821',
    spotNumber: 'Bay P-24',
    createdAt: new Date().toISOString(),
  };

  const currentDisplayBooking = activeBooking || (demoPassSimulated ? simulatedBooking : null);

  return (
    <div className={`min-h-screen py-6 sm:py-8 transition-colors ${isDark ? 'bg-[#070b12] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-500/90 text-slate-950 font-bold text-xs sm:text-sm shadow-xl shadow-emerald-500/20 backdrop-blur-md animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-slate-950 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ========================================================= */}
          {/* LEFT SIDEBAR NAVIGATION & FINTECH WALLET (DESKTOP ONLY) */}
          {/* ========================================================= */}
          <aside className="hidden lg:block lg:col-span-3 space-y-5">
            {/* Sidebar Navigation */}
            <div className="p-4 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-1">
              <nav className="space-y-1 text-xs font-semibold">
                <Link
                  to="/dashboard"
                  className="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10 font-bold transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Compass className="w-4 h-4 text-emerald-400" />
                    <span>Overview Hub</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </Link>

                <Link
                  to="/find"
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                    <span>Find Parking</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  to="/bookings"
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <CalendarCheck2 className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                    <span>My Bookings</span>
                  </div>
                  {bookings.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-bold text-slate-300 border border-slate-700">
                      {bookings.length}
                    </span>
                  )}
                </Link>

                <Link
                  to="/saved"
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Bookmark className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                    <span>Saved Parking</span>
                  </div>
                  {favoriteSpaces.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-bold text-slate-300 border border-slate-700">
                      {favoriteSpaces.length}
                    </span>
                  )}
                </Link>

                <Link
                  to="/vehicles"
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Car className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                    <span>Vehicles Garage</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-bold text-slate-300 border border-slate-700">
                    {vehicles.length}
                  </span>
                </Link>

                <Link
                  to="/notifications"
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                    <span>Notifications</span>
                  </div>
                  {notifications.filter((n) => !n.read).length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                      {notifications.filter((n) => !n.read).length} new
                    </span>
                  )}
                </Link>

                <Link
                  to="/settings"
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                    <span>Profile & Settings</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </nav>
            </div>

            {/* Smart Digital Wallet Card (Fintech Style) */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0c1926] via-slate-900 to-[#09151f] border border-emerald-500/30 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/25 transition-all" />

              <div className="relative z-10 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-5 rounded-md bg-amber-400/20 border border-amber-400/40 flex items-center justify-center">
                      <div className="w-3 h-2 rounded-sm bg-amber-400/60" />
                    </div>
                    <Wifi className="w-3.5 h-3.5 text-emerald-400 rotate-90" />
                  </div>
                  <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-emerald-400/90 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Contactless Pass
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    ParkShare Wallet Balance
                  </span>
                  <div className="text-3xl font-black text-white tracking-tight flex items-baseline gap-1 mt-0.5">
                    <span>₹{user?.walletBalance ?? 0}</span>
                    <span className="text-xs text-emerald-400 font-semibold font-sans">Active</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Ready for 1-click contactless QR gate check-ins & auto-toll deductions.
                </p>

                {/* Quick Add Presets */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleTopup(100)}
                    className={`py-1.5 rounded-xl text-[11px] font-black border transition-all cursor-pointer ${
                      isDark
                        ? 'bg-slate-800/80 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 border-slate-700/60 hover:border-emerald-500/40'
                        : 'bg-white hover:bg-emerald-50 text-slate-900 hover:text-emerald-800 border-2 border-slate-200 hover:border-emerald-400 shadow-xs'
                    }`}
                  >
                    +₹100
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTopup(250)}
                    className={`py-1.5 rounded-xl text-[11px] font-black border transition-all cursor-pointer ${
                      isDark
                        ? 'bg-slate-800/80 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 border-slate-700/60 hover:border-emerald-500/40'
                        : 'bg-white hover:bg-emerald-50 text-slate-900 hover:text-emerald-800 border-2 border-slate-200 hover:border-emerald-400 shadow-xs'
                    }`}
                  >
                    +₹250
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTopup(500)}
                    className={`py-1.5 rounded-xl text-[11px] font-black border transition-all cursor-pointer ${
                      isDark
                        ? 'bg-slate-800/80 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 border-slate-700/60 hover:border-emerald-500/40'
                        : 'bg-white hover:bg-emerald-50 text-slate-900 hover:text-emerald-800 border-2 border-slate-200 hover:border-emerald-400 shadow-xs'
                    }`}
                  >
                    +₹500
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowTopupModal(true)}
                  className={`w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer mt-1 ${
                    isDark
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/25'
                  }`}
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Top-up Custom Amount</span>
                </button>
              </div>
            </div>
          </aside>

          {/* ========================================================= */}
          {/* MAIN DASHBOARD CONTENT (9 COLS) */}
          {/* ========================================================= */}
          <main className="lg:col-span-9 space-y-5 sm:space-y-7">
            {/* Top Greeting & Action Header */}
            <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800/80 backdrop-blur-xl relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5 relative z-10">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      Smart Driver Hub
                    </span>
                    <span className="text-slate-400 text-xs flex items-center gap-1">
                      ● Live Grid • Kolkata Metro Area
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                    <span>
                      {greetingInfo.text}, {user?.name?.split(' ')[0] || 'Rahul'}
                    </span>
                    {greetingInfo.icon}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
                    Welcome back! Real-time parking availability across 40+ connected smart garages.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 w-full sm:w-auto">
                  <Link
                    to="/find"
                    className={`px-3.5 sm:px-4 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer text-center ${
                      isDark
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
                    }`}
                  >
                    <MapPin className="w-4 h-4 stroke-[2.5]" />
                    <span>Find New Spot</span>
                  </Link>

                  <Link
                    to="/qr-checkin"
                    className={`px-3.5 sm:px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer text-center ${
                      isDark
                        ? 'bg-slate-800/90 hover:bg-slate-700 text-white border-slate-700/80'
                        : 'bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-300 shadow-xs'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-emerald-500" />
                    <span>Gate Scanner</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Admin Live Action Alerts (Security Key, Wallet Credit, Dispute Refund) */}
            {notifications.filter(
              (n) => !n.read && (
                n.type === 'refund' ||
                n.title.toLowerCase().includes('security') ||
                n.title.toLowerCase().includes('dispute') ||
                n.title.toLowerCase().includes('admin') ||
                n.title.toLowerCase().includes('wallet') ||
                n.title.toLowerCase().includes('key')
              )
            ).length > 0 && (
              <div className="space-y-2.5">
                {notifications.filter(
                  (n) => !n.read && (
                    n.type === 'refund' ||
                    n.title.toLowerCase().includes('security') ||
                    n.title.toLowerCase().includes('dispute') ||
                    n.title.toLowerCase().includes('admin') ||
                    n.title.toLowerCase().includes('wallet') ||
                    n.title.toLowerCase().includes('key')
                  )
                ).map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-3 backdrop-blur-md shadow-lg"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 mt-0.5 shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            Admin Security & Support Update
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1">{alert.title}</h4>
                        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{alert.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to="/notifications"
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold transition-colors"
                      >
                        Details
                      </Link>
                      <button
                        onClick={() => markAsRead(alert.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Dismiss notice"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick KPI Stat Metric Cards (Row of 4) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Active Pass
                </span>
                <div className="text-lg sm:text-2xl font-black text-white mt-1 flex items-center gap-1.5">
                  {currentDisplayBooking ? (
                    <span className="text-emerald-400 font-mono text-base sm:text-lg">1 Active</span>
                  ) : (
                    <span className="text-slate-400 text-base sm:text-lg">None</span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5 truncate">
                  {currentDisplayBooking ? currentDisplayBooking.spotNumber : 'Ready to park'}
                </span>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Wallet Balance
                </span>
                <div className="text-lg sm:text-2xl font-black text-emerald-400 mt-1">
                  ₹{user?.walletBalance ?? 0}
                </div>
                <button
                  type="button"
                  onClick={() => setShowTopupModal(true)}
                  className="text-[10px] text-emerald-400 hover:underline block mt-0.5 font-semibold cursor-pointer"
                >
                  + Add Funds
                </button>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Saved Spots
                </span>
                <div className="text-lg sm:text-2xl font-black text-white mt-1">
                  {favoriteSpaces.length}
                </div>
                <Link to="/saved" className="text-[10px] text-slate-400 hover:text-emerald-400 block mt-0.5">
                  Quick Re-reserve →
                </Link>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Garage Vehicles
                </span>
                <div className="text-lg sm:text-2xl font-black text-white mt-1">
                  {vehicles.length}
                </div>
                <Link to="/vehicles" className="text-[10px] text-slate-400 hover:text-emerald-400 block mt-0.5 font-mono truncate">
                  {vehicles[0]?.numberPlate || '+ Add Vehicle'}
                </Link>
              </div>
            </div>

            {/* Mobile-Only Smart Fintech Wallet Card */}
            <div className="lg:hidden p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#0c1926] via-slate-900 to-[#09151f] border border-emerald-500/30 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-4.5 rounded bg-amber-400/20 border border-amber-400/40 flex items-center justify-center">
                      <div className="w-2.5 h-1.5 rounded-xs bg-amber-400/60" />
                    </div>
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                      <Wifi className="w-2.5 h-2.5 text-emerald-400 rotate-90" />
                      Contactless Pass
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTopupModal(true)}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Top-up</span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      ParkShare Wallet
                    </span>
                    <div className="text-2xl font-black text-white tracking-tight flex items-baseline gap-1.5 mt-0.5">
                      <span>₹{user?.walletBalance ?? 0}</span>
                      <span className="text-xs text-emerald-400 font-semibold font-sans">Active</span>
                    </div>
                  </div>

                  {/* Quick Add Presets */}
                  <div className="flex items-center gap-1.5">
                    {[100, 250, 500].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleTopup(amt)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-emerald-500/20 text-slate-200 hover:text-emerald-400 text-xs font-bold border border-slate-700/70 hover:border-emerald-500/40 transition-all cursor-pointer"
                      >
                        +₹{amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* HERO SECTION: ACTIVE RESERVATION TICKET vs SMART SPOT FINDER */}
            {/* ========================================================= */}
            {currentDisplayBooking ? (
              /* LIVE DIGITAL BOARDING PASS CARD */
              <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-[#0c1824] via-slate-900 to-[#0c1420] border-2 border-emerald-500/40 shadow-2xl relative overflow-hidden animate-fade-in">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
                  <div className="space-y-4 max-w-xl flex-1">
                    {/* Status Badge & Live Timer */}
                    <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                      <span className="px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-500/20">
                        <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
                        Active Reservation
                      </span>
                      <LiveTimer initialSeconds={6138} />
                      {demoPassSimulated && (
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold border border-cyan-500/30">
                          Demo Preview Mode
                        </span>
                      )}
                    </div>

                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        {currentDisplayBooking.parkingTitle}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                        {currentDisplayBooking.parkingAddress}
                      </p>
                    </div>

                    {/* Assigned Bay & Details Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 text-xs pt-1">
                      <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-950/70 border border-emerald-500/30">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Bay Assigned</span>
                        <span className="font-black text-emerald-400 text-base sm:text-lg">
                          {currentDisplayBooking.spotNumber || 'Bay P-24'}
                        </span>
                      </div>
                      <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Time Window</span>
                        <span className="font-semibold text-white truncate block">
                          {currentDisplayBooking.arrivalTime} → {currentDisplayBooking.departureTime}
                        </span>
                      </div>
                      <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Vehicle</span>
                        <span className="font-mono text-white truncate block font-bold">
                          {currentDisplayBooking.vehicle?.numberPlate || 'WB-02-AK-9821'}
                        </span>
                      </div>
                      <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Pass ID</span>
                          <span className="font-mono text-emerald-400 font-bold truncate block">{currentDisplayBooking.bookingCode}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(currentDisplayBooking.bookingCode)}
                          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white shrink-0 ml-1"
                          title="Copy Pass ID"
                        >
                          {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-2 flex-wrap sm:flex-nowrap">
                      <button
                        type="button"
                        onClick={() => setShowQrModal(true)}
                        className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer text-center ${
                          isDark
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
                        }`}
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Show QR Entry Pass</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const lat = currentDisplayBooking.parkingLocation?.lat || 22.5512;
                          const lng = currentDisplayBooking.parkingLocation?.lng || 88.3619;
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
                        }}
                        className={`flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-colors cursor-pointer text-center ${
                          isDark
                            ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                            : 'bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-300 shadow-xs'
                        }`}
                      >
                        <Navigation className="w-3.5 h-3.5 text-blue-500" />
                        <span>Directions</span>
                      </button>

                      <Link
                        to="/messages"
                        className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-colors text-center ${
                          isDark
                            ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                            : 'bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-300 shadow-xs'
                        }`}
                      >
                        Chat Host
                      </Link>

                      {demoPassSimulated ? (
                        <button
                          type="button"
                          onClick={() => setDemoPassSimulated(false)}
                          className="px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 border border-slate-700 text-xs font-semibold cursor-pointer"
                        >
                          Close Preview
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm('Are you sure you want to cancel this active booking? The amount will be refunded to your wallet.')) return;
                            try {
                              await api.cancelBooking(currentDisplayBooking.id);
                            } catch {}
                            setActiveBooking(null);
                            setDemoPassSimulated(false);
                            setBookings((prev) =>
                              prev.map((b) => (b.id === currentDisplayBooking.id ? { ...b, bookingStatus: 'cancelled' } : b))
                            );
                            if (user && currentDisplayBooking.totalAmount) {
                              updateUser({ walletBalance: (user.walletBalance || 0) + currentDisplayBooking.totalAmount });
                            }
                            showToast('Booking cancelled. Parking allotment released and amount refunded to wallet.');
                          }}
                          className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            isDark
                              ? 'text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30'
                              : 'text-rose-700 hover:text-rose-950 bg-rose-50 hover:bg-rose-100 border-2 border-rose-300 shadow-xs'
                          }`}
                        >
                          <X className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* QR Pass Box on Desktop */}
                  <div
                    onClick={() => setShowQrModal(true)}
                    className="hidden md:flex flex-col items-center bg-slate-950 p-4 rounded-3xl border border-emerald-500/30 shrink-0 cursor-pointer group hover:border-emerald-400 transition-all shadow-xl"
                  >
                    <div className="bg-white p-3 rounded-2xl shadow-inner group-hover:scale-102 transition-transform">
                      <QRCodeSVG value={currentDisplayBooking.qrCodeData} size={110} />
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 mt-2.5 font-bold tracking-wider">
                      {currentDisplayBooking.bookingCode}
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5">Click to Enlarge</span>
                  </div>
                </div>
              </div>
            ) : (
              /* SMART SPOT FINDER HERO (REPLACING THE DULL EMPTY CARD) */
              <div className="p-5 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900/90 via-[#0a121d] to-slate-950 border border-slate-800/90 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 space-y-5 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        Zero Cruising • Guaranteed Bay
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        Where are you parking today?
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-400 max-w-lg">
                        Search any destination to reserve an open spot with automated boom-barrier QR access.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDemoPassSimulated(true)}
                      className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Preview how an active gate pass ticket looks"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Preview Live Pass</span>
                    </button>
                  </div>

                  {/* Interactive Search Bar */}
                  <form onSubmit={handleSearchSubmit} className="relative">
                    <div className="flex items-center rounded-2xl bg-slate-950/80 border border-slate-800 focus-within:border-emerald-500/60 transition-all p-1.5 sm:p-2 shadow-inner">
                      <Search className="w-4 sm:w-5 h-4 sm:h-5 text-slate-400 ml-2.5 sm:ml-3 shrink-0" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search landmark, airport or metro..."
                        className="w-full bg-transparent border-none px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 shrink-0 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                      >
                        <span>Find Spots</span>
                        <ArrowRight className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  </form>

                  {/* Quick Popular Hotspot Pills */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      Trending High-Demand Smart Hubs
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar sm:flex-wrap">
                      <button
                        type="button"
                        onClick={() => navigate('/find?q=Park%20Street')}
                        className="px-3 py-1.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 text-xs font-medium text-slate-300 hover:text-emerald-400 border border-slate-800/80 hover:border-emerald-500/40 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Park Street (14 free • ₹50/hr)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/find?q=Sector%20V')}
                        className="px-3 py-1.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 text-xs font-medium text-slate-300 hover:text-emerald-400 border border-slate-800/80 hover:border-emerald-500/40 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                      >
                        <MapPin className="w-3.5 h-3.5 text-blue-400" />
                        <span>Salt Lake Sector V (24 free • ₹40/hr)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/find?q=Airport')}
                        className="px-3 py-1.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 text-xs font-medium text-slate-300 hover:text-emerald-400 border border-slate-800/80 hover:border-emerald-500/40 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                      >
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        <span>Airport T2 (8 free • ₹80/hr)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/find?q=Howrah')}
                        className="px-3 py-1.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 text-xs font-medium text-slate-300 hover:text-emerald-400 border border-slate-800/80 hover:border-emerald-500/40 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                      >
                        <MapPin className="w-3.5 h-3.5 text-purple-400" />
                        <span>Howrah Station Hub (18 free • ₹35/hr)</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FULLSCREEN QR BARRIER ENTRY MODAL */}
      {/* ========================================================= */}
      {showQrModal && currentDisplayBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className={`border rounded-3xl p-5 sm:p-7 max-w-sm w-full text-center space-y-4 shadow-2xl relative overflow-hidden max-h-[92vh] overflow-y-auto ${
            isDark
              ? 'bg-[#0b121e] border-emerald-500/40 text-white'
              : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
          }`}>
            <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <span className={`text-xs uppercase font-mono font-bold flex items-center gap-1.5 ${
                isDark ? 'text-emerald-400' : 'text-emerald-700'
              }`}>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Contactless Boom Barrier Pass
              </span>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className={`p-1 rounded-lg transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Align this QR code with the gate scanner camera at the entry barrier.
            </p>

            {/* Glowing High-Contrast QR Code */}
            <div className={`p-4 rounded-3xl inline-block shadow-xl mx-auto relative border-2 ${
              isDark ? 'bg-white border-emerald-500/30' : 'bg-white border-slate-200'
            }`}>
              <QRCodeSVG value={currentDisplayBooking.qrCodeData} size={180} level="H" />
            </div>

            <div className={`p-3.5 rounded-2xl border text-xs space-y-1.5 text-left font-mono ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              <div className="flex justify-between">
                <span className={`font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Spot Assigned:</span>
                <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700 font-sans'}`}>{currentDisplayBooking.spotNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className={`font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Vehicle Plate:</span>
                <span className={`font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentDisplayBooking.vehicle?.numberPlate || 'WB-02-AK-9821'}</span>
              </div>
              <div className="flex justify-between">
                <span className={`font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Pass Code:</span>
                <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700 font-mono'}`}>{currentDisplayBooking.bookingCode}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className={`w-full py-3 rounded-2xl font-black text-sm shadow-lg cursor-pointer transition-all ${
                isDark
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
              }`}
            >
              Done & Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* WALLET TOP-UP MODAL */}
      {/* ========================================================= */}
      {showTopupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className={`border rounded-3xl p-5 sm:p-7 max-w-md w-full space-y-4 sm:space-y-5 shadow-2xl relative max-h-[92vh] overflow-y-auto ${
            isDark ? 'bg-[#0b121e] border-emerald-500/40 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl border ${
                  isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>Top-up ParkShare Wallet</h3>
                  <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Current Balance: ₹{user?.walletBalance ?? 0}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTopupModal(false)}
                className={`p-1 rounded-lg transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Amount Selection */}
            <div className="space-y-2">
              <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Select Amount (₹)</label>
              <div className="grid grid-cols-4 gap-2">
                {[100, 250, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopupAmount(amt)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      topupAmount === amt
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                        : isDark
                        ? 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(Number(e.target.value))}
                  placeholder="Or enter custom amount..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                  }`}
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Payment Method</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setTopupMethod('upi')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    topupMethod === 'upi'
                      ? isDark
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold'
                        : 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                      : isDark
                      ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  UPI (Fast)
                </button>
                <button
                  type="button"
                  onClick={() => setTopupMethod('card')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    topupMethod === 'card'
                      ? isDark
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold'
                        : 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                      : isDark
                      ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  Card
                </button>
                <button
                  type="button"
                  onClick={() => setTopupMethod('netbanking')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    topupMethod === 'netbanking'
                      ? isDark
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold'
                        : 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                      : isDark
                      ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  NetBanking
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled={isTopupProcessing || topupAmount <= 0}
                onClick={() => handleTopup(topupAmount)}
                className={`w-full py-3 rounded-2xl disabled:opacity-50 font-black text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  isDark
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
                }`}
              >
                {isTopupProcessing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-slate-950" />
                    <span>Add ₹{topupAmount} to Wallet</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

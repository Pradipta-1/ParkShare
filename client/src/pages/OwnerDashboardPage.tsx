import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Layers,
  Star,
  CheckCircle,
  PlusCircle,
  Pause,
  Play,
  Eye,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Trash2,
  AlertTriangle,
  X,
  CheckCircle2,
  Car,
  Clock,
  MapPin,
  Zap,
  Wifi,
  Sun,
  Moon,
  Sunset,
  ArrowRight,
  Activity,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Compass,
  CreditCard,
  Building,
  Settings,
} from 'lucide-react';
import { OccupancyRing } from '../components/OccupancyRing';
import { ParkingSpace } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { api } from '../services/api';

export const OwnerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { notifications, markAsRead } = useNotifications();
  const navigate = useNavigate();

  const hostName = user && user.role === 'owner' ? user.name : 'Vikramaditya Roy';
  const hostAvatar =
    user && user.role === 'owner' && user.avatar
      ? user.avatar
      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';

  const [spaces, setSpaces] = useState<ParkingSpace[]>([]);
  const [metrics, setMetrics] = useState<any>({
    todayEarnings: 0,
    totalEarnings: 0,
    activeBookings: 0,
    occupancy: 0,
    rating: 5.0,
  });
  const [earningsChart, setEarningsChart] = useState<any[]>([]);
  const [occupancyChart, setOccupancyChart] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [spaceToDelete, setSpaceToDelete] = useState<ParkingSpace | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string>('');
  const [spaceFilter, setSpaceFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dynamic time-of-day greeting (matching customer dashboard)
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', icon: <Sun className="w-5 h-5 text-amber-400" /> };
    if (hour < 17) return { text: 'Good afternoon', icon: <Sunset className="w-5 h-5 text-amber-400" /> };
    return { text: 'Good evening', icon: <Moon className="w-5 h-5 text-cyan-400" /> };
  };

  const greetingInfo = getGreeting();

  const fetchOwnerData = async () => {
    setIsLoading(true);
    try {
      const mRes = await api.getOwnerMetrics();
      if (mRes.success) {
        setMetrics(mRes.data.metrics);
        setEarningsChart(mRes.data.earningsChart);
        setOccupancyChart(mRes.data.occupancyChart);
      }
      const sRes = await api.getOwnerSpaces();
      const localCustom: ParkingSpace[] = JSON.parse(
        localStorage.getItem('parkshare_custom_spaces') || '[]'
      );
      if (sRes.success) {
        const merged = [...localCustom, ...sRes.data.filter((s) => !localCustom.some((c) => c.id === s.id))];
        setSpaces(merged);
      } else if (localCustom.length > 0) {
        setSpaces(localCustom);
      }
    } catch {
      const localCustom: ParkingSpace[] = JSON.parse(
        localStorage.getItem('parkshare_custom_spaces') || '[]'
      );
      if (localCustom.length > 0) {
        setSpaces(localCustom);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOwnerData();
  }, []);

  const handleToggleStatus = async (spaceId: string) => {
    try {
      const res = await api.toggleSpaceStatus(spaceId);
      if (res.success) {
        setSpaces((prev) =>
          prev.map((s) => (s.id === spaceId ? { ...s, status: res.data.status } : s))
        );
        setActionSuccess(
          `Listing marked as ${res.data.status === 'active' ? 'Live & Active' : 'Paused'}`
        );
        setTimeout(() => setActionSuccess(''), 3500);
      }
    } catch {
      // Ignore
    }
  };

  const handleConfirmDelete = async () => {
    if (!spaceToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteParkingSpace(spaceToDelete.id);
      setSpaces((prev) => prev.filter((s) => s.id !== spaceToDelete.id));
      setActionSuccess(`Parking space "${spaceToDelete.title}" has been permanently deleted.`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch {
      // Fallback local deletion
      setSpaces((prev) => prev.filter((s) => s.id !== spaceToDelete.id));
      setActionSuccess(`Parking space "${spaceToDelete.title}" deleted.`);
      setTimeout(() => setActionSuccess(''), 4000);
    } finally {
      setIsDeleting(false);
      setSpaceToDelete(null);
    }
  };

  const activeCount = useMemo(() => spaces.filter((s) => s.status === 'active').length, [spaces]);
  const pausedCount = useMemo(() => spaces.filter((s) => s.status !== 'active').length, [spaces]);

  const filteredSpaces = useMemo(() => {
    return spaces.filter((space) => {
      if (spaceFilter === 'active' && space.status !== 'active') return false;
      if (spaceFilter === 'paused' && space.status === 'active') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          space.title?.toLowerCase().includes(q) ||
          space.address?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [spaces, spaceFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 py-6 sm:py-8">
      {/* Toast Notification */}
      {actionSuccess && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-500/90 text-slate-950 font-bold text-xs sm:text-sm shadow-xl shadow-emerald-500/20 backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-slate-950 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-4 sm:space-y-8">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ========================================================= */}
          {/* LEFT SIDEBAR NAVIGATION & HOST VAULT (DESKTOP) */}
          {/* ========================================================= */}
          <aside className="hidden lg:block lg:col-span-3 space-y-5">
            {/* Host Nav Card */}
            <div className="p-4 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-1">
              {/* Navigation Menu */}
              <nav className="space-y-1 text-xs font-semibold">
                <Link
                  to="/owner"
                  className="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10 font-bold transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Host Overview</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </Link>

                <Link
                  to="/add-space"
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <PlusCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span>List New Space</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  to="/owner/calendar"
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                    <span>Availability Calendar</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  to="/owner/earnings"
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                    <span>Earnings & Payouts</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                    ₹{metrics.todayEarnings}
                  </span>
                </Link>

                <Link
                  to="/messages"
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                    <span>Driver Inquiries</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-400 border border-slate-700">
                    Active
                  </span>
                </Link>

                <Link
                  to="/settings"
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                    <span>Host Profile & Settings</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </nav>
            </div>

            {/* Smart Host Protection & Vault Card (Fintech Style) */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0c1a26] via-slate-900 to-[#09151f] border border-emerald-500/30 shadow-2xl relative overflow-hidden group">
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
                    Host Protection
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    Host Damage Coverage
                  </span>
                  <div className="text-2xl font-black text-white tracking-tight flex items-baseline gap-1 mt-0.5">
                    <span>Up to ₹5,00,000</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  All listings backed by automated perimeter security & vehicle damage indemnity.
                </p>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">Next Auto-Payout:</span>
                  <span className="font-bold text-emerald-400 font-mono">Tomorrow 10 AM</span>
                </div>

                <Link
                  to="/owner/earnings"
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer mt-1"
                >
                  <CreditCard className="w-4 h-4 stroke-[2.5]" />
                  <span>View Payout History</span>
                </Link>
              </div>
            </div>
          </aside>

          {/* ========================================================= */}
          {/* MAIN DASHBOARD WORKSPACE (9 COLS) */}
          {/* ========================================================= */}
          <main className="lg:col-span-9 space-y-6 sm:space-y-8">
            {/* Top Greeting & Action Header (Matching Customer Style) */}
            <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800/80 backdrop-blur-xl relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5 relative z-10">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      Host Operations Hub
                    </span>
                    <span className="text-slate-400 text-xs flex items-center gap-1">
                      ● Live Grid • Kolkata Metro Area
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                    <span>
                      {greetingInfo.text}, {hostName.split(' ')[0]}
                    </span>
                    {greetingInfo.icon}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-300">
                    Manage parking capacity, monitor real-time revenue velocity, and control spot listings.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={fetchOwnerData}
                    className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer shadow-sm"
                    title="Refresh Live Metrics"
                  >
                    <RefreshCw className={`w-4 h-4 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>

                  <Link
                    to="/add-space"
                    className="px-4 sm:px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>List New Space</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Admin Live Action Alerts for Host (Space Verification, Security Key, Dispute Resolution) */}
            {notifications.filter(
              (n) => !n.read && (
                n.type === 'verification' ||
                n.title.toLowerCase().includes('security') ||
                n.title.toLowerCase().includes('dispute') ||
                n.title.toLowerCase().includes('admin') ||
                n.title.toLowerCase().includes('space') ||
                n.title.toLowerCase().includes('verification')
              )
            ).length > 0 && (
              <div className="space-y-2.5">
                {notifications.filter(
                  (n) => !n.read && (
                    n.type === 'verification' ||
                    n.title.toLowerCase().includes('security') ||
                    n.title.toLowerCase().includes('dispute') ||
                    n.title.toLowerCase().includes('admin') ||
                    n.title.toLowerCase().includes('space') ||
                    n.title.toLowerCase().includes('verification')
                  )
                ).map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3.5 sm:p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-start justify-between gap-3 backdrop-blur-md shadow-lg"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 mt-0.5 shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                            Admin Platform Notice
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1">{alert.title}</h4>
                        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{alert.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to="/notifications"
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold transition-colors"
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

            {/* Top 4 Metric Cards (Matching Customer Aesthetics) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
              {/* Today's Earnings */}
              <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/70 border border-slate-800/80 hover:border-emerald-500/40 backdrop-blur-md space-y-2 transition-all shadow-lg group">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-[11px] sm:text-xs">Today's Earnings</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  ₹{metrics.todayEarnings.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+14% vs yesterday</span>
                </div>
              </div>

              {/* Active Bookings */}
              <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/70 border border-slate-800/80 hover:border-cyan-500/40 backdrop-blur-md space-y-2 transition-all shadow-lg group">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-[11px] sm:text-xs">Active Bookings</span>
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                    <Car className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {metrics.activeBookings}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Live parked cars</span>
                </div>
              </div>

              {/* Peak Occupancy */}
              <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/70 border border-slate-800/80 hover:border-amber-500/40 backdrop-blur-md space-y-2 transition-all shadow-lg group">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-[11px] sm:text-xs">Peak Occupancy</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {metrics.occupancy}%
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                  <span>Peak hour capacity</span>
                </div>
              </div>

              {/* Host Rating */}
              <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/70 border border-slate-800/80 hover:border-amber-400/40 backdrop-blur-md space-y-2 transition-all shadow-lg group">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-[11px] sm:text-xs">Host Rating</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    <Star className="w-4 h-4 fill-amber-400" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {metrics.rating}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Superhost Badge</span>
                </div>
              </div>
            </div>

            {/* Charts Row: Weekly Revenue Area Chart & Hourly Profile Bar Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Earnings Chart (7 cols) */}
              <div className="lg:col-span-7 p-5 sm:p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                      <span>Weekly Revenue Velocity</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Daily earnings across all registered parking bays</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shadow-sm">
                    ₹11,170 This Week
                  </span>
                </div>

                <div className="h-60 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={earningsChart}>
                      <defs>
                        <linearGradient id="ownerRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#090e1a',
                          borderColor: '#1e293b',
                          borderRadius: '16px',
                          fontSize: '12px',
                          color: '#f8fafc',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#ownerRevenueGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Occupancy Heatmap by Hour (5 cols) */}
              <div className="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl space-y-4 shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                    <span>Hourly Occupancy Profile</span>
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Spot utilization patterns by time of day</p>
                </div>

                <div className="h-56 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={occupancyChart}>
                      <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#090e1a',
                          borderColor: '#1e293b',
                          borderRadius: '16px',
                          fontSize: '12px',
                          color: '#f8fafc',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)',
                        }}
                      />
                      <Bar dataKey="occupancy" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80">
                  <span>Peak window: 12 PM - 4 PM</span>
                  <span className="text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                    92% peak fill
                  </span>
                </div>
              </div>
            </div>

            {/* Parking Spaces Management List */}
            <div className="space-y-4">
              {/* Header with Search and Status Filter Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div>
                  <h3 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                    <span>My Parking Spaces</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                      {spaces.length} Total
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Manage real-time availability, hourly tariffs, and instant pause status</p>
                </div>

                {/* Filter Pills & Search */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Status Pills */}
                  <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setSpaceFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        spaceFilter === 'all'
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      All ({spaces.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpaceFilter('active')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        spaceFilter === 'active'
                          ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                          : 'text-emerald-400/80 hover:text-emerald-300'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Active ({activeCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpaceFilter('paused')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        spaceFilter === 'paused'
                          ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                          : 'text-amber-400/80 hover:text-amber-300'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Paused ({pausedCount})
                    </button>
                  </div>

                  <Link
                    to="/add-space"
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors px-2 py-1"
                  >
                    <span>+ Add Space</span>
                  </Link>
                </div>
              </div>

              {/* Spaces Feed */}
              <div className="space-y-4">
                {filteredSpaces.map((space) => {
                  const isLive = space.status === 'active';
                  const occPercent = Math.min(
                    100,
                    Math.round(
                      ((space.totalSpots - space.availableSpots) / Math.max(1, space.totalSpots)) * 100
                    )
                  );

                  return (
                    <div
                      key={space.id}
                      className="p-5 sm:p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 backdrop-blur-xl transition-all shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 group"
                    >
                      <div className="flex items-start gap-4 sm:gap-5 min-w-0">
                        {/* Thumbnail Image */}
                        <div className="relative shrink-0">
                          <img
                            src={
                              space.images?.[0] ||
                              'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80'
                            }
                            alt={space.title || 'Parking spot'}
                            className="w-20 sm:w-24 h-20 sm:h-24 rounded-2xl object-cover ring-1 ring-slate-700/80 shadow-md group-hover:scale-105 transition-transform"
                          />
                          <span
                            className={`absolute top-1.5 left-1.5 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                              isLive
                                ? 'bg-emerald-500/90 text-slate-950'
                                : 'bg-amber-500/90 text-slate-950'
                            }`}
                          >
                            {isLive ? 'Live' : 'Paused'}
                          </span>
                        </div>

                        {/* Space Details */}
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base sm:text-lg font-extrabold text-white truncate">
                              {space.title}
                            </h4>

                            {space.isVerified && (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Verified
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate">{space.address}</span>
                          </p>

                          {/* Stats Badges */}
                          <div className="flex items-center gap-3 sm:gap-4 text-xs text-slate-300 pt-1 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                {space.operatingHours?.open || '06:00'} -{' '}
                                {space.operatingHours?.close || '23:00'}
                              </span>
                            </div>

                            <span className="text-slate-600">•</span>

                            <div className="flex items-center gap-1">
                              <span className="text-emerald-400 font-extrabold font-mono text-sm">
                                ₹{space.pricePerHour}
                              </span>
                              <span className="text-slate-400 text-[11px]">/hr</span>
                            </div>

                            <span className="text-slate-600">•</span>

                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white">
                                {space.availableSpots} of {space.totalSpots}
                              </span>
                              <span className="text-[11px] text-slate-400">spots free</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons: 2x2 grid on mobile, flex row on sm+ */}
                      <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                        {/* Live Preview Button */}
                        <Link
                          to={`/parking/${space.id}`}
                          className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Preview</span>
                        </Link>

                        {/* Calendar Button */}
                        <Link
                          to="/owner/calendar"
                          className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center"
                        >
                          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Calendar</span>
                        </Link>

                        {/* Pause / Activate Toggle Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(space.id)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center ${
                            isLive
                              ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                              : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                        >
                          {isLive ? (
                            <>
                              <Pause className="w-3.5 h-3.5" />
                              <span>Pause</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              <span>Activate</span>
                            </>
                          )}
                        </button>

                        {/* Delete Parking Button */}
                        <button
                          type="button"
                          onClick={() => setSpaceToDelete(space)}
                          className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs font-semibold border border-slate-700/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center"
                          title="Delete Parking Listing"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredSpaces.length === 0 && (
                <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">No parking spots found</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {searchQuery
                      ? 'No listings matched your search query. Try clearing the search.'
                      : 'You do not have any parking spots under this filter. List your driveway or garage to start earning.'}
                  </p>
                  <Link
                    to="/add-space"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
                  >
                    <PlusCircle className="w-4 h-4" /> Add Your First Spot
                  </Link>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {spaceToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#090e1a] border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-rose-400">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
                <h3 className="text-base font-bold text-white">Delete Parking Listing</h3>
              </div>
              <button
                type="button"
                onClick={() => setSpaceToDelete(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p>
                Are you sure you want to permanently delete this parking listing? This action cannot be undone.
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-bold text-white block text-sm">{spaceToDelete.title}</span>
                <span className="text-slate-400">{spaceToDelete.address}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSpaceToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Parking'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

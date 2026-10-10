import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  Shield,
  Zap,
  Building,
  Plane,
  Train,
  ShoppingBag,
  Briefcase,
  Hospital,
  GraduationCap,
  Trophy,
  Sparkles,
  CheckCircle2,
  Car,
  Bookmark,
  Layers,
  ChevronRight,
  LogIn,
  UserPlus,
  QrCode,
  DollarSign,
  Star,
  Lock,
  Compass,
} from 'lucide-react';
import { LeafletMap } from '../components/LeafletMap';
import { ParkingCard } from '../components/ParkingCard';
import { ParkingSpace } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { formatLiveDistance } from '../utils/distance';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [parkingList, setParkingList] = useState<ParkingSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [activePersonaTab, setActivePersonaTab] = useState<'driver' | 'owner'>('driver');

  // Auto-detect user live GPS location on landing page mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
      );
    }
  }, []);

  // Search state
  const [searchLocation, setSearchLocation] = useState('Central Avenue, Bowbazar');
  const [searchDate, setSearchDate] = useState('Today');
  const [arrivalTime, setArrivalTime] = useState('02:00 PM');
  const [departureTime, setDepartureTime] = useState('05:00 PM');

  useEffect(() => {
    const loadParking = async () => {
      try {
        const res = await api.getParkingSpaces();
        if (res.success) {
          setParkingList(res.data);
          if (res.data.length > 0) {
            setSelectedSpace(res.data[0]);
          }
        }
      } catch {
        // Fallback
      }
    };
    loadParking();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/find?q=${encodeURIComponent(searchLocation)}`);
  };

  const categories = [
    { name: 'Downtown', icon: Building, spots: '32 spots', color: 'text-emerald-400 bg-emerald-500/10' },
    { name: 'Airport', icon: Plane, spots: '18 spots', color: 'text-blue-400 bg-blue-500/10' },
    { name: 'Railway Station', icon: Train, spots: '24 spots', color: 'text-amber-400 bg-amber-500/10' },
    { name: 'Shopping', icon: ShoppingBag, spots: '45 spots', color: 'text-purple-400 bg-purple-500/10' },
    { name: 'Business District', icon: Briefcase, spots: '50 spots', color: 'text-indigo-400 bg-indigo-500/10' },
    { name: 'Hospitals', icon: Hospital, spots: '15 spots', color: 'text-rose-400 bg-rose-500/10' },
    { name: 'Universities', icon: GraduationCap, spots: '20 spots', color: 'text-cyan-400 bg-cyan-500/10' },
    { name: 'Stadiums', icon: Trophy, spots: '12 spots', color: 'text-orange-400 bg-orange-500/10' },
  ];

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-200 ${isDark ? 'bg-[#0b0f17] text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* 1. HERO STARTER SECTION: HOW PARKSHARE WORKS & ACCOUNT SIGN IN PROMPT */}
      <section className={`relative pt-10 pb-16 lg:pt-16 lg:pb-20 overflow-hidden border-b transition-colors ${isDark ? 'border-slate-800/80 bg-[#0b0f17]' : 'border-slate-200 bg-white'}`}>
        {/* Ambient lighting glows */}
        <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[450px] blur-[140px] rounded-full pointer-events-none -z-10 ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-500/5'}`} />
        <div className={`absolute top-1/2 right-10 w-[400px] h-[400px] blur-[130px] rounded-full pointer-events-none -z-10 ${isDark ? 'bg-purple-500/10' : 'bg-purple-500/5'}`} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-10">
            <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs shadow-xs transition-colors ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>How ParkShare Works</span>
              <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>•</span>
              <span className="text-emerald-500 font-bold">Smart P2P Mobility Platform</span>
            </div>

            <h1 className={`text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] sm:leading-[1.1] ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Effortless Parking Discovery <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500">
                & Space Sharing Made Simple.
              </span>
            </h1>

            <p className={`text-sm sm:text-lg font-normal leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Find, reserve, and share parking spots with guaranteed entry. Connect drivers needing safe spaces with hosts monetizing empty driveways and garages.
            </p>
          </div>

          {/* DEDICATED SIGN IN / LOG IN PROMPT CARD */}
          <div className={`max-w-4xl mx-auto mb-8 sm:mb-12 p-4 sm:p-8 rounded-2xl sm:rounded-3xl backdrop-blur-2xl border shadow-2xl relative overflow-hidden transition-all ${
            isDark
              ? 'bg-gradient-to-b from-slate-900/90 to-slate-950/90 border-emerald-500/30 shadow-emerald-950/20'
              : 'bg-white border-emerald-500/30 shadow-slate-900/10 ring-1 ring-slate-200/80'
          }`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6 relative z-10">
              <div className="space-y-1.5 sm:space-y-2 text-center md:text-left">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-500">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Get Started with ParkShare
                </span>
                <h2 className={`text-xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {user ? `Welcome Back, ${user.name}!` : 'Sign in to access your account'}
                </h2>
                <p className={`text-xs sm:text-sm max-w-xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {user
                    ? `You are signed in as a ${user.role}. Open your dashboard or manage bookings and parking spaces.`
                    : 'Choose your profile to find parking spots, list your driveway, or access management operations.'}
                </p>
              </div>

              {/* Direct Buttons to Redirect to Login Page */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0">
                {user ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (user.role === 'admin') navigate('/admin');
                      else if (user.role === 'owner') navigate('/owner');
                      else navigate('/dashboard');
                    }}
                    className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Open Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className={`w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer shadow-xl ${
                        isDark
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
                      }`}
                    >
                      <LogIn className="w-4 h-4 stroke-[2.5]" />
                      <span>Log In / Sign In</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/login?mode=signup')}
                      className={`w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm border-2 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                        isDark
                          ? 'bg-slate-800/80 hover:bg-slate-800 text-white border-slate-700/80'
                          : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-300'
                      }`}
                    >
                      <UserPlus className="w-4 h-4 stroke-[2.5]" />
                      <span>Create Account</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 3 Persona Cards: Driver, Owner, Admin */}
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-8 pt-5 sm:pt-6 border-t relative z-10 ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
              {/* Persona 1: Driver */}
              <div
                onClick={() => navigate('/login?role=driver')}
                className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
                  isDark
                    ? 'bg-slate-950/70 border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-900'
                    : 'bg-slate-50 border-slate-200 hover:border-emerald-500/50 hover:bg-slate-100/80 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center sm:block gap-2.5 sm:gap-0 mb-2 sm:mb-2.5">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Car className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <h3 className={`text-sm font-bold group-hover:text-emerald-500 transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Customer / Driver
                    </h3>
                  </div>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Search nearby spots, lock in hourly bookings, and check in via touchless QR pass.
                  </p>
                </div>
                <div className="mt-3 text-xs font-bold text-emerald-500 flex items-center gap-1">
                  <span>Sign In as Driver</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Persona 2: Owner */}
              <div
                onClick={() => navigate('/login?role=owner')}
                className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
                  isDark
                    ? 'bg-slate-950/70 border-slate-800/80 hover:border-blue-500/50 hover:bg-slate-900'
                    : 'bg-slate-50 border-slate-200 hover:border-blue-500/50 hover:bg-slate-100/80 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center sm:block gap-2.5 sm:gap-0 mb-2 sm:mb-2.5">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Building className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <h3 className={`text-sm font-bold group-hover:text-blue-500 transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Space Owner / Host
                    </h3>
                  </div>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    List empty driveways or parking bays, set calendar rates, and receive weekly bank payouts.
                  </p>
                </div>
                <div className="mt-3 text-xs font-bold text-blue-500 flex items-center gap-1">
                  <span>Sign In as Owner</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Persona 3: Admin */}
              <div
                onClick={() => navigate('/login?role=admin')}
                className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
                  isDark
                    ? 'bg-slate-950/70 border-slate-800/80 hover:border-purple-500/50 hover:bg-slate-900'
                    : 'bg-slate-50 border-slate-200 hover:border-purple-500/50 hover:bg-slate-100/80 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center sm:block gap-2.5 sm:gap-0 mb-2 sm:mb-2.5">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <h3 className={`text-sm font-bold group-hover:text-purple-500 transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Platform Administrator
                    </h3>
                  </div>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Verify host documents, award verified badges, review dispute tickets, and sync telemetry.
                  </p>
                </div>
                <div className="mt-3 text-xs font-bold text-purple-500 flex items-center gap-1">
                  <span>Sign In as Admin</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE CORE "HOW IT WORKS" EXPERIENCE (CENTERPIECE OF THE HOMEPAGE) */}
      <section id="how-it-works" className={`py-10 sm:py-16 lg:py-24 border-b transition-colors relative ${isDark ? 'bg-[#080d17] border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-500">
              Interactive Platform Guide
            </span>
            <h2 className={`text-2xl sm:text-4xl font-black tracking-tight mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              How ParkShare Works Step-by-Step
            </h2>
            <p className={`text-xs sm:text-sm mt-2 sm:mt-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Explore how our peer-to-peer ecosystem makes parking seamless for drivers and lucrative for owners.
            </p>

            {/* Persona Switcher Tabs */}
            <div className={`grid grid-cols-2 sm:inline-flex p-1 rounded-xl sm:rounded-2xl mt-5 sm:mt-6 shadow-inner w-full sm:w-auto max-w-md mx-auto border transition-colors ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-200/80 border-slate-300'
            }`}>
              <button
                type="button"
                onClick={() => setActivePersonaTab('driver')}
                className={`px-3 sm:px-5 py-2.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                  activePersonaTab === 'driver'
                    ? isDark
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-700 hover:text-slate-950 hover:bg-white/60 font-bold'
                }`}
              >
                <Car className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="hidden sm:inline">For Drivers (Find & Park)</span>
                <span className="sm:hidden">For Drivers</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePersonaTab('owner')}
                className={`px-3 sm:px-5 py-2.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                  activePersonaTab === 'owner'
                    ? isDark
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                      : 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-700 hover:text-slate-950 hover:bg-white/60 font-bold'
                }`}
              >
                <Building className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="hidden sm:inline">For Space Owners (List & Earn)</span>
                <span className="sm:hidden">For Owners</span>
              </button>
            </div>
          </div>

          {/* DRIVER WORKFLOW: 5 STEPS */}
          {activePersonaTab === 'driver' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 sm:gap-6">
              {/* Step 1 */}
              <div className={`p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all text-left sm:text-center flex sm:flex-col items-start sm:items-center gap-3.5 sm:gap-0 group ${
                isDark ? 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/50' : 'bg-white border-slate-200 hover:border-emerald-500/50 shadow-xs'
              }`}>
                <div className="flex sm:flex-col items-center gap-2 sm:gap-0 shrink-0">
                  <span className="text-[10px] sm:text-xs font-mono font-black text-emerald-500 bg-emerald-500/10 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full sm:mb-3">
                    01
                  </span>
                  <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-emerald-500 sm:mb-3.5 transition-colors ${
                    isDark ? 'bg-slate-800/80 group-hover:bg-emerald-500/20' : 'bg-slate-100 group-hover:bg-emerald-100'
                  }`}>
                    <Search className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm sm:text-base font-bold mb-1 sm:mb-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>1. Search Spot</h3>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Enter your target location, dates, and arrival time to view available spots within walking distance.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className={`p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all text-left sm:text-center flex sm:flex-col items-start sm:items-center gap-3.5 sm:gap-0 group ${
                isDark ? 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/50' : 'bg-white border-slate-200 hover:border-emerald-500/50 shadow-xs'
              }`}>
                <div className="flex sm:flex-col items-center gap-2 sm:gap-0 shrink-0">
                  <span className="text-[10px] sm:text-xs font-mono font-black text-blue-500 bg-blue-500/10 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full sm:mb-3">
                    02
                  </span>
                  <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-blue-500 sm:mb-3.5 transition-colors ${
                    isDark ? 'bg-slate-800/80 group-hover:bg-blue-500/20' : 'bg-slate-100 group-hover:bg-blue-100'
                  }`}>
                    <Compass className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm sm:text-base font-bold mb-1 sm:mb-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>2. Compare & Pick</h3>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Filter by covered bays, EV charging, CCTV security, ratings, and transparent hourly prices.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className={`p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all text-left sm:text-center flex sm:flex-col items-start sm:items-center gap-3.5 sm:gap-0 group ${
                isDark ? 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/50' : 'bg-white border-slate-200 hover:border-emerald-500/50 shadow-xs'
              }`}>
                <div className="flex sm:flex-col items-center gap-2 sm:gap-0 shrink-0">
                  <span className="text-[10px] sm:text-xs font-mono font-black text-purple-500 bg-purple-500/10 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full sm:mb-3">
                    03
                  </span>
                  <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-purple-500 sm:mb-3.5 transition-colors ${
                    isDark ? 'bg-slate-800/80 group-hover:bg-purple-500/20' : 'bg-slate-100 group-hover:bg-purple-100'
                  }`}>
                    <Lock className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm sm:text-base font-bold mb-1 sm:mb-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>3. Reserve Spot</h3>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Book instantly with secure digital escrow. Receive guaranteed space protection with no surge fees.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className={`p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all text-left sm:text-center flex sm:flex-col items-start sm:items-center gap-3.5 sm:gap-0 group ${
                isDark ? 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/50' : 'bg-white border-slate-200 hover:border-emerald-500/50 shadow-xs'
              }`}>
                <div className="flex sm:flex-col items-center gap-2 sm:gap-0 shrink-0">
                  <span className="text-[10px] sm:text-xs font-mono font-black text-amber-500 bg-amber-500/10 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full sm:mb-3">
                    04
                  </span>
                  <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-amber-500 sm:mb-3.5 transition-colors ${
                    isDark ? 'bg-slate-800/80 group-hover:bg-amber-500/20' : 'bg-slate-100 group-hover:bg-amber-100'
                  }`}>
                    <QrCode className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm sm:text-base font-bold mb-1 sm:mb-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>4. QR Check-In</h3>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Navigate via GPS directly to the slot. Scan your digital QR pass at the entrance to activate session.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className={`p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all text-left sm:text-center flex sm:flex-col items-start sm:items-center gap-3.5 sm:gap-0 group ${
                isDark ? 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/50' : 'bg-white border-slate-200 hover:border-emerald-500/50 shadow-xs'
              }`}>
                <div className="flex sm:flex-col items-center gap-2 sm:gap-0 shrink-0">
                  <span className="text-[10px] sm:text-xs font-mono font-black text-teal-500 bg-teal-500/10 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full sm:mb-3">
                    05
                  </span>
                  <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-teal-500 sm:mb-3.5 transition-colors ${
                    isDark ? 'bg-slate-800/80 group-hover:bg-teal-500/20' : 'bg-slate-100 group-hover:bg-teal-100'
                  }`}>
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm sm:text-base font-bold mb-1 sm:mb-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>5. Done & Depart</h3>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Check out seamlessly with automated duration tracking, instant receipts, and leave a review.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* OWNER WORKFLOW: 5 STEPS */}
          {activePersonaTab === 'owner' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 sm:gap-6">
              {/* Step 1 */}
              <div className={`p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all text-left sm:text-center flex sm:flex-col items-start sm:items-center gap-3.5 sm:gap-0 group ${
                isDark ? 'bg-slate-900/80 border-slate-800 hover:border-blue-500/50' : 'bg-white border-slate-200 hover:border-blue-500/50 shadow-xs'
              }`}>
                <div className="flex sm:flex-col items-center gap-2 sm:gap-0 shrink-0">
                  <span className="text-[10px] sm:text-xs font-mono font-black text-blue-500 bg-blue-500/10 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full sm:mb-3">
                    01
                  </span>
                  <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-blue-500 sm:mb-3.5 transition-colors ${
                    isDark ? 'bg-slate-800/80 group-hover:bg-blue-500/20' : 'bg-slate-100 group-hover:bg-blue-100'
                  }`}>
                    <Building className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm sm:text-base font-bold mb-1 sm:mb-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>1. List Your Space</h3>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Pin your address, upload clear photos of your driveway or garage, and specify spot dimensions.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className={`p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all text-left sm:text-center flex sm:flex-col items-start sm:items-center gap-3.5 sm:gap-0 group ${
                isDark ? 'bg-slate-900/80 border-slate-800 hover:border-blue-500/50' : 'bg-white border-slate-200 hover:border-blue-500/50 shadow-xs'
              }`}>
                <div className="flex sm:flex-col items-center gap-2 sm:gap-0 shrink-0">
                  <span className="text-[10px] sm:text-xs font-mono font-black text-emerald-500 bg-emerald-500/10 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full sm:mb-3">
                    02
                  </span>
                  <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-emerald-500 sm:mb-3.5 transition-colors ${
                    isDark ? 'bg-slate-800/80 group-hover:bg-emerald-500/20' : 'bg-slate-100 group-hover:bg-emerald-100'
                  }`}>
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm sm:text-base font-bold mb-1 sm:mb-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>2. Get Verified</h3>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Upload ID or utility proof to earn the official "Verified Parking" badge and boost driver trust.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className={`p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all text-left sm:text-center flex sm:flex-col items-start sm:items-center gap-3.5 sm:gap-0 group ${
                isDark ? 'bg-slate-900/80 border-slate-800 hover:border-blue-500/50' : 'bg-white border-slate-200 hover:border-blue-500/50 shadow-xs'
              }`}>
                <div className="flex sm:flex-col items-center gap-2 sm:gap-0 shrink-0">
                  <span className="text-[10px] sm:text-xs font-mono font-black text-purple-500 bg-purple-500/10 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full sm:mb-3">
                    03
                  </span>
                  <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-purple-500 sm:mb-3.5 transition-colors ${
                    isDark ? 'bg-slate-800/80 group-hover:bg-purple-500/20' : 'bg-slate-100 group-hover:bg-purple-100'
                  }`}>
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm sm:text-base font-bold mb-1 sm:mb-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>3. Set Calendar</h3>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Block dates when you need your space, set weekend pricing multipliers, or toggle instant booking.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className={`p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all text-left sm:text-center flex sm:flex-col items-start sm:items-center gap-3.5 sm:gap-0 group ${
                isDark ? 'bg-slate-900/80 border-slate-800 hover:border-blue-500/50' : 'bg-white border-slate-200 hover:border-blue-500/50 shadow-xs'
              }`}>
                <div className="flex sm:flex-col items-center gap-2 sm:gap-0 shrink-0">
                  <span className="text-[10px] sm:text-xs font-mono font-black text-amber-500 bg-amber-500/10 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full sm:mb-3">
                    04
                  </span>
                  <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-amber-500 sm:mb-3.5 transition-colors ${
                    isDark ? 'bg-slate-800/80 group-hover:bg-amber-500/20' : 'bg-slate-100 group-hover:bg-amber-100'
                  }`}>
                    <QrCode className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm sm:text-base font-bold mb-1 sm:mb-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>4. Auto Check-In</h3>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Drivers scan your designated QR code to park. No key handovers or physical interactions required.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className={`p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all text-left sm:text-center flex sm:flex-col items-start sm:items-center gap-3.5 sm:gap-0 group ${
                isDark ? 'bg-slate-900/80 border-slate-800 hover:border-blue-500/50' : 'bg-white border-slate-200 hover:border-blue-500/50 shadow-xs'
              }`}>
                <div className="flex sm:flex-col items-center gap-2 sm:gap-0 shrink-0">
                  <span className="text-[10px] sm:text-xs font-mono font-black text-emerald-500 bg-emerald-500/10 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full sm:mb-3">
                    05
                  </span>
                  <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-emerald-500 sm:mb-3.5 transition-colors ${
                    isDark ? 'bg-slate-800/80 group-hover:bg-emerald-500/20' : 'bg-slate-100 group-hover:bg-emerald-100'
                  }`}>
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm sm:text-base font-bold mb-1 sm:mb-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>5. Collect Payouts</h3>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Track cumulative revenues in real-time and request instant payouts directly to your bank account or UPI.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Prompt in How It Works Section to Redirect to Sign In */}
          <div className={`mt-8 sm:mt-12 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 sm:gap-4 transition-all ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Ready to experience seamless parking?</h4>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Sign in to book a spot or list your private driveway in under 2 minutes.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>Sign In to Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. LIVE SEARCH & MAP EXPLORER PREVIEW */}
      <section className={`py-10 sm:py-16 border-b transition-colors ${isDark ? 'bg-[#0b0f17] border-slate-800/80' : 'bg-white border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            {/* Search Box on Left */}
            <div className="lg:col-span-5 space-y-4 sm:space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Live Inventory</span>
                <h2 className={`text-xl sm:text-3xl font-extrabold tracking-tight mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Preview Parking Near You
                </h2>
                <p className={`text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Test-search any location, compare hourly pricing, and view real-time space capacity before reserving.
                </p>
              </div>

              <div className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border shadow-xl transition-all ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'
              }`}>
                <form onSubmit={handleSearchSubmit} className="space-y-3 sm:space-y-3.5">
                  <div>
                    <label className={`text-[10px] font-bold uppercase tracking-wider px-2 block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Target Destination
                    </label>
                    <div className={`flex items-center gap-2 px-3 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border focus-within:border-emerald-500 transition-colors mt-1 ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300'
                    }`}>
                      <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                      <input
                        type="text"
                        value={searchLocation}
                        onChange={(e) => setSearchLocation(e.target.value)}
                        placeholder="Search street, metro or landmark..."
                        className={`w-full bg-transparent text-xs sm:text-sm outline-none font-medium ${
                          isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={`text-[10px] font-bold uppercase tracking-wider px-2 block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Arrival Time
                      </label>
                      <div className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl sm:rounded-2xl border text-xs mt-1 ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}>
                        <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <select
                          value={arrivalTime}
                          onChange={(e) => setArrivalTime(e.target.value)}
                          className="bg-transparent w-full outline-none font-medium cursor-pointer text-xs"
                        >
                          {['09:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '04:00 PM', '06:00 PM'].map((t) => (
                            <option key={t} value={t} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className={`text-[10px] font-bold uppercase tracking-wider px-2 block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Departure Time
                      </label>
                      <div className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl sm:rounded-2xl border text-xs mt-1 ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}>
                        <Clock className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <select
                          value={departureTime}
                          onChange={(e) => setDepartureTime(e.target.value)}
                          className="bg-transparent w-full outline-none font-medium cursor-pointer text-xs"
                        >
                          {['12:00 PM', '03:00 PM', '05:00 PM', '07:00 PM', '09:00 PM', '11:00 PM'].map((t) => (
                            <option key={t} value={t} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>Search Available Parking</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>

              <div className={`flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-start gap-2.5 sm:gap-4 text-[11px] sm:text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <span className={`flex items-center gap-1 font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Guaranteed Slots
                </span>
                <span className={`flex items-center gap-1 font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Zap className="w-3.5 h-3.5 text-blue-500 shrink-0" /> Instant QR Entry
                </span>
                <span className={`flex items-center gap-1 font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" /> 4.9/5 Rating
                </span>
              </div>
            </div>

            {/* Map on Right */}
            <div className="lg:col-span-7 relative">
              <div className={`relative h-[320px] sm:h-[440px] w-full rounded-2xl sm:rounded-3xl overflow-hidden border shadow-2xl transition-all ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <LeafletMap
                  spaces={parkingList}
                  selectedSpaceId={selectedSpace?.id}
                  onSelectSpace={(space) => setSelectedSpace(space)}
                  center={[22.5697, 88.3582]}
                  zoom={14}
                  userLocation={userCoords}
                  onLocationChange={setUserCoords}
                  showRadius={true}
                />

                {selectedSpace && (
                  <div className={`absolute bottom-2 left-2 right-2 sm:left-auto sm:right-4 sm:bottom-4 z-20 sm:w-72 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl backdrop-blur-xl border shadow-2xl transition-all ${
                    isDark ? 'bg-slate-950/95 border-slate-700/80 text-white' : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-900/10'
                  }`}>
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      <img
                        src={selectedSpace.images[0] || 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80'}
                        alt={selectedSpace.title}
                        onError={(e) => {
                          const fallback = 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80';
                          if (e.currentTarget.src !== fallback) {
                            e.currentTarget.src = fallback;
                          }
                        }}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl object-cover ring-1 ring-emerald-500/40 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedSpace.title}</h4>
                        <div className={`flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          <span className="text-amber-500 font-bold shrink-0">⭐ {selectedSpace.rating}</span>
                          <span className="truncate">
                            {formatLiveDistance(
                              userCoords?.[0],
                              userCoords?.[1],
                              selectedSpace.location.lat,
                              selectedSpace.location.lng,
                              selectedSpace.distanceMeters
                            )}{' '}
                            away
                          </span>
                        </div>
                        <div className="text-xs font-extrabold text-emerald-500 mt-0.5 sm:mt-1">
                          ₹{selectedSpace.pricePerHour}/hour
                        </div>
                      </div>
                    </div>
                    <div className={`mt-2 sm:mt-2.5 flex items-center justify-between gap-2 pt-1.5 sm:pt-2 border-t text-[10px] ${
                      isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'
                    }`}>
                      <span className="truncate">Covered • CCTV • 24/7</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (!user) {
                            navigate('/login');
                            return;
                          }
                          navigate(`/parking/${selectedSpace.id}`);
                        }}
                        className="text-emerald-500 font-bold hover:underline cursor-pointer shrink-0"
                      >
                        View Parking →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURED DESTINATIONS */}
      <section className={`py-10 sm:py-14 border-b transition-colors ${isDark ? 'bg-[#090d15] border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-500">
                Popular Hubs
              </span>
              <h2 className={`text-xl sm:text-3xl font-extrabold tracking-tight mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Parking in High-Demand Transit & City Zones
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  navigate('/login');
                  return;
                }
                navigate('/find');
              }}
              className="text-xs font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 group cursor-pointer self-start sm:self-auto"
            >
              <span>Explore all destinations</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.name}
                  onClick={() => {
                    if (!user) {
                      navigate('/login');
                      return;
                    }
                    navigate(`/find?category=${encodeURIComponent(cat.name)}`);
                  }}
                  className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl border transition-all cursor-pointer group ${
                    isDark
                      ? 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                      : 'bg-white hover:bg-slate-100/80 border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 ${cat.color}`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <h3 className={`text-xs sm:text-sm font-bold group-hover:text-emerald-500 transition-colors truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {cat.name}
                  </h3>
                  <span className={`text-[11px] sm:text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{cat.spots}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. TOP RATED VERIFIED SPACES */}
      <section className={`py-10 sm:py-16 transition-colors ${isDark ? 'bg-[#0b0f17]' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-500">
                Verified Listings
              </span>
              <h2 className={`text-xl sm:text-3xl font-extrabold tracking-tight mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Top Rated Community Spaces
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  navigate('/login');
                  return;
                }
                navigate('/find');
              }}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-700'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25 hover:scale-[1.02]'
              }`}
            >
              <span>View all on live map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {parkingList.slice(0, 6).map((parking) => (
              <ParkingCard key={parking.id} parking={parking} layout="grid" />
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

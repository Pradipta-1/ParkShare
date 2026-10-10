import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User as UserIcon,
  Camera,
  Upload,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Shield,
  Car,
  Building,
  Save,
  ArrowLeft,
  Globe,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=250&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=250&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=250&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=250&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=250&auto=format&fit=crop&q=80',
];

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(user?.avatar || AVATAR_PRESETS[0]);
  const [city, setCity] = useState(user?.city || 'Kolkata, India');
  const [bio, setBio] = useState(
    user?.bio ||
      (user?.role === 'owner'
        ? 'Verified parking host providing safe, sheltered spaces.'
        : user?.role === 'admin'
        ? 'ParkShare platform trust and security administrator.'
        : 'Daily urban commuter seeking guaranteed reserved parking.')
  );

  const [isCustomUrl, setIsCustomUrl] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [profileStats, setProfileStats] = useState<{
    bookingsCount: number;
    activeCount: number;
    walletBalance: number;
  }>({
    bookingsCount: 0,
    activeCount: 0,
    walletBalance: user?.walletBalance || 0,
  });

  React.useEffect(() => {
    const loadProfileStats = async () => {
      try {
        const res = await api.getBookings();
        if (res.success && res.data) {
          const active = res.data.filter(
            (b) => b.bookingStatus === 'active' || b.bookingStatus === 'confirmed'
          ).length;
          setProfileStats({
            bookingsCount: res.data.length,
            activeCount: active,
            walletBalance: user?.walletBalance || 0,
          });
        }
      } catch {}
    };
    loadProfileStats();
    const handleSync = () => loadProfileStats();
    window.addEventListener('parkshare_booking_created', handleSync);
    return () => window.removeEventListener('parkshare_booking_created', handleSync);
  }, [user]);

  // Synchronize form state whenever user changes
  React.useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAvatar(user.avatar || AVATAR_PRESETS[0]);
      setCity(user.city || 'Kolkata, India');
      setBio(
        user.bio ||
          (user.role === 'owner'
            ? 'Verified parking host providing safe, sheltered spaces.'
            : user.role === 'admin'
            ? 'ParkShare platform trust and security administrator.'
            : 'Daily urban commuter seeking guaranteed reserved parking.')
      );
    }
  }, [user]);

  const getBackDestination = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'owner') return '/owner';
    return '/dashboard';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds 2MB limit. Please select a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyCustomUrl = () => {
    if (customAvatarUrl.trim()) {
      setAvatar(customAvatarUrl.trim());
      setIsCustomUrl(false);
      setCustomAvatarUrl('');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      avatar,
      city: city.trim(),
      bio: bio.trim(),
    };

    try {
      const res = await api.updateProfile(payload);
      if (res.success && res.user) {
        updateUser(res.user);
      } else {
        updateUser(payload);
      }
      setToastMessage('Profile settings saved successfully!');
      setTimeout(() => setToastMessage(''), 2500);
    } catch {
      updateUser(payload);
      setToastMessage('Profile updated successfully!');
      setTimeout(() => setToastMessage(''), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`min-h-screen py-4 sm:py-6 px-3 sm:px-6 lg:px-8 transition-colors ${isDark ? 'bg-[#070b12] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-2xl mx-auto space-y-3.5 sm:space-y-4">
        {/* Compact Top Navigation Bar */}
        <div className="flex items-center justify-between gap-3">
          <Link
            to={getBackDestination()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-emerald-500/40 text-xs font-semibold transition-all group shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>Dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {user?.role || 'User'}
            </span>
            <span className={`text-xs font-mono hidden sm:inline ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {user?.email}
            </span>
          </div>
        </div>

        {/* Compact Page Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
              Profile Settings
            </h1>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Update your photo, personal details, and account preferences.
            </p>
          </div>
        </div>

        {/* Real-Time Profile Activity & Booking Stats */}
        <div className={`grid grid-cols-3 gap-2 p-2.5 sm:p-3 rounded-2xl border ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <div className="text-center">
            <span className={`block text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {user?.role === 'admin' ? 'Platform Bookings' : user?.role === 'owner' ? 'Host Reservations' : 'Total Bookings'}
            </span>
            <span className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {profileStats.bookingsCount}
            </span>
          </div>
          <div className="text-center border-x border-slate-800/60">
            <span className={`block text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Active Passes
            </span>
            <span className="text-base sm:text-lg font-black text-emerald-400">
              {profileStats.activeCount}
            </span>
          </div>
          <div className="text-center">
            <span className={`block text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Wallet Balance
            </span>
            <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">
              ₹{user?.walletBalance ?? 0}
            </span>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Compact Settings Card */}
        <div className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border shadow-xl ${isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'}`}>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* Integrated Avatar Row */}
            <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-3.5">
                <div className="relative group shrink-0">
                  <img
                    src={avatar}
                    alt={name}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover ring-2 ring-emerald-500/50 shadow-md"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md bg-emerald-500 text-slate-950 flex items-center justify-center shadow-xs">
                    <Camera className="w-3 h-3" />
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <label
                      htmlFor="settings-avatar-file-input"
                      className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload Picture</span>
                      <input
                        id="settings-avatar-file-input"
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsCustomUrl(!isCustomUrl)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                        isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Globe className="w-3 h-3 text-emerald-400" />
                      <span>Image URL</span>
                    </button>
                  </div>

                  {isCustomUrl ? (
                    <div className="flex items-center gap-1.5 pt-1 animate-in fade-in">
                      <input
                        type="url"
                        placeholder="Paste image URL (https://...)"
                        value={customAvatarUrl}
                        onChange={(e) => setCustomAvatarUrl(e.target.value)}
                        className={`flex-1 px-2.5 py-1 rounded-lg text-xs border outline-none ${
                          isDark ? 'bg-slate-900 border-slate-800 text-white focus:border-emerald-500' : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={handleApplyCustomUrl}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs shrink-0 cursor-pointer"
                      >
                        Set
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-0.5 no-scrollbar">
                      <span className={`text-[10px] font-medium shrink-0 mr-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Presets:</span>
                      {AVATAR_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatar(preset)}
                          className={`w-7 h-7 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                            avatar === preset ? 'border-emerald-400 ring-2 ring-emerald-500/40 scale-105' : 'border-transparent opacity-65 hover:opacity-100'
                          }`}
                        >
                          <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Inputs 2x2 Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
                  <UserIcon className="w-3 h-3 text-emerald-400" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sen"
                  className={`w-full px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium border outline-none transition-colors ${
                    isDark
                      ? 'bg-slate-900/90 border-slate-800 text-white focus:border-emerald-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
                  <Mail className="w-3 h-3 text-emerald-400" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@parkshare.com"
                  className={`w-full px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium border outline-none transition-colors ${
                    isDark
                      ? 'bg-slate-900/90 border-slate-800 text-white focus:border-emerald-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  <span>Phone Number</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98301 23456"
                  className={`w-full px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium border outline-none transition-colors ${
                    isDark
                      ? 'bg-slate-900/90 border-slate-800 text-white focus:border-emerald-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>City / Region</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Kolkata, India"
                  className={`w-full px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium border outline-none transition-colors ${
                    isDark
                      ? 'bg-slate-900/90 border-slate-800 text-white focus:border-emerald-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'
                  }`}
                />
              </div>
            </div>

            {/* Bio / Description */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
                <FileText className="w-3 h-3 text-emerald-400" />
                <span>Bio / Notes</span>
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell other users or parking guests a little about yourself..."
                className={`w-full px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium border outline-none resize-none transition-colors ${
                  isDark
                    ? 'bg-slate-900/90 border-slate-800 text-white focus:border-emerald-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'
                }`}
              />
            </div>

            {/* Role Badge and Action Buttons */}
            <div className={`pt-3 border-t flex items-center justify-between gap-3 ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2 text-xs">
                {user?.role === 'admin' ? (
                  <Shield className="w-4 h-4 text-indigo-400" />
                ) : user?.role === 'owner' ? (
                  <Building className="w-4 h-4 text-amber-400" />
                ) : (
                  <Car className="w-4 h-4 text-emerald-400" />
                )}
                <span className={`text-[11px] font-medium hidden sm:inline ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {user?.role?.toUpperCase()} • Member since {user?.memberSince || '2023'}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

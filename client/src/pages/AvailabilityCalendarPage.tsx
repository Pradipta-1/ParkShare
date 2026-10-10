import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Lock,
  Unlock,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { api } from '../services/api';
import { ParkingSpace } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const AvailabilityCalendarPage: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [spaces, setSpaces] = useState<ParkingSpace[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('');
  const [pricingMap, setPricingMap] = useState<Record<string, number>>({
    '2026-10-06': 40,
    '2026-10-07': 40,
    '2026-10-08': 40,
    '2026-10-09': 45,
    '2026-10-10': 50,
    '2026-10-11': 60,
    '2026-10-12': 60,
  });
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-06');
  const [customPrice, setCustomPrice] = useState<number>(40);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    const loadSpaces = async () => {
      try {
        const res = await api.getOwnerSpaces();
        const localCustom: ParkingSpace[] = JSON.parse(
          localStorage.getItem('parkshare_custom_spaces') || '[]'
        );
        const combined = [
          ...localCustom,
          ...(res.success ? res.data.filter((s: ParkingSpace) => !localCustom.some((c) => c.id === s.id)) : []),
        ];
        if (combined.length > 0) {
          setSpaces(combined);
          setSelectedSpaceId(combined[0].id);
        }
      } catch {
        const localCustom: ParkingSpace[] = JSON.parse(
          localStorage.getItem('parkshare_custom_spaces') || '[]'
        );
        if (localCustom.length > 0) {
          setSpaces(localCustom);
          setSelectedSpaceId(localCustom[0].id);
        }
      }
    };
    loadSpaces();
  }, []);

  const calendarDays = [
    { day: 'MON', date: '2026-10-06', price: pricingMap['2026-10-06'] || 40, occupancy: 70 },
    { day: 'TUE', date: '2026-10-07', price: pricingMap['2026-10-07'] || 40, occupancy: 75 },
    { day: 'WED', date: '2026-10-08', price: pricingMap['2026-10-08'] || 40, occupancy: 82 },
    { day: 'THU', date: '2026-10-09', price: pricingMap['2026-10-09'] || 45, occupancy: 78 },
    { day: 'FRI', date: '2026-10-10', price: pricingMap['2026-10-10'] || 50, occupancy: 94 },
    { day: 'SAT', date: '2026-10-11', price: pricingMap['2026-10-11'] || 60, occupancy: 98 },
    { day: 'SUN', date: '2026-10-12', price: pricingMap['2026-10-12'] || 60, occupancy: 91 },
  ];

  const formatDateShort = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleToggleBlock = async (dateStr: string) => {
    const nextBlocked = blockedDates.includes(dateStr)
      ? blockedDates.filter((d) => d !== dateStr)
      : [...blockedDates, dateStr];
    setBlockedDates(nextBlocked);
    if (selectedSpaceId) {
      try {
        const pricingCalendar = Object.entries(pricingMap).map(([date, price]) => ({ date, price }));
        await api.updateCalendar(selectedSpaceId, { blockedDates: nextBlocked, pricingCalendar });
      } catch {}
    }
  };

  const handleApplyCustomPrice = async () => {
    const nextMap = { ...pricingMap, [selectedDate]: customPrice };
    setPricingMap(nextMap);
    if (selectedSpaceId) {
      try {
        const pricingCalendar = Object.entries(nextMap).map(([date, price]) => ({ date, price }));
        await api.updateCalendar(selectedSpaceId, { blockedDates, pricingCalendar });
      } catch {}
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 py-3 sm:py-4 space-y-3 sm:space-y-3.5">
      {/* Top Back Navigation */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/owner')}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-emerald-500/40 text-xs font-semibold transition-all group shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Host Overview</span>
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 pb-0.5">
        <div>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            Yield Management
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-0.5">
            Parking Availability Calendar
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Dynamic surge pricing, weekend premiums, and date blocking.
          </p>
        </div>

        {/* Space selector */}
        {spaces.length > 0 && (
          <select
            value={selectedSpaceId}
            onChange={(e) => setSelectedSpaceId(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white outline-none cursor-pointer self-start sm:self-auto hover:border-slate-700 transition-colors shadow-sm"
          >
            {spaces.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        )}
      </div>

      {isSaved && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in shadow-md">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>Calendar pricing and availability rules saved successfully!</span>
        </div>
      )}

      {/* Weekly Rate & Occupancy Heatmap Section */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3 sm:space-y-3.5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h3 className="font-extrabold text-white text-sm sm:text-base">Weekly Rate & Occupancy Heatmap</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[11px] sm:text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Normal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> High Demand
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Peak Weekend
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Blocked
            </span>
          </div>
        </div>

        {/* 7 Days Column Heatmap */}
        <div className="overflow-x-auto py-2 px-1 no-scrollbar touch-pan-x">
          <div className="min-w-[560px] sm:min-w-0 grid grid-cols-7 gap-2 sm:gap-3">
            {calendarDays.map((col) => {
              const isBlocked = blockedDates.includes(col.date);
              const isSelected = selectedDate === col.date;

              // Heatmap intensity style
              let baseBgClass = isDark
                ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                : 'bg-white border-slate-200 hover:border-slate-300';

              if (isBlocked) {
                baseBgClass = isDark
                  ? 'bg-rose-950/25 border-rose-500/40 text-rose-300'
                  : 'bg-rose-50 border-rose-300 text-rose-800';
              } else if (col.occupancy >= 95) {
                baseBgClass = isDark
                  ? 'bg-amber-950/25 border-amber-500/40 text-amber-200'
                  : 'bg-amber-50 border-amber-300 text-amber-900';
              } else if (col.occupancy >= 80) {
                baseBgClass = isDark
                  ? 'bg-blue-950/25 border-blue-500/40 text-blue-200'
                  : 'bg-blue-50 border-blue-300 text-blue-900';
              } else {
                baseBgClass = isDark
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900';
              }

              // High-impact active selection state
              const selectedHighlightClass = isSelected
                ? isDark
                  ? 'border-2 border-emerald-400 ring-2 ring-emerald-400/50 shadow-[0_0_24px_rgba(16,185,129,0.35)] bg-gradient-to-b from-emerald-950/70 via-slate-900 to-emerald-950/50'
                  : 'border-2 border-emerald-600 ring-2 ring-emerald-500/30 shadow-lg bg-emerald-50/80'
                : baseBgClass;

              return (
                <div
                  key={col.date}
                  onClick={() => {
                    setSelectedDate(col.date);
                    setCustomPrice(col.price);
                  }}
                  className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border flex flex-col justify-between items-center text-center cursor-pointer transition-all duration-150 min-h-[142px] sm:min-h-[148px] active:scale-[0.98] select-none ${selectedHighlightClass}`}
                >
                  <div className="w-full flex flex-col items-center">
                    {isSelected && (
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-black text-[9px] uppercase tracking-wider mb-0.5 shadow-sm">
                        ACTIVE
                      </span>
                    )}
                    <span className={`text-xs font-bold uppercase tracking-wider block transition-colors ${
                      isSelected ? (isDark ? 'text-emerald-300' : 'text-emerald-800') : (isDark ? 'text-slate-300' : 'text-slate-700')
                    }`}>
                      {col.day}
                    </span>
                    <span className={`text-[11px] font-medium block -mt-0.5 ${
                      isSelected ? (isDark ? 'text-emerald-400/90' : 'text-emerald-700') : (isDark ? 'text-slate-400' : 'text-slate-500')
                    }`}>
                      {formatDateShort(col.date)}
                    </span>
                  </div>

                  <div className="my-1.5 text-center">
                    <span className={`text-lg sm:text-xl font-black font-mono transition-colors ${
                      isSelected
                        ? isDark ? 'text-emerald-300 drop-shadow-[0_1px_8px_rgba(16,185,129,0.4)]' : 'text-emerald-700 font-extrabold'
                        : isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      ₹{col.price}
                    </span>
                    <span className="block text-[10px] text-slate-400 -mt-0.5">/hr</span>
                  </div>

                  <div className="w-full mt-auto pt-1">
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-1">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isBlocked
                            ? 'bg-rose-500'
                            : col.occupancy > 90
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                        style={{ width: `${isBlocked ? 0 : col.occupancy}%` }}
                      />
                    </div>
                    <span className={`text-[11px] block font-semibold ${
                      isSelected ? (isDark ? 'text-emerald-300' : 'text-emerald-800') : (isDark ? 'text-slate-400' : 'text-slate-600')
                    }`}>
                      {isBlocked ? 'Blocked' : `${col.occupancy}% fill`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Day Configuration Controls */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3 sm:space-y-3.5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              Configure Settings for: <span className="text-emerald-400 font-mono font-bold">{selectedDate}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Apply custom dynamic rate or toggle reservation availability.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleToggleBlock(selectedDate)}
            className={`w-full sm:w-auto px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 ${
              blockedDates.includes(selectedDate)
                ? isDark
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200'
                : isDark
                ? 'bg-slate-800 text-slate-200 border border-slate-700 hover:text-white hover:border-slate-600'
                : 'bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200'
            }`}
          >
            {blockedDates.includes(selectedDate) ? (
              <>
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>Blocked (Click to Unblock)</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Open for Booking (Click to Block)</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Price setting */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
            <label className="text-xs text-slate-300 block font-medium">Custom Hourly Rate</label>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-400">₹</span>
              <input
                type="number"
                min="20"
                max="200"
                value={customPrice}
                onChange={(e) => setCustomPrice(Number(e.target.value))}
                className="w-full bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-white font-bold text-sm outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Quick presets */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
            <label className="text-xs text-slate-300 block font-medium">Quick Preset Surge</label>
            <div className="flex gap-1.5">
              {[40, 50, 60, 75].map((amt) => {
                const isPresetActive = customPrice === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCustomPrice(amt)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
                      isPresetActive
                        ? 'bg-emerald-400 text-slate-950 border-emerald-300 font-black shadow-[0_0_12px_rgba(16,185,129,0.35)] ring-2 ring-emerald-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    ₹{amt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Action */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-end">
            <button
              type="button"
              onClick={handleApplyCustomPrice}
              className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer active:scale-95 transition-all"
            >
              Update Day Pricing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};



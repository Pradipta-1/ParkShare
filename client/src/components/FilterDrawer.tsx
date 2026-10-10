import React from 'react';
import {
  X,
  RotateCcw,
  Check,
  ShieldCheck,
  Zap,
  SlidersHorizontal,
} from 'lucide-react';
import { FilterOptions, ParkingType, VehicleType, Amenity } from '../types';
import { useTheme } from '../context/ThemeContext';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onReset: () => void;
}

const PARKING_TYPES: ParkingType[] = ['Covered', 'Basement', 'Garage', 'Driveway', 'Open'];
const VEHICLE_TYPES: VehicleType[] = ['Car', 'Bike', 'SUV', 'EV'];
const DISTANCES = [
  { label: 'Within 500 m', value: 500 },
  { label: 'Within 1 km', value: 1000 },
  { label: 'Within 3 km', value: 3000 },
  { label: 'Within 5 km', value: 5000 },
];
const AMENITIES_LIST: Amenity[] = [
  'CCTV',
  'Security',
  'EV charging',
  '24/7 access',
  'Covered',
  'Gated',
  'Well lit',
];

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onReset,
}) => {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  const handlePriceChange = (val: number) => {
    onFilterChange({ ...filters, maxPrice: val });
  };

  const handleDistanceSelect = (dist: number) => {
    onFilterChange({
      ...filters,
      distance: filters.distance === dist ? undefined : dist,
    });
  };

  const handleTypeSelect = (type: ParkingType) => {
    onFilterChange({
      ...filters,
      type: filters.type === type ? undefined : type,
    });
  };

  const handleVehicleSelect = (veh: VehicleType) => {
    onFilterChange({
      ...filters,
      vehicle: filters.vehicle === veh ? undefined : veh,
    });
  };

  const handleAmenityToggle = (amenity: Amenity) => {
    const current = filters.amenities || [];
    const exists = current.includes(amenity);
    const updated = exists ? current.filter((a) => a !== amenity) : [...current, amenity];
    onFilterChange({ ...filters, amenities: updated });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div
        className={`relative w-full max-w-md h-full overflow-y-auto shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 border-l ${
          isDark
            ? 'bg-[#0d131f] border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`p-5 border-b flex items-center justify-between sticky top-0 backdrop-blur-md z-20 ${
            isDark
              ? 'bg-[#0d131f]/95 border-slate-800'
              : 'bg-white/95 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Filter Parking</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters Content */}
        <div className="p-6 space-y-7 flex-1">
          {/* Price Range Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Max Hourly Price
              </label>
              <span className={`font-extrabold text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                ₹{filters.maxPrice || 100}/hr
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="500"
              step="10"
              value={filters.maxPrice || 500}
              onChange={(e) => handlePriceChange(Number(e.target.value))}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-emerald-500 ${
                isDark ? 'bg-slate-800' : 'bg-slate-200'
              }`}
            />
            <div className={`flex justify-between text-[11px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
              <span>₹20/hr</span>
              <span>₹250/hr</span>
              <span>₹500+/hr</span>
            </div>
          </div>

          {/* Distance Chips */}
          <div>
            <label className={`text-xs font-bold uppercase tracking-wider block mb-2.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Distance
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DISTANCES.map((d) => {
                const isSelected = filters.distance === d.value;
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => handleDistanceSelect(d.value)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                      isSelected
                        ? isDark
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold shadow-sm'
                          : 'bg-emerald-500 border-emerald-500 text-slate-950 font-bold shadow-sm shadow-emerald-500/20'
                        : isDark
                          ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          : 'bg-white border-2 border-slate-200 text-slate-800 hover:border-slate-300 font-bold shadow-xs'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Parking Type */}
          <div>
            <label className={`text-xs font-bold uppercase tracking-wider block mb-2.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Parking Type
            </label>
            <div className="flex flex-wrap gap-2">
              {PARKING_TYPES.map((t) => {
                const isSelected = filters.type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTypeSelect(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      isSelected
                        ? isDark
                          ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-500 shadow-md shadow-emerald-500/20'
                          : 'bg-emerald-500 text-slate-950 font-bold border-emerald-500 shadow-md shadow-emerald-500/20'
                        : isDark
                          ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          : 'bg-white border-2 border-slate-200 text-slate-800 hover:border-slate-300 font-bold shadow-xs'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vehicle Type */}
          <div>
            <label className={`text-xs font-bold uppercase tracking-wider block mb-2.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Vehicle Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {VEHICLE_TYPES.map((v) => {
                const isSelected = filters.vehicle === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleVehicleSelect(v)}
                    className={`py-2 rounded-xl text-xs font-medium border text-center transition-all ${
                      isSelected
                        ? isDark
                          ? 'bg-blue-500/10 border-blue-500 text-blue-400 font-bold'
                          : 'bg-blue-600 border-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
                        : isDark
                          ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          : 'bg-white border-2 border-slate-200 text-slate-800 hover:border-slate-300 font-bold shadow-xs'
                    }`}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Facilities & Amenities */}
          <div>
            <label className={`text-xs font-bold uppercase tracking-wider block mb-2.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Facilities & Security
            </label>
            <div className="grid grid-cols-2 gap-2">
              {AMENITIES_LIST.map((amenity) => {
                const checked = (filters.amenities || []).includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => handleAmenityToggle(amenity)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs border transition-all text-left ${
                      checked
                        ? isDark
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 font-semibold'
                          : 'bg-emerald-50 border-2 border-emerald-500 text-emerald-900 font-bold'
                        : isDark
                          ? 'bg-slate-900 border-slate-800/80 text-slate-400 hover:border-slate-700'
                          : 'bg-white border-2 border-slate-200 text-slate-800 hover:border-slate-300 font-bold shadow-xs'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                        checked
                          ? isDark
                            ? 'bg-emerald-500 border-emerald-500 text-black'
                            : 'bg-emerald-500 border-emerald-500 text-slate-950 font-bold'
                          : isDark
                            ? 'border-slate-700'
                            : 'border-slate-300 bg-white'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span>{amenity}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Booking & Trust Toggles */}
          <div className={`space-y-3 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <label
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                isDark
                  ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Zap className={`w-4 h-4 ${isDark ? 'text-blue-400 fill-blue-400' : 'text-blue-600 fill-blue-600'}`} />
                <div>
                  <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Instant Booking</div>
                  <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Book without host approval wait</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(filters.instantOnly)}
                onChange={(e) => onFilterChange({ ...filters, instantOnly: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </label>

            <label
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                isDark
                  ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <div>
                  <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Verified Parking Only</div>
                  <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Inspected & documents validated</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(filters.verifiedOnly)}
                onChange={(e) => onFilterChange({ ...filters, verifiedOnly: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className={`p-5 border-t flex items-center gap-3 sticky bottom-0 backdrop-blur-md ${
            isDark
              ? 'bg-[#0d131f]/95 border-slate-800'
              : 'bg-white/95 border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={onReset}
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border-2 text-xs font-bold transition-colors cursor-pointer ${
              isDark
                ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                : 'border-slate-300 text-slate-800 hover:bg-slate-100 hover:text-slate-900 shadow-xs'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all shadow-lg text-center cursor-pointer ${
              isDark
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
            }`}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};


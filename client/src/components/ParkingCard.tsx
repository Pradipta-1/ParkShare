import { useNavigate } from 'react-router-dom';
import {
  Heart,
  Star,
  ShieldCheck,
  Zap,
  MapPin,
  Clock,
  ArrowRight,
  Car,
  Navigation,
  Lock,
} from 'lucide-react';
import { ParkingSpace } from '../types';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { formatLiveDistance } from '../utils/distance';

interface ParkingCardProps {
  parking: ParkingSpace;
  layout?: 'horizontal' | 'grid';
  onSelect?: () => void;
  onReserve?: (parking: ParkingSpace) => void;
  isSelected?: boolean;
  userCoords?: [number, number] | null;
}

export const ParkingCard: React.FC<ParkingCardProps> = ({
  parking,
  layout = 'grid',
  onSelect,
  onReserve,
  isSelected = false,
  userCoords = null,
}) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { isFavorite, toggleFavorite } = useFavorites();
  const navigate = useNavigate();
  const favorited = isFavorite(parking.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    toggleFavorite(parking);
  };

  const handleReserveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    if (onReserve) {
      onReserve(parking);
      return;
    }
    navigate(`/parking/${parking.id}?book=true`);
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect();
      return;
    }
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/parking/${parking.id}`);
  };

  const isHorizontal = layout === 'horizontal';
  const isAllotted = (parking.availableSpots ?? 1) <= 0 || parking.status === 'allotted';

  return (
    <div
      onClick={handleCardClick}
      className={`group relative rounded-2xl backdrop-blur-md border transition-all duration-300 overflow-hidden ${
        isDark
          ? 'bg-[#0f172a]/80 hover:shadow-2xl hover:shadow-emerald-950/20'
          : 'bg-white hover:shadow-xl hover:shadow-slate-900/10'
      } ${
        isSelected
          ? isAllotted
            ? 'border-rose-500 ring-2 ring-rose-500/30 -translate-y-1'
            : 'border-emerald-500 ring-2 ring-emerald-500/30 -translate-y-1'
          : isDark
          ? 'border-slate-800/80 hover:border-slate-700 hover:-translate-y-1'
          : 'border-slate-200 hover:border-slate-300 hover:-translate-y-1'
      } ${isHorizontal ? 'flex flex-col sm:flex-row' : 'flex flex-col'}`}
    >
      {/* Image container */}
      <div
        className={`relative overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-slate-100'} ${
          isHorizontal ? 'w-full sm:w-56 h-48 sm:h-auto shrink-0' : 'w-full h-48'
        }`}
      >
        <img
          src={parking.images?.[0] || 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80'}
          alt={parking.title}
          onError={(e) => {
            const fallback = 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80';
            if (e.currentTarget.src !== fallback) {
              e.currentTarget.src = fallback;
            }
          }}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Favorite Heart Button with animation */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-300 z-10 cursor-pointer ${
            favorited
              ? isDark
                ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40 scale-110 shadow-lg'
                : 'bg-rose-50 text-rose-600 border border-rose-300 shadow-md scale-110'
              : isDark
              ? 'bg-black/60 text-slate-200 hover:text-white hover:bg-black/80 border border-white/20 shadow-md'
              : 'bg-white/95 text-slate-700 hover:text-rose-600 hover:bg-white border border-slate-200/90 shadow-md'
          }`}
          aria-label="Add to favorites"
        >
          <Heart className={`w-4 h-4 transition-transform ${favorited ? 'fill-rose-500 text-rose-500 animate-pulse' : 'hover:scale-110'}`} />
        </button>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          {parking.isVerified && (
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-md text-[10px] font-bold border shadow ${
              isDark
                ? 'bg-slate-950/80 text-emerald-400 border-emerald-500/30'
                : 'bg-white/95 text-emerald-800 border-emerald-400/60 shadow-sm'
            }`}>
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              Verified
            </span>
          )}
          {parking.ownerName && (
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-md text-[10px] font-semibold border shadow ${
              isDark
                ? 'bg-slate-950/85 text-slate-300 border-slate-700/60'
                : 'bg-white/95 text-slate-800 border-slate-200 shadow-sm'
            }`}>
              Host: {parking.ownerName}
            </span>
          )}
          {parking.isInstantBooking && !isAllotted && (
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-md text-[10px] font-bold border shadow ${
              isDark
                ? 'bg-blue-950/80 text-blue-400 border-blue-500/30'
                : 'bg-white/95 text-blue-800 border-blue-400/60 shadow-sm'
            }`}>
              <Zap className="w-3 h-3 text-blue-500 fill-blue-500" />
              Instant
            </span>
          )}
        </div>

        {/* Availability tag */}
        <div className={`absolute bottom-3 left-3 backdrop-blur-md px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 ${
          isAllotted
            ? isDark
              ? 'bg-rose-950/90 text-rose-200 border-rose-500/60'
              : 'bg-rose-100/95 text-rose-800 border-rose-300 shadow-sm'
            : isDark
            ? 'bg-black/80 text-white border-slate-700/60'
            : 'bg-white/95 text-slate-900 border-slate-200 shadow-md'
        }`}>
          <span
            className={`w-2 h-2 rounded-full ${
              !isAllotted ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'
            }`}
          />
          <span>{isAllotted ? 'Allotted by Owner' : `${parking.availableSpots} spots available`}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 min-w-0 flex flex-col justify-between">
        <div className="min-w-0">
          {/* Header & Rating */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className={`font-bold text-base transition-colors truncate ${
              isDark ? 'text-white group-hover:text-emerald-400' : 'text-slate-900 group-hover:text-emerald-600'
            }`}>
              {parking.title}
            </h3>
            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md shrink-0">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs font-bold text-amber-500">{parking.rating}</span>
              <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>({parking.reviewCount})</span>
            </div>
          </div>

          {/* Location & Accurate Live GPS Distance */}
          <div className={`flex items-center gap-2 text-xs mb-3 min-w-0 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span className="flex items-center gap-1 min-w-0 truncate">
              <MapPin className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <span className="truncate">{parking.address}</span>
            </span>
            <span className={`shrink-0 px-2 py-0.5 rounded font-bold text-[11px] flex items-center gap-1 border shadow-xs ${
              isDark
                ? 'bg-slate-800/90 text-slate-300 border-slate-700/60'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              <Navigation className="w-2.5 h-2.5 text-blue-500 shrink-0" />
              <span>
                {formatLiveDistance(
                  userCoords?.[0],
                  userCoords?.[1],
                  parking.location?.lat,
                  parking.location?.lng,
                  parking.distanceMeters
                )}
              </span>
            </span>
          </div>

          {/* Amenities & Parking Type chips */}
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border shrink-0 ${
              isDark
                ? 'bg-slate-800/80 text-slate-300 border-slate-700/50'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {parking.parkingType || 'Covered'}
            </span>
            {(parking.amenities || []).slice(0, 3).map((amenity, i) => (
              <span
                key={i}
                className={`text-[11px] font-medium px-2 py-0.5 rounded-md border shrink-0 ${
                  isDark
                    ? 'bg-slate-800/50 text-slate-400 border-slate-800'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                {amenity}
              </span>
            ))}
            {isAllotted && (
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border shrink-0 ${
                isDark
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}>
                Allotted
              </span>
            )}
            {(parking.amenities?.length || 0) > 3 && (
              <span className={`text-[10px] font-medium shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                +{(parking.amenities?.length || 0) - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Footer: Price Hierarchy & CTA */}
        <div className={`pt-3 border-t flex items-center justify-between gap-3 min-w-0 ${
          isDark ? 'border-slate-800/70' : 'border-slate-100'
        }`}>
          <div className="shrink-0">
            <span className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              ₹{parking.pricePerHour}
            </span>
            <span className={`text-xs font-medium ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/ hour</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isAllotted ? (
              <button
                type="button"
                disabled
                className={`px-4 py-2 rounded-xl text-xs font-black border flex items-center gap-1.5 cursor-not-allowed shrink-0 whitespace-nowrap shadow-xs ${
                  isDark
                    ? 'bg-slate-800/80 text-rose-300 border-rose-500/30'
                    : 'bg-rose-50 text-rose-800 border-2 border-rose-300 shadow-xs'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>Allotted</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReserveClick}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-md group/btn cursor-pointer shrink-0 whitespace-nowrap ${
                  isDark
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25 hover:scale-[1.02]'
                }`}
              >
                <span>Reserve</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform shrink-0" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

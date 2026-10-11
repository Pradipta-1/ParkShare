import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  MapPin,
  X,
  Layers,
  ChevronDown,
  ChevronUp,
  Navigation,
  ArrowLeft,
  Sparkles,
  Car,
  Compass,
  ArrowUpDown,
  LayoutGrid,
  Map as MapIcon,
  Columns,
  RefreshCw,
  Star,
  ShieldCheck,
  Zap,
  ArrowRight,
  Filter,
  Eye,
  EyeOff,
  Check,
  Lock,
  RotateCcw,
} from 'lucide-react';
import { LeafletMap } from '../components/LeafletMap';
import { ParkingCard } from '../components/ParkingCard';
import { FilterDrawer } from '../components/FilterDrawer';
import { BookingModal } from '../components/BookingModal';
import { ParkingSpace, FilterOptions, VehicleType } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { calculateDistanceKm, formatLiveDistance } from '../utils/distance';

const QUICK_CATEGORIES = [
  'All',
  'Downtown',
  'Railway Station',
  'Airport',
  'Shopping',
  'Business District',
];

const VEHICLE_OPTIONS: { label: string; value: VehicleType | 'All' }[] = [
  { label: 'All Vehicles', value: 'All' },
  { label: 'Car', value: 'Car' },
  { label: 'SUV', value: 'SUV' },
  { label: 'EV Charging', value: 'EV' },
  { label: 'Bike', value: 'Bike' },
];

const SORT_OPTIONS: { label: string; value: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'available' }[] = [
  { label: 'Recommended', value: 'relevance' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Highest Rated', value: 'rating' },
  { label: 'Most Available', value: 'available' },
];

const DISTANCE_OPTIONS: { label: string; value?: number }[] = [
  { label: 'Any Distance', value: undefined },
  { label: 'Within 500m', value: 500 },
  { label: 'Within 1km', value: 1000 },
  { label: 'Within 3km', value: 3000 },
  { label: 'Within 5km', value: 5000 },
];

export const FindParkingPage: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [parkingSpaces, setParkingSpaces] = useState<ParkingSpace[]>([]);
  const [allSpacesForMap, setAllSpacesForMap] = useState<ParkingSpace[]>([]);
  const [statusFilter, setStatusFilter] = useState<'All' | 'available' | 'allotted'>('All');
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null);
  const [hoveredSpaceId, setHoveredSpaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);
  const [mobileSheetState, setMobileSheetState] = useState<'peek' | 'half' | 'full'>('peek');
  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null) return;
    const diff = touchStartYRef.current - e.changedTouches[0].clientY;
    if (diff > 35) {
      // Swiped UP
      setMobileSheetState((curr) => (curr === 'peek' ? 'half' : 'full'));
    } else if (diff < -35) {
      // Swiped DOWN
      setMobileSheetState((curr) => (curr === 'full' ? 'half' : 'peek'));
    }
    touchStartYRef.current = null;
  };

  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'available'>('relevance');

  const [bookingSpace, setBookingSpace] = useState<ParkingSpace | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);

  // Filters state
  const initialCategory = searchParams.get('category') || undefined;
  const initialQuery = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([22.5697, 88.3582]);
  const [showSearchThisArea, setShowSearchThisArea] = useState<boolean>(false);
  const [lastMovedCoords, setLastMovedCoords] = useState<[number, number] | null>(null);

  const [filters, setFilters] = useState<FilterOptions>({
    q: initialQuery || undefined,
    category: initialCategory,
  });

  // Mobile dedicated sorting & filtering modal state
  const [isMobileSortOpen, setIsMobileSortOpen] = useState<boolean>(false);
  const [tempSortBy, setTempSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'available'>(sortBy);
  const [tempCategory, setTempCategory] = useState<string>('All');
  const [tempVehicle, setTempVehicle] = useState<VehicleType | 'All'>('All');
  const [tempDistance, setTempDistance] = useState<number | undefined>(undefined);

  const handleOpenMobileSort = () => {
    setTempSortBy(sortBy);
    setTempCategory(filters.category || 'All');
    setTempVehicle((filters.vehicle as VehicleType) || 'All');
    setTempDistance(filters.distance);
    setIsMobileSortOpen(true);
  };

  const handleApplyMobileSort = () => {
    setSortBy(tempSortBy);
    setFilters((prev) => ({
      ...prev,
      category: tempCategory === 'All' ? undefined : (tempCategory as any),
      vehicle: tempVehicle === 'All' ? undefined : (tempVehicle as any),
      distance: tempDistance,
    }));
    setIsMobileSortOpen(false);
  };

  const handleResetMobileSort = () => {
    setTempSortBy('relevance');
    setTempCategory('All');
    setTempVehicle('All');
    setTempDistance(undefined);
  };

  const isSortActive = Boolean(
    sortBy !== 'relevance' ||
    (filters.category && filters.category !== 'All') ||
    (filters.vehicle && filters.vehicle !== 'All') ||
    filters.distance
  );

  // Calculate live counts of allotted vs available vs total
  const counts = useMemo(() => {
    const list = allSpacesForMap.length > 0 ? allSpacesForMap : parkingSpaces;
    const available = list.filter((s) => (s.availableSpots ?? 1) > 0 && s.status !== 'allotted').length;
    const allotted = list.filter((s) => (s.availableSpots ?? 1) <= 0 || s.status === 'allotted').length;
    return { total: list.length, available, allotted };
  }, [allSpacesForMap, parkingSpaces]);

  // Load all spaces once for complete map plotting (all allotted + owner spaces)
  useEffect(() => {
    const loadAllSpacesForMap = async () => {
      try {
        const res = await api.getParkingSpaces({});
        if (res.success && Array.isArray(res.data)) {
          setAllSpacesForMap(res.data);
        }
      } catch (err) {
        console.error('Failed to preload all parking spaces for map:', err);
      }
    };
    loadAllSpacesForMap();
  }, []);

  const fetchSpaces = useCallback(async () => {
    setIsLoading(true);
    try {
      const activeFilters: any = { ...filters };
      if (statusFilter !== 'All') {
        activeFilters.status = statusFilter;
      }
      const res = await api.getParkingSpaces(activeFilters);
      if (res.success && Array.isArray(res.data)) {
        let spacesList = res.data;
        try {
          const stored = JSON.parse(localStorage.getItem('parkshare_custom_spaces') || '[]');
          if (Array.isArray(stored) && stored.length > 0) {
            const ratingMap = new Map(stored.map((s: any) => [s.id, { rating: s.rating, reviewCount: s.reviewCount }]));
            spacesList = spacesList.map((space) => {
              const custom = ratingMap.get(space.id);
              if (custom && custom.rating !== undefined) {
                return { ...space, rating: custom.rating, reviewCount: custom.reviewCount ?? space.reviewCount };
              }
              return space;
            });
          }
        } catch {}

        setParkingSpaces(spacesList);
        // Synchronize allSpacesForMap with updated statuses & ratings
        if (statusFilter === 'All' && !filters.q) {
          setAllSpacesForMap(spacesList);
        } else {
          setAllSpacesForMap((prev) => {
            if (prev.length === 0) return spacesList;
            const updatedMap = new Map(spacesList.map((s) => [s.id, s]));
            return prev.map((s) => updatedMap.get(s.id) || s);
          });
        }
        setSelectedSpace((prev) => {
          if (prev && spacesList.some((s) => s.id === prev.id)) {
            const fresh = spacesList.find((s) => s.id === prev.id);
            return fresh || prev;
          }
          return null;
        });
      }
    } catch (err) {
      console.error('Failed to load parking spaces:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, statusFilter, allSpacesForMap.length]);

  // Debounced live search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        q: searchQuery.trim() ? searchQuery.trim() : undefined,
      }));
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchSpaces();

    const handleRatingSync = () => {
      fetchSpaces();
    };
    window.addEventListener('parkshare_rating_updated', handleRatingSync);
    window.addEventListener('parkshare_spots_updated', handleRatingSync);
    window.addEventListener('storage', handleRatingSync);
    return () => {
      window.removeEventListener('parkshare_rating_updated', handleRatingSync);
      window.removeEventListener('parkshare_spots_updated', handleRatingSync);
      window.removeEventListener('storage', handleRatingSync);
    };
  }, [fetchSpaces]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, q: searchQuery.trim() || undefined }));
    setSearchParams(searchQuery ? { q: searchQuery } : {});
  };

  const handleResetFilters = () => {
    setFilters({});
    setStatusFilter('All');
    setSearchQuery('');
    setSearchParams({});
    setIsFilterDrawerOpen(false);
  };

  const activeFiltersCount = [
    filters.category && filters.category !== 'All',
    filters.type && filters.type !== 'All',
    filters.vehicle && filters.vehicle !== 'All',
    filters.distance,
    filters.verifiedOnly,
    filters.instantOnly,
    filters.amenities && filters.amenities.length > 0,
    filters.maxPrice && filters.maxPrice < 150,
  ].filter(Boolean).length;

  // Sorted list of spaces (sorted by accurate live distance from GPS when available)
  const sortedSpaces = useMemo(() => {
    const list = [...parkingSpaces];
    switch (sortBy) {
      case 'price_asc':
        return list.sort((a, b) => a.pricePerHour - b.pricePerHour);
      case 'price_desc':
        return list.sort((a, b) => b.pricePerHour - a.pricePerHour);
      case 'rating':
        return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'available':
        return list.sort((a, b) => (b.availableSpots || 0) - (a.availableSpots || 0));
      case 'relevance':
      default:
        if (userCoords) {
          return list.sort((a, b) => {
            const distA =
              a.location?.lat && a.location?.lng
                ? calculateDistanceKm(userCoords[0], userCoords[1], a.location.lat, a.location.lng)
                : (a.distanceMeters || 1000) / 1000;
            const distB =
              b.location?.lat && b.location?.lng
                ? calculateDistanceKm(userCoords[0], userCoords[1], b.location.lat, b.location.lng)
                : (b.distanceMeters || 1000) / 1000;
            return distA - distB;
          });
        }
        return list;
    }
  }, [parkingSpaces, sortBy, userCoords]);

  // Stable callbacks for LeafletMap to avoid render thrashing
  const handleSelectSpace = useCallback((space: ParkingSpace) => {
    setSelectedSpace(space);
    if (space?.location) {
      setMapCenter([space.location.lat, space.location.lng]);
    }
    setMobileSheetState('half');
  }, []);

  const handleReserveSpace = useCallback((space: ParkingSpace) => {
    setBookingSpace(space);
    setIsBookingOpen(true);
  }, []);

  const handleUserLocationFound = useCallback((lat: number, lng: number) => {
    setUserCoords([lat, lng]);
  }, []);

  const handleMapCenterChange = useCallback((lat: number, lng: number) => {
    setLastMovedCoords([lat, lng]);
    setShowSearchThisArea(true);
  }, []);

  const handleSearchThisArea = () => {
    if (lastMovedCoords) {
      setMapCenter(lastMovedCoords);
      setShowSearchThisArea(false);
      fetchSpaces();
    }
  };

  const triggerNearMe = () => {
    if (userCoords) {
      setMapCenter([userCoords[0], userCoords[1]]);
      setSelectedSpace(null);
    } else if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserCoords(coords);
          setMapCenter(coords);
          setSelectedSpace(null);
        },
        () => {
          // ignore or toast
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  return (
    <div className={`flex flex-col h-[calc(100vh-65px)] overflow-hidden transition-colors ${isDark ? 'bg-[#070b12] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sleek 2-Tier Header: Prevents squishing on any screen size */}
      <header className={`backdrop-blur-xl border-b shrink-0 z-30 transition-colors ${isDark ? 'bg-[#0b101b]/98 border-slate-800/80 shadow-lg' : 'bg-white/98 border-slate-200 shadow-sm'}`}>
        {/* Tier 1: Navigation, Search, and Primary Actions */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-2.5 sm:gap-4">
          {/* Left: Overview back + Title badge */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              to="/dashboard"
              className={`px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all group shadow-sm cursor-pointer border ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 hover:border-emerald-500/40'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 border-slate-200 hover:border-emerald-500/40'
              }`}
              title="Back to Overview"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-500 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">Overview</span>
            </Link>

            <div className={`hidden md:flex items-center gap-2 border-l pl-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <h1 className={`text-sm font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Find Parking</h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                {sortedSpaces.length} spots
              </span>
            </div>
          </div>

          {/* Search input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xl ml-auto">
            <Search className="w-4 h-4 text-emerald-500/80 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location, metro, mall, or landmark..."
              className={`w-full pl-9 sm:pl-10 pr-8 py-2 rounded-xl border text-xs sm:text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                isDark
                  ? 'bg-slate-900/90 border-slate-800 text-white placeholder-slate-500'
                  : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilters((prev) => ({ ...prev, q: undefined }));
                }}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full transition-colors cursor-pointer ${
                  isDark ? 'text-slate-500 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-200'
                }`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>

        {/* Tier 2: Category Chips & Quick Dropdowns Strip */}
        <div className={`border-t py-2 transition-colors ${isDark ? 'border-slate-800/60 bg-[#090d16]/90' : 'border-slate-200 bg-slate-50/95'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* MOBILE ONLY: Exactly two options - "All" (selected by default) and "Sort" */}
            <div className="flex sm:hidden items-center gap-2 w-full">
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    category: undefined,
                  }))
                }
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  !filters.category || filters.category === 'All'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-sm shadow-emerald-500/25'
                    : isDark
                    ? 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800'
                    : 'bg-white text-slate-800 hover:text-slate-950 border border-slate-200 shadow-xs'
                }`}
              >
                All
              </button>

              <button
                type="button"
                onClick={handleOpenMobileSort}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSortActive
                    ? isDark
                      ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
                      : 'bg-emerald-50 text-emerald-800 border-2 border-emerald-500/50 shadow-xs'
                    : isDark
                    ? 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800'
                    : 'bg-white text-slate-800 hover:text-slate-950 border border-slate-200 shadow-xs'
                }`}
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-emerald-500" />
                <span>Sort</span>
                {isSortActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                )}
              </button>
            </div>

            {/* DESKTOP ONLY: Full Category Chips & Quick Dropdowns Strip */}
            <div className="hidden sm:flex items-center justify-between gap-3 overflow-x-auto scrollbar-none w-full">
              {/* Category Chips */}
              <div className="flex items-center gap-1.5 shrink-0">
                {QUICK_CATEGORIES.map((cat) => {
                  const isSelected =
                    (!filters.category && cat === 'All') ||
                    filters.category?.toLowerCase() === cat.toLowerCase();
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          category: cat === 'All' ? undefined : (cat as any),
                        }))
                      }
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        isSelected
                          ? isDark
                            ? 'bg-emerald-500 text-slate-950 font-black shadow-sm shadow-emerald-500/25'
                            : 'bg-emerald-500 text-slate-950 font-black shadow-sm shadow-emerald-500/25'
                          : isDark
                          ? 'bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                          : 'bg-white text-slate-800 hover:text-slate-950 hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 shadow-xs'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Quick Vehicle & Distance & Sort Selectors */}
              <div className="flex items-center gap-2 shrink-0 ml-auto">
                {/* Vehicle selector */}
                <select
                  value={filters.vehicle || 'All'}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      vehicle: e.target.value === 'All' ? undefined : (e.target.value as any),
                    }))
                  }
                  aria-label="Filter by vehicle type"
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold outline-none cursor-pointer transition-colors border ${
                    isDark
                      ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  {VEHICLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {/* Distance selector */}
                <select
                  value={filters.distance || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      distance: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  aria-label="Filter by distance"
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold outline-none cursor-pointer transition-colors border ${
                    isDark
                      ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <option value="" className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Any Distance</option>
                  <option value="500" className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Within 500m</option>
                  <option value="1000" className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Within 1km</option>
                  <option value="3000" className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Within 3km</option>
                  <option value="5000" className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Within 5km</option>
                </select>

                {/* Sort By selector */}
                <div className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-xl border transition-colors ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}>
                  <ArrowUpDown className={`w-3 h-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    aria-label="Sort parking spaces"
                    className={`bg-transparent text-xs font-semibold outline-none cursor-pointer border-none ${
                      isDark ? 'text-slate-300' : 'text-slate-800'
                    }`}
                  >
                    <option value="relevance" className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Recommended</option>
                    <option value="price_asc" className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Price: Low to High</option>
                    <option value="price_desc" className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Price: High to Low</option>
                    <option value="rating" className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Highest Rated</option>
                    <option value="available" className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Most Available</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area: 60% Parking Spaces, 40% Map position */}
      <div className="flex-1 w-full max-w-7xl mx-auto md:px-4 sm:px-6 lg:px-8 md:py-3.5 flex overflow-hidden relative md:gap-3.5">
        {/* 60% PARKING SPACES LISTING CONTAINER (Desktop Only) */}
        <div className={`hidden md:flex h-full flex-col md:rounded-2xl border transition-all duration-300 z-10 md:w-[58%] lg:w-[60%] shrink-0 overflow-hidden shadow-xs ${
          isDark ? 'bg-[#070b12] border-slate-800/80' : 'bg-slate-50 border-slate-200'
        }`}>
          {/* List Sub-Header with active filters & stats */}
          <div className={`px-3 sm:px-6 py-2.5 border-b backdrop-blur-md flex flex-wrap items-center justify-between gap-2.5 shrink-0 transition-colors ${
            isDark ? 'border-slate-800/60 bg-[#0a0f1a]/80' : 'border-slate-200 bg-white/90'
          }`}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className={`font-extrabold text-xs sm:text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {sortedSpaces.length} spots
              </span>
              <span className={`hidden sm:inline text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>• Kolkata</span>
            </div>

            {/* Quick Status Filter Tabs: All, Available, Allotted */}
            <div className={`flex items-center gap-1.5 p-1 rounded-xl border transition-colors ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-300 shadow-inner'
            }`}>
              <button
                type="button"
                onClick={() => setStatusFilter('All')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'All'
                    ? isDark ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-950 shadow-sm border border-slate-200 font-black'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-700 hover:text-slate-950 hover:bg-white/60 font-bold'
                }`}
              >
                All ({counts.total})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('available')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === 'available'
                    ? isDark
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                      : 'bg-emerald-500 text-slate-950 font-black shadow-sm shadow-emerald-500/25'
                    : isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50/80 font-bold'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'available' ? 'bg-white' : 'bg-emerald-500'}`}></span>
                Available ({counts.available})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('allotted')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === 'allotted'
                    ? isDark
                      ? 'bg-rose-500 text-white font-black shadow-sm'
                      : 'bg-rose-600 text-white font-black shadow-md shadow-rose-600/25'
                    : isDark ? 'text-rose-400 hover:text-rose-300' : 'text-rose-800 hover:text-rose-950 hover:bg-rose-50/80 font-bold'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'allotted' ? 'bg-white' : 'bg-rose-500'}`}></span>
                Allotted ({counts.allotted})
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Active filters count badge / reset */}
              {(activeFiltersCount > 0 || statusFilter !== 'All') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-emerald-500 hover:text-emerald-600 font-semibold underline underline-offset-2 cursor-pointer ml-1"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>          {/* Active filter badges row */}
          {activeFiltersCount > 0 && (
            <div className={`px-4 sm:px-6 py-2 border-b flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 transition-colors ${
              isDark ? 'border-slate-800/40 bg-slate-900/30' : 'border-slate-200 bg-slate-100/70'
            }`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                Active filters:
              </span>
              {filters.category && (
                <span className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold flex items-center gap-1 shrink-0 ${
                  isDark
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                }`}>
                  {filters.category}
                  <button
                    type="button"
                    onClick={() => setFilters((p) => ({ ...p, category: undefined }))}
                    className="hover:opacity-75 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.vehicle && (
                <span className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold flex items-center gap-1 shrink-0 ${
                  isDark
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    : 'bg-blue-50 text-blue-800 border-blue-300'
                }`}>
                  {filters.vehicle}
                  <button
                    type="button"
                    onClick={() => setFilters((p) => ({ ...p, vehicle: undefined }))}
                    className="hover:opacity-75 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.distance && (
                <span className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold flex items-center gap-1 shrink-0 ${
                  isDark
                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                    : 'bg-purple-50 text-purple-800 border-purple-300'
                }`}>
                  &lt;{filters.distance}m
                  <button
                    type="button"
                    onClick={() => setFilters((p) => ({ ...p, distance: undefined }))}
                    className="hover:opacity-75 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Scrollable Parking Spaces Feed */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 scrollbar-thin scrollbar-thumb-slate-800">
            {isLoading ? (
              // Skeleton Loaders
              <div className="flex flex-col gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-2xl border p-4 animate-pulse flex flex-col sm:flex-row gap-4 ${
                      isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className={`h-40 sm:w-56 rounded-xl shrink-0 ${isDark ? 'bg-slate-800/60' : 'bg-slate-200'}`}></div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div className="space-y-2">
                        <div className={`h-4 rounded w-2/3 ${isDark ? 'bg-slate-800/80' : 'bg-slate-200'}`}></div>
                        <div className={`h-3 rounded w-1/2 ${isDark ? 'bg-slate-800/60' : 'bg-slate-200'}`}></div>
                      </div>
                      <div className={`h-8 rounded w-1/3 mt-4 ${isDark ? 'bg-slate-800/70' : 'bg-slate-200'}`}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedSpaces.length === 0 ? (
              // Empty State
              <div className="text-center py-16 px-4 flex flex-col items-center justify-center max-w-md mx-auto">
                <div className={`w-16 h-16 rounded-3xl border flex items-center justify-center shadow-2xl mb-4 ${
                  isDark
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                }`}>
                  <Compass className="w-8 h-8 animate-spin-slow" />
                </div>
                <h3 className={`text-base font-bold mb-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  No parking spots match your filters
                </h3>
                <p className={`text-xs mb-6 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Try broadening your search radius, selecting all vehicle types, or exploring a different neighborhood.
                </p>
                <div className="flex flex-col sm:flex-row gap-2.5 w-full justify-center">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                  <button
                    type="button"
                    onClick={triggerNearMe}
                    className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition-colors border cursor-pointer ${
                      isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                    }`}
                  >
                    Locate Near GPS
                  </button>
                </div>
              </div>
            ) : (
              // Active Spaces List (Spacious horizontal cards with full breathing room)
              <div className="flex flex-col gap-4">
                {sortedSpaces.map((parking) => (
                  <div
                    key={parking.id}
                    onMouseEnter={() => setHoveredSpaceId(parking.id)}
                    onMouseLeave={() => setHoveredSpaceId(null)}
                  >
                    <ParkingCard
                      parking={parking}
                      layout="horizontal"
                      isSelected={selectedSpace?.id === parking.id}
                      userCoords={userCoords}
                      onSelect={() => handleSelectSpace(parking)}
                      onReserve={(p) => handleReserveSpace(p)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MAP PANEL (Permanent Street Navigation Dark Mode - Fullscreen on mobile, 40% on desktop) */}
        <div className="w-full h-full absolute inset-0 md:relative md:w-[42%] lg:w-[40%] z-0 overflow-hidden md:rounded-2xl">
          {/* Floating "Search This Area" Pill */}
          {showSearchThisArea && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 animate-in fade-in slide-in-from-top-3">
              <button
                type="button"
                onClick={handleSearchThisArea}
                className={`px-4 py-2 rounded-full font-black text-xs shadow-2xl flex items-center gap-2 transition-all cursor-pointer hover:scale-105 ${
                  isDark
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/40'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Search This Area</span>
              </button>
            </div>
          )}

          {/* Floating GPS Re-Center button on mobile (Google Maps style) */}
          <button
            type="button"
            onClick={triggerNearMe}
            className={`md:hidden absolute right-4 z-20 w-11 h-11 rounded-2xl backdrop-blur-md border shadow-2xl flex items-center justify-center active:scale-95 transition-all ${
              isDark
                ? 'bg-[#090e1a]/90 border-slate-700/80 text-emerald-400 hover:bg-slate-800'
                : 'bg-white/95 border-slate-200 text-emerald-700 hover:bg-slate-50'
            } ${
              mobileSheetState === 'full'
                ? 'bottom-[90vh]'
                : mobileSheetState === 'half'
                ? 'bottom-[56vh]'
                : 'bottom-36'
            }`}
            title="Locate Me"
            aria-label="Locate my position"
          >
            <Compass className="w-5 h-5 animate-spin-slow" />
          </button>

          {/* Leaflet Map in Permanent Street Navigation Dark Mode (Shows ALL allotted & owner spaces) */}
          <LeafletMap
            spaces={allSpacesForMap.length > 0 ? allSpacesForMap : parkingSpaces}
            selectedSpaceId={selectedSpace?.id}
            hoveredSpaceId={hoveredSpaceId}
            onSelectSpace={handleSelectSpace}
            onReserveSpace={handleReserveSpace}
            center={mapCenter}
            zoom={14}
            height="100%"
            autoLocate={true}
            onUserLocationFound={handleUserLocationFound}
            onMapCenterChange={handleMapCenterChange}
          />
        </div>

        {/* MOBILE GOOGLE MAPS SLIDING BOTTOM SHEET */}
        <div
          className={`md:hidden fixed inset-x-0 bottom-0 z-30 transition-all duration-300 ease-out backdrop-blur-2xl border-t flex flex-col rounded-t-[28px] overflow-hidden ${
            isDark
              ? 'bg-[#080d19]/96 border-slate-700/80 shadow-[0_-16px_50px_rgba(0,0,0,0.85)] text-white'
              : 'bg-white/98 border-slate-200 shadow-[0_-16px_50px_rgba(0,0,0,0.15)] text-slate-900'
          } ${
            mobileSheetState === 'peek'
              ? 'h-32'
              : mobileSheetState === 'half'
              ? 'h-[54vh]'
              : 'h-[88vh]'
          }`}
        >
          {/* Top Drag Bar & Handle (Swipe only for mobile devices) */}
          <div
            className={`w-full pt-2.5 pb-2 px-4 flex flex-col items-center select-none shrink-0 border-b ${
              isDark ? 'border-slate-800/60' : 'border-slate-100'
            }`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className={`w-12 h-1.5 rounded-full mb-2 ${
              isDark ? 'bg-slate-600' : 'bg-slate-300'
            }`} />

            {/* Quick Header Row */}
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {selectedSpace ? (
                  <>
                    <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className={`font-bold text-xs truncate max-w-[200px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {selectedSpace.title}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        (selectedSpace.availableSpots ?? 1) > 0 && selectedSpace.status !== 'allotted'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {(selectedSpace.availableSpots ?? 1) > 0 && selectedSpace.status !== 'allotted'
                        ? 'Available'
                        : 'Allotted'}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className={`font-extrabold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {sortedSpaces.length} spots nearby
                    </span>
                    <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>• Swipe up for list</span>
                  </>
                )}
              </div>

              <div className={`flex items-center gap-1.5 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <span className="text-[11px] font-semibold">
                  {mobileSheetState === 'peek'
                    ? 'Expand'
                    : mobileSheetState === 'half'
                    ? 'More'
                    : 'Collapse'}
                </span>
                {mobileSheetState === 'full' ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-emerald-500" />
                )}
              </div>
            </div>
          </div>

          {/* Quick Status Filter Tabs inside mobile drawer */}
          <div className={`px-3 py-2 border-b flex items-center justify-between gap-2 shrink-0 ${
            isDark ? 'border-slate-800/60 bg-slate-900/40' : 'border-slate-100 bg-slate-50'
          }`}>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setStatusFilter('All')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  statusFilter === 'All'
                    ? isDark ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-900 shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({counts.total})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('available')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                  statusFilter === 'available'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                    : isDark ? 'text-emerald-400/80 hover:text-emerald-300' : 'text-emerald-700 hover:text-emerald-900'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Available ({counts.available})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('allotted')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                  statusFilter === 'allotted'
                    ? 'bg-rose-500 text-white font-black shadow-sm'
                    : isDark ? 'text-rose-400/80 hover:text-rose-300' : 'text-rose-700 hover:text-rose-900'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                Allotted ({counts.allotted})
              </button>
            </div>

            {selectedSpace && (
              <button
                type="button"
                onClick={() => setSelectedSpace(null)}
                className="text-[11px] text-slate-400 hover:text-rose-500 font-semibold"
              >
                Clear Pin
              </button>
            )}
          </div>

          {/* Main Sheet Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-slate-800">
            {/* If a space is specifically selected: show Google Maps style detailed card preview */}
            {selectedSpace && (
              <div className={`rounded-2xl border p-3.5 shadow-xl space-y-3 transition-all ${
                isDark ? 'bg-gradient-to-br from-slate-900 to-[#0e1626] border-emerald-500/40' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className={`font-extrabold text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {selectedSpace.title}
                    </h3>
                    <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {selectedSpace.address || 'Kolkata, West Bengal'}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-xs">
                      {userCoords && selectedSpace.location && (
                        <span className="text-emerald-500 font-semibold flex items-center gap-1">
                          <Navigation className="w-3 h-3" />
                          {formatLiveDistance(
                            userCoords[0],
                            userCoords[1],
                            selectedSpace.location.lat,
                            selectedSpace.location.lng
                          )}
                        </span>
                      )}
                      <span className={isDark ? 'text-slate-400' : 'text-slate-400'}>•</span>
                      <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        ₹{selectedSpace.pricePerHour}/hr
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      ₹{selectedSpace.pricePerHour}
                    </span>
                    <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/hr</span>
                  </div>
                </div>

                {/* Direct Action Buttons for Selected Space */}
                <div className="flex items-center gap-2 pt-1">
                  {(selectedSpace.availableSpots ?? 1) > 0 && selectedSpace.status !== 'allotted' ? (
                    <button
                      type="button"
                      onClick={() => handleReserveSpace(selectedSpace)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Reserve Spot Now</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed opacity-80"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Currently Allotted</span>
                    </button>
                  )}

                  {selectedSpace.location && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedSpace.location.lat},${selectedSpace.location.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`py-2.5 px-3.5 rounded-xl font-bold text-xs transition-all border flex items-center gap-1.5 ${
                        isDark
                          ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                      }`}
                    >
                      <Navigation className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Directions</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Horizontal swipeable cards preview when sheet is in peek/half mode and no space selected */}
            {mobileSheetState === 'peek' && !selectedSpace && (
              <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory">
                {sortedSpaces.slice(0, 10).map((space) => {
                  const isAvail = (space.availableSpots ?? 1) > 0 && space.status !== 'allotted';
                  return (
                    <div
                      key={space.id}
                      onClick={() => handleSelectSpace(space)}
                      className={`min-w-[240px] max-w-[240px] snap-center rounded-xl p-2.5 flex flex-col justify-between cursor-pointer border transition-all shrink-0 ${
                        isDark
                          ? 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/40 text-white'
                          : 'bg-slate-50 border-slate-200 hover:border-emerald-500/40 text-slate-900 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          <p className={`font-bold text-xs truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{space.title}</p>
                          <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {space.address || 'Kolkata'}
                          </p>
                        </div>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 ${
                            isAvail
                              ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-800'
                              : isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isAvail ? 'Available' : 'Allotted'}
                        </span>
                      </div>
                      <div className={`flex items-center justify-between mt-2 pt-1 border-t ${isDark ? 'border-slate-800/60' : 'border-slate-200'}`}>
                        <span className={`text-xs font-black ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          ₹{space.pricePerHour}/hr
                        </span>
                        {userCoords && space.location && (
                          <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {formatLiveDistance(
                              userCoords[0],
                              userCoords[1],
                              space.location.lat,
                              space.location.lng
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full vertical list when expanded into half or full mode */}
            {(mobileSheetState === 'half' || mobileSheetState === 'full') && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Available Parking Spots ({sortedSpaces.length})</span>
                  <span>Tap to view on map</span>
                </div>
                {sortedSpaces.map((parking) => (
                  <div
                    key={parking.id}
                    onClick={() => handleSelectSpace(parking)}
                    className="cursor-pointer"
                  >
                    <ParkingCard
                      parking={parking}
                      layout="horizontal"
                      isSelected={selectedSpace?.id === parking.id}
                      userCoords={userCoords}
                      onSelect={() => handleSelectSpace(parking)}
                      onReserve={(p) => handleReserveSpace(p)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Slide-over Drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onFilterChange={(newFilters) => setFilters(newFilters)}
        onReset={handleResetFilters}
      />

      {/* Direct Booking Modal */}
      {bookingSpace && (
        <BookingModal
          parking={bookingSpace}
          isOpen={isBookingOpen}
          onClose={() => {
            setIsBookingOpen(false);
            setBookingSpace(null);
            fetchSpaces();
          }}
        />
      )}

      {/* Mobile-Only Dedicated Sorting & Filtering Window */}
      {isMobileSortOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSortOpen(false)}
          />

          {/* Sheet Container */}
          <div
            className={`relative w-full max-h-[85vh] rounded-t-3xl border-t shadow-2xl flex flex-col z-10 animate-in slide-in-from-bottom duration-300 ${
              isDark
                ? 'bg-[#0b101b] border-slate-800 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Header */}
            <div
              className={`p-4 border-b flex items-center justify-between sticky top-0 backdrop-blur-md z-20 ${
                isDark ? 'border-slate-800 bg-[#0b101b]/95' : 'border-slate-200 bg-white/95'
              }`}
            >
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-emerald-500" />
                <h2 className="text-sm font-extrabold">Sort & Filter Options</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSortOpen(false)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
                aria-label="Close sort window"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-5 overflow-y-auto flex-1">
              {/* 1. Sort By */}
              <div>
                <label className={`text-[11px] font-bold uppercase tracking-wider block mb-2 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Sort By
                </label>
                <div className="flex flex-wrap gap-2">
                  {SORT_OPTIONS.map((opt) => {
                    const isSelected = tempSortBy === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTempSortBy(opt.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20 font-black'
                            : isDark
                            ? 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                            : 'bg-slate-100 text-slate-800 border border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. All types of places */}
              <div>
                <label className={`text-[11px] font-bold uppercase tracking-wider block mb-2 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Types of Places
                </label>
                <div className="flex flex-wrap gap-2">
                  {QUICK_CATEGORIES.map((cat) => {
                    const isSelected =
                      (tempCategory === 'All' && cat === 'All') ||
                      tempCategory.toLowerCase() === cat.toLowerCase();
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setTempCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20 font-black'
                            : isDark
                            ? 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                            : 'bg-slate-100 text-slate-800 border border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. All vehicle */}
              <div>
                <label className={`text-[11px] font-bold uppercase tracking-wider block mb-2 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Vehicle
                </label>
                <div className="flex flex-wrap gap-2">
                  {VEHICLE_OPTIONS.map((opt) => {
                    const isSelected = tempVehicle === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTempVehicle(opt.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20 font-black'
                            : isDark
                            ? 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                            : 'bg-slate-100 text-slate-800 border border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Any distance */}
              <div>
                <label className={`text-[11px] font-bold uppercase tracking-wider block mb-2 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Distance
                </label>
                <div className="flex flex-wrap gap-2">
                  {DISTANCE_OPTIONS.map((opt) => {
                    const isSelected = tempDistance === opt.value;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setTempDistance(opt.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20 font-black'
                            : isDark
                            ? 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                            : 'bg-slate-100 text-slate-800 border border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              className={`p-4 border-t flex items-center gap-3 sticky bottom-0 backdrop-blur-md ${
                isDark ? 'border-slate-800 bg-[#0b101b]/95' : 'border-slate-200 bg-white/95'
              }`}
            >
              <button
                type="button"
                onClick={handleResetMobileSort}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                  isDark
                    ? 'border-slate-800 text-slate-300 hover:bg-slate-800'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
              <button
                type="button"
                onClick={handleApplyMobileSort}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/25 text-center cursor-pointer"
              >
                Apply Sort & Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

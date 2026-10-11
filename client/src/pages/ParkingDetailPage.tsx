import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Star,
  MapPin,
  ShieldCheck,
  Zap,
  Clock,
  Car,
  Heart,
  Share2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Shield,
  CheckCircle,
  Eye,
  MessageSquare,
  ArrowRight,
  X,
  Navigation,
} from 'lucide-react';
import { LeafletMap } from '../components/LeafletMap';
import { BookingModal } from '../components/BookingModal';
import { ParkingSpace, Review } from '../types';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { formatLiveDistance } from '../utils/distance';
import { fallbackParkingSpaces } from '../data/mockSpaces';

export const ParkingDetailPage: React.FC = () => {
  const { isDark } = useTheme();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [parking, setParking] = useState<ParkingSpace | null>(null);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<any>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(
    searchParams.get('book') === 'true' || searchParams.get('reserve') === 'true'
  );

  // Auto-detect user live location for accurate distance calculation
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

  // Booking Card controls
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState<number>(3);
  const [arrivalTime, setArrivalTime] = useState<string>('02:00 PM');
  const [departureTime, setDepartureTime] = useState<string>('05:00 PM');

  // New review form state
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;
    const loadDetails = async () => {
      try {
        const res = await api.getParkingById(id);
        if (res.success && res.data) {
          setParking(res.data);
        } else {
          // Check local custom spaces & mock spaces fallback
          const localSpaces: ParkingSpace[] = JSON.parse(
            localStorage.getItem('parkshare_custom_spaces') || '[]'
          );
          const found = localSpaces.find((s) => s.id === id) || fallbackParkingSpaces.find((s) => s.id === id);
          if (found) {
            setParking(found);
          } else {
            setNotFound(true);
          }
        }
        const revRes = await api.getReviews(id);
        if (revRes.success) {
          setReviews(revRes.data);
          setReviewStats(revRes.stats);
        }
      } catch {
        // Check local custom spaces & mock spaces
        const localSpaces: ParkingSpace[] = JSON.parse(
          localStorage.getItem('parkshare_custom_spaces') || '[]'
        );
        const found = localSpaces.find((s) => s.id === id) || fallbackParkingSpaces.find((s) => s.id === id);
        if (found) {
          setParking(found);
        } else {
          setNotFound(true);
        }
      }
    };
    loadDetails();

    const handleSync = () => {
      loadDetails();
    };
    window.addEventListener('parkshare_rating_updated', handleSync);
    window.addEventListener('parkshare_spots_updated', handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);

    return () => {
      window.removeEventListener('parkshare_rating_updated', handleSync);
      window.removeEventListener('parkshare_spots_updated', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, [id]);

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-5">
        <div className={`w-16 h-16 rounded-3xl border flex items-center justify-center mx-auto text-2xl ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-400'
        }`}>
          🚗
        </div>
        <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Parking Spot Not Found</h2>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          The parking space you requested may have been unlisted, moved, or expired.
        </p>
        <button
          type="button"
          onClick={() => navigate('/find')}
          className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm transition"
        >
          Explore All Available Spots
        </button>
      </div>
    );
  }

  if (!parking) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto" />
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Loading parking space details...</p>
      </div>
    );
  }

  const subtotal = parking.pricePerHour * duration;
  const serviceFee = 10;
  const total = subtotal + serviceFee;
  const favorited = isFavorite(parking.id);

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingReview(true);
    try {
      const res = await api.addReview(parking.id, newRating, newComment);
      if (res.success) {
        if (res.parking) {
          setParking(res.parking);
        }
        const revRes = await api.getReviews(parking.id);
        if (revRes.success) {
          setReviews(revRes.data);
          setReviewStats(revRes.stats);
        } else {
          setReviews([res.data, ...reviews]);
        }
        setNewComment('');

        window.dispatchEvent(
          new CustomEvent('parkshare_rating_updated', {
            detail: {
              parkingId: parking.id,
              parkingTitle: parking.title,
              rating: newRating,
              comment: newComment,
            },
          })
        );
        window.dispatchEvent(new Event('parkshare_spots_updated'));
      }
    } catch {
      // Ignore
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleShareClick = () => {
    if (navigator.share) {
      navigator.share({ title: parking.title, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  return (
    <div className="pb-36 lg:pb-16 pt-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between py-3 mb-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={`flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
            isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Parking Search</span>
        </button>

        <div className="flex items-center gap-2 relative">
          {copiedLink && (
            <span className="absolute -top-8 right-0 px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 text-[11px] font-bold shadow-lg animate-in fade-in">
              Link copied!
            </span>
          )}
          <button
            type="button"
            onClick={() => toggleFavorite(parking)}
            className={`p-2 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer ${
              favorited
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                : isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm'
            }`}
          >
            <Heart className={`w-4 h-4 ${favorited ? 'fill-rose-500' : ''}`} />
            <span className="hidden sm:inline">{favorited ? 'Saved' : 'Save'}</span>
          </button>
          <button
            type="button"
            onClick={handleShareClick}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm'
            }`}
            title="Share Parking Spot"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1. Large Image Gallery */}
      <div className="space-y-3 mb-8">
        <div className={`relative h-[320px] sm:h-[440px] rounded-3xl overflow-hidden border group ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200 shadow-sm'
        }`}>
          <img
            src={parking.images[activeImageIndex] || parking.images[0] || 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80'}
            alt={parking.title}
            onError={(e) => {
              const fallback = 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80';
              if (e.currentTarget.src !== fallback) {
                e.currentTarget.src = fallback;
              }
            }}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => setIsLightboxOpen(true)}
          />

          {/* Fullscreen icon trigger */}
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="absolute bottom-4 right-4 px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10 hover:bg-black cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View All Photos ({parking.images.length})</span>
          </button>

          {/* Status badge */}
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg">
              {parking.availableSpots} SPOTS AVAILABLE
            </span>
            {parking.isVerified && (
              <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified
              </span>
            )}
          </div>
        </div>

        {/* Thumbnails row */}
        {parking.images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {parking.images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={`relative w-24 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  activeImageIndex === idx
                    ? 'border-emerald-500 scale-105 shadow-md'
                    : isDark
                      ? 'border-slate-800 opacity-60 hover:opacity-100'
                      : 'border-slate-300 opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={img}
                  alt=""
                  onError={(e) => {
                    const fallback = 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80';
                    if (e.currentTarget.src !== fallback) {
                      e.currentTarget.src = fallback;
                    }
                  }}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content + Floating Sticky Booking Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Details, Amenities, Map, Reviews (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Header info */}
          <div className={`space-y-3 pb-6 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {parking.title}
            </h1>

            <div className={`flex flex-wrap items-center gap-4 text-xs sm:text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                <Star className="w-4 h-4 fill-amber-500" />
                <span>{parking.rating}</span>
                <span className={isDark ? 'text-slate-400 font-normal' : 'text-slate-500 font-normal'}>({parking.reviewCount} reviews)</span>
              </div>
              <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>•</span>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{parking.address}</span>
              </div>
              <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>•</span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-emerald-500" />
                {formatLiveDistance(
                  userCoords?.[0],
                  userCoords?.[1],
                  parking.location.lat,
                  parking.location.lng,
                  parking.distanceMeters
                )}{' '}
                away
              </span>
            </div>
          </div>

          {/* Owner Host Card */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-3">
              <img
                src={parking.ownerAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                alt={parking.ownerName}
                className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-500/30"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Listed by</span>
                  <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{parking.ownerName}</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </div>
                <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Member since Jan 2022 • Response rate: <span className="text-emerald-500 font-semibold">{parking.ownerResponseRate || '99%'}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/messages')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Contact Host</span>
            </button>
          </div>

          {/* About this parking */}
          <div className="space-y-3">
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>About this parking</h3>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {parking.description}
            </p>
          </div>

          {/* Parking information grid */}
          <div className="space-y-4">
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Parking specifications</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <span className={`text-[10px] uppercase font-bold block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Parking Type</span>
                <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{parking.parkingType}</span>
              </div>
              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <span className={`text-[10px] uppercase font-bold block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Suitable Vehicles</span>
                <span className="text-sm font-semibold text-emerald-500">{parking.suitableVehicles.join(', ')}</span>
              </div>
              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <span className={`text-[10px] uppercase font-bold block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Entry Type</span>
                <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>QR Code Automated Barrier</span>
              </div>
              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <span className={`text-[10px] uppercase font-bold block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Access Hours</span>
                <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {parking.operatingHours.open} - {parking.operatingHours.close}
                </span>
              </div>
              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <span className={`text-[10px] uppercase font-bold block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Security Guard</span>
                <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>24/7 On-Duty Guard</span>
              </div>
              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <span className={`text-[10px] uppercase font-bold block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Max Clearance</span>
                <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>2.2 Meters</span>
              </div>
            </div>
          </div>

          {/* Amenities Icon Grid */}
          <div className="space-y-3">
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Amenities & Facilities</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {parking.amenities.map((amenity, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-medium ${
                    isDark ? 'bg-slate-900/60 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Location Map */}
          <div className="space-y-3">
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Location & Neighborhood</h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Exact parking entry gate coordinates provided upon confirmed reservation.
            </p>
            <div className={`h-64 rounded-2xl overflow-hidden border ${isDark ? 'border-slate-800' : 'border-slate-200 shadow-sm'}`}>
              <LeafletMap
                center={[parking.location.lat, parking.location.lng]}
                zoom={15}
                spaces={[parking]}
                selectedSpaceId={parking.id}
                userLocation={userCoords}
                onLocationChange={setUserCoords}
                height="100%"
                showRadius={false}
              />
            </div>
          </div>

          {/* Reviews & Breakdown Bar (Requirement 15) */}
          <div className={`space-y-6 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Verified Reviews</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center text-amber-500">
                    <Star className="w-5 h-5 fill-amber-500" />
                  </div>
                  <span className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{parking.rating}</span>
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>out of 5 ({parking.reviewCount} reviews)</span>
                </div>
              </div>
            </div>

            {/* Rating breakdown bars */}
            <div className={`space-y-2 p-4 rounded-2xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              {(
                reviewStats?.breakdown || [
                  { stars: 5, percentage: 82 },
                  { stars: 4, percentage: 12 },
                  { stars: 3, percentage: 4 },
                  { stars: 2, percentage: 1 },
                  { stars: 1, percentage: 1 },
                ]
              ).map((bar: any) => (
                <div key={bar.stars} className="flex items-center gap-3 text-xs">
                  <span className={`w-8 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{bar.stars} ★</span>
                  <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${bar.percentage}%` }}
                    />
                  </div>
                  <span className={`w-10 text-right font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{bar.percentage}%</span>
                </div>
              ))}
            </div>

            {/* Review Cards */}
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div key={rev.id} className={`p-4 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={rev.userAvatar}
                        alt={rev.userName}
                        className={`w-8 h-8 rounded-full object-cover ring-1 ${isDark ? 'ring-slate-700' : 'ring-slate-200'}`}
                      />
                      <div>
                        <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{rev.userName}</div>
                        <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{rev.date}</div>
                      </div>
                    </div>
                    <div className="flex text-amber-500">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                      ))}
                    </div>
                  </div>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{rev.comment}</p>

                  {/* Owner response if present */}
                  {rev.ownerResponse && (
                    <div className={`p-3 rounded-xl border-l-2 border-emerald-500 text-xs space-y-1 ${
                      isDark ? 'bg-slate-950/80' : 'bg-slate-50'
                    }`}>
                      <span className="font-semibold text-emerald-500 text-[11px] block">
                        Response from Host:
                      </span>
                      <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{rev.ownerResponse}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Leave a review form */}
            <form onSubmit={handlePostReview} className={`p-4 rounded-2xl border space-y-3 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Leave a Review</h4>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Your Rating:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-1 text-amber-500 cursor-pointer"
                    >
                      <Star className={`w-4 h-4 ${star <= newRating ? 'fill-amber-500' : isDark ? 'text-slate-700' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your parking experience (ramp clearance, host friendliness, access ease)..."
                rows={3}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none focus:border-emerald-500 resize-none transition-colors ${
                  isDark 
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500' 
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                }`}
              />
              <button
                type="submit"
                disabled={isSubmittingReview || !newComment.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-500/20"
              >
                {isSubmittingReview ? 'Posting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Sticky Floating Booking Card on Desktop (5 cols) */}
        <div className="hidden lg:block lg:col-span-5 sticky top-24">
          <div className={`p-6 rounded-3xl border shadow-2xl space-y-6 ${
            isDark ? 'bg-[#0f172a] border-slate-700/80' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-baseline justify-between">
              <div>
                <span className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>₹{parking.pricePerHour}</span>
                <span className={`text-xs font-medium ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/ hour</span>
              </div>
              <span className="text-xs text-emerald-500 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Instant Confirmation
              </span>
            </div>

            {/* Date & Time Picker inputs */}
            <div className={`space-y-3 p-4 rounded-2xl border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  When do you need parking?
                </label>
                <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className={`bg-transparent font-medium outline-none cursor-pointer w-full ${isDark ? 'text-white' : 'text-slate-900'}`}
                  />
                </div>
              </div>

              <div className={`grid grid-cols-2 gap-2 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div>
                  <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Arrival
                  </label>
                  <select
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className={`w-full px-2 py-1.5 rounded-lg border text-xs outline-none cursor-pointer ${
                      isDark 
                        ? 'bg-slate-950 border-slate-800 text-white' 
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    {['09:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '04:00 PM', '06:00 PM'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Departure
                  </label>
                  <select
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className={`w-full px-2 py-1.5 rounded-lg border text-xs outline-none cursor-pointer ${
                      isDark 
                        ? 'bg-slate-950 border-slate-800 text-white' 
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    {['12:00 PM', '03:00 PM', '05:00 PM', '07:00 PM', '09:00 PM'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Duration buttons */}
              <div className={`pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Duration ({duration} hours)
                </span>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 5, 8].map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setDuration(hrs)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        duration === hrs
                          ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                          : isDark
                            ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                            : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {hrs}h
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Transparent Pricing Breakdown (Requirement 16) */}
            <div className={`space-y-2 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <div className="flex justify-between">
                <span>Parking ({duration} hrs × ₹{parking.pricePerHour})</span>
                <span className="font-mono">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Service Fee</span>
                <span className="font-mono">₹{serviceFee}</span>
              </div>
              <div className={`pt-3 border-t flex justify-between items-baseline ${
                isDark ? 'border-slate-800 text-white' : 'border-slate-200 text-slate-900'
              }`}>
                <span className="font-bold text-sm">TOTAL AMOUNT</span>
                <span className="font-mono font-black text-2xl text-emerald-500">₹{total}</span>
              </div>
            </div>

            {/* Reserve CTA Button */}
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  navigate('/login');
                  return;
                }
                setIsBookingModalOpen(true);
              }}
              className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Reserve Spot</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className={`flex items-center justify-center gap-1.5 text-[11px] text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Full refund if cancelled up to 2 hours before start</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Booking Bar (Requirement 16) */}
      <div className={`lg:hidden fixed bottom-14 left-0 right-0 z-40 backdrop-blur-xl border-t p-3 flex items-center justify-between shadow-2xl ${
        isDark 
          ? 'bg-[#0d131f]/95 border-slate-800' 
          : 'bg-white/95 border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]'
      }`}>
        <div>
          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total ({duration} hrs):</span>
          <div className="text-xl font-black text-emerald-500 leading-tight">₹{total}</div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!user) {
              navigate('/login');
              return;
            }
            setIsBookingModalOpen(true);
          }}
          className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 cursor-pointer"
        >
          Reserve Spot
        </button>
      </div>

      {/* Lightbox Viewer */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-white hover:bg-slate-700"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl">
            <img
              src={parking.images[activeImageIndex]}
              alt=""
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Multi-step Booking Modal */}
      <BookingModal
        parking={parking}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        defaultDate={selectedDate}
        defaultArrival={arrivalTime}
        defaultDeparture={departureTime}
      />
    </div>
  );
};

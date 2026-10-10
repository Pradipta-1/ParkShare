import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import {
  CalendarCheck2,
  Clock,
  MapPin,
  Car,
  QrCode,
  Navigation,
  RotateCcw,
  CheckCircle2,
  X,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  Star,
  Sparkles,
} from 'lucide-react';
import { Booking } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const BookingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [selectedBookingForQr, setSelectedBookingForQr] = useState<Booking | null>(null);

  // Rating Modal & User Ratings State
  const [selectedBookingForRate, setSelectedBookingForRate] = useState<Booking | null>(null);
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [rateComment, setRateComment] = useState<string>('');
  const [isSubmittingRating, setIsSubmittingRating] = useState<boolean>(false);
  const [ratingToast, setRatingToast] = useState<string>('');
  const [userRatings, setUserRatings] = useState<Record<string, { rating: number; comment?: string; date?: string }>>(() => {
    try {
      const stored = localStorage.getItem('parkshare_user_ratings');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const fetchBookings = async () => {
    try {
      const res = await api.getBookings();
      if (res.success) {
        setBookings(res.data);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchBookings();
    const handleSync = () => fetchBookings();
    window.addEventListener('parkshare_booking_created', handleSync);
    window.addEventListener('parkshare_booking_cancelled', handleSync);
    return () => {
      window.removeEventListener('parkshare_booking_created', handleSync);
      window.removeEventListener('parkshare_booking_cancelled', handleSync);
    };
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking? The full amount will be refunded to your wallet.')) return;

    try {
      const res = await api.cancelBooking(id);
      if (res.success) {
        const targetBooking = bookings.find((b) => b.id === id);
        if (targetBooking && user) {
          updateUser({ walletBalance: (user.walletBalance || 0) + (targetBooking.totalAmount || 0) });
        }
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, bookingStatus: 'cancelled', paymentStatus: 'refunded' } : b))
        );
      }
    } catch {
      // Ignore
    }
  };

  const handleOpenRateModal = (b: Booking) => {
    setSelectedBookingForRate(b);
    const existing = userRatings[b.id] || userRatings[b.parkingId];
    if (existing) {
      setSelectedRating(existing.rating);
      setRateComment(existing.comment || '');
    } else {
      setSelectedRating(5);
      setRateComment('');
    }
    setHoveredRating(0);
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForRate) return;
    setIsSubmittingRating(true);

    const b = selectedBookingForRate;
    const finalRating = selectedRating;
    const finalComment = rateComment.trim() || `Rated ${finalRating} out of 5 stars`;

    try {
      await api.addReview(b.parkingId, finalRating, finalComment);
    } catch {
      // Continue locally for offline / mock resilience
    }

    // 1. Update user ratings dictionary
    const updatedUserRatings = {
      ...userRatings,
      [b.id]: { rating: finalRating, comment: finalComment, date: new Date().toISOString() },
      [b.parkingId]: { rating: finalRating, comment: finalComment, date: new Date().toISOString() },
    };
    setUserRatings(updatedUserRatings);
    try {
      localStorage.setItem('parkshare_user_ratings', JSON.stringify(updatedUserRatings));
    } catch {}

    // 2. Synchronize parkshare_custom_spaces in localStorage so find parking, map, detail, and owner views immediately pick up the new rating
    try {
      const storedSpaces = JSON.parse(localStorage.getItem('parkshare_custom_spaces') || '[]');
      const updatedSpaces = storedSpaces.map((s: any) => {
        if (s.id === b.parkingId || s.title?.toLowerCase() === b.parkingTitle?.toLowerCase()) {
          const currentCount = s.reviewCount || 0;
          const currentRating = s.rating || 5.0;
          const newCount = currentCount + 1;
          const newRating = Number(((currentRating * currentCount + finalRating) / newCount).toFixed(1));
          return {
            ...s,
            rating: newRating,
            reviewCount: newCount,
          };
        }
        return s;
      });
      localStorage.setItem('parkshare_custom_spaces', JSON.stringify(updatedSpaces));
    } catch {}

    // 3. Dispatch real-time events across the entire app
    window.dispatchEvent(
      new CustomEvent('parkshare_rating_updated', {
        detail: {
          parkingId: b.parkingId,
          parkingTitle: b.parkingTitle,
          rating: finalRating,
          comment: finalComment,
        },
      })
    );
    window.dispatchEvent(new Event('parkshare_spots_updated'));
    window.dispatchEvent(new Event('storage'));

    setIsSubmittingRating(false);
    setSelectedBookingForRate(null);
    setRatingToast(`Thank you! Rated ${finalRating} stars for "${b.parkingTitle}". Live rating updated platform-wide!`);
    setTimeout(() => setRatingToast(''), 4500);

    try {
      confetti({
        particleCount: 75,
        spread: 65,
        origin: { y: 0.65 },
      });
    } catch {}
  };

  const filtered =
    activeFilter === 'all'
      ? bookings
      : bookings.filter((b) =>
          activeFilter === 'active'
            ? b.bookingStatus === 'active' || b.bookingStatus === 'confirmed'
            : b.bookingStatus === activeFilter
        );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Notification */}
      {ratingToast && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-emerald-500/90 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-4 h-4 text-slate-950" />
          <span>{ratingToast}</span>
        </div>
      )}

      {/* Back button */}
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-emerald-500/40 text-xs font-semibold transition-all group shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Overview Hub</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Reservations
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
            My Parking Bookings
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Access active entry passes, receipts and turn-by-turn navigation.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-2xl text-xs font-semibold self-start sm:self-auto overflow-x-auto max-w-full no-scrollbar">
          {(['all', 'active', 'confirmed', 'completed', 'cancelled'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveFilter(tab)}
              className={`px-3 py-1.5 rounded-xl capitalize transition-all shrink-0 cursor-pointer ${
                activeFilter === tab
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'confirmed' ? 'Upcoming' : tab}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-16 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-4 max-w-md mx-auto my-12">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mx-auto">
            <CalendarCheck2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No bookings found</h3>
            <p className="text-xs text-slate-400 mt-1">
              You do not have any {activeFilter === 'all' ? '' : activeFilter} parking reservations.
            </p>
          </div>
          <Link
            to="/find"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
          >
            <span>Find a Spot</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => {
            const hasRated = userRatings[b.id] || userRatings[b.parkingId];
            return (
              <div
                key={b.id}
                className="p-5 sm:p-6 rounded-3xl bg-[#0f172a] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-5"
              >
                {/* Card Top: Image & Info */}
                <div className="flex items-start gap-3 sm:gap-4">
                  <img
                    src={b.parkingImage || 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80'}
                    alt={b.parkingTitle}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-1 ring-slate-700 shrink-0"
                  />

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-white">{b.parkingTitle}</h3>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          b.bookingStatus === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : b.bookingStatus === 'confirmed'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : b.bookingStatus === 'cancelled'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        ● {b.bookingStatus}
                      </span>

                      {/* Display user rating badge if rated */}
                      {hasRated && (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>Rated {hasRated.rating}.0★</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400">{b.parkingAddress}</p>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-300 pt-1">
                      <span>Date: <strong className="text-white">{b.date}</strong></span>
                      <span className="hidden sm:inline">•</span>
                      <span>Time: <strong className="text-white">{b.arrivalTime} → {b.departureTime}</strong></span>
                      <span className="hidden sm:inline">•</span>
                      <span>Spot: <strong className="text-emerald-400 font-bold">{b.spotNumber}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Metadata and Action Buttons */}
                <div className="pt-3.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-xs text-slate-400 flex-wrap">
                    <span className="font-mono text-emerald-400 font-bold">Pass: {b.bookingCode}</span>
                    <span>•</span>
                    <span>Total Paid: <strong className="text-white font-mono">₹{b.totalAmount}</strong></span>
                    <span>•</span>
                    <span>{b.paymentMethod || 'UPI'}</span>
                    {b.bookingStatus === 'cancelled' && (
                      <span className="text-[11px] text-slate-500 italic bg-slate-900/60 px-2 py-0.5 rounded-md border border-slate-800 ml-1">
                        Refund credited to wallet
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
                    {/* Rate Option Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenRateModal(b)}
                      className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                        hasRated
                          ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/40 shadow-sm'
                          : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/25'
                      }`}
                      title="Rate this parking spot out of 5 stars"
                    >
                      <Star className={`w-3.5 h-3.5 ${hasRated ? 'fill-amber-400 text-amber-400' : 'text-amber-400'}`} />
                      <span>{hasRated ? `★ ${hasRated.rating}.0 Rated` : 'Rate Spot'}</span>
                    </button>

                    {b.bookingStatus !== 'completed' && b.bookingStatus !== 'cancelled' && (
                      <button
                        type="button"
                        onClick={() => handleCancel(b.id)}
                        className="col-span-2 sm:col-span-1 px-3.5 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/20 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
                        title="Cancel this reservation and receive a full wallet refund"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cancel Booking</span>
                      </button>
                    )}

                    <Link
                      to={`/messages?bookingId=${b.id}`}
                      className="p-2 sm:px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-xs"
                      title="Chat Host"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      <span className="sm:hidden font-semibold">Chat</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        window.open(
                          `https://www.google.com/maps/dir/?api=1&destination=${b.parkingLocation?.lat || 22.5697},${b.parkingLocation?.lng || 88.3582}`,
                          '_blank'
                        );
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center"
                    >
                      <Navigation className="w-3.5 h-3.5 text-blue-400" />
                      <span>Navigate</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedBookingForQr(b)}
                      className="col-span-2 sm:col-span-1 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer text-center"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>QR Pass</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5-Star Interactive Rating Modal */}
      {selectedBookingForRate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Star className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Rate This Parking</h3>
                  <p className="text-xs text-slate-400">Rate out of 5 stars for live platform updates</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBookingForRate(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Spot Details Header */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-1">
              <h4 className="text-xs sm:text-sm font-bold text-white truncate">{selectedBookingForRate.parkingTitle}</h4>
              <p className="text-[11px] text-slate-400 truncate">{selectedBookingForRate.parkingAddress}</p>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-0.5">
                <span>Pass: <strong className="text-emerald-400 font-mono">{selectedBookingForRate.bookingCode}</strong></span>
                <span>•</span>
                <span>Bay: <strong className="text-white">{selectedBookingForRate.spotNumber}</strong></span>
              </div>
            </div>

            <form onSubmit={handleSubmitRating} className="space-y-4">
              {/* Interactive 5-Star Row */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block text-center">
                  Select your rating:
                </label>
                <div className="flex items-center justify-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoveredRating || selectedRating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        onClick={() => setSelectedRating(star)}
                        className="p-1 sm:p-2 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                        title={`${star} star${star > 1 ? 's' : ''}`}
                      >
                        <Star
                          className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors ${
                            isFilled
                              ? 'fill-amber-400 text-amber-400 filter drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                              : 'text-slate-700 hover:text-slate-600'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Rating Descriptor Banner */}
                <div className="text-center pt-1">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {selectedRating === 5 && '★★★★★ 5.0 • Outstanding experience!'}
                    {selectedRating === 4 && '★★★★☆ 4.0 • Very Good & satisfied'}
                    {selectedRating === 3 && '★★★☆☆ 3.0 • Average experience'}
                    {selectedRating === 2 && '★★☆☆☆ 2.0 • Needs improvements'}
                    {selectedRating === 1 && '★☆☆☆☆ 1.0 • Poor experience'}
                  </span>
                </div>
              </div>

              {/* Quick Tags */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 block text-center">Quick highlights (click to append):</span>
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  {[
                    'Easy boom barrier entry',
                    'Safe & well guarded',
                    'Spacious bay',
                    'Fast check-in',
                    'EV charger ready',
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setRateComment((prev) => (prev ? `${prev}, ${tag}` : tag));
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-[10px] transition-colors cursor-pointer"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Comment Textarea */}
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">
                  Review & Feedback (Optional)
                </label>
                <textarea
                  value={rateComment}
                  onChange={(e) => setRateComment(e.target.value)}
                  placeholder="Share details about cleanliness, security, access ease..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none focus:border-amber-400 resize-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForRate(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRating}
                  className="flex-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingRating ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Star className="w-3.5 h-3.5 fill-slate-950" />
                      <span>Submit {selectedRating}-Star Rating</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {selectedBookingForQr && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Digital Gate Pass
              </span>
              <button
                type="button"
                onClick={() => setSelectedBookingForQr(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white p-4 rounded-2xl inline-block shadow-2xl mx-auto">
              <QRCodeSVG value={selectedBookingForQr.qrCodeData} size={170} level="H" />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-left space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Booking Code</span>
                <span className="font-mono font-bold text-emerald-400">{selectedBookingForQr.bookingCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Bay</span>
                <span className="font-bold text-white">{selectedBookingForQr.spotNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Slot Window</span>
                <span className="text-white">{selectedBookingForQr.arrivalTime} → {selectedBookingForQr.departureTime}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedBookingForQr(null);
                navigate('/qr-checkin');
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer"
            >
              Open Live Scanner Interface
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


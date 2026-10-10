import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
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

  const filtered = activeFilter === 'all' ? bookings : bookings.filter((b) => b.bookingStatus === activeFilter);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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
              className={`px-3 py-1.5 rounded-xl capitalize transition-all shrink-0 ${
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
          {filtered.map((b) => (
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
                    to="/messages"
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
          ))}
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
                className="p-1 rounded-lg text-slate-400 hover:text-white"
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
              className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
            >
              Open Live Scanner Interface
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

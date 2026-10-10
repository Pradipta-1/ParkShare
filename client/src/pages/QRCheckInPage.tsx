import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import {
  QrCode,
  CheckCircle2,
  Clock,
  Car,
  MapPin,
  Sparkles,
  ArrowRight,
  LogOut,
  Navigation,
  FileText,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { Booking } from '../types';

export const QRCheckInPage: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [checkInState, setCheckInState] = useState<'scan' | 'checked_in' | 'checked_out'>('scan');
  const [checkInData, setCheckInData] = useState<any>(null);
  const [checkOutData, setCheckOutData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    const loadBooking = async () => {
      try {
        const res = await api.getBookings();
        if (res.success && res.data.length > 0) {
          const b = res.data.find((item) => item.bookingStatus === 'active' || item.bookingStatus === 'confirmed') || res.data[0];
          setActiveBooking(b);
          if (b.bookingStatus === 'active' && b.checkInTime) {
            setCheckInState('checked_in');
            setCheckInData({
              spotNumber: b.spotNumber || 'P-24',
              checkInTime: b.checkInTime,
              parkingTitle: b.parkingTitle,
            });
          }
        }
      } catch {
        // Fallback
      }
    };
    loadBooking();
    const handleSync = () => loadBooking();
    window.addEventListener('parkshare_booking_created', handleSync);
    return () => window.removeEventListener('parkshare_booking_created', handleSync);
  }, []);

  const handleSimulateScanCheckIn = async () => {
    const booking = activeBooking || {
      id: 'bk_sample_1',
      parkingTitle: 'Park Street Premium Covered Bay',
      spotNumber: 'P-24',
      bookingCode: 'PS-8921-X',
      totalAmount: 180,
      vehicle: { numberPlate: 'WB 01 AB 1234' },
      qrCodeData: 'PARKSHARE::SAMPLE::SPOT_P24',
    };
    if (!activeBooking) setActiveBooking(booking as any);

    setIsProcessing(true);
    try {
      const res = await api.checkInBooking(booking.id);
      if (res.success) {
        setCheckInData(res.data);
        setCheckInState('checked_in');
        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        } catch {
          // Ignore
        }
      } else {
        throw new Error('Fallback check-in');
      }
    } catch {
      // Fallback state
      setCheckInData({
        spotNumber: booking.spotNumber || 'P-24',
        checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        parkingTitle: booking.parkingTitle,
      });
      setCheckInState('checked_in');
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch {
        // Ignore
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulateCheckOut = async () => {
    const booking = activeBooking || {
      id: 'bk_sample_1',
      parkingTitle: 'Park Street Premium Covered Bay',
      spotNumber: 'P-24',
      bookingCode: 'PS-8921-X',
      totalAmount: 180,
    };
    setIsProcessing(true);
    try {
      const res = await api.checkOutBooking(booking.id);
      if (res.success) {
        setCheckOutData(res.data);
        setCheckInState('checked_out');
        try {
          confetti({ particleCount: 90, spread: 80, origin: { y: 0.5 } });
        } catch {
          // Ignore
        }
      } else {
        throw new Error('Fallback checkout');
      }
    } catch {
      // Fallback state
      setCheckOutData({
        spotNumber: booking.spotNumber || 'P-24',
        checkInTime: '02:02 PM',
        checkOutTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        durationText: '2h 45m',
        finalAmount: booking.totalAmount || 150,
      });
      setCheckInState('checked_out');
      try {
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.5 } });
      } catch {
        // Ignore
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      {/* Back button */}
      <div>
        <Link
          to="/dashboard"
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all group shadow-sm border ${
            isDark
              ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 hover:border-emerald-500/40'
              : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 border-slate-200 hover:border-emerald-500/40'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-500 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Overview Hub</span>
        </Link>
      </div>

      <div className={`border rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-2xl text-center space-y-5 sm:space-y-6 transition-colors ${
        isDark
          ? 'bg-[#0f172a] border-slate-800 text-white'
          : 'bg-white border-slate-200 text-slate-900 shadow-xl'
      }`}>
        {/* State 1: Scan to Enter */}
        {checkInState === 'scan' && (
          <div className="space-y-5 sm:space-y-6">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              isDark
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              <QrCode className="w-4 h-4" />
              <span>Contactless Boom Barrier Entry</span>
            </div>

            <div>
              <h1 className={`text-2xl sm:text-3xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Scan to enter</h1>
              <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Present this QR code to the scanner camera at the barrier.
              </p>
            </div>

            {/* QR Code Container */}
            <div className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl inline-block shadow-2xl mx-auto border-4 ring-4 sm:ring-8 ${
              isDark
                ? 'bg-white border-emerald-500/20 ring-emerald-500/10'
                : 'bg-white border-emerald-500/30 ring-emerald-500/15'
            }`}>
              <QRCodeSVG
                value={activeBooking?.qrCodeData || 'PARKSHARE::SAMPLE::SPOT_P24'}
                size={170}
                level="H"
              />
            </div>

            {/* Spot context info */}
            {activeBooking && (
              <div className={`p-4 rounded-2xl border text-left text-xs space-y-2 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`flex justify-between items-center pb-2 border-b ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Pass Code:</span>
                  <span className={`font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{activeBooking.bookingCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Destination:</span>
                  <span className={`font-medium truncate max-w-[200px] ${isDark ? 'text-white' : 'text-slate-900'}`}>{activeBooking.parkingTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Reserved Spot:</span>
                  <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{activeBooking.spotNumber || 'P-24'}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Vehicle:</span>
                  <span className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{activeBooking.vehicle?.numberPlate}</span>
                </div>
              </div>
            )}

            {/* Interactive Simulation CTA */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleSimulateScanCheckIn}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>Simulate Gate QR Scan Check-In</span>
              </button>
              <span className={`text-[11px] mt-2 block ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                Simulates the hardware scanner trigger when driving through the boom barrier.
              </span>
            </div>
          </div>
        )}

        {/* State 2: Check-in Successful */}
        {checkInState === 'checked_in' && (
          <div className="space-y-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ring-8 ${
              isDark
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 ring-emerald-500/10'
                : 'bg-emerald-100 text-emerald-700 border border-emerald-300 ring-emerald-500/10'
            }`}>
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <h1 className={`text-2xl sm:text-3xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Check-in successful</h1>
              <p className={`text-sm font-semibold mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                Barrier open. Enjoy your parking!
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className={`p-5 rounded-2xl border text-left text-sm space-y-3 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`flex justify-between items-center pb-3 border-b ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Designated Bay</span>
                <span className={`text-xl font-black font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  {checkInData?.spotNumber || 'P-24'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Arrival Time</span>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{checkInData?.checkInTime || '02:02 PM'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Facility</span>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{checkInData?.parkingTitle || 'Central Avenue Parking'}</span>
              </div>
            </div>

            {/* Next actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleSimulateCheckOut}
                className={`py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-colors ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                }`}
              >
                <LogOut className="w-4 h-4 text-amber-500" />
                <span>Simulate Gate Check-Out</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
              >
                <span>Return to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* State 3: Check-out Completed (Requirement 19) */}
        {checkInState === 'checked_out' && (
          <div className="space-y-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ring-8 ${
              isDark
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 ring-blue-500/10'
                : 'bg-blue-100 text-blue-700 border border-blue-300 ring-blue-500/10'
            }`}>
              <Sparkles className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <h1 className={`text-2xl sm:text-3xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Parking completed</h1>
              <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Thank you for using ParkShare. Safe travels!
              </p>
            </div>

            {/* Final receipt */}
            <div className={`p-5 rounded-2xl border text-left text-xs space-y-3 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`flex justify-between items-center pb-3 border-b ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Total Duration Parked</span>
                <span className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{checkOutData?.durationText || '2h 56m'}</span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Check-in / Check-out</span>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {checkOutData?.checkInTime || '02:02 PM'} → {checkOutData?.checkOutTime || '04:58 PM'}
                </span>
              </div>
              <div className={`flex justify-between items-baseline pt-2 border-t ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Final Settled Amount</span>
                <span className={`text-xl font-black font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  ₹{checkOutData?.finalAmount || 120}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCheckInState('scan')}
                className={`flex-1 py-3 rounded-xl font-semibold text-xs border transition-colors ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                }`}
              >
                Scan New Code
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

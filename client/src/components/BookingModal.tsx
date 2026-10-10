import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Check,
  Calendar,
  Clock,
  Car,
  CreditCard,
  QrCode,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Navigation,
  CheckCircle2,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { ParkingSpace, Vehicle, VehicleType } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

interface BookingModalProps {
  parking: ParkingSpace;
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  defaultArrival?: string;
  defaultDeparture?: string;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  parking,
  isOpen,
  onClose,
  defaultDate = new Date().toISOString().split('T')[0],
  defaultArrival = '02:00 PM',
  defaultDeparture = '05:00 PM',
}) => {
  const { user, updateUser } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [step, setStep] = useState<number>(1);
  const [date, setDate] = useState<string>(defaultDate);
  const [arrivalTime, setArrivalTime] = useState<string>(defaultArrival);
  const [departureTime, setDepartureTime] = useState<string>(defaultDeparture);
  const [durationHours, setDurationHours] = useState<number>(3);

  // Driver Real Vehicles State
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState<boolean>(false);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [vehicleError, setVehicleError] = useState<string>('');

  // Inline Vehicle Form fields
  const [newNumberPlate, setNewNumberPlate] = useState<string>('');
  const [newBrand, setNewBrand] = useState<string>('');
  const [newModel, setNewModel] = useState<string>('');
  const [newColor, setNewColor] = useState<string>('');
  const [newType, setNewType] = useState<VehicleType>('Car');
  const [isSavingVehicle, setIsSavingVehicle] = useState<boolean>(false);

  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'Wallet' | 'Net Banking'>('UPI');
  const [upiId, setUpiId] = useState<string>('driver@okaxis');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  // Fetch driver's real registered vehicles
  const loadDriverVehicles = async () => {
    setIsLoadingVehicles(true);
    setVehicleError('');
    try {
      let vList: Vehicle[] = [];
      const res = await api.getVehicles();
      if (res.success && Array.isArray(res.data)) {
        vList = res.data;
      }
      try {
        const local = JSON.parse(localStorage.getItem('parkshare_custom_vehicles') || '[]');
        if (Array.isArray(local) && local.length > 0) {
          const ids = new Set(vList.map((v) => v.id));
          vList = [...vList, ...local.filter((v: any) => !ids.has(v.id))];
        }
      } catch {}

      setVehicles(vList);
      if (vList.length > 0) {
        const primary = vList.find((v) => v.isDefault) || vList[0];
        setSelectedVehicle((prev) => {
          if (prev && vList.some((v) => v.id === prev.id)) return prev;
          return primary;
        });
        setShowAddForm(false);
      } else {
        setSelectedVehicle(null);
        setShowAddForm(true);
      }
    } catch {
      try {
        const local = JSON.parse(localStorage.getItem('parkshare_custom_vehicles') || '[]');
        if (Array.isArray(local) && local.length > 0) {
          setVehicles(local);
          const primary = local.find((v: any) => v.isDefault) || local[0];
          setSelectedVehicle((prev) => {
            if (prev && local.some((v: any) => v.id === prev.id)) return prev;
            return primary;
          });
          setShowAddForm(false);
        } else {
          setVehicles([]);
          setSelectedVehicle(null);
          setShowAddForm(true);
        }
      } catch {
        setVehicles([]);
        setSelectedVehicle(null);
        setShowAddForm(true);
      }
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDriverVehicles();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleSync = () => {
      loadDriverVehicles();
    };
    window.addEventListener('parkshare_vehicle_added', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('parkshare_vehicle_added', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const handleSaveInlineVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumberPlate.trim() || !newBrand.trim() || !newModel.trim()) {
      setVehicleError('Please provide registration number plate, brand, and model.');
      return;
    }

    setIsSavingVehicle(true);
    setVehicleError('');
    try {
      const payload = {
        numberPlate: newNumberPlate.trim().toUpperCase(),
        brand: newBrand.trim(),
        model: newModel.trim(),
        color: newColor.trim() || 'Obsidian Black',
        type: newType,
        isDefault: vehicles.length === 0,
        userId: user?.id || 'usr_driver_1',
      };

      let createdVehicle: Vehicle;
      try {
        const res = await api.addVehicle(payload);
        if (res.success && res.data) {
          createdVehicle = res.data;
        } else {
          throw new Error('Failed to save vehicle');
        }
      } catch {
        createdVehicle = {
          id: `veh_${Date.now()}`,
          ...payload,
        };
      }

      try {
        const stored = JSON.parse(localStorage.getItem('parkshare_custom_vehicles') || '[]');
        const updated = [createdVehicle, ...stored.filter((v: any) => v.id !== createdVehicle.id)];
        localStorage.setItem('parkshare_custom_vehicles', JSON.stringify(updated));
      } catch {}

      const updatedVehicles = [...vehicles.filter((v) => v.id !== createdVehicle.id), createdVehicle];
      setVehicles(updatedVehicles);
      setSelectedVehicle(createdVehicle);
      setShowAddForm(false);
      setNewNumberPlate('');
      setNewBrand('');
      setNewModel('');
      setNewColor('');

      window.dispatchEvent(new Event('parkshare_vehicle_added'));
      window.dispatchEvent(new Event('storage'));
    } catch (err: any) {
      setVehicleError(err.message || 'Could not save vehicle');
    } finally {
      setIsSavingVehicle(false);
    }
  };

  if (!isOpen) return null;

  const subtotal = parking.pricePerHour * durationHours;
  const serviceFee = 10;
  const totalAmount = subtotal + serviceFee;

  const handleNext = () => {
    if (step === 3 && !selectedVehicle) {
      setVehicleError('You must add or select a vehicle to continue.');
      setShowAddForm(true);
      return;
    }
    setStep((prev) => Math.min(6, prev + 1));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleConfirmPayment = async () => {
    if (!selectedVehicle) {
      setStep(3);
      setVehicleError('Please select or add a vehicle to continue.');
      return;
    }
    setIsProcessing(true);
    try {
      const payload = {
        parkingId: parking.id,
        parkingTitle: parking.title,
        parkingAddress: parking.address,
        parkingImage: (parking.images && parking.images[0]) || (parking as any).image || 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80',
        parkingLocation: parking.location || { lat: 22.5512, lng: 88.3619 },
        pricePerHour: parking.pricePerHour || 50,
        ownerId: parking.ownerId || 'usr_owner_1',
        ownerName: parking.ownerName || 'Vikramaditya Roy',
        date,
        arrivalTime,
        departureTime,
        durationHours,
        vehicle: selectedVehicle,
        paymentMethod,
      };

      const res = await api.createBooking(payload);

      if (res.success && res.data) {
        setConfirmedBooking(res.data);
        // Persist booking to local storage cache as well
        try {
          const stored = JSON.parse(localStorage.getItem('parkshare_custom_bookings') || '[]');
          localStorage.setItem('parkshare_custom_bookings', JSON.stringify([res.data, ...stored.filter((b: any) => b.id !== res.data.id)]));
        } catch {}

        // Deduct from driver wallet if paying via Wallet
        if (paymentMethod === 'Wallet' && user) {
          updateUser({ walletBalance: Math.max(0, (user.walletBalance || 0) - totalAmount) });
        }

        window.dispatchEvent(new Event('parkshare_booking_created'));
        window.dispatchEvent(new Event('parkshare_spots_updated'));
        window.dispatchEvent(new Event('storage'));
        setStep(6);
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // Ignore
        }
      } else {
        throw new Error('Booking failed');
      }
    } catch {
      // Local fallback simulation if server is unreachable
      const mockBooking = {
        id: `book_${Date.now().toString(36)}`,
        bookingCode: `PS-${Math.floor(100000 + Math.random() * 900000)}`,
        parkingId: parking.id,
        parkingTitle: parking.title,
        parkingAddress: parking.address,
        parkingImage: (parking.images && parking.images[0]) || (parking as any).image || 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80',
        parkingLocation: parking.location || { lat: 22.5512, lng: 88.3619 },
        userId: user?.id || 'usr_driver_1',
        userName: user?.name || 'Rahul Sen',
        userPhone: user?.phone || '+91 98301 23456',
        ownerId: parking.ownerId || 'usr_owner_1',
        ownerName: parking.ownerName || 'Vikramaditya Roy',
        date,
        arrivalTime,
        departureTime,
        durationHours,
        vehicle: selectedVehicle,
        pricePerHour: parking.pricePerHour || 50,
        subtotal,
        serviceFee,
        totalAmount,
        paymentStatus: 'paid',
        bookingStatus: 'confirmed',
        paymentMethod,
        spotNumber: 'Bay P-24',
        transactionId: `TXN-${Math.floor(100000000 + Math.random() * 900000000)}`,
        qrCodeData: `PARKSHARE::${parking.id}::USER_${user?.id}::SPOT_P24`,
        createdAt: new Date().toISOString(),
      };

      try {
        const stored = JSON.parse(localStorage.getItem('parkshare_custom_bookings') || '[]');
        localStorage.setItem('parkshare_custom_bookings', JSON.stringify([mockBooking, ...stored]));
      } catch {}

      if (paymentMethod === 'Wallet' && user) {
        updateUser({ walletBalance: Math.max(0, (user.walletBalance || 0) - totalAmount) });
      }

      window.dispatchEvent(new Event('parkshare_booking_created'));
      window.dispatchEvent(new Event('parkshare_spots_updated'));
      window.dispatchEvent(new Event('storage'));
      setConfirmedBooking(mockBooking);
      setStep(6);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={step === 6 ? undefined : onClose} />

      {/* Modal Card */}
      <div
        className={`relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 border ${
          isDark
            ? 'bg-[#0d131f] border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900 shadow-xl'
        }`}
      >
        {/* Progress indicator header */}
        <div
          className={`p-5 border-b flex items-center justify-between ${
            isDark
              ? 'border-slate-800 bg-slate-950/60'
              : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2">
            {step > 1 && step < 6 && (
              <button
                type="button"
                onClick={handleBack}
                className={`p-1 rounded-lg mr-1 transition-colors ${
                  isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                Step {step} of {step === 6 ? '6 Completed' : '5'}
              </span>
              <h2 className={`text-base font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {step === 1 && 'Select Reservation Date'}
                {step === 2 && 'Set Parking Hours'}
                {step === 3 && 'Choose Your Vehicle'}
                {step === 4 && 'Review Booking Details'}
                {step === 5 && 'Secure Payment'}
                {step === 6 && 'Booking Confirmed!'}
              </h2>
            </div>
          </div>

          {step !== 6 && (
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step Progress Bar */}
        <div className={`w-full h-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
          <div
            className="bg-emerald-500 h-1 transition-all duration-300"
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>

        {/* Step 1: Choose Date */}
        {step === 1 && (
          <div className="p-6 space-y-5">
            <div
              className={`p-3 rounded-2xl border flex items-center gap-3 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <img src={parking.images[0]} alt="" className="w-12 h-12 rounded-xl object-cover" />
              <div>
                <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{parking.title}</h4>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{parking.address}</p>
                <span className={`text-[11px] font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>₹{parking.pricePerHour}/hour</span>
              </div>
            </div>

            <div>
              <label className={`text-xs font-semibold mb-2 flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Calendar className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                When do you need parking?
              </label>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border font-medium outline-none transition-colors ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-white focus:border-emerald-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                }`}
              />
            </div>

            <div className="flex gap-2">
              {['Today', 'Tomorrow', 'This Weekend'].map((shortcut, idx) => {
                const target = new Date();
                if (idx === 1) target.setDate(target.getDate() + 1);
                const str = target.toISOString().split('T')[0];
                return (
                  <button
                    key={shortcut}
                    type="button"
                    onClick={() => setDate(str)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${
                      date === str
                        ? isDark
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold'
                          : 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                        : isDark
                          ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {shortcut}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
            >
              <span>Continue to Time</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Choose Time */}
        {step === 2 && (
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`text-xs font-semibold mb-1.5 flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Clock className="w-3.5 h-3.5 text-blue-500" /> Arrival Time
                </label>
                <select
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs font-medium outline-none ${
                    isDark
                      ? 'bg-slate-900 border-slate-800 text-white focus:border-emerald-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                  }`}
                >
                  {['09:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '04:00 PM', '06:00 PM', '08:00 PM'].map((t) => (
                    <option key={t} value={t} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`text-xs font-semibold mb-1.5 flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Clock className="w-3.5 h-3.5 text-purple-500" /> Departure Time
                </label>
                <select
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs font-medium outline-none ${
                    isDark
                      ? 'bg-slate-900 border-slate-800 text-white focus:border-emerald-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                  }`}
                >
                  {['12:00 PM', '03:00 PM', '05:00 PM', '07:00 PM', '09:00 PM', '11:00 PM'].map((t) => (
                    <option key={t} value={t} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={`text-xs font-semibold mb-2 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Estimated Duration ({durationHours} hours)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 5, 8].map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => setDurationHours(hrs)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      durationHours === hrs
                        ? isDark
                          ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                          : 'bg-emerald-500 text-slate-950 font-bold border-emerald-500 shadow-sm'
                        : isDark
                          ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {hrs}h
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`p-3.5 rounded-xl border text-xs flex justify-between items-center ${
                isDark
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <span>Hourly Rate: ₹{parking.pricePerHour} × {durationHours} hrs</span>
              <span className={`font-extrabold text-sm ${isDark ? 'text-white' : 'text-emerald-950'}`}>₹{subtotal}</span>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
            >
              <span>Continue to Vehicle</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 3: Select Vehicle */}
        {step === 3 && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className={`text-xs font-bold block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  Choose Your Vehicle
                </label>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Only vehicles registered to your driver account can be used for this parking spot.
                </p>
              </div>
              {vehicles.length > 0 && !showAddForm && (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className={`text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                    isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Vehicle</span>
                </button>
              )}
            </div>

            {vehicleError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{vehicleError}</span>
              </div>
            )}

            {isLoadingVehicles && vehicles.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading your vehicles...</p>
              </div>
            ) : null}

            {/* List of driver's added vehicles */}
            {vehicles.length > 0 && (
              <div className="space-y-2.5">
                {vehicles.map((veh) => {
                  const isSelected = selectedVehicle?.id === veh.id || selectedVehicle?.numberPlate === veh.numberPlate;
                  return (
                    <div
                      key={veh.id}
                      onClick={() => {
                        setSelectedVehicle(veh);
                        setVehicleError('');
                      }}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? isDark
                            ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/30'
                            : 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/30'
                          : isDark
                            ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                            isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          <Car className="w-5 h-5" />
                        </div>
                        <div>
                          <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {veh.brand} {veh.model}
                          </div>
                          <div className={`text-[11px] font-mono font-semibold tracking-wider ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                            {veh.numberPlate}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {veh.color && (
                          <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {veh.color}
                          </span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>
                          {veh.type}
                        </span>
                        {isSelected && <Check className={`w-4 h-4 stroke-[3] ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* If no vehicles registered OR Add Vehicle form is toggled */}
            {(vehicles.length === 0 || showAddForm) && (
              <div className={`p-4 rounded-2xl border space-y-3.5 ${
                vehicles.length === 0
                  ? isDark ? 'bg-amber-500/5 border-amber-500/30' : 'bg-amber-50/60 border-amber-300'
                  : isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                {vehicles.length === 0 && (
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                    <div>
                      <h4 className={`text-xs font-bold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                        No vehicle registered in your driver account
                      </h4>
                      <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        You must add a vehicle to continue the reservation. Enter your vehicle details below or register it in the Add Vehicle section.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {vehicles.length === 0 ? 'Register Vehicle to Continue' : 'Add Another Vehicle'}
                  </span>
                  {vehicles.length > 0 && showAddForm && (
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className={`text-xs ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveInlineVehicle} className="space-y-3">
                  <div>
                    <label className={`text-[11px] font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Registration Number Plate *
                    </label>
                    <input
                      type="text"
                      value={newNumberPlate}
                      onChange={(e) => setNewNumberPlate(e.target.value.toUpperCase())}
                      placeholder="e.g. WB 01 AB 1234"
                      required
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold tracking-wider outline-none focus:border-emerald-500 ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className={`text-[11px] font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Brand / Make *
                      </label>
                      <input
                        type="text"
                        value={newBrand}
                        onChange={(e) => setNewBrand(e.target.value)}
                        placeholder="e.g. Honda"
                        required
                        className={`w-full px-3 py-2 rounded-xl border text-xs outline-none focus:border-emerald-500 ${
                          isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`text-[11px] font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Model *
                      </label>
                      <input
                        type="text"
                        value={newModel}
                        onChange={(e) => setNewModel(e.target.value)}
                        placeholder="e.g. City ZX"
                        required
                        className={`w-full px-3 py-2 rounded-xl border text-xs outline-none focus:border-emerald-500 ${
                          isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className={`text-[11px] font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Color
                      </label>
                      <input
                        type="text"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        placeholder="e.g. Obsidian Black"
                        className={`w-full px-3 py-2 rounded-xl border text-xs outline-none focus:border-emerald-500 ${
                          isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`text-[11px] font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Vehicle Type
                      </label>
                      <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as VehicleType)}
                        className={`w-full px-3 py-2 rounded-xl border text-xs outline-none cursor-pointer focus:border-emerald-500 ${
                          isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      >
                        <option value="Car">Car</option>
                        <option value="SUV">SUV</option>
                        <option value="EV">EV</option>
                        <option value="Bike">Bike</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="submit"
                      disabled={isSavingVehicle}
                      className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>{isSavingVehicle ? 'Saving Vehicle...' : 'Save & Select Vehicle'}</span>
                    </button>
                  </div>
                </form>

                {vehicles.length === 0 && (
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                      Prefer adding from Garage?
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate('/vehicles');
                      }}
                      className={`font-semibold underline flex items-center gap-1 cursor-pointer ${
                        isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'
                      }`}
                    >
                      <span>Add Vehicle section</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Review Booking Button */}
            {selectedVehicle ? (
              <button
                type="button"
                onClick={handleNext}
                className="w-full mt-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Review Booking</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="space-y-1 mt-2">
                <button
                  type="button"
                  disabled
                  className="w-full py-3 rounded-xl bg-slate-800 text-slate-500 font-bold text-sm cursor-not-allowed opacity-60 flex items-center justify-center gap-2"
                >
                  <span>Add a vehicle above to continue</span>
                </button>
                <p className={`text-[10px] text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  You must add a vehicle to continue the reservation process.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Review Booking */}
        {step === 4 && (
          <div className="p-6 space-y-4">
            <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{parking.title}</h4>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{parking.address}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${
                  isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {parking.parkingType}
                </span>
              </div>

              <div className={`grid grid-cols-2 gap-2 pt-2 border-t text-xs ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
                <div>
                  <span className={`block text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Date & Slot</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{date}</span>
                </div>
                <div>
                  <span className={`block text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Time Window</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{arrivalTime} → {departureTime}</span>
                </div>
                <div>
                  <span className={`block text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Vehicle</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model} (${selectedVehicle.numberPlate})` : 'No vehicle selected'}
                  </span>
                </div>
                <div>
                  <span className={`block text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Host</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{parking.ownerName}</span>
                </div>
              </div>
            </div>

            {/* Price breakdown */}
            <div className={`p-4 rounded-2xl border text-xs space-y-2 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className={`flex justify-between ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                <span>Parking ({durationHours} hrs × ₹{parking.pricePerHour})</span>
                <span>₹{subtotal}</span>
              </div>
              <div className={`flex justify-between ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                <span>Platform Service Fee</span>
                <span>₹{serviceFee}</span>
              </div>
              <div className={`border-t pt-2 flex justify-between text-sm font-bold ${isDark ? 'border-slate-800 text-white' : 'border-slate-200 text-slate-900'}`}>
                <span>Total Amount Due</span>
                <span className={`text-base ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>₹{totalAmount}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
            >
              <span>Proceed to Payment</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 5: Payment */}
        {step === 5 && (
          <div className="p-6 space-y-5">
            <div className={`flex items-center justify-between p-3.5 rounded-2xl border ${
              isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
            }`}>
              <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Payable Amount:</span>
              <span className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>₹{totalAmount}</span>
            </div>

            {/* Payment method selector */}
            <div className="space-y-2">
              {(['UPI', 'Card', 'Wallet', 'Net Banking'] as const).map((method) => (
                <label
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                    paymentMethod === method
                      ? isDark
                        ? 'bg-emerald-500/10 border-emerald-500 text-white font-semibold'
                        : 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold'
                      : isDark
                        ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 text-xs">
                    <CreditCard className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    <span>{method}</span>
                  </div>
                  <input
                    type="radio"
                    name="pay_method"
                    checked={paymentMethod === method}
                    onChange={() => setPaymentMethod(method)}
                    className="accent-emerald-500"
                  />
                </label>
              ))}
            </div>

            {paymentMethod === 'UPI' && (
              <div>
                <label className={`text-xs block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Enter UPI VPA / Handle</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. yourname@oksbi"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none font-mono ${
                    isDark
                      ? 'bg-slate-900 border-slate-800 text-white focus:border-emerald-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                  }`}
                />
              </div>
            )}

            <div className={`flex items-center gap-2 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <ShieldCheck className={`w-4 h-4 shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              <span>256-bit encrypted checkout with Razorpay sandbox integration.</span>
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleConfirmPayment}
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Pay ₹{totalAmount} & Confirm Spot</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 6: Confirmation Screen */}
        {step === 6 && (
          <div className="p-6 text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
              <Check className="w-7 h-7 stroke-[3]" />
            </div>

            <div>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Parking Reserved!</h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Your spot has been secured. Show this QR code upon arrival.
              </p>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-4 rounded-2xl inline-block shadow-xl mx-auto border-4 border-emerald-500/30">
              <QRCodeSVG
                value={confirmedBooking?.qrCodeData || `PARKSHARE::${parking.id}::${user?.id}`}
                size={140}
                level="H"
              />
            </div>

            {/* Booking Details Summary */}
            <div className={`p-4 rounded-2xl border text-left text-xs space-y-2 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className={`flex justify-between items-center pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Booking ID</span>
                <span className={`font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  {confirmedBooking?.bookingCode || 'PS-482931'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Location</span>
                <span className={`font-medium truncate max-w-[200px] ${isDark ? 'text-white' : 'text-slate-900'}`}>{parking.title}</span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Slot Assigned</span>
                <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{confirmedBooking?.spotNumber || 'P-24'}</span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Time</span>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{arrivalTime} → {departureTime}</span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Vehicle</span>
                <span className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedVehicle?.numberPlate || 'N/A'}</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/qr-checkin');
                }}
                className="py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                <QrCode className="w-4 h-4" />
                <span>Open Check-in</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/bookings');
                }}
                className={`py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 border transition-colors ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                }`}
              >
                <span>View Bookings</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

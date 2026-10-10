import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Camera,
  Info,
  CheckCircle,
  DollarSign,
  Calendar,
  Eye,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  ShieldCheck,
  Navigation,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { LeafletMap } from '../components/LeafletMap';
import { ParkingType, VehicleType, Amenity } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PARKING_TYPES: ParkingType[] = ['Covered', 'Basement', 'Garage', 'Driveway', 'Open'];
const VEHICLE_OPTIONS: VehicleType[] = ['Car', 'Bike', 'SUV', 'EV'];
const AMENITY_OPTIONS: Amenity[] = [
  'CCTV',
  'Security',
  'EV charging',
  '24/7 access',
  'Covered',
  'Gated',
  'Well lit',
];

const SAMPLE_PHOTO_PRESETS = [
  'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=800&auto=format&fit=crop&q=80',
];

export const AddParkingSpacePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State
  const [address, setAddress] = useState<string>('18 Park Street, Mullick Bazar');
  const [city, setCity] = useState<string>('Kolkata');
  const [location, setLocation] = useState<{ lat: number; lng: number }>({ lat: 22.5512, lng: 88.3619 });
  const [isResolvingAddress, setIsResolvingAddress] = useState<boolean>(false);
  const [addressAutoDetected, setAddressAutoDetected] = useState<boolean>(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([SAMPLE_PHOTO_PRESETS[0]]);
  const [title, setTitle] = useState<string>('Park Street Executive Gated Driveway');
  const [description, setDescription] = useState<string>(
    'Sheltered private parking bay inside a residential building with manned security gate and CCTV coverage.'
  );
  const [parkingType, setParkingType] = useState<ParkingType>('Covered');
  const [suitableVehicles, setSuitableVehicles] = useState<VehicleType[]>(['Car', 'SUV']);
  const [amenities, setAmenities] = useState<Amenity[]>(['CCTV', 'Security', 'Well lit', 'Gated']);
  const [pricePerHour, setPricePerHour] = useState<number>(50);
  const [totalSpots, setTotalSpots] = useState<number>(2);
  const [operatingHours, setOperatingHours] = useState<{ open: string; close: string }>({
    open: '08:00',
    close: '22:00',
  });
  const [category, setCategory] = useState<any>('Downtown');

  const handleNext = () => setStep((prev) => Math.min(7, prev + 1));
  const handleBack = () => setStep((prev) => Math.max(1, prev - 1));

  // Reverse geocode lat,lng into street address, city, and accurate road/landmark name
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsResolvingAddress(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          const road =
            addr.road ||
            addr.street ||
            addr.pedestrian ||
            addr.footway ||
            addr.residential ||
            addr.highway;
          const landmark =
            data.name ||
            addr.amenity ||
            addr.building ||
            addr.tourism ||
            addr.historic ||
            addr.commercial ||
            addr.neighbourhood ||
            addr.suburb;

          const parts = [
            addr.house_number || addr.building,
            road,
            addr.suburb || addr.neighbourhood,
          ].filter(Boolean);

          const street =
            parts.length > 0
              ? parts.join(', ')
              : data.display_name?.split(',').slice(0, 3).join(',') || `Near ${road || landmark || `${lat.toFixed(4)}, ${lng.toFixed(4)}`}`;
          const detectedCity =
            addr.city ||
            addr.town ||
            addr.municipality ||
            addr.village ||
            addr.state_district ||
            city;

          setAddress(street);
          setCity(detectedCity);
          setAddressAutoDetected(true);

          // Accurate Road or Landmark Parking Name
          let autoTitle = '';
          if (road && landmark && road.toLowerCase() !== landmark.toLowerCase()) {
            autoTitle = `${landmark}, ${road} Bay`;
          } else if (road) {
            autoTitle = `${road} Parking Bay`;
          } else if (landmark) {
            autoTitle = `${landmark} Parking Spot`;
          } else if (data.display_name) {
            const firstPart = data.display_name.split(',')[0]?.trim();
            autoTitle = `${firstPart || detectedCity} Parking Bay`;
          } else {
            autoTitle = `Parking at ${street}`;
          }

          setTitle(autoTitle);
        }
      }
    } catch {
      // Keep existing if fetch fails
    } finally {
      setIsResolvingAddress(false);
    }
  };

  const handleLocationPicked = (lat: number, lng: number) => {
    setLocation({ lat, lng });
    reverseGeocode(lat, lng);
  };

  const handleUseCurrentGPS = () => {
    if ('geolocation' in navigator) {
      setIsResolvingAddress(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setLocation({ lat, lng });
          reverseGeocode(lat, lng);
        },
        () => {
          setIsResolvingAddress(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  // Auto detect live location on mount
  React.useEffect(() => {
    handleUseCurrentGPS();
  }, []);

  const handleToggleVehicle = (v: VehicleType) => {
    setSuitableVehicles((prev) =>
      prev.includes(v) ? prev.filter((item) => item !== v) : [...prev, v]
    );
  };

  const handleToggleAmenity = (a: Amenity) => {
    setAmenities((prev) =>
      prev.includes(a) ? prev.filter((item) => item !== a) : [...prev, a]
    );
  };

  const handleTogglePhoto = (url: string) => {
    setSelectedPhotos((prev) =>
      prev.includes(url) ? (prev.length > 1 ? prev.filter((u) => u !== url) : prev) : [...prev, url]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.createParkingSpace({
        title,
        description,
        address,
        city,
        location,
        parkingType,
        suitableVehicles,
        amenities,
        images: selectedPhotos,
        pricePerHour,
        totalSpots,
        operatingHours,
        category,
      });

      if (res.success) {
        navigate('/owner');
      }
    } catch {
      navigate('/owner');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 min-h-[calc(100vh-80px)] flex flex-col justify-start">
      {/* Compact Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/owner')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-emerald-500/40 text-xs font-semibold transition-all group shadow-sm cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-x-1 transition-transform" />
            <span>Host Overview</span>
          </button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-tight truncate">
              List Your Parking Spot
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block leading-tight mt-0.5">
              Turn unused driveway, bay, or garage into effortless passive income
            </p>
          </div>
        </div>

        {/* Wizard Progress Bar */}
        <div className="w-full sm:w-72 bg-slate-900/70 p-2.5 rounded-2xl border border-slate-800/80 shrink-0 shadow-md">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1.5">
            <span>Step {step} of 7</span>
            <span className="text-emerald-400 font-bold truncate ml-2">
              {step === 1 && '1. Pin Location'}
              {step === 2 && '2. Photos'}
              {step === 3 && '3. Spot Info'}
              {step === 4 && '4. Amenities'}
              {step === 5 && '5. Pricing'}
              {step === 6 && '6. Operating Hours'}
              {step === 7 && '7. Review & Submit'}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${(step / 7) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Wizard Card Container - Full width & expansive, compact on mobile */}
      <div className="flex-1 bg-[#0f172a] border border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 lg:p-8 shadow-2xl flex flex-col justify-between space-y-3.5 sm:space-y-6">
        {/* Step 1: Location on Draggable Map (Spacious Desktop, Compact Mobile) */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 lg:gap-8 items-stretch flex-1">
            {/* Left Column: Form Inputs */}
            <div className="lg:col-span-5 space-y-2.5 sm:space-y-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm sm:text-base lg:text-lg font-bold text-white flex items-center gap-1.5 sm:gap-2">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                    <span>Space Location</span>
                  </h2>

                  <button
                    type="button"
                    onClick={handleUseCurrentGPS}
                    disabled={isResolvingAddress}
                    className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-blue-600/15 border border-blue-500/40 text-blue-400 hover:bg-blue-600/25 text-[11px] sm:text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-colors cursor-pointer shrink-0"
                    title="Fill address with your device GPS"
                  >
                    {isResolvingAddress ? (
                      <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                    ) : (
                      <Navigation className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    )}
                    <span>Current GPS</span>
                  </button>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">
                  Drag pin or click anywhere on the map to set entrance coordinates.
                </p>
              </div>

              {/* Auto-fill feedback indicator */}
              {addressAutoDetected && (
                <div className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] sm:text-xs font-medium flex items-center gap-1.5 sm:gap-2 animate-in fade-in">
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span>Address automatically filled from map pin!</span>
                </div>
              )}

              {/* Auto-detected Parking Name */}
              <div>
                <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                  <label className="text-[11px] sm:text-xs text-slate-300 font-semibold">
                    Parking Name (Road / Landmark)
                  </label>
                  {isResolvingAddress && (
                    <span className="text-[10px] text-blue-400 flex items-center gap-1">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" /> Auto-naming...
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Park Street Executive Driveway"
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl bg-slate-900 border border-slate-800 text-white text-xs sm:text-sm outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-2.5">
                <div>
                  <label className="text-[11px] sm:text-xs text-slate-300 block mb-0.5 sm:mb-1">Street Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setAddressAutoDetected(false);
                    }}
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl bg-slate-900 border border-slate-800 text-white text-xs sm:text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] sm:text-xs text-slate-300 block mb-0.5 sm:mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      setAddressAutoDetected(false);
                    }}
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl bg-slate-900 border border-slate-800 text-white text-xs sm:text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1.5 sm:gap-2 pt-1.5 sm:pt-2 border-t border-slate-800/80">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400" />
                <span>Coordinates: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
              </div>
            </div>

            {/* Right Column: Draggable Map (Compact on Mobile, Spacious on Desktop) */}
            <div className="lg:col-span-7 flex flex-col space-y-1 sm:space-y-2">
              <div className="h-[180px] sm:h-[340px] lg:h-[480px] min-h-[160px] rounded-xl sm:rounded-2xl overflow-hidden border border-slate-700/80 shadow-inner">
                <LeafletMap
                  center={[location.lat, location.lng]}
                  zoom={15}
                  isDraggableMarker={true}
                  onMarkerDragEnd={handleLocationPicked}
                />
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 flex items-center justify-between">
                <span>Tip: Click anywhere on map to reposition pin</span>
                <span className="hidden sm:inline text-emerald-400 font-mono">Live OpenStreetMap Draggable Pin</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Photos */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-400" />
                Add Photos of the Parking Area
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Clear photos of the driveway, lighting, and entry gate build high driver confidence.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {SAMPLE_PHOTO_PRESETS.map((photo, i) => {
                const isSelected = selectedPhotos.includes(photo);
                return (
                  <div
                    key={i}
                    onClick={() => handleTogglePhoto(photo)}
                    className={`relative h-36 sm:h-52 rounded-2xl overflow-hidden border-2 cursor-pointer transition-all ${
                      isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/40' : 'border-slate-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-md">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 text-center">
              Selected {selectedPhotos.length} photo(s). Drivers prefer listings with at least 2 distinct angles.
            </p>
          </div>
        )}

        {/* Step 3: Information */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-purple-400" />
              Spot Title & Category
            </h2>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Listing Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Park Street Executive Gated Driveway"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Parking Structure</label>
                <select
                  value={parkingType}
                  onChange={(e) => setParkingType(e.target.value as ParkingType)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none"
                >
                  {PARKING_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Category Hub</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none"
                >
                  {['Downtown', 'Business District', 'Shopping', 'Airport', 'Railway Station', 'Universities'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-2">Suitable Vehicle Types</label>
              <div className="grid grid-cols-2 sm:flex gap-2">
                {VEHICLE_OPTIONS.map((v) => {
                  const active = suitableVehicles.includes(v);
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleToggleVehicle(v)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                        active
                          ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Amenities */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              Facilities & Features
            </h2>
            <p className="text-xs text-slate-400">
              Highlight security and amenities that drivers value most.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {AMENITY_OPTIONS.map((a) => {
                const active = amenities.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => handleToggleAmenity(a)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs text-left transition-all ${
                      active
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 font-semibold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                        active ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-slate-700'
                      }`}
                    >
                      {active && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span>{a}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 5: Pricing */}
        {step === 5 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Hourly Price & Spot Capacity
            </h2>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Price Per Hour (₹)</label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white">₹</span>
                  <input
                    type="number"
                    min="15"
                    max="300"
                    value={pricePerHour}
                    onChange={(e) => setPricePerHour(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-black text-xl outline-none focus:border-emerald-500"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Recommended rate for this neighborhood: ₹40 — ₹60/hour.
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <label className="text-xs text-slate-300 block mb-1">Total Parking Spots</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={totalSpots}
                  onChange={(e) => setTotalSpots(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-base outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Availability */}
        {step === 6 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Operating Hours
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Open Time</label>
                <input
                  type="time"
                  value={operatingHours.open}
                  onChange={(e) => setOperatingHours({ ...operatingHours, open: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none cursor-pointer"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">Close Time</label>
                <input
                  type="time"
                  value={operatingHours.close}
                  onChange={(e) => setOperatingHours({ ...operatingHours, close: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none cursor-pointer"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
              ✓ Instant automated booking will be enabled during these hours.
            </div>
          </div>
        )}

        {/* Step 7: Preview & Submit */}
        {step === 7 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Preview Your Listing</h2>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="h-44 rounded-xl overflow-hidden">
                <img src={selectedPhotos[0]} alt="" className="w-full h-full object-cover" />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-base text-white">{title}</h3>
                  <span className="text-lg font-extrabold text-emerald-400">₹{pricePerHour}/hr</span>
                </div>
                <p className="text-xs text-slate-400">{address}, {city}</p>
                <p className="text-xs text-slate-300 pt-1">{description}</p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-white text-[11px] font-semibold">
                  {parkingType}
                </span>
                {amenities.map((a, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-slate-800/60 text-slate-300 text-[11px]">
                    {a}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>A verification request will be queued for Admin review automatically.</span>
            </div>
          </div>
        )}

        {/* Navigation Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 7 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm flex items-center gap-2 shadow-xl shadow-emerald-500/30"
            >
              {isSubmitting ? (
                <span>Publishing...</span>
              ) : (
                <>
                  <span>Publish Parking Space</span>
                  <Check className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { ParkingSpace } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Crosshair,
  Plus,
  Minus,
  Navigation,
  Loader2,
  AlertCircle,
  X,
  Maximize2,
  Layers,
  Map as MapIcon,
  Sparkles,
  Compass,
} from 'lucide-react';
import { formatLiveDistance } from '../utils/distance';

const STREET_NAV_DARK_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const STREET_NAV_OPTIONS: L.TileLayerOptions = {
  subdomains: ['a', 'b', 'c'],
  maxZoom: 19,
  className: 'street-nav-dark-tiles',
  attribution: '&copy; OpenStreetMap contributors | Street Navigation (Dark)',
};

interface LeafletMapProps {
  spaces?: ParkingSpace[];
  selectedSpaceId?: string | null;
  hoveredSpaceId?: string | null;
  onSelectSpace?: (space: ParkingSpace) => void;
  onReserveSpace?: (space: ParkingSpace) => void;
  center?: [number, number];
  zoom?: number;
  height?: string;
  isInteractive?: boolean;
  isDraggableMarker?: boolean;
  onMarkerDragEnd?: (lat: number, lng: number) => void;
  showRadius?: boolean;
  autoLocate?: boolean;
  userLocation?: [number, number] | null;
  onLocationChange?: (coords: [number, number] | null) => void;
  onUserLocationFound?: (lat: number, lng: number) => void;
  onMapCenterChange?: (lat: number, lng: number) => void;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  spaces = [],
  selectedSpaceId = null,
  hoveredSpaceId = null,
  onSelectSpace,
  onReserveSpace,
  center = [22.5697, 88.3582],
  zoom = 14,
  height = '100%',
  isInteractive = true,
  isDraggableMarker = false,
  onMarkerDragEnd,
  showRadius = false,
  autoLocate = true,
  userLocation: propUserLocation = null,
  onLocationChange,
  onUserLocationFound,
  onMapCenterChange,
}) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const markersMapRef = useRef<Map<string, { marker: L.Marker; space: ParkingSpace }>>(new Map());
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const dragMarkerRef = useRef<L.Marker | null>(null);
  const hasAutoLocatedRef = useRef<boolean>(false);
  const hasFittedInitialBoundsRef = useRef<boolean>(false);
  const lastCenterRef = useRef<[number, number]>(center);
  const isDraggingMapRef = useRef<boolean>(false);

  // Keep latest callbacks in refs to avoid rebuilding effects
  const onSelectSpaceRef = useRef(onSelectSpace);
  onSelectSpaceRef.current = onSelectSpace;
  const onReserveSpaceRef = useRef(onReserveSpace);
  onReserveSpaceRef.current = onReserveSpace;
  const onUserLocationFoundRef = useRef(onUserLocationFound);
  onUserLocationFoundRef.current = onUserLocationFound;
  const onLocationChangeRef = useRef(onLocationChange);
  onLocationChangeRef.current = onLocationChange;
  const onMapCenterChangeRef = useRef(onMapCenterChange);
  onMapCenterChangeRef.current = onMapCenterChange;

  const [userLocation, setUserLocation] = useState<[number, number] | null>(propUserLocation);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsActive, setGpsActive] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Helper to place/update user's live GPS marker
  const renderUserMarker = useCallback((coords: [number, number], accuracy?: number) => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const userIcon = L.divIcon({
      className: 'user-loc-marker',
      html: `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
          <div class="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-xl ring-4 ring-blue-500/50"></div>
          <div class="absolute w-8 h-8 rounded-full bg-blue-400 opacity-40 animate-ping"></div>
          <div class="absolute -top-7 whitespace-nowrap bg-blue-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full shadow-lg border border-blue-400/40">
            You are here
          </div>
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(coords);
    } else {
      userMarkerRef.current = L.marker(coords, {
        icon: userIcon,
        zIndexOffset: 1000,
      }).addTo(map);

      userMarkerRef.current.bindPopup(
        `<div class="p-2 text-center text-xs">
          <div class="font-bold text-blue-400 mb-0.5">Your Current Location</div>
          <div class="text-slate-400 text-[10px]">Lat: ${coords[0].toFixed(4)}, Lng: ${coords[1].toFixed(4)}</div>
        </div>`,
        { closeButton: false }
      );
    }

    if (accuracy && accuracy < 2000) {
      if (userAccuracyCircleRef.current) {
        userAccuracyCircleRef.current.setLatLng(coords);
        userAccuracyCircleRef.current.setRadius(accuracy);
      } else {
        userAccuracyCircleRef.current = L.circle(coords, {
          radius: accuracy,
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.08,
          weight: 1,
        }).addTo(map);
      }
    }
  }, []);

  // Sync parent userLocation prop if provided
  useEffect(() => {
    if (propUserLocation) {
      setUserLocation(propUserLocation);
      renderUserMarker(propUserLocation);
    }
  }, [propUserLocation, renderUserMarker]);

  // Request Live GPS Location
  const requestLiveLocation = useCallback(
    (flyTo = true) => {
      if (!('geolocation' in navigator)) {
        setLocationError('Geolocation is not supported by your browser.');
        return;
      }

      setIsLocating(true);
      setLocationError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = position.coords.accuracy;
          const coords: [number, number] = [lat, lng];

          setUserLocation(coords);
          setGpsActive(true);
          setIsLocating(false);

          if (onUserLocationFoundRef.current) {
            onUserLocationFoundRef.current(lat, lng);
          }
          if (onLocationChangeRef.current) {
            onLocationChangeRef.current(coords);
          }

          if (isDraggableMarker && dragMarkerRef.current) {
            dragMarkerRef.current.setLatLng(coords);
            if (onMarkerDragEnd) {
              onMarkerDragEnd(lat, lng);
            }
          }

          renderUserMarker(coords, accuracy);

          if (mapInstanceRef.current && flyTo) {
            mapInstanceRef.current.flyTo(coords, Math.max(mapInstanceRef.current.getZoom(), 15), {
              duration: 1.0,
            });
          }
        },
        (error) => {
          setIsLocating(false);
          if (error.code === error.PERMISSION_DENIED) {
            setLocationError('Location permission was denied. You can search by entering an address.');
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            setLocationError('Location is currently unavailable. Please verify device GPS.');
          } else {
            setLocationError('Location request timed out. Please try again.');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        }
      );
    },
    [isDraggableMarker, onMarkerDragEnd, renderUserMarker]
  );

  // Initialize Map Instance ONCE on mount
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    if ((container as any)._leaflet_id && mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
      return;
    }
    if ((container as any)._leaflet_id && !mapInstanceRef.current) {
      delete (container as any)._leaflet_id;
    }

    const map = L.map(container, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: isInteractive,
      dragging: isInteractive,
      touchZoom: isInteractive,
      doubleClickZoom: isInteractive,
      preferCanvas: true,
    });

    mapInstanceRef.current = map;

    // Attach permanent high-contrast Dark Street Navigation tiles
    const tileLayer = L.tileLayer(STREET_NAV_DARK_URL, {
      ...STREET_NAV_OPTIONS,
      crossOrigin: true,
      keepBuffer: 8,
      updateWhenIdle: false,
      updateWhenZooming: true,
    }).addTo(map);

    tileLayer.bringToBack();
    currentTileLayerRef.current = tileLayer;

    // Track user dragging state
    map.on('movestart', () => {
      isDraggingMapRef.current = true;
    });
    map.on('moveend', () => {
      isDraggingMapRef.current = false;
      const c = map.getCenter();
      if (onMapCenterChangeRef.current) {
        onMapCenterChangeRef.current(c.lat, c.lng);
      }
    });

    // Throttled ResizeObserver for zero layout lag
    let resizeFrameId: number | null = null;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeFrameId) cancelAnimationFrame(resizeFrameId);
      resizeFrameId = requestAnimationFrame(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize({ pan: false });
        }
      });
    });
    resizeObserver.observe(container);

    // Initial size invalidation
    const t = setTimeout(() => map.invalidateSize(), 150);

    return () => {
      clearTimeout(t);
      if (resizeFrameId) cancelAnimationFrame(resizeFrameId);
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Run once on mount

  // Auto locate on mount: point to user's live GPS location by default without needing to click the arrow button
  useEffect(() => {
    if (autoLocate && !hasAutoLocatedRef.current) {
      hasAutoLocatedRef.current = true;
      requestLiveLocation(true);
    }
  }, [autoLocate, requestLiveLocation]);

  // Initial bounds fit to show all parking spaces (only if autoLocate is false or no user live GPS requested)
  useEffect(() => {
    if (!autoLocate && !hasFittedInitialBoundsRef.current && spaces.length > 0 && mapInstanceRef.current && !selectedSpaceId) {
      hasFittedInitialBoundsRef.current = true;
      const latLngs: L.LatLngTuple[] = [];
      spaces.forEach((s) => {
        if (s?.location?.lat && s?.location?.lng) {
          latLngs.push([s.location.lat, s.location.lng]);
        }
      });
      if (latLngs.length > 0) {
        const bounds = L.latLngBounds(latLngs);
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    }
  }, [spaces, selectedSpaceId, autoLocate]);

  // Center pan update (only when center coordinates meaningfully change)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !center) return;

    const currentCenter = map.getCenter();
    const dist = Math.hypot(currentCenter.lat - center[0], currentCenter.lng - center[1]);

    if (dist > 0.0002 && !isDraggingMapRef.current) {
      lastCenterRef.current = center;
      map.panTo(center, { animate: true, duration: 0.5 });
    }
  }, [center[0], center[1]]);

  // Radius Circle handling
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (showRadius) {
      if (radiusCircleRef.current) {
        radiusCircleRef.current.setLatLng(center);
      } else {
        radiusCircleRef.current = L.circle(center, {
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.1,
          radius: 1200,
          weight: 1.5,
          dashArray: '4, 8',
        }).addTo(map);
      }
    } else if (radiusCircleRef.current) {
      radiusCircleRef.current.remove();
      radiusCircleRef.current = null;
    }
  }, [center[0], center[1], showRadius]);

  // Draggable marker mode for space listing creation
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isDraggableMarker) return;

    const customPin = L.divIcon({
      className: 'custom-drag-pin',
      html: `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full cursor-grab active:cursor-grabbing">
          <div class="w-10 h-10 rounded-full bg-emerald-500 shadow-xl shadow-emerald-500/50 flex items-center justify-center border-2 border-white ring-4 ring-emerald-500/20">
            <span class="text-white text-xs font-black">P</span>
          </div>
          <div class="absolute -bottom-1.5 w-3 h-3 bg-emerald-500 rotate-45 border-r-2 border-b-2 border-white"></div>
        </div>
      `,
      iconSize: [40, 48],
      iconAnchor: [20, 48],
    });

    const dragMarker = L.marker(center, {
      draggable: true,
      icon: customPin,
    }).addTo(map);

    dragMarkerRef.current = dragMarker;

    dragMarker.on('dragend', () => {
      const pos = dragMarker.getLatLng();
      if (onMarkerDragEnd) {
        onMarkerDragEnd(pos.lat, pos.lng);
      }
    });

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      dragMarker.setLatLng(e.latlng);
      if (onMarkerDragEnd) {
        onMarkerDragEnd(e.latlng.lat, e.latlng.lng);
      }
    };

    map.on('click', handleMapClick);

    return () => {
      dragMarker.remove();
      dragMarkerRef.current = null;
      map.off('click', handleMapClick);
    };
  }, [center[0], center[1], isDraggableMarker, onMarkerDragEnd]);

  // Marker HTML generator
  const createMarkerHtml = useCallback(
    (space: ParkingSpace, isSelected: boolean, isHovered: boolean) => {
      const isAllotted = (space.availableSpots ?? 1) <= 0 || space.status === 'allotted';
      const isAvailable = !isAllotted;

      const pillClass = isDark
        ? isSelected
          ? isAllotted
            ? 'bg-rose-500 text-white font-black border-white ring-4 ring-rose-500/40 shadow-rose-500/50 scale-110 z-50'
            : 'bg-emerald-500 text-slate-950 font-black border-white ring-4 ring-emerald-500/40 shadow-emerald-500/50 scale-110 z-50'
          : isHovered
          ? isAllotted
            ? 'bg-rose-600 text-white font-black border-white ring-2 ring-rose-400/40 scale-105 z-40'
            : 'bg-emerald-400 text-slate-950 font-black border-white ring-2 ring-emerald-400/40 scale-105 z-40'
          : isAllotted
          ? 'bg-[#1a0a0f]/95 backdrop-blur-md text-rose-300 font-bold border-rose-500/60 hover:bg-rose-600 hover:text-white shadow-lg'
          : 'bg-[#0b1220]/95 backdrop-blur-md text-white font-bold border-emerald-500/60 hover:bg-emerald-500 hover:text-slate-950 hover:border-white shadow-lg'
        : isSelected
        ? isAllotted
          ? 'bg-rose-600 text-white font-black border-2 border-white ring-4 ring-rose-500/40 shadow-xl scale-110 z-50'
          : 'bg-emerald-500 text-slate-950 font-black border-2 border-white ring-4 ring-emerald-500/40 shadow-xl scale-110 z-50'
        : isHovered
        ? isAllotted
          ? 'bg-rose-500 text-white font-black border-2 border-white ring-2 ring-rose-400/40 scale-105 z-40'
          : 'bg-emerald-500 text-white font-black border-2 border-white ring-2 ring-emerald-400/40 scale-105 z-40'
        : isAllotted
        ? 'bg-white text-rose-700 font-extrabold border-2 border-rose-400 shadow-md hover:bg-rose-600 hover:text-white hover:border-white'
        : 'bg-white text-slate-900 font-extrabold border-2 border-emerald-500 shadow-md hover:bg-emerald-500 hover:text-white hover:border-white';

      return `
        <div id="marker-pill-${space.id}" class="custom-marker-pill group relative cursor-pointer -translate-x-1/2 -translate-y-1/2 ${
        isSelected ? 'is-selected' : ''
      } ${isHovered ? 'is-hovered' : ''}">
          ${
            isAvailable
              ? `<div class="absolute -inset-1 rounded-full bg-emerald-400/30 marker-pulse pointer-events-none"></div>`
              : ''
          }
          <div class="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-2xl transition-all duration-200 border ${pillClass}">
            <span class="w-2 h-2 rounded-full shrink-0 ${isAvailable ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
            <span class="text-xs font-bold tracking-tight">₹${space.pricePerHour}</span>
            ${
              isAllotted
                ? `<span class="text-[9px] uppercase font-black px-1.5 py-0.2 rounded ${
                    isDark
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }">Full</span>`
                : ''
            }
          </div>
        </div>
      `;
    },
    [isDark]
  );

  // Popup HTML generator
  const createPopupHtml = useCallback((space: ParkingSpace) => {
    const spaceImg =
      Array.isArray(space.images) && space.images.length > 0
        ? space.images[0]
        : 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80';
    const spaceAmenity =
      Array.isArray(space.amenities) && space.amenities.length > 0 ? space.amenities[0] : 'CCTV';
    const isAllotted = (space.availableSpots ?? 1) <= 0 || space.status === 'allotted';
    const liveDist = formatLiveDistance(
      userLocation?.[0],
      userLocation?.[1],
      space.location?.lat,
      space.location?.lng,
      space.distanceMeters
    );

    return `
      <div class="w-72 p-3.5 font-sans ${isDark ? 'text-slate-100' : 'text-slate-800'}">
        <div class="relative h-28 rounded-xl overflow-hidden mb-2.5 ${isDark ? 'bg-slate-900' : 'bg-slate-100'}">
          <img src="${spaceImg}" alt="${space.title || 'Parking space'}" class="w-full h-full object-cover" />
          <div class="absolute top-2 right-2 backdrop-blur-md text-xs font-black px-2.5 py-1 rounded-lg border shadow-lg ${
            isDark
              ? 'bg-slate-950/85 text-emerald-400 border-emerald-500/30'
              : 'bg-white/95 text-emerald-800 border-emerald-500/30 shadow-md'
          }">
            ₹${space.pricePerHour}/hr
          </div>
          ${
            isAllotted
              ? `<div class="absolute bottom-2 left-2 bg-rose-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-md shadow flex items-center gap-1.5 border border-rose-400/40">
                   <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                   ALLOTTED / FULLY BOOKED
                 </div>`
              : `<div class="absolute bottom-2 left-2 bg-emerald-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-md shadow flex items-center gap-1.5">
                   <span class="w-1.5 h-1.5 rounded-full bg-slate-950"></span>
                   ${space.availableSpots ?? 1} SPOTS AVAILABLE
                 </div>`
          }
        </div>
        <div class="text-xs font-bold truncate mb-1 leading-snug ${isDark ? 'text-white' : 'text-slate-900'}">${space.title}</div>
        
        <div class="flex items-center justify-between text-[11px] mb-2">
          <div class="flex items-center gap-1 font-semibold truncate ${isDark ? 'text-emerald-400' : 'text-emerald-700'}">
            <span>👤 Host: ${space.ownerName || 'Verified Owner'}</span>
          </div>
          <span class="flex items-center gap-1 shrink-0 ${isDark ? 'text-slate-300' : 'text-slate-600'}">⭐ <span class="font-bold ${isDark ? 'text-white' : 'text-slate-900'}">${space.rating ? Number(space.rating).toFixed(1) : '5.0'}</span> (${space.reviewCount || 0})</span>
        </div>

        <div class="flex items-center justify-between text-[11px] mb-2 truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}">
          <span class="truncate">📍 ${space.address}</span>
          <span class="font-bold shrink-0 ml-1.5 flex items-center gap-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}">🚀 ${liveDist}</span>
        </div>

        <div class="flex items-center gap-1.5 mb-3 text-[10px] flex-wrap ${isDark ? 'text-slate-400' : 'text-slate-600'}">
          <span class="px-2 py-0.5 rounded-md border font-semibold ${isDark ? 'bg-slate-800/90 text-slate-300 border-slate-700/60' : 'bg-slate-100 text-slate-700 border-slate-200'}">${space.parkingType || 'Covered'}</span>
          <span class="px-2 py-0.5 rounded-md border font-semibold ${isDark ? 'bg-slate-800/90 text-slate-300 border-slate-700/60' : 'bg-slate-100 text-slate-700 border-slate-200'}">${spaceAmenity}</span>
          ${
            isAllotted
              ? `<span class="px-2 py-0.5 rounded-md border font-semibold ${isDark ? 'bg-rose-950/80 text-rose-300 border-rose-500/40' : 'bg-rose-50 text-rose-700 border-rose-200'}">Allotted by Host</span>`
              : `<span class="px-2 py-0.5 rounded-md border font-semibold ${isDark ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}">Instant Book</span>`
          }
        </div>

        ${
          isAllotted
            ? `<div class="w-full py-2 text-xs font-bold rounded-xl border text-center mb-2 flex items-center justify-center gap-1.5 cursor-not-allowed ${
                isDark
                  ? 'bg-slate-800/80 text-rose-300 border-rose-500/30'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }">
                 <span>🔒 Allotted by Owner (Occupied)</span>
               </div>`
            : `<button
                 type="button"
                 id="map-popup-reserve-${space.id}"
                 class="w-full py-2 ${
                   isDark
                     ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
                     : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
                 } text-xs font-black rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer mb-2"
               >
                 <span>Reserve Now</span>
                 <span>→</span>
               </button>`
        }

        <button
          type="button"
          id="map-popup-detail-${space.id}"
          class="block text-center w-full text-[11px] font-bold transition-colors cursor-pointer py-1 ${
            isDark ? 'text-slate-400 hover:text-emerald-400' : 'text-emerald-700 hover:text-emerald-900 underline underline-offset-2'
          }"
        >
          View Full Details & Photos
        </button>
      </div>
    `;
  }, [userLocation, isDark]);

  // DIFFERENTIAL MARKER SYNC (Zero full teardown on render)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentMap = markersMapRef.current;
    const newSpacesMap = new Map<string, ParkingSpace>();

    spaces.forEach((space) => {
      if (
        space?.location &&
        typeof space.location.lat === 'number' &&
        typeof space.location.lng === 'number' &&
        !isNaN(space.location.lat) &&
        !isNaN(space.location.lng)
      ) {
        newSpacesMap.set(space.id, space);
      }
    });

    // 1. Remove markers no longer present
    currentMap.forEach(({ marker }, id) => {
      if (!newSpacesMap.has(id)) {
        marker.remove();
        currentMap.delete(id);
      }
    });

    // 2. Add or update markers
    newSpacesMap.forEach((space, id) => {
      const existing = currentMap.get(id);
      const isSelected = selectedSpaceId === id;
      const isHovered = hoveredSpaceId === id;

      if (!existing) {
        // Create new marker
        const icon = L.divIcon({
          className: 'ps-price-pin',
          html: createMarkerHtml(space, isSelected, isHovered),
          iconSize: [64, 32],
          iconAnchor: [32, 16],
        });

        const marker = L.marker([space.location.lat, space.location.lng], { icon }).addTo(map);

        const popupHtml = createPopupHtml(space);
        marker.bindPopup(popupHtml, { closeButton: false, offset: [0, -10] });

        marker.on('click', () => {
          if (onSelectSpaceRef.current) {
            onSelectSpaceRef.current(space);
          }
        });

        marker.on('popupopen', () => {
          const currentSpace = markersMapRef.current.get(id)?.space || space;
          const reserveBtn = document.getElementById(`map-popup-reserve-${space.id}`);
          if (reserveBtn) {
            reserveBtn.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!user) {
                navigate('/login');
                return;
              }
              if (onReserveSpaceRef.current) {
                onReserveSpaceRef.current(currentSpace);
              } else {
                navigate(`/parking/${space.id}?book=true`);
              }
            };
          }

          const detailBtn = document.getElementById(`map-popup-detail-${space.id}`);
          if (detailBtn) {
            detailBtn.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/parking/${space.id}`);
            };
          }
        });

        currentMap.set(id, { marker, space });
      } else {
        // Marker exists - check if location changed
        const pos = existing.marker.getLatLng();
        if (pos.lat !== space.location.lat || pos.lng !== space.location.lng) {
          existing.marker.setLatLng([space.location.lat, space.location.lng]);
        }
        existing.space = space;

        // Dynamically update existing marker icon & popup HTML to reflect live status/availability
        const isSelected = selectedSpaceId === id;
        const isHovered = hoveredSpaceId === id;
        existing.marker.setIcon(
          L.divIcon({
            className: 'ps-price-pin',
            html: createMarkerHtml(space, isSelected, isHovered),
            iconSize: [64, 32],
            iconAnchor: [32, 16],
          })
        );
        existing.marker.setPopupContent(createPopupHtml(space));
      }
    });
  }, [spaces, createMarkerHtml, createPopupHtml, navigate, user, selectedSpaceId, hoveredSpaceId, isDark]);

  // LIGHTWEIGHT SELECTION & HOVER UPDATE (Direct icon update, zero marker recreation)
  useEffect(() => {
    markersMapRef.current.forEach(({ marker, space }, id) => {
      const isSelected = selectedSpaceId === id;
      const isHovered = hoveredSpaceId === id;

      marker.setIcon(
        L.divIcon({
          className: 'ps-price-pin',
          html: createMarkerHtml(space, isSelected, isHovered),
          iconSize: [64, 32],
          iconAnchor: [32, 16],
        })
      );

      if (isSelected) {
        marker.setZIndexOffset(1000);
      } else if (isHovered) {
        marker.setZIndexOffset(900);
      } else {
        marker.setZIndexOffset(0);
      }
    });
  }, [selectedSpaceId, hoveredSpaceId, createMarkerHtml, isDark]);

  // Smooth fit to all parking markers
  const handleFitAllMarkers = () => {
    if (!mapInstanceRef.current || spaces.length === 0) return;
    const latLngs: L.LatLngTuple[] = [];

    spaces.forEach((s) => {
      if (s?.location?.lat && s?.location?.lng) {
        latLngs.push([s.location.lat, s.location.lng]);
      }
    });

    if (userLocation) {
      const distKm = Math.hypot(userLocation[0] - 22.57, userLocation[1] - 88.36) * 111;
      if (distKm < 40) {
        latLngs.push(userLocation);
      }
    }

    if (latLngs.length > 0) {
      const bounds = L.latLngBounds(latLngs);
      mapInstanceRef.current.flyToBounds(bounds, { padding: [60, 60], duration: 1.0 });
    }
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleRecenter = () => {
    if (userLocation) {
      mapInstanceRef.current?.flyTo(userLocation, 15, { duration: 1.0 });
    } else {
      mapInstanceRef.current?.flyTo(center, zoom, { duration: 1.0 });
    }
  };

  return (
    <div
      className={`relative w-full h-full overflow-hidden rounded-2xl border transition-colors ${
        isDark ? 'border-slate-800/90 bg-[#0b0f17] shadow-2xl' : 'border-slate-200 bg-slate-100 shadow-md'
      }`}
      style={{ height }}
    >
      <div ref={mapContainerRef} className="w-full h-full z-0 outline-none" />

      {/* Location Error Toast */}
      {locationError && (
        <div className={`absolute top-4 left-4 right-16 z-30 backdrop-blur-md text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 ${
          isDark
            ? 'bg-rose-950/90 border border-rose-500/40 text-rose-200'
            : 'bg-rose-50 border border-rose-300 text-rose-800 shadow-md'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle className={`w-4 h-4 shrink-0 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
            <span className="leading-tight font-medium">{locationError}</span>
          </div>
          <button
            type="button"
            onClick={() => setLocationError(null)}
            className={`p-1 rounded-md transition-colors ${
              isDark ? 'hover:bg-rose-900/60 text-rose-400 hover:text-rose-200' : 'hover:bg-rose-100 text-rose-600 hover:text-rose-900'
            }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Modern Map Controls (Right Side) */}
      {isInteractive && (
        <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2.5">
          {/* Zoom Buttons */}
          <div className={`rounded-xl border shadow-xl overflow-hidden flex flex-col ${
            isDark ? 'bg-[#0d131f]/90 border-slate-700/80 backdrop-blur-md' : 'bg-white/95 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={handleZoomIn}
              className={`p-2.5 transition-colors border-b cursor-pointer ${
                isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800/80 border-slate-700/60' : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 border-slate-200'
              }`}
              title="Zoom In"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className={`p-2.5 transition-colors cursor-pointer ${
                isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800/80' : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
              }`}
              title="Zoom Out"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          {/* Fit All Spots Button */}
          {spaces.length > 0 && (
            <button
              type="button"
              onClick={handleFitAllMarkers}
              className={`p-2.5 rounded-xl border shadow-xl transition-all cursor-pointer group relative ${
                isDark
                  ? 'bg-[#0d131f]/90 backdrop-blur-md border-slate-700/80 text-slate-300 hover:text-emerald-400 hover:bg-slate-800/80'
                  : 'bg-white/95 border-slate-200 text-slate-700 hover:text-emerald-600 hover:bg-slate-50'
              }`}
              title="Fit All Spots in View"
            >
              <Maximize2 className="w-4 h-4" />
              <span className={`absolute right-full mr-2.5 px-2.5 py-1 text-[11px] font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border ${
                isDark ? 'bg-slate-950/95 text-white border-slate-800' : 'bg-white text-slate-900 border-slate-200 shadow-md'
              }`}>
                Fit All Spots
              </span>
            </button>
          )}

          {/* Dedicated Live GPS Location Button */}
          <button
            type="button"
            onClick={() => requestLiveLocation(true)}
            disabled={isLocating}
            className={`p-2.5 rounded-xl border shadow-xl transition-all flex items-center justify-center relative group cursor-pointer ${
              gpsActive
                ? 'bg-blue-600/90 border-blue-400 text-white ring-2 ring-blue-500/40 shadow-blue-500/20'
                : isDark
                ? 'bg-[#0d131f]/90 backdrop-blur-md border-slate-700/80 text-blue-400 hover:text-blue-300 hover:bg-slate-800/80'
                : 'bg-white/95 border-slate-200 text-blue-600 hover:text-blue-700 hover:bg-slate-50'
            }`}
            title="Locate My GPS Position"
          >
            {isLocating ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            ) : (
              <Navigation className={`w-4 h-4 ${gpsActive ? 'fill-white' : ''}`} />
            )}
            <span className={`absolute right-full mr-2.5 px-2.5 py-1 text-[11px] font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border ${
              isDark ? 'bg-slate-950/95 text-white border-slate-800' : 'bg-white text-slate-900 border-slate-200 shadow-md'
            }`}>
              {isLocating ? 'Acquiring Live GPS...' : gpsActive ? 'Recenter to GPS' : 'Locate My Position'}
            </span>
          </button>

          {/* Recenter Area */}
          <button
            type="button"
            onClick={handleRecenter}
            className={`p-2.5 rounded-xl border shadow-xl transition-colors cursor-pointer group relative ${
              isDark
                ? 'bg-[#0d131f]/90 backdrop-blur-md border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800/80'
                : 'bg-white/95 border-slate-200 text-slate-700 hover:text-slate-950 hover:bg-slate-50'
            }`}
            title="Recenter Map View"
          >
            <Crosshair className="w-4 h-4" />
            <span className={`absolute right-full mr-2.5 px-2.5 py-1 text-[11px] font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border ${
              isDark ? 'bg-slate-950/95 text-white border-slate-800' : 'bg-white text-slate-900 border-slate-200 shadow-md'
            }`}>
              Recenter Map
            </span>
          </button>
        </div>
      )}

      {/* Map Legend & Density Indicator (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-auto">
        <div className={`rounded-xl border px-3.5 py-2 shadow-2xl flex items-center gap-3.5 text-[11px] ${
          isDark
            ? 'bg-[#0b101b]/95 backdrop-blur-md border-slate-800/90 text-slate-300'
            : 'bg-white/95 border-slate-200 text-slate-800 shadow-md'
        }`}>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-400/30"></span>
            <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Available</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/30"></span>
            <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Full</span>
          </div>

          <button
            type="button"
            onClick={() => requestLiveLocation(true)}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              isDark ? 'hover:text-white' : 'hover:text-slate-900'
            }`}
            title="Click to jump to your live GPS location"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                gpsActive ? 'bg-blue-500 ring-2 ring-blue-500/50 animate-pulse' : 'bg-slate-400'
              }`}
            ></span>
            <span className={gpsActive ? 'text-blue-500 font-bold' : isDark ? 'text-slate-400' : 'text-slate-600'}>You</span>
          </button>

          <div className={`hidden sm:flex items-center gap-1 border-l pl-3 ${
            isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
          }`}>
            <Sparkles className="w-3 h-3 text-emerald-500" />
            <span className={`text-[10px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{spaces.length} spots rendered</span>
          </div>
        </div>
      </div>
    </div>
  );
};

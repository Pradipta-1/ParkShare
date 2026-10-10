import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbStore } from '../store/dbStore.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { ParkingSpace, Amenity, VehicleType, ParkingType } from '../models/types.js';

export const getParkingList = (req: Request, res: Response): void => {
  const {
    q,
    type,
    vehicle,
    minPrice,
    maxPrice,
    distance,
    amenities,
    verifiedOnly,
    instantOnly,
    category,
    ownerId,
  } = req.query;

  // Reconcile space allotments with live booking states
  for (const space of dbStore.parkingSpaces) {
    const activeBookings = dbStore.bookings.filter(
      (b) => b.parkingId === space.id && (b.bookingStatus === 'active' || b.bookingStatus === 'confirmed')
    );
    const occupied = activeBookings.length;
    const total = space.totalSpots || 1;
    space.availableSpots = Math.max(0, total - occupied);
    space.occupancyPercent = Math.min(100, Math.round((occupied / total) * 100));
    if (space.availableSpots > 0 && space.status === 'allotted') {
      space.status = 'active';
    } else if (space.availableSpots === 0 && space.status === 'active') {
      space.status = 'allotted';
    }
  }

  let results = [...dbStore.parkingSpaces];

  // If filtered by owner
  if (ownerId) {
    results = results.filter((p) => p.ownerId === ownerId);
    res.json({ success: true, count: results.length, data: results });
    return;
  }

  // Include all valid listings (active, allotted, or host-managed) - only exclude rejected
  const statusFilter = req.query.status as string | undefined;
  if (statusFilter && statusFilter !== 'All') {
    if (statusFilter === 'available') {
      results = results.filter((p) => p.status === 'active' && (p.availableSpots ?? 1) > 0);
    } else if (statusFilter === 'allotted') {
      results = results.filter((p) => p.status === 'allotted' || (p.availableSpots ?? 1) <= 0);
    } else {
      results = results.filter((p) => p.status === statusFilter);
    }
  } else {
    results = results.filter((p) => p.status !== 'rejected');
  }

  // Text search query
  if (q && typeof q === 'string' && q.trim().length > 0) {
    const term = q.toLowerCase().trim();
    results = results.filter(
      (p) =>
        (p.title && p.title.toLowerCase().includes(term)) ||
        (p.address && p.address.toLowerCase().includes(term)) ||
        (p.city && p.city.toLowerCase().includes(term)) ||
        (p.category && p.category.toLowerCase().includes(term)) ||
        (p.parkingType && p.parkingType.toLowerCase().includes(term))
    );
  }

  // Category
  if (category && typeof category === 'string' && category !== 'All') {
    results = results.filter((p) => p.category?.toLowerCase() === category.toLowerCase());
  }

  // Parking type
  if (type && typeof type === 'string' && type !== 'All') {
    results = results.filter((p) => p.parkingType.toLowerCase() === type.toLowerCase());
  }

  // Vehicle type
  if (vehicle && typeof vehicle === 'string' && vehicle !== 'All') {
    results = results.filter((p) => p.suitableVehicles.includes(vehicle as VehicleType));
  }

  // Price range
  if (minPrice) {
    results = results.filter((p) => p.pricePerHour >= Number(minPrice));
  }
  if (maxPrice) {
    results = results.filter((p) => p.pricePerHour <= Number(maxPrice));
  }

  // Distance filter (e.g. 500, 1000, 3000, 5000 in meters)
  if (distance) {
    const distNum = Number(distance);
    results = results.filter((p) => (p.distanceMeters || 1000) <= distNum);
  }

  // Amenities
  if (amenities) {
    const amenityList = (typeof amenities === 'string' ? amenities.split(',') : (amenities as string[])).map((a) =>
      a.trim().toLowerCase()
    );
    results = results.filter((p) =>
      amenityList.every((reqA) => p.amenities.some((a) => a.toLowerCase() === reqA))
    );
  }

  // Verified only
  if (verifiedOnly === 'true') {
    results = results.filter((p) => p.isVerified);
  }

  // Instant booking only
  if (instantOnly === 'true') {
    results = results.filter((p) => p.isInstantBooking);
  }

  res.json({
    success: true,
    count: results.length,
    data: results,
  });
};

export const getParkingById = (req: Request, res: Response): void => {
  const { id } = req.params;
  const parking = dbStore.parkingSpaces.find((p) => p.id === id);

  if (!parking) {
    res.status(404).json({ success: false, message: 'Parking space not found' });
    return;
  }

  res.json({
    success: true,
    data: parking,
  });
};

export const createParkingSpace = (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user || dbStore.users.find((u) => u.role === 'owner') || dbStore.users[0];
  if (!user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const {
    title,
    description,
    address,
    city = 'Kolkata',
    location,
    pricePerHour,
    parkingType = 'Covered',
    suitableVehicles = ['Car'],
    amenities = ['CCTV', 'Security'],
    images = [],
    totalSpots = 1,
    operatingHours = { open: '00:00', close: '23:59' },
    isInstantBooking = true,
    category = 'Downtown',
  } = req.body;

  if (!title || !address || !pricePerHour) {
    res.status(400).json({ success: false, message: 'Title, address and hourly price are required' });
    return;
  }

  const defaultImages = [
    'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=80',
  ];

  const locLat = location && typeof location.lat === 'number' && !isNaN(location.lat) ? location.lat : 22.5726;
  const locLng = location && typeof location.lng === 'number' && !isNaN(location.lng) ? location.lng : 88.3639;

  const newSpace: ParkingSpace = {
    id: `park_${uuidv4().substring(0, 8)}`,
    ownerId: user.id,
    ownerName: user.name,
    ownerAvatar: user.avatar,
    ownerResponseRate: '98% within 10 min',
    title,
    description: description || 'Secure, clean and convenient private parking space listed on ParkShare.',
    address,
    city,
    location: { lat: locLat, lng: locLng },
    pricePerHour: Number(pricePerHour) || 50,
    parkingType: (parkingType as ParkingType) || 'Covered',
    suitableVehicles: Array.isArray(suitableVehicles) && suitableVehicles.length > 0 ? (suitableVehicles as VehicleType[]) : ['Car', 'SUV'],
    amenities: Array.isArray(amenities) && amenities.length > 0 ? (amenities as Amenity[]) : ['CCTV', 'Security', 'Well lit'],
    images: Array.isArray(images) && images.length > 0 ? images : defaultImages,
    status: 'active',
    isVerified: false,
    isInstantBooking: Boolean(isInstantBooking),
    totalSpots: Number(totalSpots) || 1,
    availableSpots: Number(totalSpots) || 1,
    occupancyPercent: 0,
    operatingHours: operatingHours || { open: '08:00', close: '22:00' },
    blockedDates: [],
    pricingCalendar: [{ date: new Date().toISOString().split('T')[0], price: Number(pricePerHour) || 50 }],
    rating: 5.0,
    reviewCount: 0,
    distanceMeters: Math.floor(Math.random() * 800) + 200,
    category: category || 'Downtown',
    createdAt: new Date().toISOString(),
  };

  dbStore.saveParkingSpace(newSpace);

  // Add verification request to queue
  dbStore.verificationRequests.unshift({
    id: `vr_${uuidv4().substring(0, 8)}`,
    listingId: newSpace.id,
    ownerName: user.name,
    title: newSpace.title,
    location: newSpace.address,
    pricePerHour: newSpace.pricePerHour,
    documents: { identity: true, ownershipProof: true, photos: true },
    status: 'pending',
    submittedAt: new Date().toISOString(),
  });

  res.status(201).json({
    success: true,
    message: 'Parking space listed successfully',
    data: newSpace,
  });
};

export const updateParkingSpace = (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const parking = dbStore.parkingSpaces.find((p) => p.id === id);

  if (!parking) {
    res.status(404).json({ success: false, message: 'Parking space not found' });
    return;
  }

  // Update fields
  Object.assign(parking, req.body);
  dbStore.saveParkingSpace(parking);

  res.json({
    success: true,
    message: 'Parking space updated successfully',
    data: parking,
  });
};

export const deleteParkingSpace = (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const index = dbStore.parkingSpaces.findIndex((p) => p.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'Parking space not found' });
    return;
  }

  dbStore.deleteParkingSpace(id);
  res.json({
    success: true,
    message: 'Parking space deleted',
  });
};

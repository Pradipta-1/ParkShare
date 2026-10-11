import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbStore } from '../store/dbStore.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { Review, ParkingSpace } from '../models/types.js';
import { ReviewModel, ParkingSpaceModel } from '../models/mongooseModels.js';

export const getReviewsByParkingId = async (req: Request, res: Response): Promise<void> => {
  const { parkingId } = req.params;

  if (dbStore.isMongoConnected) {
    await dbStore.syncCollection('reviews');
    await dbStore.syncCollection('parkingSpaces');
  }

  const parking = dbStore.parkingSpaces.find(
    (p) =>
      p.id === parkingId ||
      p.id?.toLowerCase() === parkingId?.toLowerCase() ||
      (p.title && p.title.toLowerCase() === parkingId?.toLowerCase())
  );

  const reviews = dbStore.reviews.filter(
    (r) =>
      r.parkingId === parkingId ||
      r.parkingId?.toLowerCase() === parkingId?.toLowerCase() ||
      (parking && (
        r.parkingId === parking.id ||
        r.parkingId?.toLowerCase() === parking.id.toLowerCase() ||
        (parking.title && r.parkingId?.toLowerCase() === parking.title.toLowerCase())
      ))
  );

  // Calculate rating stats
  const total = reviews.length;
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;

  reviews.forEach((r) => {
    sum += r.rating;
    const rounded = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    counts[rounded] = (counts[rounded] || 0) + 1;
  });

  const avg = total > 0 ? Number((sum / total).toFixed(1)) : (parking?.rating || 5.0);

  const breakdown = [
    { stars: 5, percentage: total > 0 ? Math.round((counts[5] / total) * 100) : 82, count: counts[5] },
    { stars: 4, percentage: total > 0 ? Math.round((counts[4] / total) * 100) : 12, count: counts[4] },
    { stars: 3, percentage: total > 0 ? Math.round((counts[3] / total) * 100) : 4, count: counts[3] },
    { stars: 2, percentage: total > 0 ? Math.round((counts[2] / total) * 100) : 1, count: counts[2] },
    { stars: 1, percentage: total > 0 ? Math.round((counts[1] / total) * 100) : 1, count: counts[1] },
  ];

  res.json({
    success: true,
    data: reviews,
    stats: {
      averageRating: avg,
      totalReviews: total,
      breakdown,
    },
  });
};

export const addReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const { parkingId, rating, comment } = req.body;
  if (!parkingId || rating === undefined || rating === null) {
    res.status(400).json({ success: false, message: 'Parking ID and rating are required' });
    return;
  }

  if (dbStore.isMongoConnected) {
    await dbStore.syncCollection('reviews');
    await dbStore.syncCollection('parkingSpaces');
    await dbStore.syncCollection('bookings');
  }

  const numericRating = Math.min(5, Math.max(1, Number(rating)));

  // Look up matching parking space
  let parking = dbStore.parkingSpaces.find(
    (p) =>
      p.id === parkingId ||
      p.id?.toLowerCase() === parkingId?.toLowerCase() ||
      (p.title && p.title.toLowerCase() === parkingId?.toLowerCase())
  );

  // If parking not directly in dbStore.parkingSpaces, check if matching booking exists
  if (!parking) {
    const matchingBooking = dbStore.bookings.find(
      (b) => b.parkingId === parkingId || b.parkingTitle?.toLowerCase() === parkingId?.toLowerCase()
    );
    if (matchingBooking) {
      const createdSpace: ParkingSpace = {
        id: matchingBooking.parkingId,
        ownerId: matchingBooking.ownerId || 'usr_owner_1',
        ownerName: (matchingBooking as any).ownerName || 'Vikramaditya Roy',
        title: matchingBooking.parkingTitle,
        description: 'Verified residential & commercial parking bay',
        address: matchingBooking.parkingAddress,
        city: 'Kolkata',
        location: matchingBooking.parkingLocation || { lat: 22.5512, lng: 88.3619 },
        pricePerHour: matchingBooking.pricePerHour || 50,
        parkingType: 'Covered',
        suitableVehicles: ['Car', 'SUV', 'EV'],
        amenities: ['CCTV', 'Security'],
        images: [
          matchingBooking.parkingImage ||
            'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80',
        ],
        status: 'active',
        isVerified: true,
        isInstantBooking: true,
        totalSpots: 4,
        availableSpots: 3,
        occupancyPercent: 25,
        operatingHours: { open: '06:00 AM', close: '11:00 PM' },
        blockedDates: [],
        pricingCalendar: [],
        rating: numericRating,
        reviewCount: 1,
        createdAt: new Date().toISOString(),
      };
      dbStore.saveParkingSpace(createdSpace);
      parking = createdSpace;
    }
  }

  const targetSpaceId = parking ? parking.id : parkingId;

  const existingIndex = dbStore.reviews.findIndex(
    (r) =>
      (r.parkingId === targetSpaceId ||
        r.parkingId === parkingId ||
        r.parkingId?.toLowerCase() === targetSpaceId.toLowerCase() ||
        (parking && (
          r.parkingId === parking.id ||
          r.parkingId?.toLowerCase() === parking.id.toLowerCase() ||
          (parking.title && r.parkingId?.toLowerCase() === parking.title.toLowerCase())
        ))) &&
      (r.userId === user.id || (r.userName && r.userName.toLowerCase() === user.name.toLowerCase()))
  );

  let newReview: Review;
  if (existingIndex !== -1) {
    dbStore.reviews[existingIndex].rating = numericRating;
    if (comment) dbStore.reviews[existingIndex].comment = comment;
    dbStore.reviews[existingIndex].date = 'Just now';
    newReview = dbStore.reviews[existingIndex];
  } else {
    newReview = {
      id: `rev_${uuidv4().substring(0, 8)}`,
      parkingId: targetSpaceId,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      rating: numericRating,
      comment: comment || `Rated ${numericRating} out of 5 stars`,
      date: 'Just now',
      createdAt: new Date().toISOString(),
    };
  }

  dbStore.saveReview(newReview);
  if (dbStore.isMongoConnected) {
    await ReviewModel.findOneAndUpdate({ id: newReview.id }, newReview, { upsert: true }).catch((e) =>
      console.error('Mongo saveReview error in addReview:', e.message)
    );
  }

  // Update parking average rating and review count
  let updatedParking: any = null;
  if (parking) {
    const all = dbStore.reviews.filter(
      (r) =>
        r.parkingId === parking!.id ||
        r.parkingId?.toLowerCase() === parking!.id.toLowerCase() ||
        (parking!.title && r.parkingId?.toLowerCase() === parking!.title.toLowerCase()) ||
        r.parkingId === parkingId ||
        r.parkingId?.toLowerCase() === parkingId.toLowerCase()
    );
    parking.reviewCount = all.length;
    const sum = all.reduce((acc, curr) => acc + curr.rating, 0);
    parking.rating = Number((sum / all.length).toFixed(1));
    dbStore.saveParkingSpace(parking);

    if (dbStore.isMongoConnected) {
      await ParkingSpaceModel.findOneAndUpdate(
        { id: parking.id },
        { rating: parking.rating, reviewCount: parking.reviewCount },
        { new: true }
      ).catch((e) => console.error('Mongo update parking rating error:', e.message));
    }
    updatedParking = parking;
  }

  res.status(201).json({
    success: true,
    message: 'Rating and review submitted successfully',
    data: newReview,
    parking: updatedParking,
  });
};

export const respondToReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { responseText } = req.body;

  if (dbStore.isMongoConnected) {
    await dbStore.syncCollection('reviews');
  }

  const review = dbStore.reviews.find((r) => r.id === id);
  if (!review) {
    res.status(404).json({ success: false, message: 'Review not found' });
    return;
  }

  review.ownerResponse = responseText;
  dbStore.saveReview(review);
  if (dbStore.isMongoConnected) {
    await ReviewModel.findOneAndUpdate({ id: review.id }, { ownerResponse: responseText }).catch((e) =>
      console.error('Mongo update review response error:', e.message)
    );
  }

  res.json({
    success: true,
    message: 'Response added to review',
    data: review,
  });
};

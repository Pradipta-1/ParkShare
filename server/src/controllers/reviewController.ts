import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbStore } from '../store/dbStore.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { Review } from '../models/types.js';

export const getReviewsByParkingId = (req: Request, res: Response): void => {
  const { parkingId } = req.params;
  const reviews = dbStore.reviews.filter((r) => r.parkingId === parkingId);

  // Calculate rating stats
  const total = reviews.length;
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;

  reviews.forEach((r) => {
    sum += r.rating;
    const rounded = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    counts[rounded] = (counts[rounded] || 0) + 1;
  });

  const avg = total > 0 ? Number((sum / total).toFixed(1)) : 5.0;

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

export const addReview = (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const { parkingId, rating, comment } = req.body;
  if (!parkingId || !rating || !comment) {
    res.status(400).json({ success: false, message: 'Parking ID, rating and comment are required' });
    return;
  }

  const newReview: Review = {
    id: `rev_${uuidv4().substring(0, 8)}`,
    parkingId,
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar,
    rating: Number(rating),
    comment,
    date: 'Just now',
    createdAt: new Date().toISOString(),
  };

  dbStore.reviews.unshift(newReview);

  // Update parking average rating
  const parking = dbStore.parkingSpaces.find((p) => p.id === parkingId);
  if (parking) {
    parking.reviewCount = (parking.reviewCount || 0) + 1;
    const all = dbStore.reviews.filter((r) => r.parkingId === parkingId);
    const sum = all.reduce((acc, curr) => acc + curr.rating, 0);
    parking.rating = Number((sum / all.length).toFixed(1));
  }

  res.status(201).json({
    success: true,
    message: 'Review posted successfully',
    data: newReview,
  });
};

export const respondToReview = (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const { responseText } = req.body;

  const review = dbStore.reviews.find((r) => r.id === id);
  if (!review) {
    res.status(404).json({ success: false, message: 'Review not found' });
    return;
  }

  review.ownerResponse = responseText;
  res.json({
    success: true,
    message: 'Response added to review',
    data: review,
  });
};

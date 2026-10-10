import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbStore } from '../store/dbStore.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export const getFavorites = (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const userFavs = dbStore.favorites.filter((f) => f.userId === user.id);
  const parkingList = userFavs
    .map((fav) => dbStore.parkingSpaces.find((p) => p.id === fav.parkingId))
    .filter(Boolean);

  res.json({
    success: true,
    count: parkingList.length,
    data: parkingList,
    favoriteIds: userFavs.map((f) => f.parkingId),
  });
};

export const toggleFavorite = (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const { parkingId } = req.body;
  if (!parkingId) {
    res.status(400).json({ success: false, message: 'Parking ID required' });
    return;
  }

  const existingIndex = dbStore.favorites.findIndex((f) => f.userId === user.id && f.parkingId === parkingId);

  if (existingIndex > -1) {
    dbStore.deleteFavorite(user.id, parkingId);
    res.json({ success: true, isFavorited: false, message: 'Removed from favorites' });
  } else {
    const now = new Date().toISOString();
    const newFav = {
      id: `fav_${uuidv4().substring(0, 8)}`,
      userId: user.id,
      parkingId,
      savedAt: now,
      createdAt: now,
    };
    dbStore.saveFavorite(newFav);
    res.json({ success: true, isFavorited: true, message: 'Saved to favorites', data: newFav });
  }
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { ParkingSpace } from '../types';

interface FavoritesContextType {
  favoriteIds: string[];
  favoriteSpaces: ParkingSpace[];
  isFavorite: (parkingId: string) => boolean;
  toggleFavorite: (parking: ParkingSpace) => Promise<void>;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [favoriteSpaces, setFavoriteSpaces] = useState<ParkingSpace[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchFavorites = async () => {
    try {
      setIsLoading(true);
      const res = await api.getFavorites();
      if (res.success) {
        setFavoriteSpaces(res.data);
        setFavoriteIds(res.favoriteIds || res.data.map((p) => p.id));
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const isFavorite = (parkingId: string) => {
    return favoriteIds.includes(parkingId);
  };

  const toggleFavorite = async (parking: ParkingSpace) => {
    const isFav = favoriteIds.includes(parking.id);
    if (isFav) {
      setFavoriteIds((prev) => prev.filter((id) => id !== parking.id));
      setFavoriteSpaces((prev) => prev.filter((p) => p.id !== parking.id));
    } else {
      setFavoriteIds((prev) => [...prev, parking.id]);
      setFavoriteSpaces((prev) => [parking, ...prev]);
    }

    try {
      await api.toggleFavorite(parking.id);
    } catch {
      // Keep optimistic UI update
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favoriteIds,
        favoriteSpaces,
        isFavorite,
        toggleFavorite,
        isLoading,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used within FavoritesProvider');
  return context;
};

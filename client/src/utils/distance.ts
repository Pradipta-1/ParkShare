/**
 * Accurate Haversine distance calculator between two GPS coordinates
 */
export const calculateDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's mean radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const calculateDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  return Math.round(calculateDistanceKm(lat1, lon1, lat2, lon2) * 1000);
};

export const formatDistanceKm = (km: number): string => {
  if (isNaN(km) || km < 0) return 'Nearby';
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters} m away`;
  }
  return `${km.toFixed(2)} km away`;
};

export const formatLiveDistance = (
  userLat?: number | null,
  userLng?: number | null,
  targetLat?: number | null,
  targetLng?: number | null,
  fallbackMeters?: number
): string => {
  if (
    typeof userLat === 'number' &&
    typeof userLng === 'number' &&
    typeof targetLat === 'number' &&
    typeof targetLng === 'number' &&
    !isNaN(userLat) &&
    !isNaN(userLng) &&
    !isNaN(targetLat) &&
    !isNaN(targetLng)
  ) {
    const km = calculateDistanceKm(userLat, userLng, targetLat, targetLng);
    return formatDistanceKm(km);
  }

  if (typeof fallbackMeters === 'number' && fallbackMeters > 0) {
    return formatDistanceKm(fallbackMeters / 1000);
  }

  return 'Nearby';
};

export type UserRole = 'driver' | 'owner' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  phone: string;
  avatar: string;
  memberSince: string;
  responseRate?: string;
  walletBalance: number;
  bio?: string;
  city?: string;
}

export interface Vehicle {
  id: string;
  userId: string;
  numberPlate: string;
  brand: string;
  model: string;
  color: string;
  type: 'Car' | 'Bike' | 'SUV' | 'EV';
  isDefault?: boolean;
}

export type ParkingType = 'Open' | 'Covered' | 'Garage' | 'Basement' | 'Driveway';
export type VehicleType = 'Car' | 'Bike' | 'SUV' | 'EV';
export type Amenity = 'CCTV' | 'Security' | 'EV charging' | '24/7 access' | 'Covered' | 'Gated' | 'Well lit';

export interface ParkingSpace {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  ownerResponseRate?: string;
  title: string;
  description: string;
  address: string;
  city: string;
  location: {
    lat: number;
    lng: number;
  };
  pricePerHour: number;
  parkingType: ParkingType;
  suitableVehicles: VehicleType[];
  amenities: Amenity[];
  images: string[];
  status: 'active' | 'paused' | 'pending_verification' | 'rejected' | 'allotted';
  isVerified: boolean;
  isInstantBooking: boolean;
  totalSpots: number;
  availableSpots: number;
  occupancyPercent: number;
  operatingHours: {
    open: string;
    close: string;
  };
  blockedDates: string[];
  pricingCalendar: { date: string; price: number }[];
  rating: number;
  reviewCount: number;
  distanceMeters?: number;
  category?: 'Downtown' | 'Airport' | 'Railway Station' | 'Shopping' | 'Business District' | 'Hospitals' | 'Universities' | 'Stadiums';
  createdAt: string;
}

export interface Booking {
  id: string;
  bookingCode: string;
  parkingId: string;
  parkingTitle: string;
  parkingAddress: string;
  parkingImage: string;
  parkingLocation: { lat: number; lng: number };
  userId: string;
  userName: string;
  userPhone: string;
  ownerId: string;
  vehicle: {
    id?: string;
    numberPlate: string;
    brand: string;
    model: string;
    color?: string;
    type: VehicleType;
  };
  date: string;
  arrivalTime: string;
  departureTime: string;
  durationHours: number;
  pricePerHour: number;
  subtotal: number;
  serviceFee: number;
  totalAmount: number;
  paymentStatus: 'paid' | 'pending' | 'refunded';
  bookingStatus: 'confirmed' | 'active' | 'completed' | 'cancelled';
  paymentMethod: string;
  transactionId?: string;
  checkInTime?: string;
  checkOutTime?: string;
  qrCodeData: string;
  spotNumber: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  userId: string;
  amount: number;
  method: 'UPI' | 'Card' | 'Wallet' | 'Net Banking';
  transactionId: string;
  status: 'success' | 'failed' | 'refunded';
  createdAt: string;
}

export interface Review {
  id: string;
  parkingId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
  createdAt: string;
  ownerResponse?: string;
  photos?: string[];
}

export interface Favorite {
  id: string;
  userId: string;
  parkingId: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'booking_confirmed' | 'booking_ending' | 'refund' | 'review' | 'verification' | 'general';
  title: string;
  message: string;
  dateGroup: 'Today' | 'Yesterday' | 'Earlier this week' | 'Older';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface MessageItem {
  id: string;
  bookingId: string;
  conversationId?: string;
  senderId: string;
  senderName: string;
  senderRole: 'driver' | 'owner' | 'admin';
  receiverId: string;
  text: string;
  messageText?: string;
  timestamp: string;
  isRead?: boolean;
  createdAt?: string;
}

export interface PayoutItem {
  id: string;
  ownerId: string;
  amount: number;
  status: 'completed' | 'pending';
  method: string;
  date: string;
}

export interface ReportItem {
  id: string;
  userId: string;
  userName: string;
  parkingId?: string;
  parkingTitle?: string;
  category: 'Parking unavailable' | 'Incorrect location' | 'Fraud' | 'Unsafe environment' | 'Owner issue' | 'Payment problem' | 'Other';
  description: string;
  status: 'Open' | 'Investigating' | 'Resolved' | 'Rejected';
  createdAt: string;
}

export interface VerificationRequestItem {
  id: string;
  listingId: string;
  ownerName: string;
  title: string;
  location: string;
  pricePerHour: number;
  documents: {
    identity: boolean;
    ownershipProof: boolean;
    photos: boolean;
  };
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

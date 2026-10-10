import mongoose, { Schema } from 'mongoose';
import { User, ParkingSpace, Booking, Review, Vehicle } from './types.js';

// User Schema
const UserSchema = new Schema<User>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: { type: String, required: true },
    phone: { type: String },
    avatar: { type: String },
    memberSince: { type: String },
    responseRate: { type: String },
    walletBalance: { type: Number, default: 0 },
    bio: { type: String },
    city: { type: String },
  },
  { strict: false, timestamps: true }
);

// Parking Space Schema
const ParkingSpaceSchema = new Schema<ParkingSpace>(
  {
    id: { type: String, required: true, unique: true },
    ownerId: { type: String, required: true },
    ownerName: { type: String, required: true },
    ownerAvatar: { type: String },
    title: { type: String, required: true },
    description: { type: String },
    address: { type: String, required: true },
    city: { type: String },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    pricePerHour: { type: Number, required: true },
    parkingType: { type: String },
    suitableVehicles: [{ type: String }],
    amenities: [{ type: String }],
    images: [{ type: String }],
    status: { type: String, default: 'active' },
    isVerified: { type: Boolean, default: true },
    isInstantBooking: { type: Boolean, default: true },
    totalSpots: { type: Number, default: 1 },
    availableSpots: { type: Number, default: 1 },
    occupancyPercent: { type: Number, default: 0 },
    operatingHours: {
      open: { type: String },
      close: { type: String },
    },
    blockedDates: [{ type: String }],
    rating: { type: Number, default: 5.0 },
    reviewCount: { type: Number, default: 0 },
    category: { type: String },
  },
  { strict: false, timestamps: true }
);

// Booking Schema
const BookingSchema = new Schema<Booking>(
  {
    id: { type: String, required: true, unique: true },
    bookingCode: { type: String },
    parkingId: { type: String, required: true },
    parkingTitle: { type: String },
    parkingAddress: { type: String },
    parkingImage: { type: String },
    parkingLocation: {
      lat: { type: Number },
      lng: { type: Number },
    },
    userId: { type: String, required: true },
    userName: { type: String },
    userPhone: { type: String },
    ownerId: { type: String },
    vehicle: { type: Schema.Types.Mixed },
    date: { type: String },
    arrivalTime: { type: String },
    departureTime: { type: String },
    durationHours: { type: Number },
    pricePerHour: { type: Number },
    subtotal: { type: Number },
    serviceFee: { type: Number },
    totalAmount: { type: Number },
    paymentStatus: { type: String },
    bookingStatus: { type: String },
    paymentMethod: { type: String },
    transactionId: { type: String },
    qrCodeData: { type: String },
    spotNumber: { type: String },
  },
  { strict: false, timestamps: true }
);

// Review Schema
const ReviewSchema = new Schema<Review>(
  {
    id: { type: String, required: true, unique: true },
    parkingId: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String },
    userAvatar: { type: String },
    rating: { type: Number, required: true },
    comment: { type: String },
    date: { type: String },
  },
  { strict: false, timestamps: true }
);

// Vehicle Schema
const VehicleSchema = new Schema<Vehicle>(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    numberPlate: { type: String, required: true },
    brand: { type: String },
    model: { type: String },
    color: { type: String },
    type: { type: String },
    isDefault: { type: Boolean, default: false },
  },
  { strict: false, timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model<User>('User', UserSchema);
export const ParkingSpaceModel = mongoose.models.ParkingSpace || mongoose.model<ParkingSpace>('ParkingSpace', ParkingSpaceSchema);
export const BookingModel = mongoose.models.Booking || mongoose.model<Booking>('Booking', BookingSchema);
export const ReviewModel = mongoose.models.Review || mongoose.model<Review>('Review', ReviewSchema);
export const VehicleModel = mongoose.models.Vehicle || mongoose.model<Vehicle>('Vehicle', VehicleSchema);

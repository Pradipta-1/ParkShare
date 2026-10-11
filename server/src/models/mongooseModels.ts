import mongoose, { Schema } from 'mongoose';
import {
  User,
  ParkingSpace,
  Booking,
  Review,
  Vehicle,
  Favorite,
  NotificationItem,
  MessageItem,
  PayoutItem,
  ReportItem,
  VerificationRequestItem,
} from './types.js';

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

// Favorite Schema (Saved Spots)
const FavoriteSchema = new Schema<any>(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    parkingId: { type: String, required: true, index: true },
    savedAt: { type: String },
    createdAt: { type: String },
  },
  { strict: false, timestamps: true }
);

// Message Schema (In-App Driver & Host Chat)
const MessageSchema = new Schema<any>(
  {
    id: { type: String, required: true, unique: true },
    conversationId: { type: String, index: true },
    bookingId: { type: String, index: true },
    senderId: { type: String, required: true },
    senderName: { type: String },
    senderRole: { type: String },
    receiverId: { type: String, required: true, index: true },
    messageText: { type: String },
    text: { type: String },
    timestamp: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { strict: false, timestamps: true }
);

// Notification Schema (System & Activity Alerts)
const NotificationSchema = new Schema<any>(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    dateGroup: { type: String },
    createdAt: { type: String },
  },
  { strict: false, timestamps: true }
);

// Payout Schema (Host Earnings & Bank Withdrawals)
const PayoutSchema = new Schema<any>(
  {
    id: { type: String, required: true, unique: true },
    ownerId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    status: { type: String, default: 'pending' },
    paymentMethod: { type: String, default: 'UPI' },
    method: { type: String },
    accountDetails: { type: String },
    processedAt: { type: String },
    date: { type: String },
  },
  { strict: false, timestamps: true }
);

// Verification Request Schema (Property Verification)
const VerificationRequestSchema = new Schema<any>(
  {
    id: { type: String, required: true, unique: true },
    ownerId: { type: String, index: true },
    ownerName: { type: String },
    parkingId: { type: String, index: true },
    listingId: { type: String },
    parkingTitle: { type: String },
    title: { type: String },
    location: { type: String },
    pricePerHour: { type: Number },
    documentUrls: [{ type: String }],
    documents: { type: Schema.Types.Mixed },
    status: { type: String, default: 'pending' },
    reviewedBy: { type: String },
    reviewedAt: { type: String },
    submittedAt: { type: String },
  },
  { strict: false, timestamps: true }
);

// Report Schema (Disputes & Incident Reports)
const ReportSchema = new Schema<any>(
  {
    id: { type: String, required: true, unique: true },
    reporterId: { type: String, index: true },
    userId: { type: String },
    userName: { type: String },
    reportedItemId: { type: String, index: true },
    parkingId: { type: String },
    parkingTitle: { type: String },
    reason: { type: String },
    category: { type: String },
    details: { type: String },
    description: { type: String },
    status: { type: String, default: 'open' },
    resolutionNote: { type: String },
    createdAt: { type: String },
  },
  { strict: false, timestamps: true }
);

// Export Mongoose Models
export const UserModel = mongoose.models.User || mongoose.model<User>('User', UserSchema);
export const ParkingSpaceModel = mongoose.models.ParkingSpace || mongoose.model<ParkingSpace>('ParkingSpace', ParkingSpaceSchema);
export const BookingModel = mongoose.models.Booking || mongoose.model<Booking>('Booking', BookingSchema);
export const ReviewModel = mongoose.models.Review || mongoose.model<Review>('Review', ReviewSchema);
export const VehicleModel = mongoose.models.Vehicle || mongoose.model<Vehicle>('Vehicle', VehicleSchema);

export const FavoriteModel = mongoose.models.Favorite || mongoose.model<Favorite>('Favorite', FavoriteSchema, 'favorites');
export const MessageModel = mongoose.models.Message || mongoose.model<MessageItem>('Message', MessageSchema, 'messages');
export const NotificationModel = mongoose.models.Notification || mongoose.model<NotificationItem>('Notification', NotificationSchema, 'notifications');
export const PayoutModel = mongoose.models.Payout || mongoose.model<PayoutItem>('Payout', PayoutSchema, 'payouts');
export const VerificationRequestModel = mongoose.models.VerificationRequest || mongoose.model<VerificationRequestItem>('VerificationRequest', VerificationRequestSchema, 'verification_requests');
export const ReportModel = mongoose.models.Report || mongoose.model<ReportItem>('Report', ReportSchema, 'reports');

const MetaSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed },
  },
  { strict: false, timestamps: true }
);
export const MetaModel = mongoose.models.Meta || mongoose.model('Meta', MetaSchema, 'meta');

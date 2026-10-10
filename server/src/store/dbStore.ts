import {
  User,
  Vehicle,
  ParkingSpace,
  Booking,
  Payment,
  Review,
  Favorite,
  NotificationItem,
  MessageItem,
  PayoutItem,
  ReportItem,
  VerificationRequestItem,
} from '../models/types.js';
import {
  initialUsers,
  initialVehicles,
  initialParkingSpaces,
  initialBookings,
  initialReviews,
  initialFavorites,
  initialNotifications,
  initialMessages,
  initialPayouts,
  initialReports,
  initialVerificationRequests,
} from '../data/seedData.js';

class DataStore {
  public users: User[] = [...initialUsers];
  public vehicles: Vehicle[] = [...initialVehicles];
  public parkingSpaces: ParkingSpace[] = [...initialParkingSpaces];
  public bookings: Booking[] = [...initialBookings];
  public reviews: Review[] = [...initialReviews];
  public favorites: Favorite[] = [...initialFavorites];
  public notifications: NotificationItem[] = [...initialNotifications];
  public messages: MessageItem[] = [...initialMessages];
  public payouts: PayoutItem[] = [...initialPayouts];
  public reports: ReportItem[] = [...initialReports];
  public verificationRequests: VerificationRequestItem[] = [...initialVerificationRequests];
  public payments: Payment[] = [];

  // Reset to initial state
  public resetToDefault() {
    this.users = [...initialUsers];
    this.vehicles = [...initialVehicles];
    this.parkingSpaces = [...initialParkingSpaces];
    this.bookings = [...initialBookings];
    this.reviews = [...initialReviews];
    this.favorites = [...initialFavorites];
    this.notifications = [...initialNotifications];
    this.messages = [...initialMessages];
    this.payouts = [...initialPayouts];
    this.reports = [...initialReports];
    this.verificationRequests = [...initialVerificationRequests];
  }
}

export const dbStore = new DataStore();

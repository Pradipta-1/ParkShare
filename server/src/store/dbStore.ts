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
import {
  UserModel,
  ParkingSpaceModel,
  BookingModel,
  ReviewModel,
  VehicleModel,
} from '../models/mongooseModels.js';

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
  public isMongoConnected = false;

  // Sync memory store with MongoDB Atlas
  public async initFromMongo(): Promise<void> {
    try {
      this.isMongoConnected = true;

      // 1. Users
      const userCount = await UserModel.countDocuments();
      if (userCount === 0) {
        await UserModel.insertMany(initialUsers);
      } else {
        const dbUsers = await UserModel.find().lean();
        this.users = dbUsers.map((u: any) => ({
          ...u,
          id: u.id || u._id?.toString(),
        })) as User[];
      }

      // 2. Parking Spaces
      const spaceCount = await ParkingSpaceModel.countDocuments();
      if (spaceCount === 0) {
        await ParkingSpaceModel.insertMany(initialParkingSpaces);
      } else {
        const dbSpaces = await ParkingSpaceModel.find().lean();
        this.parkingSpaces = dbSpaces.map((s: any) => ({
          ...s,
          id: s.id || s._id?.toString(),
        })) as ParkingSpace[];
      }

      // 3. Vehicles
      const vehicleCount = await VehicleModel.countDocuments();
      if (vehicleCount === 0) {
        await VehicleModel.insertMany(initialVehicles);
      } else {
        const dbVehicles = await VehicleModel.find().lean();
        this.vehicles = dbVehicles.map((v: any) => ({
          ...v,
          id: v.id || v._id?.toString(),
        })) as Vehicle[];
      }

      // 4. Bookings
      const bookingCount = await BookingModel.countDocuments();
      if (bookingCount === 0) {
        await BookingModel.insertMany(initialBookings);
      } else {
        const dbBookings = await BookingModel.find().lean();
        this.bookings = dbBookings.map((b: any) => ({
          ...b,
          id: b.id || b._id?.toString(),
        })) as Booking[];
      }

      // 5. Reviews
      const reviewCount = await ReviewModel.countDocuments();
      if (reviewCount === 0) {
        await ReviewModel.insertMany(initialReviews);
      } else {
        const dbReviews = await ReviewModel.find().lean();
        this.reviews = dbReviews.map((r: any) => ({
          ...r,
          id: r.id || r._id?.toString(),
        })) as Review[];
      }

      console.log(
        ` Connected & Synchronized with MongoDB Atlas: ${this.parkingSpaces.length} spots, ${this.bookings.length} bookings, ${this.users.length} users, ${this.vehicles.length} vehicles.`
      );
    } catch (err: any) {
      console.warn('⚠️ MongoDB Atlas initialization warning:', err.message);
    }
  }

  // MongoDB Persistence Helpers
  public saveUser(user: User) {
    if (!this.users.some((u) => u.id === user.id)) {
      this.users.push(user);
    } else {
      const idx = this.users.findIndex((u) => u.id === user.id);
      this.users[idx] = user;
    }
    if (this.isMongoConnected) {
      UserModel.findOneAndUpdate({ id: user.id }, user, { upsert: true }).catch((e) =>
        console.error('Mongo saveUser error:', e.message)
      );
    }
  }

  public saveParkingSpace(space: ParkingSpace) {
    const idx = this.parkingSpaces.findIndex((s) => s.id === space.id);
    if (idx === -1) {
      this.parkingSpaces.unshift(space);
    } else {
      this.parkingSpaces[idx] = space;
    }
    if (this.isMongoConnected) {
      ParkingSpaceModel.findOneAndUpdate({ id: space.id }, space, { upsert: true }).catch((e) =>
        console.error('Mongo saveParkingSpace error:', e.message)
      );
    }
  }

  public deleteParkingSpace(id: string) {
    this.parkingSpaces = this.parkingSpaces.filter((s) => s.id !== id);
    if (this.isMongoConnected) {
      ParkingSpaceModel.deleteOne({ id }).catch((e) =>
        console.error('Mongo deleteParkingSpace error:', e.message)
      );
    }
  }

  public saveBooking(booking: Booking) {
    const idx = this.bookings.findIndex((b) => b.id === booking.id);
    if (idx === -1) {
      this.bookings.unshift(booking);
    } else {
      this.bookings[idx] = booking;
    }
    if (this.isMongoConnected) {
      BookingModel.findOneAndUpdate({ id: booking.id }, booking, { upsert: true }).catch((e) =>
        console.error('Mongo saveBooking error:', e.message)
      );
    }
  }

  public saveReview(review: Review) {
    const idx = this.reviews.findIndex((r) => r.id === review.id);
    if (idx === -1) {
      this.reviews.unshift(review);
    } else {
      this.reviews[idx] = review;
    }
    if (this.isMongoConnected) {
      ReviewModel.findOneAndUpdate({ id: review.id }, review, { upsert: true }).catch((e) =>
        console.error('Mongo saveReview error:', e.message)
      );
    }
  }

  public saveVehicle(vehicle: Vehicle) {
    const idx = this.vehicles.findIndex((v) => v.id === vehicle.id);
    if (idx === -1) {
      this.vehicles.push(vehicle);
    } else {
      this.vehicles[idx] = vehicle;
    }
    if (this.isMongoConnected) {
      VehicleModel.findOneAndUpdate({ id: vehicle.id }, vehicle, { upsert: true }).catch((e) =>
        console.error('Mongo saveVehicle error:', e.message)
      );
    }
  }

  public deleteVehicle(id: string) {
    this.vehicles = this.vehicles.filter((v) => v.id !== id);
    if (this.isMongoConnected) {
      VehicleModel.deleteOne({ id }).catch((e) =>
        console.error('Mongo deleteVehicle error:', e.message)
      );
    }
  }

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

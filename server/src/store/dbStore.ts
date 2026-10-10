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
  FavoriteModel,
  MessageModel,
  NotificationModel,
  PayoutModel,
  VerificationRequestModel,
  ReportModel,
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
        if (initialUsers.length > 0) await UserModel.insertMany(initialUsers);
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
        if (initialParkingSpaces.length > 0) await ParkingSpaceModel.insertMany(initialParkingSpaces);
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
        if (initialVehicles.length > 0) await VehicleModel.insertMany(initialVehicles);
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
        if (initialBookings.length > 0) await BookingModel.insertMany(initialBookings);
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
        if (initialReviews.length > 0) await ReviewModel.insertMany(initialReviews);
      } else {
        const dbReviews = await ReviewModel.find().lean();
        this.reviews = dbReviews.map((r: any) => ({
          ...r,
          id: r.id || r._id?.toString(),
        })) as Review[];
      }

      // 6. Favorites (Saved Spots)
      const favCount = await FavoriteModel.countDocuments();
      if (favCount === 0) {
        if (initialFavorites.length > 0) await FavoriteModel.insertMany(initialFavorites);
      } else {
        const dbFavs = await FavoriteModel.find().lean();
        this.favorites = dbFavs.map((f: any) => ({
          ...f,
          id: f.id || f._id?.toString(),
        })) as Favorite[];
      }

      // 7. Messages (In-App Driver & Host Chat)
      // 7. Messages (In-App Driver & Host Chat) - Real-time messages only
      await MessageModel.deleteMany({
        id: { $in: ['msg_rahul_1', 'msg_pooja_1', 'msg_amit_1', 'msg_vikram_1'] },
      }).catch(() => {});
      const dbMsgs = await MessageModel.find().lean();
      this.messages = dbMsgs.map((m: any) => ({
        ...m,
        id: m.id || m._id?.toString(),
      })) as MessageItem[];

      // 8. Notifications (System & Activity Alerts)
      await NotificationModel.deleteMany({
        id: { $in: ['notif_init_msg_1', 'notif_init_msg_2', 'notif_init_msg_3', 'notif_init_msg_4'] },
      }).catch(() => {});
      const dbNotifs = await NotificationModel.find().lean();
      this.notifications = dbNotifs.map((n: any) => ({
        ...n,
        id: n.id || n._id?.toString(),
      })) as NotificationItem[];

      // 9. Payouts (Host Earnings & Bank Withdrawals)
      const payoutCount = await PayoutModel.countDocuments();
      if (payoutCount === 0) {
        if (initialPayouts.length > 0) await PayoutModel.insertMany(initialPayouts);
      } else {
        const dbPayouts = await PayoutModel.find().lean();
        this.payouts = dbPayouts.map((p: any) => ({
          ...p,
          id: p.id || p._id?.toString(),
        })) as PayoutItem[];
      }

      // 10. Verification Requests (Property Verification)
      const vrCount = await VerificationRequestModel.countDocuments();
      if (vrCount === 0) {
        if (initialVerificationRequests.length > 0) await VerificationRequestModel.insertMany(initialVerificationRequests);
      } else {
        const dbVrs = await VerificationRequestModel.find().lean();
        this.verificationRequests = dbVrs.map((v: any) => ({
          ...v,
          id: v.id || v._id?.toString(),
        })) as VerificationRequestItem[];
      }

      // 11. Reports (Disputes & Incident Reports)
      const repCount = await ReportModel.countDocuments();
      if (repCount === 0) {
        if (initialReports.length > 0) await ReportModel.insertMany(initialReports);
      } else {
        const dbReps = await ReportModel.find().lean();
        this.reports = dbReps.map((r: any) => ({
          ...r,
          id: r.id || r._id?.toString(),
        })) as ReportItem[];
      }

      console.log(
        ` Connected & Synchronized with MongoDB Atlas: ${this.parkingSpaces.length} spots, ${this.bookings.length} bookings, ${this.users.length} users, ${this.vehicles.length} vehicles, ${this.favorites.length} favorites, ${this.messages.length} messages, ${this.notifications.length} notifs, ${this.payouts.length} payouts, ${this.verificationRequests.length} verifications, ${this.reports.length} reports.`
      );
    } catch (err: any) {
      console.warn('⚠️ MongoDB Atlas initialization warning:', err.message);
    }
  }

  // MongoDB Persistence Helpers
  public saveUser(user: User) {
    const idx = this.users.findIndex((u) => u.id === user.id);
    if (idx === -1) this.users.push(user);
    else this.users[idx] = user;
    if (this.isMongoConnected) {
      UserModel.findOneAndUpdate({ id: user.id }, user, { upsert: true }).catch((e) =>
        console.error('Mongo saveUser error:', e.message)
      );
    }
  }

  public deleteUser(id: string) {
    this.users = this.users.filter((u) => u.id !== id);
    if (this.isMongoConnected) {
      UserModel.deleteOne({ id }).catch((e) =>
        console.error('Mongo deleteUser error:', e.message)
      );
    }
  }

  public saveParkingSpace(space: ParkingSpace) {
    const idx = this.parkingSpaces.findIndex((s) => s.id === space.id);
    if (idx === -1) this.parkingSpaces.unshift(space);
    else this.parkingSpaces[idx] = space;
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
    if (idx === -1) this.bookings.unshift(booking);
    else this.bookings[idx] = booking;
    if (this.isMongoConnected) {
      BookingModel.findOneAndUpdate({ id: booking.id }, booking, { upsert: true }).catch((e) =>
        console.error('Mongo saveBooking error:', e.message)
      );
    }
  }

  public saveReview(review: Review) {
    const idx = this.reviews.findIndex((r) => r.id === review.id);
    if (idx === -1) this.reviews.unshift(review);
    else this.reviews[idx] = review;
    if (this.isMongoConnected) {
      ReviewModel.findOneAndUpdate({ id: review.id }, review, { upsert: true }).catch((e) =>
        console.error('Mongo saveReview error:', e.message)
      );
    }
  }

  public saveVehicle(vehicle: Vehicle) {
    const idx = this.vehicles.findIndex((v) => v.id === vehicle.id);
    if (idx === -1) this.vehicles.push(vehicle);
    else this.vehicles[idx] = vehicle;
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

  // 1. Favorites Persistence
  public saveFavorite(fav: Favorite) {
    const idx = this.favorites.findIndex((f) => f.id === fav.id || (f.userId === fav.userId && f.parkingId === fav.parkingId));
    if (idx === -1) this.favorites.unshift(fav);
    else this.favorites[idx] = fav;
    if (this.isMongoConnected) {
      FavoriteModel.findOneAndUpdate({ id: fav.id }, fav, { upsert: true }).catch((e) =>
        console.error('Mongo saveFavorite error:', e.message)
      );
    }
  }

  public deleteFavorite(userId: string, parkingId: string) {
    this.favorites = this.favorites.filter((f) => !(f.userId === userId && f.parkingId === parkingId));
    if (this.isMongoConnected) {
      FavoriteModel.deleteOne({ userId, parkingId }).catch((e) =>
        console.error('Mongo deleteFavorite error:', e.message)
      );
    }
  }

  // 2. Messages Persistence
  public saveMessage(msg: MessageItem) {
    const idx = this.messages.findIndex((m) => m.id === msg.id);
    if (idx === -1) this.messages.push(msg);
    else this.messages[idx] = msg;
    if (this.isMongoConnected) {
      MessageModel.findOneAndUpdate({ id: msg.id }, msg, { upsert: true }).catch((e) =>
        console.error('Mongo saveMessage error:', e.message)
      );
    }
  }

  // 3. Notifications Persistence
  public saveNotification(notif: NotificationItem) {
    const idx = this.notifications.findIndex((n) => n.id === notif.id);
    if (idx === -1) this.notifications.unshift(notif);
    else this.notifications[idx] = notif;
    if (this.isMongoConnected) {
      NotificationModel.findOneAndUpdate({ id: notif.id }, notif, { upsert: true }).catch((e) =>
        console.error('Mongo saveNotification error:', e.message)
      );
    }
  }

  public deleteNotification(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    if (this.isMongoConnected) {
      NotificationModel.deleteOne({ id }).catch((e) =>
        console.error('Mongo deleteNotification error:', e.message)
      );
    }
  }

  public clearNotificationsForUser(userIds: string[]) {
    this.notifications = this.notifications.filter((n) => !userIds.includes(n.userId));
    if (this.isMongoConnected) {
      NotificationModel.deleteMany({ userId: { $in: userIds } }).catch((e) =>
        console.error('Mongo clearNotifications error:', e.message)
      );
    }
  }

  // 4. Payouts Persistence
  public savePayout(payout: PayoutItem) {
    const idx = this.payouts.findIndex((p) => p.id === payout.id);
    if (idx === -1) this.payouts.unshift(payout);
    else this.payouts[idx] = payout;
    if (this.isMongoConnected) {
      PayoutModel.findOneAndUpdate({ id: payout.id }, payout, { upsert: true }).catch((e) =>
        console.error('Mongo savePayout error:', e.message)
      );
    }
  }

  // 5. Verification Requests Persistence
  public saveVerificationRequest(vr: VerificationRequestItem) {
    const idx = this.verificationRequests.findIndex((v) => v.id === vr.id);
    if (idx === -1) this.verificationRequests.unshift(vr);
    else this.verificationRequests[idx] = vr;
    if (this.isMongoConnected) {
      VerificationRequestModel.findOneAndUpdate({ id: vr.id }, vr, { upsert: true }).catch((e) =>
        console.error('Mongo saveVerificationRequest error:', e.message)
      );
    }
  }

  // 6. Reports Persistence
  public saveReport(report: ReportItem) {
    const idx = this.reports.findIndex((r) => r.id === report.id);
    if (idx === -1) this.reports.unshift(report);
    else this.reports[idx] = report;
    if (this.isMongoConnected) {
      ReportModel.findOneAndUpdate({ id: report.id }, report, { upsert: true }).catch((e) =>
        console.error('Mongo saveReport error:', e.message)
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

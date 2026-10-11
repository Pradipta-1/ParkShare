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
  MetaModel,
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

  private syncInterval: any = null;
  private changeStreams: any[] = [];

  // Sync memory store with MongoDB Atlas
  public async initFromMongo(): Promise<void> {
    try {
      this.isMongoConnected = true;

      // Check if MongoDB was already initialized in the past
      let isInitialized = false;
      try {
        const initMeta = await MetaModel.findOne({ key: 'db_initialized' });
        isInitialized = Boolean(initMeta);
      } catch {
        isInitialized = false;
      }

      // If first-time deployment and not yet initialized, seed defaults once
      if (!isInitialized) {
        const userCount = await UserModel.countDocuments();
        if (userCount === 0 && initialUsers.length > 0) {
          await UserModel.insertMany(initialUsers).catch(() => {});
        }

        const spaceCount = await ParkingSpaceModel.countDocuments();
        if (spaceCount === 0 && initialParkingSpaces.length > 0) {
          await ParkingSpaceModel.insertMany(initialParkingSpaces).catch(() => {});
        }

        const vehicleCount = await VehicleModel.countDocuments();
        if (vehicleCount === 0 && initialVehicles.length > 0) {
          await VehicleModel.insertMany(initialVehicles).catch(() => {});
        }

        const bookingCount = await BookingModel.countDocuments();
        if (bookingCount === 0 && initialBookings.length > 0) {
          await BookingModel.insertMany(initialBookings).catch(() => {});
        }

        const reviewCount = await ReviewModel.countDocuments();
        if (reviewCount === 0 && initialReviews.length > 0) {
          await ReviewModel.insertMany(initialReviews).catch(() => {});
        }

        const favCount = await FavoriteModel.countDocuments();
        if (favCount === 0 && initialFavorites.length > 0) {
          await FavoriteModel.insertMany(initialFavorites).catch(() => {});
        }

        const payoutCount = await PayoutModel.countDocuments();
        if (payoutCount === 0 && initialPayouts.length > 0) {
          await PayoutModel.insertMany(initialPayouts).catch(() => {});
        }

        const vrCount = await VerificationRequestModel.countDocuments();
        if (vrCount === 0 && initialVerificationRequests.length > 0) {
          await VerificationRequestModel.insertMany(initialVerificationRequests).catch(() => {});
        }

        const repCount = await ReportModel.countDocuments();
        if (repCount === 0 && initialReports.length > 0) {
          await ReportModel.insertMany(initialReports).catch(() => {});
        }

        // Mark as initialized so deletions in MongoDB will NEVER be re-seeded
        await MetaModel.findOneAndUpdate(
          { key: 'db_initialized' },
          { key: 'db_initialized', value: true },
          { upsert: true }
        ).catch(() => {});
      }

      // Populate directly from MongoDB - whatever exists in MongoDB is the single source of truth
      await this.syncFromMongo();

      console.log(
        ` Connected & Synchronized with MongoDB Atlas: ${this.parkingSpaces.length} spots, ${this.bookings.length} bookings, ${this.users.length} users, ${this.vehicles.length} vehicles, ${this.favorites.length} favorites, ${this.messages.length} messages, ${this.notifications.length} notifs, ${this.payouts.length} payouts, ${this.verificationRequests.length} verifications, ${this.reports.length} reports.`
      );

      // Start Real-Time Change Streams & Continuous Polling Sync
      this.setupChangeStreams();
    } catch (err: any) {
      console.warn('⚠️ MongoDB Atlas initialization warning:', err.message);
    }
  }

  // Cleanup active streams
  public cleanupChangeStreams(): void {
    for (const stream of this.changeStreams) {
      try {
        stream.close();
      } catch {}
    }
    this.changeStreams = [];
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Setup real-time change monitoring for MongoDB
  public setupChangeStreams(): void {
    if (!this.isMongoConnected) return;

    this.cleanupChangeStreams();

    const modelsToWatch = [
      { model: UserModel, name: 'users' },
      { model: ParkingSpaceModel, name: 'parkingSpaces' },
      { model: BookingModel, name: 'bookings' },
      { model: ReviewModel, name: 'reviews' },
      { model: VehicleModel, name: 'vehicles' },
      { model: FavoriteModel, name: 'favorites' },
      { model: MessageModel, name: 'messages' },
      { model: NotificationModel, name: 'notifications' },
      { model: PayoutModel, name: 'payouts' },
      { model: ReportModel, name: 'reports' },
      { model: VerificationRequestModel, name: 'verificationRequests' },
    ];

    for (const { model, name } of modelsToWatch) {
      try {
        const stream = model.watch([], { fullDocument: 'default' });
        stream.on('change', async (change: any) => {
          console.log(`📡 [MongoDB Live Sync] Event '${change.operationType}' detected on '${name}'`);
          await this.syncCollection(name);
        });
        stream.on('error', (err: any) => {
          console.warn(`ChangeStream warning on ${name}:`, err.message);
        });
        this.changeStreams.push(stream);
      } catch (err: any) {
        console.warn(`Could not attach ChangeStream to ${name}:`, err.message);
      }
    }

    // Safety net: Periodic 3-second sync guarantees any deletion directly from MongoDB
    // (Compass, Atlas Web UI, mongosh, raw scripts) takes immediate effect across the site
    this.syncInterval = setInterval(() => {
      this.syncFromMongo().catch(() => {});
    }, 3000);
  }

  // Synchronize a single collection immediately from MongoDB
  public async syncCollection(name: string): Promise<void> {
    if (!this.isMongoConnected) return;
    try {
      switch (name) {
        case 'users': {
          const dbUsers = await UserModel.find().lean();
          this.users = dbUsers.map((u: any) => ({ ...u, id: u.id || u._id?.toString() })) as User[];
          break;
        }
        case 'parkingSpaces': {
          const dbSpaces = await ParkingSpaceModel.find().lean();
          this.parkingSpaces = dbSpaces.map((s: any) => ({ ...s, id: s.id || s._id?.toString() })) as ParkingSpace[];
          break;
        }
        case 'bookings': {
          const dbBookings = await BookingModel.find().lean();
          this.bookings = dbBookings.map((b: any) => ({ ...b, id: b.id || b._id?.toString() })) as Booking[];
          break;
        }
        case 'vehicles': {
          const dbVehicles = await VehicleModel.find().lean();
          this.vehicles = dbVehicles.map((v: any) => ({ ...v, id: v.id || v._id?.toString() })) as Vehicle[];
          break;
        }
        case 'reviews': {
          const dbReviews = await ReviewModel.find().lean();
          this.reviews = dbReviews.map((r: any) => ({ ...r, id: r.id || r._id?.toString() })) as Review[];
          break;
        }
        case 'favorites': {
          const dbFavs = await FavoriteModel.find().lean();
          this.favorites = dbFavs.map((f: any) => ({ ...f, id: f.id || f._id?.toString() })) as Favorite[];
          break;
        }
        case 'messages': {
          const dbMsgs = await MessageModel.find().lean();
          this.messages = dbMsgs.map((m: any) => ({ ...m, id: m.id || m._id?.toString() })) as MessageItem[];
          break;
        }
        case 'notifications': {
          const dbNotifs = await NotificationModel.find().lean();
          this.notifications = dbNotifs.map((n: any) => ({ ...n, id: n.id || n._id?.toString() })) as NotificationItem[];
          break;
        }
        case 'payouts': {
          const dbPayouts = await PayoutModel.find().lean();
          this.payouts = dbPayouts.map((p: any) => ({ ...p, id: p.id || p._id?.toString() })) as PayoutItem[];
          break;
        }
        case 'verificationRequests': {
          const dbVrs = await VerificationRequestModel.find().lean();
          this.verificationRequests = dbVrs.map((v: any) => ({ ...v, id: v.id || v._id?.toString() })) as VerificationRequestItem[];
          break;
        }
        case 'reports': {
          const dbReps = await ReportModel.find().lean();
          this.reports = dbReps.map((r: any) => ({ ...r, id: r.id || r._id?.toString() })) as ReportItem[];
          break;
        }
      }
    } catch (err: any) {
      console.warn(`Error syncing collection ${name}:`, err.message);
    }
  }

  // Full continuous sync of all collections from MongoDB
  public async syncFromMongo(): Promise<void> {
    if (!this.isMongoConnected) return;
    try {
      const [
        dbUsers,
        dbSpaces,
        dbVehicles,
        dbBookings,
        dbReviews,
        dbFavs,
        dbMsgs,
        dbNotifs,
        dbPayouts,
        dbVrs,
        dbReps,
      ] = await Promise.all([
        UserModel.find().lean(),
        ParkingSpaceModel.find().lean(),
        VehicleModel.find().lean(),
        BookingModel.find().lean(),
        ReviewModel.find().lean(),
        FavoriteModel.find().lean(),
        MessageModel.find().lean(),
        NotificationModel.find().lean(),
        PayoutModel.find().lean(),
        VerificationRequestModel.find().lean(),
        ReportModel.find().lean(),
      ]);

      this.users = dbUsers.map((u: any) => ({ ...u, id: u.id || u._id?.toString() })) as User[];
      this.parkingSpaces = dbSpaces.map((s: any) => ({ ...s, id: s.id || s._id?.toString() })) as ParkingSpace[];
      this.vehicles = dbVehicles.map((v: any) => ({ ...v, id: v.id || v._id?.toString() })) as Vehicle[];
      this.bookings = dbBookings.map((b: any) => ({ ...b, id: b.id || b._id?.toString() })) as Booking[];
      this.reviews = dbReviews.map((r: any) => ({ ...r, id: r.id || r._id?.toString() })) as Review[];
      this.favorites = dbFavs.map((f: any) => ({ ...f, id: f.id || f._id?.toString() })) as Favorite[];
      this.messages = dbMsgs.map((m: any) => ({ ...m, id: m.id || m._id?.toString() })) as MessageItem[];
      this.notifications = dbNotifs.map((n: any) => ({ ...n, id: n.id || n._id?.toString() })) as NotificationItem[];
      this.payouts = dbPayouts.map((p: any) => ({ ...p, id: p.id || p._id?.toString() })) as PayoutItem[];
      this.verificationRequests = dbVrs.map((v: any) => ({ ...v, id: v.id || v._id?.toString() })) as VerificationRequestItem[];
      this.reports = dbReps.map((r: any) => ({ ...r, id: r.id || r._id?.toString() })) as ReportItem[];
    } catch {
      // Ignore background sync errors
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

  public deleteParkingSpace(id: string): string[] {
    const deletedSpace = this.parkingSpaces.find((s) => s.id === id);
    this.parkingSpaces = this.parkingSpaces.filter((s) => s.id !== id);

    // Cancel all associated active/confirmed bookings immediately
    const cancelledBookingIds: string[] = [];
    this.bookings = this.bookings.map((b) => {
      if (b.parkingId === id && b.bookingStatus !== 'cancelled') {
        cancelledBookingIds.push(b.id);
        if (b.bookingCode) cancelledBookingIds.push(b.bookingCode);

        // Refund the driver if applicable
        if (b.userId) {
          const driverUser = this.users.find((u) => u.id === b.userId);
          if (driverUser) {
            const refundAmount = b.totalAmount || b.subtotal || 0;
            driverUser.walletBalance = (driverUser.walletBalance || 0) + refundAmount;
            this.saveUser(driverUser);
          }
        }

        // Create driver notification
        const notifId = `notif_cancel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const cancelNotif: NotificationItem = {
          id: notifId,
          userId: b.userId || 'usr_driver_1',
          type: 'refund',
          title: 'Booking Cancelled by Host',
          message: `Your reservation #${b.bookingCode || b.id} at "${deletedSpace?.title || b.parkingTitle || 'Parking Space'}" was cancelled because the host removed this spot. A full refund of ₹${b.totalAmount || b.subtotal || 0} has been credited to your wallet balance.`,
          dateGroup: 'Today',
          read: false,
          createdAt: new Date().toISOString(),
          link: '/bookings',
        };
        this.notifications.unshift(cancelNotif);
        if (this.isMongoConnected) {
          NotificationModel.create(cancelNotif).catch(() => {});
        }

        return {
          ...b,
          bookingStatus: 'cancelled' as const,
          paymentStatus: 'refunded' as const,
        };
      }
      return b;
    });

    if (this.isMongoConnected) {
      ParkingSpaceModel.deleteOne({ id }).catch((e) =>
        console.error('Mongo deleteParkingSpace error:', e.message)
      );
      BookingModel.updateMany(
        { parkingId: id, bookingStatus: { $ne: 'cancelled' } },
        { bookingStatus: 'cancelled', paymentStatus: 'refunded' }
      ).catch((e) => console.error('Mongo cancelBookingsOnDelete error:', e.message));
    }

    return cancelledBookingIds;
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

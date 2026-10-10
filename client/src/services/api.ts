import {
  User,
  ParkingSpace,
  Booking,
  Review,
  Vehicle,
  NotificationItem,
  MessageItem,
  FilterOptions,
  VerificationRequestItem,
  ReportItem,
} from '../types';
import { fallbackParkingSpaces } from '../data/mockSpaces';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';


class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('parkshare_token');
  }

  public setToken(token: string) {
    localStorage.setItem('parkshare_token', token);
  }

  public removeToken() {
    localStorage.removeItem('parkshare_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const userStr = localStorage.getItem('parkshare_user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u?.role) headers['X-User-Role'] = u.role;
        if (u?.id) headers['X-User-Id'] = u.id;
      }
    } catch {
      // Ignore
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'API request failed');
      }
      return data;
    } catch (err: any) {
      console.error(`API Error on ${endpoint}:`, err.message);
      throw err;
    }
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ success: boolean; token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async demoLogin(role: 'driver' | 'owner' | 'admin') {
    return this.request<{ success: boolean; token: string; user: User }>('/auth/demo', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  }

  async register(data: { name: string; email: string; password: string; role: 'driver' | 'owner'; phone?: string }) {
    return this.request<{ success: boolean; token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe() {
    return this.request<{ success: boolean; user: User }>('/auth/me');
  }

  async updateProfile(data: Partial<User>) {
    return this.request<{ success: boolean; user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Parking
  async getParkingSpaces(filters: FilterOptions = {}) {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if ((filters as any).status) params.set('status', (filters as any).status);
    if (filters.category) params.set('category', filters.category);
    if (filters.type) params.set('type', filters.type);
    if (filters.vehicle) params.set('vehicle', filters.vehicle);
    if (filters.minPrice) params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString());
    if (filters.distance) params.set('distance', filters.distance.toString());
    if (filters.verifiedOnly) params.set('verifiedOnly', 'true');
    if (filters.instantOnly) params.set('instantOnly', 'true');
    if (filters.amenities && filters.amenities.length > 0) {
      params.set('amenities', filters.amenities.join(','));
    }

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    try {
      const res = await this.request<{ success: boolean; count: number; data: ParkingSpace[] }>(`/parking${queryStr}`);
      const stored: ParkingSpace[] = JSON.parse(localStorage.getItem('parkshare_custom_spaces') || '[]');
      const cancelledAllotments: string[] = JSON.parse(localStorage.getItem('parkshare_cancelled_allotments') || '[]');

      if (res.success && Array.isArray(res.data)) {
        if (cancelledAllotments.length > 0) {
          res.data = res.data.map((space) => {
            if (
              cancelledAllotments.includes(space.id) ||
              (space.id === 'park_allotted_1' &&
                cancelledAllotments.some((c) => c.includes('allotted_1') || c.includes('book_active_1') || c.includes('demo_')))
            ) {
              return {
                ...space,
                status: 'active',
                availableSpots: Math.max(1, space.availableSpots || space.totalSpots || 4),
                occupancyPercent: 0,
              };
            }
            return space;
          });
        }

        if (stored.length > 0) {
          const existingIds = new Set(res.data.map((s) => s.id));
          let customToAdd = stored.filter((s) => !existingIds.has(s.id));
          if (filters.q) {
            const qLow = filters.q.toLowerCase().trim();
            customToAdd = customToAdd.filter((s) =>
              s.title.toLowerCase().includes(qLow) ||
              s.address.toLowerCase().includes(qLow) ||
              s.city.toLowerCase().includes(qLow)
            );
          }
          if ((filters as any).status && (filters as any).status !== 'All') {
            const st = (filters as any).status;
            if (st === 'available') {
              customToAdd = customToAdd.filter((s) => s.status === 'active' && (s.availableSpots ?? 1) > 0);
            } else if (st === 'allotted') {
              customToAdd = customToAdd.filter((s) => s.status === 'allotted' || (s.availableSpots ?? 1) <= 0);
            } else {
              customToAdd = customToAdd.filter((s) => s.status === st);
            }
          }
          res.data = [...customToAdd, ...res.data];
          res.count = res.data.length;
        }
      }
      return res;
    } catch {
      const stored: ParkingSpace[] = JSON.parse(localStorage.getItem('parkshare_custom_spaces') || '[]');
      const cancelledAllotments: string[] = JSON.parse(localStorage.getItem('parkshare_cancelled_allotments') || '[]');
      let combined = [...stored, ...fallbackParkingSpaces.filter((f) => !stored.some((s) => s.id === f.id))];

      if (cancelledAllotments.length > 0) {
        combined = combined.map((space) => {
          if (
            cancelledAllotments.includes(space.id) ||
            (space.id === 'park_allotted_1' &&
              cancelledAllotments.some((c) => c.includes('allotted_1') || c.includes('book_active_1') || c.includes('demo_')))
          ) {
            return {
              ...space,
              status: 'active',
              availableSpots: Math.max(1, space.availableSpots || space.totalSpots || 4),
              occupancyPercent: 0,
            };
          }
          return space;
        });
      }

      if (filters.q) {
        const term = filters.q.toLowerCase().trim();
        combined = combined.filter(
          (s) =>
            s.title.toLowerCase().includes(term) ||
            s.address.toLowerCase().includes(term) ||
            s.city.toLowerCase().includes(term) ||
            (s.category && s.category.toLowerCase().includes(term))
        );
      }
      if ((filters as any).status && (filters as any).status !== 'All') {
        const st = (filters as any).status;
        if (st === 'available') {
          combined = combined.filter((s) => s.status === 'active' && (s.availableSpots ?? 1) > 0);
        } else if (st === 'allotted') {
          combined = combined.filter((s) => s.status === 'allotted' || (s.availableSpots ?? 1) <= 0);
        } else {
          combined = combined.filter((s) => s.status === st);
        }
      }
      if (filters.category && filters.category !== 'All') {
        combined = combined.filter((s) => s.category?.toLowerCase() === filters.category?.toLowerCase());
      }
      if (filters.type && filters.type !== 'All') {
        combined = combined.filter((s) => s.parkingType.toLowerCase() === filters.type?.toLowerCase());
      }
      if (filters.vehicle && filters.vehicle !== 'All') {
        combined = combined.filter((s) => s.suitableVehicles.includes(filters.vehicle as any));
      }
      if (filters.minPrice) combined = combined.filter((s) => s.pricePerHour >= filters.minPrice!);
      if (filters.maxPrice) combined = combined.filter((s) => s.pricePerHour <= filters.maxPrice!);
      if (filters.distance) combined = combined.filter((s) => (s.distanceMeters || 1000) <= filters.distance!);
      if (filters.verifiedOnly) combined = combined.filter((s) => s.isVerified);
      if (filters.instantOnly) combined = combined.filter((s) => s.isInstantBooking);

      return {
        success: true,
        count: combined.length,
        data: combined,
      };
    }
  }

  async getParkingById(id: string) {
    return this.request<{ success: boolean; data: ParkingSpace }>(`/parking/${id}`);
  }

  async createParkingSpace(data: Partial<ParkingSpace>) {
    try {
      const res = await this.request<{ success: boolean; message: string; data: ParkingSpace }>('/parking', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (res.data) {
        const stored: ParkingSpace[] = JSON.parse(localStorage.getItem('parkshare_custom_spaces') || '[]');
        localStorage.setItem(
          'parkshare_custom_spaces',
          JSON.stringify([res.data, ...stored.filter((s) => s.id !== res.data.id)])
        );
      }
      return res;
    } catch {
      const fallbackSpace: ParkingSpace = {
        id: `park_${Date.now().toString(36)}`,
        ownerId: 'usr_owner_1',
        ownerName: 'Vikramaditya Roy',
        title: data.title || 'Private Parking Spot',
        description: data.description || 'Secure parking spot listed on ParkShare.',
        address: data.address || '18 Park Street',
        city: data.city || 'Kolkata',
        location: data.location || { lat: 22.5512, lng: 88.3619 },
        pricePerHour: Number(data.pricePerHour) || 50,
        parkingType: data.parkingType || 'Covered',
        suitableVehicles: data.suitableVehicles || ['Car'],
        amenities: data.amenities || ['CCTV', 'Security', 'Well lit'],
        images:
          data.images && data.images.length > 0
            ? data.images
            : ['https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80'],
        status: 'active',
        isVerified: false,
        isInstantBooking: true,
        totalSpots: Number(data.totalSpots) || 1,
        availableSpots: Number(data.totalSpots) || 1,
        occupancyPercent: 0,
        operatingHours: data.operatingHours || { open: '08:00', close: '22:00' },
        blockedDates: [],
        pricingCalendar: [],
        rating: 5.0,
        reviewCount: 0,
        distanceMeters: 380,
        category: data.category || 'Downtown',
        createdAt: new Date().toISOString(),
      };
      const stored: ParkingSpace[] = JSON.parse(localStorage.getItem('parkshare_custom_spaces') || '[]');
      localStorage.setItem('parkshare_custom_spaces', JSON.stringify([fallbackSpace, ...stored]));
      return {
        success: true,
        message: 'Parking space listed locally',
        data: fallbackSpace,
      };
    }
  }

  async updateParkingSpace(id: string, data: Partial<ParkingSpace>) {
    return this.request<{ success: boolean; message: string; data: ParkingSpace }>(`/parking/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteParkingSpace(id: string) {
    try {
      const res = await this.request<{ success: boolean; message: string }>(`/parking/${id}`, {
        method: 'DELETE',
      });
      const stored: ParkingSpace[] = JSON.parse(localStorage.getItem('parkshare_custom_spaces') || '[]');
      localStorage.setItem('parkshare_custom_spaces', JSON.stringify(stored.filter((s) => s.id !== id)));
      return res;
    } catch {
      const stored: ParkingSpace[] = JSON.parse(localStorage.getItem('parkshare_custom_spaces') || '[]');
      localStorage.setItem('parkshare_custom_spaces', JSON.stringify(stored.filter((s) => s.id !== id)));
      return { success: true, message: 'Parking space deleted' };
    }
  }

  // Bookings
  async createBooking(bookingData: {
    parkingId: string;
    parkingTitle?: string;
    parkingAddress?: string;
    parkingImage?: string;
    parkingLocation?: any;
    pricePerHour?: number;
    ownerId?: string;
    ownerName?: string;
    date: string;
    arrivalTime: string;
    departureTime: string;
    durationHours: number;
    vehicle: any;
    paymentMethod: string;
  }) {
    try {
      const res = await this.request<{ success: boolean; message: string; data: Booking }>('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      });
      if (res.data) {
        const stored: Booking[] = JSON.parse(localStorage.getItem('parkshare_custom_bookings') || '[]');
        localStorage.setItem(
          'parkshare_custom_bookings',
          JSON.stringify([res.data, ...stored.filter((b) => b.id !== res.data.id)])
        );
      }
      return res;
    } catch {
      const mockBooking: Booking = {
        id: `book_${Date.now().toString(36)}`,
        bookingCode: `PS-${Math.floor(100000 + Math.random() * 900000)}`,
        parkingId: bookingData.parkingId,
        parkingTitle: bookingData.parkingTitle || 'Reserved Parking Bay',
        parkingAddress: bookingData.parkingAddress || 'Kolkata Metro Bay',
        parkingImage: bookingData.parkingImage || 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80',
        parkingLocation: bookingData.parkingLocation || { lat: 22.5512, lng: 88.3619 },
        userId: 'usr_driver_1',
        userName: 'Rahul Sen',
        userPhone: '+91 98301 23456',
        ownerId: bookingData.ownerId || 'usr_owner_1',
        vehicle: bookingData.vehicle || {
          numberPlate: 'WB 01 AB 1234',
          brand: 'Honda',
          model: 'City',
          type: 'Car',
        },
        date: bookingData.date,
        arrivalTime: bookingData.arrivalTime,
        departureTime: bookingData.departureTime,
        durationHours: bookingData.durationHours,
        pricePerHour: bookingData.pricePerHour || 50,
        subtotal: (bookingData.pricePerHour || 50) * bookingData.durationHours,
        serviceFee: 10,
        totalAmount: (bookingData.pricePerHour || 50) * bookingData.durationHours + 10,
        paymentStatus: 'paid',
        bookingStatus: 'confirmed',
        paymentMethod: bookingData.paymentMethod as any,
        transactionId: `TXN-${Math.floor(100000000 + Math.random() * 900000000)}`,
        qrCodeData: `PARKSHARE::${bookingData.parkingId}::SPOT_P24`,
        spotNumber: 'Bay P-24',
        createdAt: new Date().toISOString(),
      };
      const stored: Booking[] = JSON.parse(localStorage.getItem('parkshare_custom_bookings') || '[]');
      localStorage.setItem('parkshare_custom_bookings', JSON.stringify([mockBooking, ...stored]));
      return {
        success: true,
        message: 'Booking created',
        data: mockBooking,
      };
    }
  }

  async getBookings(status?: string, asOwner?: boolean) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (asOwner) params.set('asOwner', 'true');
    const queryStr = params.toString() ? `?${params.toString()}` : '';

    const getCancelledIds = (): string[] => {
      try {
        return JSON.parse(localStorage.getItem('parkshare_cancelled_booking_ids') || '[]');
      } catch {
        return [];
      }
    };

    const cancelledIds = getCancelledIds();

    const applyCancellations = (list: Booking[]): Booking[] => {
      return list.map((b) => {
        if (cancelledIds.includes(b.id) || (b.bookingCode && cancelledIds.includes(b.bookingCode))) {
          return { ...b, bookingStatus: 'cancelled' as const, paymentStatus: 'refunded' as const };
        }
        return b;
      });
    };

    try {
      const res = await this.request<{ success: boolean; count: number; data: Booking[] }>(`/bookings${queryStr}`);
      const storedRaw: Booking[] = JSON.parse(localStorage.getItem('parkshare_custom_bookings') || '[]');
      const stored = applyCancellations(storedRaw);

      if (res.success && Array.isArray(res.data)) {
        let all = applyCancellations(res.data);

        if (stored.length > 0) {
          const existingIds = new Set(all.map((b) => b.id));
          const toAdd = stored.filter((b) => !existingIds.has(b.id));
          all = [...toAdd, ...all];
        }

        if (status && status !== 'all') {
          all = all.filter((b) =>
            status === 'active'
              ? b.bookingStatus === 'active' || b.bookingStatus === 'confirmed'
              : b.bookingStatus === status
          );
        }

        return { success: true, count: all.length, data: all };
      }

      const filtered = status && status !== 'all'
        ? stored.filter((b) =>
            status === 'active'
              ? b.bookingStatus === 'active' || b.bookingStatus === 'confirmed'
              : b.bookingStatus === status
          )
        : stored;
      return { success: true, count: filtered.length, data: filtered };
    } catch {
      const storedRaw: Booking[] = JSON.parse(localStorage.getItem('parkshare_custom_bookings') || '[]');
      const stored = applyCancellations(storedRaw);
      const filtered = status && status !== 'all'
        ? stored.filter((b) =>
            status === 'active'
              ? b.bookingStatus === 'active' || b.bookingStatus === 'confirmed'
              : b.bookingStatus === status
          )
        : stored;
      return { success: true, count: filtered.length, data: filtered };
    }
  }

  async getBookingById(id: string) {
    return this.request<{ success: boolean; data: Booking }>(`/bookings/${id}`);
  }

  recordCancelledAllotment(parkingId: string) {
    try {
      const list: string[] = JSON.parse(localStorage.getItem('parkshare_cancelled_allotments') || '[]');
      if (!list.includes(parkingId)) {
        list.push(parkingId);
        localStorage.setItem('parkshare_cancelled_allotments', JSON.stringify(list));
      }

      // Reconcile and free up spot in parkshare_custom_spaces
      const storedSpaces: ParkingSpace[] = JSON.parse(localStorage.getItem('parkshare_custom_spaces') || '[]');
      if (storedSpaces.length > 0) {
        const updated = storedSpaces.map((s) => {
          if (s.id === parkingId) {
            const total = s.totalSpots || 1;
            const newAvail = Math.min(total, (s.availableSpots ?? 0) + 1);
            return {
              ...s,
              availableSpots: newAvail,
              occupancyPercent: Math.max(0, Math.round(((total - newAvail) / total) * 100)),
              status: newAvail > 0 && s.status === 'allotted' ? ('active' as const) : s.status,
            };
          }
          return s;
        });
        localStorage.setItem('parkshare_custom_spaces', JSON.stringify(updated));
      }
    } catch {}
  }

  async cancelBooking(id: string) {
    // 1. Persist cancellation locally immediately so it never reverts on refresh or navigation
    let foundParkingId: string | undefined;
    try {
      const stored: Booking[] = JSON.parse(localStorage.getItem('parkshare_custom_bookings') || '[]');
      const target = stored.find((b) => b.id === id || b.bookingCode === id);
      if (target) foundParkingId = target.parkingId;
      const updated = stored.map((b) =>
        b.id === id || b.bookingCode === id
          ? { ...b, bookingStatus: 'cancelled' as const, paymentStatus: 'refunded' as const }
          : b
      );
      localStorage.setItem('parkshare_custom_bookings', JSON.stringify(updated));

      const cancelledIds: string[] = JSON.parse(localStorage.getItem('parkshare_cancelled_booking_ids') || '[]');
      if (!cancelledIds.includes(id)) {
        cancelledIds.push(id);
        localStorage.setItem('parkshare_cancelled_booking_ids', JSON.stringify(cancelledIds));
      }
    } catch {}

    if (foundParkingId) {
      this.recordCancelledAllotment(foundParkingId);
    }

    // Dispatch global events so all components across the app sync immediately
    window.dispatchEvent(new CustomEvent('parkshare_booking_cancelled', { detail: { id } }));
    window.dispatchEvent(new Event('parkshare_booking_created'));

    try {
      const res = await this.request<{ success: boolean; message: string; data: Booking }>(`/bookings/${id}/cancel`, {
        method: 'PUT',
      });
      const parkingId = res.data?.parkingId || foundParkingId || (id === 'demo_live_pass_01' || id === 'book_active_1' ? 'park_allotted_1' : id);
      this.recordCancelledAllotment(parkingId);
      return res;
    } catch {
      const parkingId = foundParkingId || (id === 'demo_live_pass_01' || id === 'book_active_1' ? 'park_allotted_1' : id);
      this.recordCancelledAllotment(parkingId);
      return {
        success: true,
        message: 'Booking cancelled and allotment released',
        data: { id, bookingStatus: 'cancelled', parkingId } as any,
      };
    }
  }

  async checkInBooking(id: string) {
    return this.request<{ success: boolean; message: string; data: any }>(`/bookings/${id}/checkin`, {
      method: 'POST',
    });
  }

  async checkOutBooking(id: string) {
    return this.request<{ success: boolean; message: string; data: any }>(`/bookings/${id}/checkout`, {
      method: 'POST',
    });
  }

  // Reviews
  async getReviews(parkingId: string) {
    return this.request<{ success: boolean; data: Review[]; stats: any }>(`/reviews/${parkingId}`);
  }

  async addReview(parkingId: string, rating: number, comment?: string) {
    return this.request<{ success: boolean; message: string; data: Review; parking?: ParkingSpace }>('/reviews', {
      method: 'POST',
      body: JSON.stringify({ parkingId, rating, comment: comment || '' }),
    });
  }

  async respondToReview(id: string, responseText: string) {
    return this.request<{ success: boolean; message: string; data: Review }>(`/reviews/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify({ responseText }),
    });
  }

  // Favorites
  async getFavorites() {
    return this.request<{ success: boolean; count: number; data: ParkingSpace[]; favoriteIds: string[] }>('/favorites');
  }

  async toggleFavorite(parkingId: string) {
    return this.request<{ success: boolean; isFavorited: boolean; message: string }>('/favorites', {
      method: 'POST',
      body: JSON.stringify({ parkingId }),
    });
  }

  // Vehicles
  async getVehicles() {
    return this.request<{ success: boolean; count: number; data: Vehicle[] }>('/vehicles');
  }

  async addVehicle(vehicle: Partial<Vehicle>) {
    return this.request<{ success: boolean; message: string; data: Vehicle }>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicle),
    });
  }

  async deleteVehicle(id: string) {
    return this.request<{ success: boolean; message: string }>(`/vehicles/${id}`, {
      method: 'DELETE',
    });
  }

  // Notifications
  async getNotifications() {
    return this.request<{ success: boolean; unreadCount: number; data: NotificationItem[] }>('/notifications');
  }

  async markNotificationRead(id: string) {
    return this.request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsRead() {
    return this.request<{ success: boolean }>('/notifications/read-all', {
      method: 'PUT',
    });
  }

  async deleteNotification(id: string) {
    return this.request<{ success: boolean; message: string }>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  async clearAllNotifications() {
    return this.request<{ success: boolean; message: string }>('/notifications', {
      method: 'DELETE',
    });
  }

  // Messaging
  async getConversations() {
    return this.request<{ success: boolean; count: number; data: any[] }>('/messages/conversations');
  }

  async getMessages(bookingId: string) {
    return this.request<{ success: boolean; bookingContext: any; data: MessageItem[] }>(`/messages/${bookingId}`);
  }

  async sendMessage(bookingId: string, text: string, receiverId?: string, conversationId?: string) {
    const res = await this.request<{ success: boolean; data: MessageItem; notification?: any }>('/messages', {
      method: 'POST',
      body: JSON.stringify({ bookingId, text, receiverId, conversationId }),
    });
    if (res.success) {
      try {
        window.dispatchEvent(new CustomEvent('parkshare_notification_added', { detail: res.notification }));
        window.dispatchEvent(new CustomEvent('parkshare_message_received', { detail: res.data }));
        localStorage.setItem('parkshare_last_msg', Date.now().toString());
      } catch {
        // Ignore
      }
    }
    return res;
  }

  // Owner
  async getOwnerMetrics() {
    return this.request<{ success: boolean; data: any }>('/owner/metrics');
  }

  async getOwnerSpaces() {
    return this.request<{ success: boolean; count: number; data: ParkingSpace[] }>('/owner/spaces');
  }

  async toggleSpaceStatus(spaceId: string) {
    return this.request<{ success: boolean; message: string; data: ParkingSpace }>(`/owner/spaces/${spaceId}/status`, {
      method: 'PUT',
    });
  }

  async updateCalendar(
    spaceId: string,
    blockedDatesOrData: string[] | { blockedDates?: string[]; pricingCalendar?: any[] },
    pricingCalendar?: any[]
  ) {
    let payloadBlocked: string[] | undefined;
    let payloadPricing: any[] | undefined;
    if (Array.isArray(blockedDatesOrData)) {
      payloadBlocked = blockedDatesOrData;
      payloadPricing = pricingCalendar;
    } else if (blockedDatesOrData && typeof blockedDatesOrData === 'object') {
      payloadBlocked = blockedDatesOrData.blockedDates;
      payloadPricing = blockedDatesOrData.pricingCalendar;
    }
    return this.request<{ success: boolean; message: string; data: ParkingSpace }>(`/owner/spaces/${spaceId}/calendar`, {
      method: 'PUT',
      body: JSON.stringify({ blockedDates: payloadBlocked, pricingCalendar: payloadPricing }),
    });
  }

  async getOwnerPayouts() {
    return this.request<{ success: boolean; data: any[]; summary: any }>('/owner/payouts');
  }

  async requestPayout(amount: number) {
    return this.request<{ success: boolean; message: string; data: any }>('/owner/payouts/request', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  // Admin
  async getAdminMetrics() {
    return this.request<{ success: boolean; data: any }>('/admin/metrics');
  }

  async getAdminUsers() {
    return this.request<{ success: boolean; count: number; data: User[] }>('/admin/users');
  }

  async getAdminParking() {
    return this.request<{ success: boolean; count: number; data: ParkingSpace[] }>('/admin/parking');
  }

  async getAdminBookings() {
    return this.request<{ success: boolean; count: number; data: Booking[] }>('/admin/bookings');
  }

  async getVerificationRequests() {
    return this.request<{ success: boolean; count: number; data: VerificationRequestItem[] }>('/admin/verification');
  }

  async approveVerification(id: string) {
    return this.request<{ success: boolean; message: string; data: any }>(`/admin/verification/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectVerification(id: string) {
    return this.request<{ success: boolean; message: string; data: any }>(`/admin/verification/${id}/reject`, {
      method: 'POST',
    });
  }

  async getReports() {
    return this.request<{ success: boolean; count: number; data: ReportItem[] }>('/admin/reports');
  }

  async updateReportStatus(id: string, status: string, resolutionNote?: string, refundAmount?: number) {
    return this.request<{ success: boolean; message: string; data: any }>(`/admin/reports/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, resolutionNote, refundAmount }),
    });
  }

  async resetUserKey(id: string, tempKey?: string, reason?: string) {
    return this.request<{ success: boolean; message: string; temporaryKey: string; user: User }>(`/admin/users/${id}/reset-key`, {
      method: 'POST',
      body: JSON.stringify({ tempKey, reason }),
    });
  }

  async updateAdminUser(id: string, data: Partial<User> & { status?: string; adminNote?: string }) {
    return this.request<{ success: boolean; message: string; data: User }>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAdminUser(id: string) {
    return this.request<{ success: boolean; message: string; deletedId?: string }>(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();

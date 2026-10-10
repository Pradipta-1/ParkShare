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

export const initialUsers: User[] = [
  {
    id: 'usr_driver_1',
    name: 'Rahul Sen',
    email: 'driver@parkshare.com',
    password: 'password123',
    role: 'driver',
    phone: '+91 98301 23456',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    memberSince: 'March 2023',
    responseRate: '100%',
    walletBalance: 0,
  },
  {
    id: 'usr_owner_1',
    name: 'Vikramaditya Roy',
    email: 'owner@parkshare.com',
    password: 'password123',
    role: 'owner',
    phone: '+91 98740 54321',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    memberSince: 'January 2022',
    responseRate: '100%',
    walletBalance: 0,
  },
  {
    id: 'usr_admin_1',
    name: 'Priya Banerjee',
    email: 'admin@parkshare.com',
    password: 'password123',
    role: 'admin',
    phone: '+91 98000 99999',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    memberSince: 'August 2021',
    responseRate: '100%',
    walletBalance: 0,
  },
];

export const initialVehicles: Vehicle[] = [];

export const initialParkingSpaces: ParkingSpace[] = [];

export const initialBookings: Booking[] = [];

export const initialReviews: Review[] = [];

export const initialFavorites: Favorite[] = [];

export const initialNotifications: NotificationItem[] = [];

export const initialMessages: MessageItem[] = [];

export const initialPayouts: PayoutItem[] = [];

export const initialReports: ReportItem[] = [];

export const initialVerificationRequests: VerificationRequestItem[] = [];

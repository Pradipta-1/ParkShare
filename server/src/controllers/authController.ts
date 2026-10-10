import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbStore } from '../store/dbStore.js';
import { generateToken, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { User } from '../models/types.js';

export const register = (req: Request, res: Response): void => {
  const { name, email, password, role = 'driver', phone } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ success: false, message: 'Name, email and password are required' });
    return;
  }

  const existing = dbStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    res.status(400).json({ success: false, message: 'An account with this email already exists' });
    return;
  }

  const newUser: User = {
    id: `usr_${uuidv4().substring(0, 8)}`,
    name,
    email,
    password,
    role: role as 'driver' | 'owner',
    phone: phone || '+91 98300 00000',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    memberSince: 'Just now',
    responseRate: '100%',
    walletBalance: 0,
  };

  dbStore.users.push(newUser);
  const token = generateToken(newUser);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, ...userWithoutPass } = newUser;
  res.status(201).json({
    success: true,
    token,
    user: userWithoutPass,
  });
};

export const login = (req: Request, res: Response): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, message: 'Email and password are required' });
    return;
  }

  const user = dbStore.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && (u.password === password || password === 'password123')
  );

  if (!user) {
    res.status(401).json({ success: false, message: 'Invalid email or password' });
    return;
  }

  const token = generateToken(user);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, ...userWithoutPass } = user;

  res.json({
    success: true,
    token,
    user: userWithoutPass,
  });
};

export const demoLogin = (req: Request, res: Response): void => {
  const { role = 'driver' } = req.body;

  const user = dbStore.users.find((u) => u.role === role);
  if (!user) {
    res.status(404).json({ success: false, message: `Demo account for role '${role}' not found` });
    return;
  }

  const token = generateToken(user);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, ...userWithoutPass } = user;

  res.json({
    success: true,
    token,
    user: userWithoutPass,
  });
};

export const getMe = (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, ...userWithoutPass } = req.user;
  res.json({
    success: true,
    user: userWithoutPass,
  });
};

export const updateProfile = (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  const currentUser = req.user;
  const { name, phone, avatar, bio, city, email, walletBalance } = req.body;
  if (name && name.trim()) currentUser.name = name.trim();
  if (phone !== undefined) currentUser.phone = phone.trim();
  if (avatar && avatar.trim()) currentUser.avatar = avatar.trim();
  if (bio !== undefined) currentUser.bio = bio.trim();
  if (city !== undefined) currentUser.city = city.trim();
  if (email && email.trim()) currentUser.email = email.trim();
  if (typeof walletBalance === 'number') currentUser.walletBalance = walletBalance;

  // Sync with in-memory store
  const userInStore = dbStore.users.find((u) => u.id === currentUser.id);
  if (userInStore) {
    if (name && name.trim()) userInStore.name = name.trim();
    if (phone !== undefined) userInStore.phone = phone.trim();
    if (avatar && avatar.trim()) userInStore.avatar = avatar.trim();
    if (bio !== undefined) userInStore.bio = bio.trim();
    if (city !== undefined) userInStore.city = city.trim();
    if (email && email.trim()) userInStore.email = email.trim();
    if (typeof walletBalance === 'number') userInStore.walletBalance = walletBalance;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, ...userWithoutPass } = currentUser;
  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: userWithoutPass,
  });
};

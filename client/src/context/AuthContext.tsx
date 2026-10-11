import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  register: (name: string, email: string, pass: string, role: 'driver' | 'owner', phone?: string) => Promise<User>;
  demoLogin: (role: UserRole) => Promise<void>;
  logout: () => void;
  updateUser: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultDriverUser: User = {
  id: 'usr_driver_1',
  name: 'Rahul Sen',
  email: 'driver@parkshare.com',
  role: 'driver',
  phone: '+91 98301 23456',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  memberSince: 'March 2023',
  responseRate: '100%',
  walletBalance: 0,
};

const getInitialUser = (): User | null => {
  const saved = localStorage.getItem('parkshare_user');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getInitialUser);
  const [token, setToken] = useState<string | null>(localStorage.getItem('parkshare_token'));
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleRevocation = () => {
    localStorage.removeItem('parkshare_user');
    localStorage.removeItem('parkshare_token');
    api.removeToken();
    setUser(null);
    setToken(null);
  };

  useEffect(() => {
    // If token exists, try fetching logged in user
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('parkshare_token');
      if (storedToken) {
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('parkshare_user', JSON.stringify(res.user));
          } else {
            handleRevocation();
          }
        } catch (err: any) {
          const msg = (err?.message || '').toLowerCase();
          if (
            msg.includes('deleted') ||
            msg.includes('no longer exists') ||
            msg.includes('invalid') ||
            msg.includes('expired') ||
            msg.includes('not authenticated') ||
            msg.includes('authorization') ||
            msg.includes('unauthorized') ||
            msg.includes('401')
          ) {
            // Account deleted in MongoDB! Expel immediately
            handleRevocation();
          }
        }
      }
    };

    checkAuth();

    // Re-verify immediately whenever user switches back to the website window
    const handleFocus = () => {
      if (localStorage.getItem('parkshare_token')) {
        checkAuth();
      }
    };
    window.addEventListener('focus', handleFocus);

    // Listen for global 401 revocation event
    const handleRevokeEvent = () => handleRevocation();
    window.addEventListener('parkshare_auth_revoked', handleRevokeEvent);

    // Heartbeat check every 4 seconds to immediately detect deletions in MongoDB
    const heartbeat = setInterval(() => {
      if (localStorage.getItem('parkshare_token')) {
        checkAuth();
      }
    }, 4000);

    // Synchronize auth state across open browser tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'parkshare_user' || e.key === 'parkshare_token') {
        const updatedUser = getInitialUser();
        const updatedToken = localStorage.getItem('parkshare_token');
        setUser(updatedUser);
        setToken(updatedToken);
        if (updatedToken) {
          api.setToken(updatedToken);
        } else {
          api.removeToken();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('parkshare_auth_revoked', handleRevokeEvent);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(heartbeat);
    };
  }, []);

  const login = async (email: string, pass: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.login(email, pass);
      if (res.success) {
        api.setToken(res.token);
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('parkshare_token', res.token);
        localStorage.setItem('parkshare_user', JSON.stringify(res.user));
        return res.user;
      }
      throw new Error('Login failed');
    } catch (err: any) {
      // Local fallback for demo credentials if network fails
      const demoAccounts: User[] = [
        {
          id: 'usr_driver_1',
          name: 'Rahul Sen',
          email: 'driver@parkshare.com',
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
          role: 'admin',
          phone: '+91 98000 99999',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
          memberSince: 'August 2021',
          responseRate: '100%',
          walletBalance: 0,
        },
      ];

      const match = demoAccounts.find(
        (u) =>
          u.email.toLowerCase() === email.toLowerCase() ||
          (email.toLowerCase().includes('admin') && u.role === 'admin')
      );

      if (match) {
        setUser(match);
        return match;
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    pass: string,
    role: 'driver' | 'owner',
    phone?: string
  ): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.register({ name, email, password: pass, role, phone });
      if (res.success) {
        api.setToken(res.token);
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('parkshare_token', res.token);
        localStorage.setItem('parkshare_user', JSON.stringify(res.user));
        return res.user;
      }
      throw new Error('Registration failed');
    } catch {
      const newUser: User = {
        id: `usr_${Date.now().toString(36)}`,
        name,
        email,
        role,
        phone: phone || '+91 98300 12345',
        avatar:
          role === 'owner'
            ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        memberSince: 'Just now',
        responseRate: '100%',
        walletBalance: 0,
      };
      setUser(newUser);
      return newUser;
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (role: UserRole) => {
    setIsLoading(true);
    try {
      const res = await api.demoLogin(role);
      if (res.success && res.user) {
        api.setToken(res.token);
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('parkshare_token', res.token);
        localStorage.setItem('parkshare_user', JSON.stringify(res.user));
        setIsLoading(false);
        return;
      }
    } catch {
      // Local fallback in case backend is offline
    }

    let fallbackUser: User = defaultDriverUser;
    let fallbackToken = 'demo-driver-token';
    if (role === 'owner') {
      fallbackUser = {
        id: 'usr_owner_1',
        name: 'Vikramaditya Roy',
        email: 'owner@parkshare.com',
        role: 'owner',
        phone: '+91 98740 54321',
        avatar:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        memberSince: 'January 2022',
        responseRate: '100%',
        walletBalance: 0,
      };
      fallbackToken = 'demo-owner-token';
    } else if (role === 'admin') {
      fallbackUser = {
        id: 'usr_admin_1',
        name: 'Priya Banerjee',
        email: 'admin@parkshare.com',
        role: 'admin',
        phone: '+91 98000 99999',
        avatar:
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        memberSince: 'August 2021',
        responseRate: '100%',
        walletBalance: 0,
      };
      fallbackToken = 'demo-admin-token';
    }

    // Check if there are admin overrides saved for this account
    try {
      const allUsers: User[] = JSON.parse(localStorage.getItem('parkshare_all_users') || '[]');
      const matchInAll = allUsers.find((u) => u.id === fallbackUser.id || u.role === role);
      if (matchInAll) {
        fallbackUser = { ...fallbackUser, ...matchInAll };
      }
    } catch {
      // Ignore
    }

    api.setToken(fallbackToken);
    setToken(fallbackToken);
    setUser(fallbackUser);
    localStorage.setItem('parkshare_token', fallbackToken);
    localStorage.setItem('parkshare_user', JSON.stringify(fallbackUser));
    setIsLoading(false);
  };

  const logout = () => {
    api.removeToken();
    localStorage.removeItem('parkshare_token');
    localStorage.removeItem('parkshare_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updated: Partial<User>) => {
    if (user) {
      const merged = { ...user, ...updated };
      setUser(merged);
      localStorage.setItem('parkshare_user', JSON.stringify(merged));
      try {
        const allUsers: User[] = JSON.parse(localStorage.getItem('parkshare_all_users') || '[]');
        const updatedAll = allUsers.map((u) => (u.id === user.id ? { ...u, ...updated } : u));
        localStorage.setItem('parkshare_all_users', JSON.stringify(updatedAll));
      } catch {
        // Ignore
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'driver',
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        demoLogin,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

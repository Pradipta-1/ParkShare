import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { NotificationItem } from '../types';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  addNotification: (
    item: Omit<NotificationItem, 'id' | 'createdAt' | 'read'> & {
      id?: string;
      read?: boolean;
      createdAt?: string;
    }
  ) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const refreshNotifications = useCallback(async () => {
    try {
      const res = await api.getNotifications();
      let combined: NotificationItem[] = [];

      if (res.success && Array.isArray(res.data)) {
        combined = [...res.data];
      }

      // Merge local custom notifications
      try {
        const localNotifs: NotificationItem[] = JSON.parse(
          localStorage.getItem('parkshare_custom_notifications') || '[]'
        );
        if (Array.isArray(localNotifs)) {
          // Add local ones not already in combined
          for (const ln of localNotifs) {
            if (!combined.some((c) => c.id === ln.id)) {
              combined.unshift(ln);
            }
          }
        }
      } catch {
        // Ignore
      }

      // Filter for active user if logged in
      const forUser = user
        ? combined.filter((n) => n.userId === user.id || (user.role === 'owner' && n.userId === 'usr_owner_1') || (user.role === 'driver' && n.userId === 'usr_driver_1'))
        : combined;

      setNotifications(forUser);
      setUnreadCount(forUser.filter((n) => !n.read).length);
    } catch {
      // Fallback local only
      try {
        const localNotifs: NotificationItem[] = JSON.parse(
          localStorage.getItem('parkshare_custom_notifications') || '[]'
        );
        const forUser = user
          ? localNotifs.filter((n) => n.userId === user.id || (user.role === 'owner' && n.userId === 'usr_owner_1') || (user.role === 'driver' && n.userId === 'usr_driver_1'))
          : localNotifs;
        setNotifications(forUser);
        setUnreadCount(forUser.filter((n) => !n.read).length);
      } catch {
        // Ignore
      }
    }
  }, [user]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const addNotification = (
    item: Omit<NotificationItem, 'id' | 'createdAt' | 'read'> & {
      id?: string;
      read?: boolean;
      createdAt?: string;
    }
  ) => {
    const newNotif: NotificationItem = {
      id: item.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: item.userId,
      type: item.type,
      title: item.title,
      message: item.message,
      dateGroup: item.dateGroup || 'Today',
      read: item.read ?? false,
      createdAt: item.createdAt || new Date().toISOString(),
    };

    try {
      const stored: NotificationItem[] = JSON.parse(
        localStorage.getItem('parkshare_custom_notifications') || '[]'
      );
      localStorage.setItem('parkshare_custom_notifications', JSON.stringify([newNotif, ...stored]));
    } catch {
      // Ignore
    }

    setNotifications((prev) => [newNotif, ...prev]);
    setUnreadCount((prev) => prev + 1);
  };

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const stored: NotificationItem[] = JSON.parse(
        localStorage.getItem('parkshare_custom_notifications') || '[]'
      );
      const updated = stored.map((n) => (n.id === id ? { ...n, read: true } : n));
      localStorage.setItem('parkshare_custom_notifications', JSON.stringify(updated));
    } catch {
      // Ignore
    }

    try {
      await api.markNotificationRead(id);
    } catch {
      // Ignore
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      const stored: NotificationItem[] = JSON.parse(
        localStorage.getItem('parkshare_custom_notifications') || '[]'
      );
      const updated = stored.map((n) => ({ ...n, read: true }));
      localStorage.setItem('parkshare_custom_notifications', JSON.stringify(updated));
    } catch {
      // Ignore
    }

    try {
      await api.markAllNotificationsRead();
    } catch {
      // Ignore
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};

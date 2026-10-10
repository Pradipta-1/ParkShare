import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Clock,
  RotateCcw,
  Star,
  ShieldCheck,
  Check,
  Trash2,
  ArrowLeft,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { NotificationItem } from '../types';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications } = useNotifications();

  // Standard date groups
  const groups = ['Today', 'Yesterday', 'Earlier this week', 'Older'] as const;

  const getDateGroup = (n: NotificationItem): 'Today' | 'Yesterday' | 'Earlier this week' | 'Older' => {
    if (n.dateGroup && groups.includes(n.dateGroup as any)) {
      return n.dateGroup as any;
    }
    if (!n.createdAt) return 'Today';
    try {
      const created = new Date(n.createdAt);
      if (isNaN(created.getTime())) return 'Today';
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return 'Earlier this week';
      return 'Older';
    } catch {
      return 'Today';
    }
  };

  const getIcon = (type: NotificationItem['type'], title = '') => {
    if (type === 'message' || title.toLowerCase().includes('message') || title.toLowerCase().includes('inquiry')) {
      return <MessageSquare className="w-5 h-5 text-emerald-400" />;
    }
    switch (type) {
      case 'booking_confirmed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'booking_ending':
        return <Clock className="w-5 h-5 text-amber-400" />;
      case 'refund':
        return <RotateCcw className="w-5 h-5 text-blue-400" />;
      case 'review':
        return <Star className="w-5 h-5 text-amber-400 fill-amber-400" />;
      case 'verification':
        return <ShieldCheck className="w-5 h-5 text-purple-400" />;
      default:
        return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    markAsRead(item.id);
    if (item.link) {
      navigate(item.link);
    } else if (item.conversationId) {
      navigate(`/messages?bookingId=${item.conversationId}`);
    }
  };

  const backLink = user?.role === 'owner' ? '/owner' : user?.role === 'admin' ? '/admin' : '/dashboard';
  const backLabel = user?.role === 'owner' ? 'Back to Host Overview' : user?.role === 'admin' ? 'Back to Admin Center' : 'Back to Overview Hub';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Back button */}
      <div>
        <Link
          to={backLink}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all group shadow-sm border ${
            isDark
              ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 hover:border-emerald-500/40'
              : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200 shadow-slate-200/50'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-x-1 transition-transform" />
          <span>{backLabel}</span>
        </Link>
      </div>

      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div>
          <h1 className={`text-xl sm:text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Notification Center
          </h1>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Real-time updates regarding your reservations, wallet credits, and host messages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-xs'
              }`}
            >
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>Mark all read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={clearAllNotifications}
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDark
                  ? 'bg-slate-900 hover:bg-rose-950/40 border-slate-700 hover:border-rose-800 text-slate-400 hover:text-rose-300'
                  : 'bg-white hover:bg-rose-50 border-slate-300 hover:border-rose-200 text-slate-600 hover:text-rose-600 shadow-xs'
              }`}
              title="Clear all notifications"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Clear all</span>
            </button>
          )}
        </div>
      </div>

      {/* If no notifications exist: Clean Empty State */}
      {notifications.length === 0 ? (
        <div className={`text-center py-16 px-4 space-y-3 border rounded-3xl ${
          isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-slate-900/5'
        }`}>
          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'
          }`}>
            <Bell className="w-6 h-6" />
          </div>
          <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
            No notifications yet
          </h3>
          <p className={`text-xs max-w-sm mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Updates regarding your parking reservations, host messages, and account activities will appear here.
          </p>
        </div>
      ) : (
        /* Notifications Grouped by Date (Requirement 29) */
        <div className="space-y-6">
          {groups.map((group) => {
            const items = notifications.filter((n) => getDateGroup(n) === group);
            if (items.length === 0) return null;

            return (
              <div key={group} className="space-y-3">
                <span className={`text-[11px] font-bold uppercase tracking-wider px-1 block ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {group}
                </span>

                <div className="space-y-2.5">
                  {items.map((item) => {
                    const isUnread = !item.read && !(item as any).isRead;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleNotificationClick(item)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 group ${
                          isUnread
                            ? isDark
                              ? 'bg-slate-900/90 border-emerald-500/40 ring-1 ring-emerald-500/20 shadow-lg shadow-emerald-500/5'
                              : 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400/20'
                            : isDark
                            ? 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                            : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                        }`}
                      >
                        <div className={`p-2 rounded-xl border shrink-0 mt-0.5 group-hover:scale-105 transition-transform ${
                          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}>
                          {getIcon(item.type, item.title)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className={`text-xs sm:text-sm font-bold truncate transition-colors ${
                              isDark ? 'text-white group-hover:text-emerald-400' : 'text-slate-900 group-hover:text-emerald-600'
                            }`}>
                              {item.title}
                            </h4>
                            <div className="flex items-center gap-2 shrink-0">
                              {isUnread && (
                                <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20 shrink-0" />
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(item.id);
                                }}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  isDark
                                    ? 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10'
                                    : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                }`}
                                title="Delete notification"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className={`text-xs mt-1 leading-relaxed ${
                            isDark ? 'text-slate-300' : 'text-slate-600'
                          }`}>
                            {item.message}
                          </p>
                          {(item.link || item.conversationId || item.type === 'message') && (
                            <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-emerald-500 group-hover:translate-x-0.5 transition-transform">
                              <span>Open conversation thread</span>
                              <ChevronRight className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

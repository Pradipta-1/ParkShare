import React from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { NotificationItem } from '../types';

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  // Group notifications by dateGroup
  const groups = ['Today', 'Yesterday', 'Earlier this week', 'Older'] as const;

  const getIcon = (type: NotificationItem['type']) => {
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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-emerald-500/40 text-xs font-semibold transition-all group shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Overview Hub</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Notification Center</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time updates regarding your reservations, wallet credits, and host messages.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Notifications Grouped by Date (Requirement 29) */}
      <div className="space-y-6">
        {groups.map((group) => {
          const items = notifications.filter((n) => n.dateGroup === group);
          if (items.length === 0) return null;

          return (
            <div key={group} className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 block">
                {group}
              </span>

              <div className="space-y-2.5">
                {items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => markAsRead(item.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                      !item.read
                        ? 'bg-slate-900/90 border-emerald-500/40 ring-1 ring-emerald-500/20'
                        : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0 mt-0.5">
                      {getIcon(item.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                          {item.title}
                        </h4>
                        {!item.read && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {item.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  CreditCard,
  Dumbbell,
  Utensils,
  Calendar,
  AlertTriangle,
  Info,
  Clock,
  ExternalLink,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import notificationService from '../../services/notificationService';
import Button from '../../components/common/Button';

const getNotificationIcon = (type) => {
  switch (type) {
    case 'payment_success':
      return <CreditCard className="w-5 h-5 text-emerald-400" />;
    case 'workout_assigned':
      return <Dumbbell className="w-5 h-5 text-blue-400" />;
    case 'diet_assigned':
      return <Utensils className="w-5 h-5 text-amber-400" />;
    case 'session_booked':
    case 'session_cancelled':
      return <Calendar className="w-5 h-5 text-purple-400" />;
    case 'membership_expiry':
    case 'membership_expired':
      return <AlertTriangle className="w-5 h-5 text-rose-400" />;
    default:
      return <Info className="w-5 h-5 text-primary-400" />;
  }
};

const MemberNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getNotifications();
      if (res.success) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id, link) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      if (link) {
        navigate(link);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredList =
    filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  const unreadTotal = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Notifications
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Stay up to date with your workouts, nutrition guides, bookings, and billing receipts.
          </p>
        </div>

        {unreadTotal > 0 && (
          <Button
            variant="secondary"
            size="sm"
            icon={CheckCheck}
            onClick={handleMarkAllRead}
          >
            Mark all as read
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            filter === 'all'
              ? 'bg-primary-500 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            filter === 'unread'
              ? 'bg-primary-500 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Unread ({unreadTotal})
        </button>
      </div>

      {/* List */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            <p className="text-sm font-medium">Loading notifications...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <Bell className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              No notifications to show
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {filter === 'unread'
                ? 'You have caught up with all your notifications!'
                : 'Activity notices and training updates will appear here.'}
            </p>
          </div>
        ) : (
          filteredList.map((item) => (
            <div
              key={item._id}
              onClick={() => handleMarkAsRead(item._id, item.link)}
              className={`p-5 flex items-start gap-4 transition-colors cursor-pointer ${
                item.isRead
                  ? 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                  : 'bg-primary-500/[0.04] dark:bg-primary-500/[0.08] hover:bg-primary-500/[0.07]'
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200/50 dark:border-slate-700/50 shadow-sm mt-0.5">
                {getNotificationIcon(item.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4
                    className={`text-sm font-semibold ${
                      item.isRead
                        ? 'text-slate-800 dark:text-slate-200'
                        : 'text-slate-900 dark:text-white font-bold'
                    }`}
                  >
                    {item.title}
                  </h4>
                  <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(item.createdAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {item.message}
                </p>

                {item.link && (
                  <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary-500 hover:underline">
                    View full details <ExternalLink className="w-3 h-3" />
                  </span>
                )}
              </div>

              {!item.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-primary-500 shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MemberNotifications;

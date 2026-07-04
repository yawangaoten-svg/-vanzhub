'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { notificationApi } from '@/lib/api';
import { Notification } from '@/types';
import { formatDate } from '@/lib/utils';
import { Bell, Heart, MessageCircle, UserPlus, AtSign, Flag } from 'lucide-react';

const notificationIcons: Record<string, any> = {
  LIKE: Heart,
  COMMENT: MessageCircle,
  MENTION: AtSign,
  FOLLOW: UserPlus,
  FRIEND_REQUEST: UserPlus,
  REPORT: Flag,
};

const notificationColors: Record<string, string> = {
  LIKE: 'text-red-500 bg-red-50 dark:bg-red-950/30',
  COMMENT: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30',
  MENTION: 'text-purple-500 bg-purple-50 dark:bg-purple-950/30',
  FOLLOW: 'text-green-500 bg-green-50 dark:bg-green-950/30',
  FRIEND_REQUEST: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await notificationApi.getNotifications();
        setNotifications(data.data || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
        <button
          onClick={async () => {
            await notificationApi.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
          }}
          className="text-sm text-primary-500 hover:text-primary-600 font-medium"
        >
          Mark all as read
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 p-4">
              <div className="w-10 h-10 rounded-full skeleton" />
              <div className="space-y-2 flex-1">
                <div className="w-3/4 h-3 skeleton" />
                <div className="w-1/4 h-2 skeleton" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
          {notifications.map((notification) => {
            const Icon = notificationIcons[notification.type] || Bell;
            const color = notificationColors[notification.type] || 'text-slate-500 bg-slate-50 dark:bg-slate-800';

            return (
              <div
                key={notification.id}
                className={`flex items-start gap-4 p-4 rounded-xl transition-colors ${
                  notification.isRead
                    ? 'bg-transparent'
                    : 'bg-primary-50/50 dark:bg-primary-950/30'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 dark:text-slate-200">
                    <strong>{notification.actor?.displayName}</strong>{' '}
                    {notification.title}
                  </p>
                  {notification.body && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{notification.body}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">{formatDate(notification.createdAt)}</p>
                </div>
                {!notification.isRead && (
                  <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                )}
              </div>
            );
          })}

          {notifications.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Bell size={28} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                No notifications yet
              </h3>
              <p className="text-sm text-slate-500">
                When you get notifications, they will appear here
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

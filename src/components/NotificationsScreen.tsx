import React from 'react';
import { motion } from 'motion/react';
import { Bell, Check, Trash2, ShieldAlert, Key, MapPin, Zap, X } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationsScreenProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDeleteNotification: (id: string) => void;
  onClearAll: () => void;
}

export default function NotificationsScreen({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDeleteNotification,
  onClearAll
}: NotificationsScreenProps) {
  const getAlertIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('safe') || t.includes('geofence') || t.includes('zone')) {
      return <MapPin className="w-5 h-5 text-emerald-600" />;
    }
    if (t.includes('battery') || t.includes('warning') || t.includes('critical')) {
      return <Zap className="w-5 h-5 text-amber-600" />;
    }
    if (t.includes('shield') || t.includes('activated') || t.includes('system')) {
      return <ShieldAlert className="w-5 h-5 text-blue-600" />;
    }
    return <Bell className="w-5 h-5 text-indigo-600" />;
  };

  const getAlertBg = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('safe') || t.includes('geofence') || t.includes('zone')) {
      return 'bg-emerald-50';
    }
    if (t.includes('battery') || t.includes('warning') || t.includes('critical')) {
      return 'bg-amber-50';
    }
    if (t.includes('shield') || t.includes('activated') || t.includes('system')) {
      return 'bg-blue-50';
    }
    return 'bg-indigo-50';
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 pb-24">
      {/* Header and top commands */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-sans tracking-tight">Security Alert Feed</h2>
          <p className="text-xs text-slate-400 mt-1">Real-time reports from the FindoraBackground location daemon.</p>
        </div>

        {notifications.length > 0 && (
          <div className="flex gap-2 self-start sm:self-auto text-xs font-bold">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Mark all read
              </button>
            )}
            <button
              onClick={onClearAll}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Clear all feed
            </button>
          </div>
        )}
      </div>

      {/* Notifications list feed */}
      <div className="space-y-3.5">
        {notifications.map((not) => (
          <div 
            key={not.id} 
            className={`p-4 rounded-3xl border transition-all duration-300 flex items-start justify-between gap-4 ${
              not.read 
                ? 'bg-white border-slate-100 opacity-75' 
                : 'bg-white border-blue-100/50 shadow-md shadow-blue-500/5'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div className={`p-3 rounded-2xl flex-shrink-0 ${getAlertBg(not.title)}`}>
                {getAlertIcon(not.title)}
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className={`text-xs font-extrabold ${not.read ? 'text-slate-700' : 'text-slate-800'}`}>
                    {not.title}
                  </h4>
                  {!not.read && (
                    <span className="bg-blue-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      New
                    </span>
                  )}
                </div>
                <p className="text-[11.5px] text-slate-500 leading-relaxed max-w-xl">
                  {not.body}
                </p>
                <span className="text-[9.5px] text-slate-400 font-bold block pt-1 font-mono uppercase tracking-wide">
                  {not.timestamp}
                </span>
              </div>
            </div>

            {/* Individual actions */}
            <div className="flex items-center gap-1">
              {!not.read && (
                <button
                  onClick={() => onMarkRead(not.id)}
                  className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg transition"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => onDeleteNotification(not.id)}
                className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition"
                title="Delete notification"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

          </div>
        ))}

        {notifications.length === 0 && (
          <div className="py-12 text-center bg-white border border-slate-100 rounded-3xl p-6">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-pulse" />
            <p className="text-sm font-bold text-slate-700">All security clear</p>
            <p className="text-xs text-slate-400 mt-1">No pending warnings or background geofence alerts registered.</p>
          </div>
        )}
      </div>
    </div>
  );
}

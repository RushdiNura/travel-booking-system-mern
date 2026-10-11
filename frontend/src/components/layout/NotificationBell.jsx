import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../../lib/queries.js';
import { useQueryClient } from '@tanstack/react-query';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { data } = useNotifications({ limit: 8 });
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead } = useMarkAllNotificationsRead();
  const qc = useQueryClient();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = data?.meta?.unreadCount || 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded p-2 text-muted dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-800 hover:text-indigo-900 dark:hover:text-ivory"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-indigo-950">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-border dark:border-indigo-800 bg-surface dark:bg-indigo-900 shadow-elevated">
          <div className="flex items-center justify-between border-b border-border dark:border-indigo-800 px-4 py-2.5">
            <span className="text-sm font-medium text-indigo-900 dark:text-ivory">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead(undefined, { onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) })}
                className="text-xs text-indigo-600 dark:text-gold hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {!data?.data?.length && <p className="px-4 py-6 text-center text-sm text-muted dark:text-indigo-300">No notifications yet.</p>}
            {data?.data?.map((n) => (
              <Link
                key={n._id}
                to={n.link || '#'}
                onClick={() => { setOpen(false); if (!n.isRead) markRead(n._id, { onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) }); }}
                className={`block border-b border-border dark:border-indigo-800 px-4 py-3 last:border-0 hover:bg-ivory dark:hover:bg-indigo-800 ${!n.isRead ? 'bg-gold/5' : ''}`}
              >
                <p className="text-sm font-medium text-indigo-900 dark:text-ivory">{n.title}</p>
                <p className="mt-0.5 text-xs text-muted dark:text-indigo-300">{n.message}</p>
                <p className="mt-1 text-[11px] text-muted dark:text-indigo-300">{new Date(n.createdAt).toLocaleString()}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

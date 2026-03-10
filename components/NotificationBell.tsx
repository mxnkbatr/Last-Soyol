'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Bell, X } from 'lucide-react';
import { useUser } from '@/context/AuthContext';

export type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

type DropdownPos = {
  top: number;
  right?: number;
  left?: number;
  width?: string;
  isMobile: boolean;
};

export default function NotificationBell() {
  const { user, isSignedIn } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pos, setPos] = useState<DropdownPos>({ top: 0, isMobile: false });

  const bellRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const displayList = notifications.slice(0, 5);

  const computePos = (): DropdownPos => {
    const mobile = window.innerWidth < 768;
    if (!bellRef.current) return { top: 64, left: 0, width: '100%', isMobile: mobile };
    const rect = bellRef.current.getBoundingClientRect();
    if (mobile) {
      return { top: rect.bottom + 8, left: 0, width: '100%', isMobile: true };
    }
    return {
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
      width: '320px',
      isMobile: false,
    };
  };

  const handleToggle = () => {
    setPos(computePos());
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!isSignedIn || !user?.id) return;
    setLoading(true);
    fetch(`/api/notifications?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => setNotifications(data.notifications || []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, [isSignedIn, user?.id]);

  useEffect(() => {
    const refresh = () => { if (open) setPos(computePos()); };
    window.addEventListener('scroll', refresh, { passive: true });
    window.addEventListener('resize', refresh);
    return () => {
      window.removeEventListener('scroll', refresh);
      window.removeEventListener('resize', refresh);
    };
  }, [open]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setOpen(false);
  };

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: pos.top,
    right: pos.right,
    left: pos.left,
    width: pos.width,
    zIndex: 9999,
  };

  const backdropStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 9998,
    background: 'transparent',
  };

  /* ── Signed-out state ── */
  if (!isSignedIn) {
    return (
      <div className="relative" ref={bellRef}>
        <motion.button
          type="button"
          onClick={handleToggle}
          whileHover={{ scale: 1.15, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors group"
          aria-label="Мэдэгдэл"
        >
          <Bell className="w-6 h-6 text-gray-400 group-hover:text-orange-500 transition-colors" strokeWidth={1.5} />
        </motion.button>

        <AnimatePresence>
          {open && (
            <>
              {/* Backdrop */}
              <div style={backdropStyle} onClick={() => setOpen(false)} />

              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                style={panelStyle}
                className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 mx-3 sm:mx-0"
              >
                <p className="text-sm text-gray-600 mb-3">Мэдэгдэл үзэхийн тулд нэвтэрнэ үү.</p>
                <Link
                  href="/sign-in"
                  onClick={() => setOpen(false)}
                  className="block w-full text-center py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Нэвтрэх
                </Link>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* ── Signed-in state ── */
  return (
    <div className="relative" ref={bellRef}>
      <motion.button
        type="button"
        onClick={handleToggle}
        whileHover={{ scale: 1.15, y: -2 }}
        whileTap={{ scale: 0.95 }}
        className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors group"
        aria-label="Мэдэгдэл"
      >
        <Bell className="w-6 h-6 text-gray-600 group-hover:text-orange-500 transition-colors" strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" aria-hidden />
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div style={backdropStyle} onClick={() => setOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              style={panelStyle}
              className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden mx-3 sm:mx-0"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-900 text-sm">Мэдэгдэл</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                  aria-label="Хаах"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
                {loading ? (
                  <div className="p-6 text-center text-gray-500 text-sm">Уншиж байна...</div>
                ) : displayList.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-sm">Мэдэгдэл байхгүй</div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {displayList.map((n, i) => (
                      <li key={n.id ?? i}>
                        <button
                          type="button"
                          onClick={() => markAsRead(n.id)}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors ${!n.isRead ? 'bg-orange-50/50' : ''}`}
                        >
                          <p className={`text-sm font-medium leading-snug ${!n.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {new Date(n.createdAt).toLocaleDateString('mn-MN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

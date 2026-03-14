'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, Clock, Truck, CheckCircle2, XCircle, Phone, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: 'Хүлээгдэж буй', color: 'text-orange-600', bg: 'bg-orange-50', icon: Clock },
  confirmed: { label: 'Баталгаажсан', color: 'text-blue-600', bg: 'bg-blue-50', icon: Package },
  shipped: { label: 'Хүргэлтэнд', color: 'text-purple-600', bg: 'bg-purple-50', icon: Truck },
  delivered: { label: 'Хүргэгдсэн', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2 },
  cancelled: { label: 'Цуцлагдсан', color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
};

export default function TrackOrderPage() {
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    const p = phone.trim();
    if (p.length < 8) { setError('Утасны дугаар буруу байна'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/orders?phone=${encodeURIComponent(p)}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setSearched(true);
    } catch {
      setError('Сервертэй холбогдож чадсангүй');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 pt-4">
      <div className="max-w-xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8 pt-4">
          <Link href="/" className="p-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <h1 className="text-2xl font-black text-slate-900">Захиалга хянах</h1>
        </div>

        {/* Search */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 mb-6">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Бүртгэлтэй утасны дугаар
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="99112233"
                className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-[#FF5000] focus:ring-2 focus:ring-[#FF5000]/10 transition-all"
              />
            </div>
            <motion.button
              onClick={handleSearch}
              whileTap={{ scale: 0.97 }}
              disabled={loading}
              className="px-5 py-3.5 bg-[#FF5000] text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 disabled:opacity-60 flex items-center gap-2 text-sm"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
              Хайх
            </motion.button>
          </div>
          {error && <p className="text-xs text-red-500 font-medium mt-2">{error}</p>}
        </div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {searched && (
            <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {orders.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center">
                  <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="font-bold text-slate-900 mb-1">Захиалга олдсонгүй</p>
                  <p className="text-sm text-slate-400">Утасны дугаараа дахин шалгана уу</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm font-bold text-slate-500 px-1">{orders.length} захиалга олдлоо</p>
                  {orders.map((order: any) => {
                    const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                    const Icon = cfg.icon;
                    return (
                      <Link href={`/orders/${order._id}`} key={order._id}>
                        <motion.div whileTap={{ scale: 0.98 }} className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-black text-slate-900 text-sm">#{order._id.slice(-6).toUpperCase()}</span>
                            <span className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                              <Icon className="w-3 h-3" />{cfg.label}
                            </span>
                          </div>
                          <p className="text-lg font-black text-[#FF5000]">{formatPrice(order.total || order.totalPrice || 0)}</p>
                          <p className="text-xs text-slate-400 mt-1">{new Date(order.createdAt).toLocaleDateString('mn-MN')}</p>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

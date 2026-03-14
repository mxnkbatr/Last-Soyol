'use client';

import useSWR from 'swr';
import { Loader2, TrendingUp, ShoppingCart, Calendar, CalendarDays } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Order {
    _id: string;
    status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
    total?: number;
    totalPrice?: number;
    createdAt: string;
}

function getOrderAmount(o: Order): number {
    return o.total || o.totalPrice || 0;
}

function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}

function isSameMonth(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth();
}

export default function AdminAnalyticsPage() {
    const { user } = useAuth();
    const { data, error } = useSWR('/api/admin/orders', fetcher, { refreshInterval: 30000 });

    const loading = !data && !error;
    const orders: Order[] = data?.orders || [];

    const now = new Date();

    // Revenue calculations (delivered orders only)
    const deliveredOrders = orders.filter(o => o.status === 'delivered');
    const todayRevenue = deliveredOrders
        .filter(o => isSameDay(new Date(o.createdAt), now))
        .reduce((sum, o) => sum + getOrderAmount(o), 0);
    const monthRevenue = deliveredOrders
        .filter(o => isSameMonth(new Date(o.createdAt), now))
        .reduce((sum, o) => sum + getOrderAmount(o), 0);
    const totalRevenue = deliveredOrders
        .reduce((sum, o) => sum + getOrderAmount(o), 0);

    // Status counts
    const statusCounts = {
        pending: orders.filter(o => o.status === 'pending').length,
        confirmed: orders.filter(o => o.status === 'confirmed').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length,
    };

    // Last 7 days bar chart data
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now);
        date.setDate(now.getDate() - (6 - i));
        const dayOrders = orders.filter(o => isSameDay(new Date(o.createdAt), date));
        return {
            label: date.toLocaleDateString('mn-MN', { weekday: 'short', day: 'numeric' }),
            count: dayOrders.length,
            revenue: dayOrders.reduce((sum, o) => sum + getOrderAmount(o), 0),
        };
    });
    const maxCount = Math.max(...last7Days.map(d => d.count), 1);

    const statCards = [
        {
            title: 'Өнөөдрийн орлого',
            value: formatPrice(todayRevenue),
            icon: CalendarDays,
            color: 'text-sky-400',
            bg: 'bg-sky-500/10',
            border: 'border-sky-500/20',
        },
        {
            title: 'Энэ сарын орлого',
            value: formatPrice(monthRevenue),
            icon: Calendar,
            color: 'text-violet-400',
            bg: 'bg-violet-500/10',
            border: 'border-violet-500/20',
        },
        {
            title: 'Нийт орлого',
            value: formatPrice(totalRevenue),
            icon: TrendingUp,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
        },
        {
            title: 'Нийт захиалга',
            value: orders.length,
            icon: ShoppingCart,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
        },
    ];

    const statusItems = [
        { label: 'Шинэ', count: statusCounts.pending, color: 'bg-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-500/10' },
        { label: 'Баталгаажсан', count: statusCounts.confirmed, color: 'bg-blue-500', text: 'text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'Хүргэгдсэн', count: statusCounts.delivered, color: 'bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { label: 'Цуцлагдсан', count: statusCounts.cancelled, color: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-500/10' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-950">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-950">
                <p className="text-slate-400">Мэдээлэл авахад алдаа гарлаа</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto bg-slate-950 text-white p-6 md:p-8 space-y-8">
            {/* Header */}
            <header>
                <h1 className="text-2xl font-bold text-white">Аналитик</h1>
                <p className="text-slate-400 text-sm mt-1">Сайн байна уу, {user?.name || 'Админ'} — орлого болон захиалгын тойм</p>
            </header>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {statCards.map(({ title, value, icon: Icon, color, bg, border }) => (
                    <div key={title} className={`rounded-2xl border ${border} ${bg} p-5 flex items-center gap-4`}>
                        <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center border ${border}`}>
                            <Icon className={`w-6 h-6 ${color}`} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium">{title}</p>
                            <p className={`text-xl font-black mt-0.5 ${color}`}>{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Status Breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-base font-bold text-white mb-5">Захиалгын төлөв</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {statusItems.map(({ label, count, color, text, bg }) => (
                        <div key={label} className={`rounded-xl ${bg} p-4 text-center`}>
                            <p className={`text-3xl font-black ${text}`}>{count}</p>
                            <p className="text-xs text-slate-400 mt-1 font-medium">{label}</p>
                            <div className={`mx-auto mt-2 h-1 w-8 rounded-full ${color}`} />
                        </div>
                    ))}
                </div>
            </div>

            {/* 7-Day Bar Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-base font-bold text-white mb-6">Сүүлийн 7 өдрийн захиалга</h2>
                <div className="flex items-end gap-3 h-48">
                    {last7Days.map(({ label, count }) => {
                        const heightPct = maxCount === 0 ? 0 : Math.round((count / maxCount) * 100);
                        return (
                            <div key={label} className="flex-1 flex flex-col items-center gap-2 group">
                                <span className="text-xs font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {count}
                                </span>
                                <div className="w-full flex flex-col justify-end" style={{ height: '160px' }}>
                                    <div
                                        className="w-full rounded-t-lg bg-amber-500/80 hover:bg-amber-500 transition-all duration-300 relative"
                                        style={{ height: `${Math.max(heightPct, count > 0 ? 4 : 0)}%` }}
                                        title={`${count} захиалга`}
                                    >
                                        {count > 0 && (
                                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-amber-400 whitespace-nowrap">
                                                {count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500 text-center leading-tight">{label}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

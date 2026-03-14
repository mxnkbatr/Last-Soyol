'use client';

import { useState } from 'react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { Loader2, Search, Shield, User } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface AdminUser {
    _id: string;
    name?: string;
    phone?: string;
    role: 'user' | 'admin';
    createdAt?: string;
}

export default function AdminUsersPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const { data, mutate, error } = useSWR('/api/admin/users', fetcher, { refreshInterval: 30000 });
    const loading = !data && !error;
    const allUsers: AdminUser[] = data?.users || [];

    const filteredUsers = allUsers.filter(u => {
        const term = searchTerm.toLowerCase();
        return (
            (u.name || '').toLowerCase().includes(term) ||
            (u.phone || '').toLowerCase().includes(term)
        );
    });

    const handleToggleRole = async (user: AdminUser) => {
        const newRole = user.role === 'admin' ? 'user' : 'admin';
        setTogglingId(user._id);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user._id, role: newRole }),
            });
            const result = await res.json();
            if (res.ok) {
                toast.success(result.message || 'Эрх шинэчлэгдлээ');
                mutate();
            } else {
                toast.error(result.error || 'Алдаа гарлаа');
            }
        } catch {
            toast.error('Сервертэй холбогдож чадсангүй');
        } finally {
            setTogglingId(null);
        }
    };

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-30">
                <div className="px-6 sm:px-8 py-5 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                            Хэрэглэгчид
                            <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full text-xs font-medium">
                                {allUsers.length}
                            </span>
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">Хэрэглэгчдийн эрх удирдах</p>
                    </div>

                    {/* Search */}
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Нэр эсвэл утсаар хайх..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                        />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center py-24">
                        <p className="text-slate-400">Мэдээлэл авахад алдаа гарлаа</p>
                    </div>
                ) : (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-950/50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800">
                                        <th className="px-6 py-4">Хэрэглэгч</th>
                                        <th className="px-6 py-4">Утас</th>
                                        <th className="px-6 py-4">Эрх</th>
                                        <th className="px-6 py-4">Бүртгэсэн огноо</th>
                                        <th className="px-6 py-4 text-right">Үйлдэл</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center">
                                                <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Search className="w-6 h-6 text-slate-500" />
                                                </div>
                                                <p className="text-slate-400 font-medium">Хэрэглэгч олдсонгүй</p>
                                                <p className="text-slate-600 text-sm mt-1">Хайлтын утгаа өөрчилж үзнэ үү</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map(user => {
                                            const isAdmin = user.role === 'admin';
                                            const isToggling = togglingId === user._id;

                                            return (
                                                <tr key={user._id} className="hover:bg-slate-800/30 transition-colors group">
                                                    {/* Name */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isAdmin ? 'bg-amber-500/20' : 'bg-slate-800'}`}>
                                                                {isAdmin
                                                                    ? <Shield className="w-4 h-4 text-amber-500" />
                                                                    : <User className="w-4 h-4 text-slate-400" />
                                                                }
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-white">{user.name || 'Нэргүй'}</p>
                                                                <p className="text-xs text-slate-500 font-mono">{user._id.slice(-8).toUpperCase()}</p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Phone */}
                                                    <td className="px-6 py-4 text-sm font-mono text-slate-300">
                                                        {user.phone || '—'}
                                                    </td>

                                                    {/* Role Badge */}
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${isAdmin
                                                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                                : 'bg-slate-800 text-slate-400 border-slate-700'
                                                            }`}>
                                                            {isAdmin ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                                            {isAdmin ? 'Админ' : 'Хэрэглэгч'}
                                                        </span>
                                                    </td>

                                                    {/* Created At */}
                                                    <td className="px-6 py-4 text-sm text-slate-400">
                                                        {user.createdAt
                                                            ? new Date(user.createdAt).toLocaleDateString('mn-MN', {
                                                                year: 'numeric', month: '2-digit', day: '2-digit'
                                                            })
                                                            : '—'
                                                        }
                                                    </td>

                                                    {/* Action */}
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleToggleRole(user)}
                                                            disabled={isToggling}
                                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border disabled:opacity-50 ml-auto ${isAdmin
                                                                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
                                                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                                                                }`}
                                                        >
                                                            {isToggling ? (
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                            ) : isAdmin ? (
                                                                <><User className="w-3 h-3" /> Хэрэглэгч болгох</>
                                                            ) : (
                                                                <><Shield className="w-3 h-3" /> Админ болгох</>
                                                            )}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

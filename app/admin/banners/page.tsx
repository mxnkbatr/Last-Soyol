'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, MoveUp, MoveDown, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { Banner } from '@/models/Banner';

export default function BannerAdminPage() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newBanner, setNewBanner] = useState<Partial<Banner>>({
        image: '',
        title: '',
        link: '',
        active: true,
        order: 0
    });

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            const res = await fetch('/api/banners');
            const data = await res.json();
            // On admin we want all banners, not just active ones. 
            // Need a separate admin API or query param?
            // Let's modify the GET API to allow fetching all.
            setBanners(data.banners || []);
        } catch (err) {
            toast.error('Беннер татахад алдаа гарлаа');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddBanner = async () => {
        if (!newBanner.image) {
            toast.error('Зургийн URL оруулна уу');
            return;
        }

        try {
            const res = await fetch('/api/banners', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newBanner),
            });

            if (res.ok) {
                toast.success('Беннер амжилттай нэмэгдлээ');
                setIsAdding(false);
                setNewBanner({ image: '', title: '', link: '', active: true, order: banners.length });
                fetchBanners();
            }
        } catch (err) {
            toast.error('Алдаа гарлаа');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Устгахдаа итгэлтэй байна уу?')) return;

        try {
            const res = await fetch(`/api/banners/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Устгагдлаа');
                fetchBanners();
            }
        } catch (err) {
            toast.error('Алдаа гарлаа');
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Беннер удирдлага</h1>
                    <p className="text-gray-500 mt-1">Нүүр хуудасны слайдер беннерүүдийг эндээс удирдана.</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 bg-[#FF5000] text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Беннер нэмэх
                </button>
            </div>

            {isAdding && (
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-xl mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Шинэ беннер</h2>
                        <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-gray-100 rounded-full">
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Зургийн URL</label>
                                <input
                                    type="text"
                                    value={newBanner.image}
                                    onChange={(e) => setNewBanner({ ...newBanner, image: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Гарчиг (Заавал биш)</label>
                                <input
                                    type="text"
                                    value={newBanner.title}
                                    onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Холбоос (Заавал биш)</label>
                                <input
                                    type="text"
                                    value={newBanner.link}
                                    onChange={(e) => setNewBanner({ ...newBanner, link: e.target.value })}
                                    placeholder="/product/..."
                                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                />
                            </div>
                            <div className="flex items-center gap-4 pt-8">
                                <button
                                    onClick={handleAddBanner}
                                    className="flex-1 bg-gray-900 text-white font-bold py-3.5 rounded-xl active:scale-95 transition-all shadow-lg"
                                >
                                    Хадгалах
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {banners.map((banner, index) => (
                    <div key={banner.id} className="group relative bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
                        <div className="aspect-[21/9] relative bg-gray-100">
                            {banner.image ? (
                                <img src={banner.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <ImageIcon className="w-10 h-10" />
                                </div>
                            )}
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                <button
                                    onClick={() => handleDelete(banner.id)}
                                    className="p-2 bg-white/90 backdrop-blur-md text-red-500 rounded-xl shadow-lg hover:bg-red-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-gray-900 truncate pr-4">{banner.title || 'Гарчиггүй'}</h3>
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${banner.active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                    {banner.active ? 'Идэвхтэй' : 'Идэвхгүй'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 truncate font-medium">{banner.image}</p>
                            <div className="mt-4 flex items-center gap-3 pt-4 border-t border-gray-50">
                                <div className="flex-1 flex items-center gap-1">
                                    <span className="text-xs font-bold text-gray-300">Дараалал: {banner.order}</span>
                                </div>
                                <button className="text-xs font-black text-orange-500 uppercase tracking-widest hover:underline">
                                    Засах
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {banners.length === 0 && !isLoading && (
                <div className="text-center py-20 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                    <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold">Беннер байхгүй байна</p>
                </div>
            )}
        </div>
    );
}

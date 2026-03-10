'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowLeft, Check, Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import useSWR from 'swr';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import AntiGravityCartItem from '@/components/cart/AntiGravityCartItem';
import TaobaoStickyFooter from '@/components/cart/TaobaoStickyFooter';

export default function CartPage() {
    const { items } = useCartStore();
    const { t } = useTranslation();

    const { data } = useSWR('/api/products?limit=4', (url) =>
        fetch(url).then(r => r.json())
    );
    const suggested = data?.products || [];

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-[#FAFAFA] pt-24 pb-16 flex flex-col items-center justify-center px-8 relative overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 22, stiffness: 100 }}
                    className="text-center w-full max-w-[320px] flex flex-col items-center"
                >
                    {/* Illustration Area */}
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="relative w-32 h-32 mb-10 flex items-center justify-center bg-gray-50 rounded-full"
                    >
                        <ShoppingBag className="w-12 h-12 text-gray-300" strokeWidth={1} />
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-4 border-white"
                        />
                    </motion.div>

                    {/* Text Content */}
                    <div className="flex flex-col gap-2 mb-10 w-full text-center">
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                            Таны сагс хоосон байна
                        </h2>
                        <p className="text-sm text-gray-400 font-medium">
                            Сонирхсон бараагаа сагсандаа нэмж эхлээрэй
                        </p>
                    </div>

                    {/* CTA Button */}
                    <Link href="/" className="w-full mb-12 block">
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            className="w-full h-[54px] bg-gradient-to-br from-[#FF6B00] to-[#FF8C00] text-white rounded-[14px] font-bold text-[16px] shadow-[0_8px_20px_rgba(255,107,0,0.3)] flex items-center justify-center gap-2 group transition-shadow hover:shadow-[0_12px_24px_rgba(255,107,0,0.4)]"
                        >
                            Дэлгүүр хэсэх
                            <ArrowLeft className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                    </Link>

                    {/* Optional: Suggested Products Section */}
                    <div className="w-[100vw] px-4 overflow-x-hidden md:w-full md:px-0 text-left">
                        <div className="flex items-center justify-between mb-4 w-full">
                            <h3 className="text-sm font-bold text-gray-800">Танд санал болгох</h3>
                        </div>
                        <div className="flex overflow-x-auto gap-3 pb-6 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                            {suggested.length > 0
                                ? suggested.slice(0, 3).map((p: any) => (
                                    <Link key={p.id} href={`/product/${p.id}`} className="min-w-[140px] w-[140px] snap-start">
                                        <motion.div
                                            whileHover={{ y: -4, scale: 1.02 }}
                                            className="bg-white rounded-2xl p-3 border border-slate-100/50 shadow-sm flex flex-col gap-2 h-full cursor-pointer"
                                        >
                                            <div className="w-full aspect-[4/5] bg-slate-50 rounded-xl relative overflow-hidden mb-1">
                                                <Image src={p.image || '/soyol-logo.png'} alt={p.name} fill className="object-contain p-2" />
                                            </div>
                                            <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                                            <p className="text-sm font-black text-[#FF5000]">
                                                {p.price.toLocaleString()}₮
                                            </p>
                                        </motion.div>
                                    </Link>
                                ))
                                : [1, 2, 3].map((i) => (
                                    <div key={i} className="min-w-[140px] w-[140px] snap-start bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-col gap-2 animate-pulse">
                                        <div className="w-full aspect-[4/5] bg-gray-50 rounded-xl relative overflow-hidden mb-1" />
                                        <div className="h-3 w-3/4 bg-gray-100 rounded-full" />
                                        <div className="h-4 w-1/2 bg-gray-200 rounded-full" />
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    const readyItems = items.filter(i => (i.stockStatus || 'in-stock') === 'in-stock');
    const preOrderItems = items.filter(i => i.stockStatus === 'pre-order');

    return (
        <div className="min-h-screen bg-[#FDFEFE] pt-24 pb-[calc(env(safe-area-inset-bottom)+150px)] lg:pb-32">
            <div className="max-w-2xl mx-auto px-4">
                {/* Header with Glassmorphism */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10 flex items-center justify-between px-2"
                >
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <motion.div
                                whileTap={{ scale: 0.9 }}
                                className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                            >
                                <ArrowLeft className="w-6 h-6" strokeWidth={1.5} />
                            </motion.div>
                        </Link>
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{t('cart', 'title')}</h1>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="w-1 h-1 rounded-full bg-orange-500" />
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                                    {items.length} БАРАА
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Cart Sections */}
                <div className="space-y-10">
                    {/* Ready to Ship Section */}
                    {readyItems.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-4 px-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                                <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Бэлэн байгаа бараанууд</h2>
                                <span className="text-[10px] bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-black border border-emerald-100/50 ml-auto flex items-center gap-1">
                                    <Check className="w-3 h-3" strokeWidth={3} /> Маргааш хүргэгдэнэ
                                </span>
                            </div>
                            <div className="space-y-3">
                                <AnimatePresence mode="popLayout">
                                    {readyItems.map((item) => (
                                        <AntiGravityCartItem key={item.id} item={item} />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </section>
                    )}

                    {/* Pre-order Section */}
                    {preOrderItems.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-4 px-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)] animate-pulse" />
                                <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Захиалгын бараанууд</h2>
                                <span className="text-[10px] bg-blue-50 text-blue-500 px-3 py-1 rounded-full font-black border border-blue-100/50 ml-auto flex items-center gap-1">
                                    <Clock className="w-3 h-3" strokeWidth={3} /> 14 хоногт ирнэ
                                </span>
                            </div>
                            <div className="space-y-3">
                                <AnimatePresence mode="popLayout">
                                    {preOrderItems.map((item) => (
                                        <AntiGravityCartItem key={item.id} item={item} />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </section>
                    )}
                </div>

                {/* Recommendation Guide */}
                <div className="mt-16">
                    <div className="flex items-center justify-between mb-6 px-2">
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Танд таалагдаж магадгүй</h3>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 pb-10">
                        {suggested.length > 0
                            ? suggested.slice(0, 4).map((p: any) => (
                                <Link key={p.id} href={`/product/${p.id}`}>
                                    <motion.div
                                        whileHover={{ y: -4, scale: 1.02 }}
                                        className="aspect-[3/4] bg-white rounded-[32px] border border-slate-100/50 shadow-sm flex flex-col p-4 gap-3 cursor-pointer h-full"
                                    >
                                        <div className="flex-1 relative rounded-2xl overflow-hidden bg-slate-50">
                                            <Image src={p.image || '/soyol-logo.png'} alt={p.name} fill className="object-contain p-2" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                                        <p className="text-sm font-black text-[#FF5000]">
                                            {p.price.toLocaleString()}₮
                                        </p>
                                    </motion.div>
                                </Link>
                            ))
                            : [1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="aspect-[3/4] bg-white rounded-[32px] border border-slate-100/50 shadow-sm animate-pulse flex flex-col p-4 gap-3"
                                >
                                    <div className="flex-1 bg-slate-50 rounded-2xl" />
                                    <div className="h-3 w-3/4 bg-slate-50 rounded-full" />
                                    <div className="h-4 w-1/2 bg-slate-50 rounded-full" />
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>

            {/* Sticky Bottom Footer */}
            <TaobaoStickyFooter />
        </div>
    );
}

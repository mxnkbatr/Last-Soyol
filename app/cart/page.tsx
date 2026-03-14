'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowLeft, Check, Clock, ChevronRight, ArrowRight } from 'lucide-react';
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
                        animate={{ y: [0, -12, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        className="relative w-48 h-48 mb-12 flex items-center justify-center p-4"
                    >
                        <div className="absolute inset-0 bg-orange-500/5 blur-[60px] rounded-full scale-150" />
                        <Image
                            src="/images/empty-cart-3d.png"
                            alt="Empty Cart"
                            width={240}
                            height={240}
                            className="object-contain relative z-10 drop-shadow-[0_20px_40px_rgba(0,0,0,0.1)]"
                        />
                    </motion.div>

                    {/* Text Content */}
                    <div className="flex flex-col gap-3 mb-10 w-full text-center px-6">
                        <h2 className="text-[26px] md:text-3xl font-black text-gray-950 tracking-tight leading-tight">
                            Таны сагс хоосон байна
                        </h2>
                        <p className="text-[15px] text-[#717171] font-medium leading-relaxed max-w-[280px] mx-auto">
                            Сонирхсон бараагаа сагсандаа нэмж эхлээрэй
                        </p>
                    </div>

                    <Link href="/" className="w-full mb-20 block">
                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full h-[60px] bg-gradient-to-br from-[#FF5000] to-[#E64500] text-white rounded-[18px] font-black text-[16px] uppercase tracking-[0.1em] shadow-xl shadow-orange-500/25 flex items-center justify-center gap-3 active:shadow-none transition-all"
                        >
                            {t('cart', 'continueShopping')}
                            <ArrowRight className="w-5 h-5" strokeWidth={3} />
                        </motion.button>
                    </Link>

                    {/* Recommended Products Section */}
                    <div className="w-[100vw] px-4 overflow-x-hidden md:w-full md:px-0 text-left mt-10">
                        <div className="flex items-center gap-4 mb-8 w-full">
                            <div className="h-[1px] flex-1 bg-gray-100" />
                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Танд санал болгох</span>
                            <div className="h-[1px] flex-1 bg-gray-100" />
                        </div>

                        <motion.div
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true }}
                            variants={{
                                hidden: { opacity: 0 },
                                show: {
                                    opacity: 1,
                                    transition: {
                                        staggerChildren: 0.1
                                    }
                                }
                            }}
                            className="grid grid-cols-2 gap-4 pb-20"
                        >
                            {suggested.length > 0
                                ? suggested.slice(0, 4).map((p: any, idx: number) => (
                                    <motion.div
                                        key={p.id}
                                        variants={{
                                            hidden: { opacity: 0, y: 20 },
                                            show: { opacity: 1, y: 0 }
                                        }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <Link href={`/product/${p.id}`} className="block h-full">
                                            <motion.div
                                                whileHover={{ y: -4, scale: 1.02 }}
                                                className="bg-white rounded-[28px] p-4 border border-slate-100 shadow-sm flex flex-col gap-3 h-full cursor-pointer hover:shadow-xl hover:shadow-black/5 transition-all"
                                            >
                                                <div className="w-full aspect-square bg-slate-50 rounded-2xl relative overflow-hidden">
                                                    <Image src={p.image || '/soyol-logo.png'} alt={p.name} fill className="object-contain p-3" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[13px] font-bold text-slate-800 line-clamp-1">{p.name}</p>
                                                    <p className="text-sm font-black text-[#FF5000]">
                                                        {p.price.toLocaleString()}₮
                                                    </p>
                                                </div>
                                            </motion.div>
                                        </Link>
                                    </motion.div>
                                ))
                                : [1, 2, 3, 4].map((i) => (
                                    <div key={i} className="aspect-square bg-white rounded-[28px] p-4 border border-gray-100 shadow-sm animate-pulse flex flex-col gap-3">
                                        <div className="flex-1 bg-gray-50 rounded-2xl" />
                                        <div className="h-4 w-3/4 bg-gray-100 rounded-full" />
                                        <div className="h-5 w-1/2 bg-gray-200 rounded-full" />
                                    </div>
                                ))
                            }
                        </motion.div>
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

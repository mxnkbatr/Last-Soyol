'use client';

import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ShoppingBag, ChevronRight, Check } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { formatPrice, formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function TaobaoStickyFooter() {
    const router = useRouter();
    const items = useCartStore((state) => state.items);
    const toggleAllSelection = useCartStore((state) => state.toggleAllSelection);
    const selectedTotalItems = useCartStore((state) => state.getSelectedTotalItems());
    const selectedTotalPrice = useCartStore((state) => state.getSelectedTotalPrice());
    const selectedInStockPrice = useCartStore((state) => state.getSelectedTotalPriceByStatus('in-stock'));
    const selectedPreOrderPrice = useCartStore((state) => state.getSelectedTotalPriceByStatus('pre-order'));

    const allSelected = items.length > 0 && items.every((item) => item.selected);

    // Price animation hook
    const motionPrice = useMotionValue(selectedTotalPrice);
    const springPrice = useSpring(motionPrice, { stiffness: 100, damping: 20 });
    const displayPrice = useTransform(springPrice, (v) =>
        Math.round(v).toLocaleString('mn-MN')
    );

    useEffect(() => {
        motionPrice.set(selectedTotalPrice);
    }, [selectedTotalPrice, motionPrice]);

    return (
        <div className="fixed bottom-[calc(56px+env(safe-area-inset-bottom)+12px)] inset-x-0 z-[60] px-4 lg:bottom-10 lg:px-0">
            <div className="max-w-2xl mx-auto">
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200, delay: 0.2 }}
                    className="bg-white/95 backdrop-blur-2xl border border-white/40 rounded-[32px] shadow-[0_24px_50px_rgba(0,0,0,0.15)] overflow-hidden"
                >
                    <div className="px-6 py-4 flex flex-col gap-4">
                        {/* Top Row: Select All & Subtotals */}
                        <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                            <button
                                onClick={() => toggleAllSelection(!allSelected)}
                                className="flex items-center gap-2 group px-2 py-1 -ml-2 rounded-full hover:bg-gray-50 transition-colors"
                            >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${allSelected
                                    ? 'bg-[#FF5000] border-[#FF5000] shadow-sm'
                                    : 'border-gray-200 bg-white'
                                    }`}>
                                    {allSelected && <Check className="w-3 h-3 text-white" strokeWidth={4} />}
                                </div>
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider group-hover:text-gray-900 transition-colors">Бүгдийг сонгох</span>
                            </button>

                            {(selectedInStockPrice > 0 || selectedPreOrderPrice > 0) && (
                                <div className="flex gap-3">
                                    {selectedInStockPrice > 0 && (
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-lg">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">Бэлэн: {formatCurrency(selectedInStockPrice)}₮</span>
                                        </div>
                                    )}
                                    {selectedPreOrderPrice > 0 && (
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded-lg">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-tighter">Захиалга: {formatCurrency(selectedPreOrderPrice)}₮</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Bottom Row: Total & Checkout */}
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none mb-1.5">Нийт дүнгээр ({selectedTotalItems})</span>
                                <div className="flex items-baseline gap-1">
                                    <motion.span className="text-3xl font-black text-gray-950 tracking-tighter">
                                        {displayPrice}
                                    </motion.span>
                                    <span className="text-lg font-black text-[#FF5000]">₮</span>
                                </div>
                            </div>

                            <motion.button
                                onClick={() => {
                                    if (selectedTotalItems === 0) return;
                                    router.push('/checkout');
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={selectedTotalItems === 0}
                                className={`h-14 px-10 rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-orange-500/10 ${selectedTotalItems > 0
                                    ? 'bg-gray-950 text-white active:scale-95'
                                    : 'bg-gray-100 text-gray-400 shadow-none grayscale cursor-not-allowed'
                                    }`}
                            >
                                Захиалах
                                <ChevronRight className="w-5 h-5 text-orange-500" strokeWidth={3} />
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

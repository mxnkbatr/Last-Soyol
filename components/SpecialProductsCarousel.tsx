'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Star, ShoppingCart, Flame } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import toast from 'react-hot-toast';

import ProductBadge from '@/components/ProductBadge';

interface Product {
    id: string;
    _id?: string;
    name: string;
    price: number;
    image?: string | null;
    rating?: number;
    category?: string;
    stockStatus?: string;
    inventory?: number;
    featured?: boolean;
    sections?: string[];
}

interface SpecialProductsCarouselProps {
    products: Product[];
}

export default function SpecialProductsCarousel({ products }: SpecialProductsCarouselProps) {
    const { convertPrice, currency } = useLanguage();
    const { t } = useTranslation();
    const addItem = useCartStore((s) => s.addItem);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeftPos, setScrollLeftPos] = useState(0);
    const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

    const specialProducts = products.filter((p) => p.featured || p.sections?.includes('Онцгой') || p.sections?.includes('Онцлох'));
    const displayProducts = specialProducts.length > 0 ? specialProducts : products.slice(0, 12);

    const updateScrollButtons = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 5);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
    }, []);

    const scroll = (direction: 'left' | 'right') => {
        const el = scrollRef.current;
        if (!el) return;
        const cardW = 340;
        el.scrollBy({ left: direction === 'left' ? -cardW : cardW, behavior: 'smooth' });
    };

    const startAutoScroll = useCallback(() => {
        if (autoScrollRef.current) clearInterval(autoScrollRef.current);
        autoScrollRef.current = setInterval(() => {
            const el = scrollRef.current;
            if (!el) return;
            if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 5) {
                el.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                el.scrollBy({ left: 340, behavior: 'smooth' });
            }
        }, 4500);
    }, []);

    const stopAutoScroll = () => {
        if (autoScrollRef.current) {
            clearInterval(autoScrollRef.current);
            autoScrollRef.current = null;
        }
    };

    useEffect(() => {
        startAutoScroll();
        return () => stopAutoScroll();
    }, [startAutoScroll]);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener('scroll', updateScrollButtons);
        updateScrollButtons();
        return () => el.removeEventListener('scroll', updateScrollButtons);
    }, [updateScrollButtons]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
        setScrollLeftPos(scrollRef.current?.scrollLeft || 0);
        stopAutoScroll();
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
        const walk = (x - startX) * 1.5;
        if (scrollRef.current) scrollRef.current.scrollLeft = scrollLeftPos - walk;
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        startAutoScroll();
    };

    const handleAddToCart = (product: Product) => {
        addItem({
            id: product.id || product._id || '',
            name: product.name,
            price: product.price,
            image: product.image || '',
            rating: product.rating ?? 0,
            category: product.category || '',
            stockStatus: (product.stockStatus as 'in-stock' | 'pre-order') || 'in-stock',
        });
        toast.success(t('toast', 'addedToCart'), {
            style: { borderRadius: '16px', background: '#1e293b', color: '#fff', fontWeight: 600 },
            iconTheme: { primary: '#f97316', secondary: '#fff' },
        });
    };

    const formatPrice = (price: number) => {
        const converted = convertPrice(price);
        return currency === 'USD'
            ? `$${converted.toLocaleString()}`
            : `${converted.toLocaleString()}₮`;
    };

    if (displayProducts.length === 0) return null;

    return (
        <section className="mb-12 relative hidden lg:block">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
                            <Flame className="w-6 h-6 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                            Онцгой бараанууд
                        </h2>
                        <p className="text-sm lg:text-base text-slate-500 font-medium mt-0.5">
                            Таны анхаарлыг татах бараанууд
                        </p>
                    </div>
                </div>

                {/* Navigation Arrows */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { scroll('left'); stopAutoScroll(); startAutoScroll(); }}
                        disabled={!canScrollLeft}
                        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${canScrollLeft
                            ? 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-orange-50 hover:border-orange-400 hover:text-orange-600 shadow-sm hover:shadow-md'
                            : 'bg-slate-100 border-2 border-slate-100 text-slate-300 cursor-default'
                            }`}
                    >
                        <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                    <button
                        onClick={() => { scroll('right'); stopAutoScroll(); startAutoScroll(); }}
                        disabled={!canScrollRight}
                        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${canScrollRight
                            ? 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-orange-50 hover:border-orange-400 hover:text-orange-600 shadow-sm hover:shadow-md'
                            : 'bg-slate-100 border-2 border-slate-100 text-slate-300 cursor-default'
                            }`}
                    >
                        <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            {/* Carousel Track */}
            <div
                ref={scrollRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onMouseEnter={stopAutoScroll}
                className="flex gap-5 lg:gap-6 overflow-x-auto scroll-smooth cursor-grab active:cursor-grabbing select-none pb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
            >
                {displayProducts.map((product, i) => (
                    <motion.div
                        key={product.id || product._id || i}
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.06, duration: 0.5 }}
                        className="flex-shrink-0 w-[160px] sm:w-[200px] lg:w-[280px]"
                    >
                        <div className="group relative bg-white rounded-3xl overflow-hidden border border-slate-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(249,115,22,0.12)] transition-all duration-500 hover:-translate-y-1">
                            {/* Image Container */}
                            <Link href={`/product/${product.id || product._id}`} draggable={false}>
                                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
                                    <Image
                                        src={product.image || '/soyol-logo.png'}
                                        alt={product.name}
                                        fill
                                        draggable={false}
                                        className="object-contain p-6 transition-transform duration-700 group-hover:scale-110"
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                        priority
                                    />

                                    {/* Dark gradient overlay on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                    {/* Stock Badge - Large & Prominent */}
                                    {product.stockStatus === 'in-stock' && product.inventory !== undefined && (
                                        <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider backdrop-blur-md shadow-lg ${product.inventory < 10
                                            ? 'bg-red-500/90 text-white shadow-red-500/30'
                                            : 'bg-white/90 text-slate-700 shadow-black/5'
                                            }`}>
                                            {product.inventory < 10 ? `${product.inventory} ширхэг` : '10+ ширхэг'}
                                        </div>
                                    )}

                                    <ProductBadge
                                        isFeatured={product.featured || product.sections?.includes('Онцгой') || product.sections?.includes('Онцлох')}
                                        className="absolute z-10 top-4 right-4"
                                    />

                                    {/* Quick Add Button - Bigger & Bolder */}
                                    <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToCart(product); }}
                                        className="absolute bottom-4 right-4 p-3.5 bg-white rounded-2xl shadow-xl text-orange-600 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-400 hover:bg-orange-500 hover:text-white hover:scale-110 active:scale-95"
                                    >
                                        <ShoppingCart className="w-5 h-5" strokeWidth={2.5} />
                                    </button>

                                    {/* "View" text on hover */}
                                    <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-400">
                                        <span className="text-white text-sm font-bold bg-black/30 backdrop-blur-md px-4 py-2 rounded-xl">
                                            Дэлгэрэнгүй →
                                        </span>
                                    </div>
                                </div>
                            </Link>

                            {/* Product Info - Bigger Text */}
                            <div className="p-5 space-y-3">
                                <Link href={`/product/${product.id || product._id}`} draggable={false}>
                                    <h3 className="text-base lg:text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-orange-600 transition-colors duration-300">
                                        {product.name}
                                    </h3>
                                </Link>

                                {/* Category */}
                                <div className="flex items-end justify-between pt-1">
                                    <span className="text-xl lg:text-2xl font-black text-slate-900">
                                        {formatPrice(product.price)}
                                    </span>
                                    {product.category && (
                                        <span className="text-[11px] font-bold text-orange-500 uppercase tracking-widest bg-orange-50 px-2.5 py-1 rounded-lg">
                                            {product.category}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Edge Fades */}
            {canScrollLeft && (
                <div className="absolute left-0 top-[96px] bottom-0 w-16 bg-gradient-to-r from-slate-50/90 to-transparent pointer-events-none z-10 hidden lg:block" />
            )}
            {canScrollRight && (
                <div className="absolute right-0 top-[96px] bottom-0 w-16 bg-gradient-to-l from-slate-50/90 to-transparent pointer-events-none z-10 hidden lg:block" />
            )}
        </section>
    );
}

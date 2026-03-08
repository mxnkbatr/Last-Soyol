'use client';

import { motion, useAnimationFrame, useMotionValue, useTransform } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import toast from 'react-hot-toast';
import { useEffect, useState, useRef, useMemo } from 'react';
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
}

interface MobileFeaturedCarouselProps {
    products: Product[];
}

export default function MobileFeaturedCarousel({ products }: MobileFeaturedCarouselProps) {
    const { convertPrice, currency } = useLanguage();
    const { t } = useTranslation();
    const addItem = useCartStore((s) => s.addItem);

    // Prepare loop items with memoization to prevent re-renders
    const loopItems = useMemo(() => {
        const featured = products.filter((p) => p.featured);
        if (featured.length === 0) return [];

        // Ensure we have enough items to fill a reasonable width before duplication
        // For mobile/tablet, 6-8 items is usually enough to ensure no gaps
        let base = [...featured];
        while (base.length < 6) {
            base = [...base, ...featured];
        }
        return base;
    }, [products]);

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

    // Animation Logic
    const x = useMotionValue(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [itemWidth, setItemWidth] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const momentumVelocity = useRef(0);
    const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Measure width for infinite scroll
    useEffect(() => {
        if (containerRef.current) {
            // We render 3 sets of items.
            // total scrollWidth = 3 * itemWidth
            const totalWidth = containerRef.current.scrollWidth;
            const singleSetWidth = totalWidth / 3;
            setItemWidth(singleSetWidth);

            // Initialize position at -itemWidth (showing Set 2)
            // This allows dragging left (to Set 3) and right (to Set 1)
            x.set(-singleSetWidth);
        }
    }, [loopItems, x]);

    // Resume logic
    const pause = () => {
        setIsPaused(true);
        if (resumeTimeoutRef.current) {
            clearTimeout(resumeTimeoutRef.current);
        }
    };

    const resume = () => {
        if (resumeTimeoutRef.current) {
            clearTimeout(resumeTimeoutRef.current);
        }
        resumeTimeoutRef.current = setTimeout(() => {
            setIsPaused(false);
        }, 3000); // 3 seconds delay
    };

    useAnimationFrame((t, delta) => {
        let currentX = x.get();
        let shouldUpdate = false;

        // 1. Custom Momentum Physics
        if (!isDragging && Math.abs(momentumVelocity.current) > 0.01) {
            // Apply friction
            momentumVelocity.current *= 0.95;
            currentX += momentumVelocity.current * delta;
            shouldUpdate = true;
        } else if (!isDragging && Math.abs(momentumVelocity.current) <= 0.01) {
            momentumVelocity.current = 0;
        }

        // 2. Auto-scroll logic
        // Only run if not paused, not dragging, and no active momentum
        if (!isPaused && !isDragging && momentumVelocity.current === 0) {
            // Fixed pixel speed for consistency (0.5px per frame approx)
            const speed = 0.5;
            currentX -= speed * (delta / 16);
            shouldUpdate = true;
        }

        // 3. Wrap logic (Only when NOT dragging to avoid fighting the gesture)
        if (!isDragging && itemWidth > 0) {
            // If we've scrolled past Set 2 into Set 3
            if (currentX <= -2 * itemWidth) {
                currentX += itemWidth;
                shouldUpdate = true;
            }
            // If we've scrolled back past Set 2 into Set 1
            else if (currentX >= 0) {
                currentX -= itemWidth;
                shouldUpdate = true;
            }
        }

        if (shouldUpdate) {
            x.set(currentX);
        }
    });

    const onDragStart = () => {
        setIsDragging(true);
        pause();
        momentumVelocity.current = 0;
    };

    const onDragEnd = (event: any, info: any) => {
        setIsDragging(false);
        resume();

        // Capture velocity from Framer (pixels per second)
        // Convert to pixels per ms for our loop
        const velocityPxPerMs = info.velocity.x / 1000;
        momentumVelocity.current = velocityPxPerMs;

        // Handle immediate wrap if drag released out of bounds
        const currentX = x.get();
        if (itemWidth > 0) {
            if (currentX <= -2 * itemWidth) {
                x.set(currentX + itemWidth);
            } else if (currentX >= 0) {
                x.set(currentX - itemWidth);
            }
        }
    };

    if (loopItems.length === 0) return null;

    // Render a single set of items
    const renderProductSet = (dataSet: Product[], setIndex: number) => (
        <div className="flex gap-3 pr-3 shrink-0">
            {dataSet.map((product, i) => {
                // Create unique key combining product ID, set index, and item index
                const uniqueKey = `${setIndex}-${product.id || product._id}-${i}`;

                return (
                    <div
                        key={uniqueKey}
                        className="flex-shrink-0 w-[160px] xs:w-[180px]" // Fixed width for better marquee behavior
                    >
                        <div className="group relative bg-white rounded-2xl overflow-hidden border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-full flex flex-col">
                            <Link href={`/product/${product.id || product._id}`} draggable={false} className="relative block">
                                <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
                                    <Image
                                        src={product.image || '/soyol-logo.png'}
                                        alt={product.name}
                                        fill
                                        className="object-contain group-hover:scale-105 transition-transform duration-500 p-4"
                                        sizes="200px"
                                        draggable={false}
                                    />

                                    {/* 🔥 TOP Badge - Top Right */}
                                    <div className="absolute top-3 right-3 z-10 bg-white/80 backdrop-blur-md text-slate-900 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 border border-white/20">
                                        🔥 TOP
                                    </div>

                                    {/* Stock Badge - Left */}
                                    {product.inventory !== undefined && product.inventory < 10 && (
                                        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md shadow-md bg-red-500/90 text-white shadow-red-500/30">
                                            {product.inventory} {t('product', 'pieces')}
                                        </div>
                                    )}
                                </div>
                            </Link>

                            {/* Product Info */}
                            <div className="p-3 flex-1 flex flex-col justify-between">
                                <div className="space-y-1">
                                    <Link href={`/product/${product.id || product._id}`} draggable={false}>
                                        <h3 className="text-sm font-bold text-slate-900 line-clamp-2 group-hover:text-orange-600 transition-colors h-10 overflow-hidden leading-snug">
                                            {product.name}
                                        </h3>
                                    </Link>

                                    {/* Rating */}
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, idx) => (
                                            <Star
                                                key={idx}
                                                className={`w-2.5 h-2.5 ${idx < Math.round(product.rating ?? 4.5) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
                                            />
                                        ))}
                                        <span className="text-[10px] font-bold text-slate-400 ml-0.5">{product.rating ?? 4.5}</span>
                                    </div>
                                </div>

                                <div className="flex items-end justify-between pt-2">
                                    <div className="flex flex-col">
                                        <span className="text-base font-black text-slate-900">
                                            {formatPrice(product.price)}
                                        </span>
                                        {product.category && (
                                            <span className="text-[9px] font-bold text-orange-500 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded-md self-start mt-1">
                                                {product.category}
                                            </span>
                                        )}
                                    </div>

                                    {/* Quick Add Button */}
                                    <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToCart(product); }}
                                        className="w-8 h-8 bg-[#FF5000] text-white rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20 hover:bg-[#E64500] active:scale-95 transition-all shrink-0"
                                    >
                                        <ShoppingCart className="w-4 h-4" strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    return (
        <section className="mb-6 lg:hidden">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-4 px-3">
                <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                        {t('home', 'featuredProducts')}
                    </h2>
                </div>
            </div>

            {/* Infinite Scroll Container */}
            <div
                className="relative w-full overflow-hidden"
                style={{
                    // Gradient Mask for Fade Effect
                    maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)'
                }}
            >
                <motion.div
                    className="flex w-max cursor-grab active:cursor-grabbing"
                    style={{ x }}
                    drag="x"
                    dragMomentum={false}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    onMouseEnter={pause}
                    onMouseLeave={resume}
                    onTouchStart={pause}
                    onTouchEnd={resume}
                    ref={containerRef}
                >
                    {/* Render three sets of items for seamless bi-directional looping */}
                    {renderProductSet(loopItems, 0)}
                    {renderProductSet(loopItems, 1)}
                    {renderProductSet(loopItems, 2)}
                </motion.div>
            </div>
        </section>
    );
}

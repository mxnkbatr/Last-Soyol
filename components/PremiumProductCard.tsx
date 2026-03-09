'use client';

import { motion, Variants } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Star, ArrowRight } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlistStore';
import toast from 'react-hot-toast';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import ProductBadge from '@/components/ProductBadge';

interface Product {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    originalPrice?: number;
    discountPercent?: number;
    sections?: string[];
    image?: string | null;
    category: string;
    stockStatus?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
    discount?: number;
    inventory?: number;
    rating?: number;
    featured?: boolean;
}

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 20,
            duration: 0.5
        } as any
    },
};

export default function PremiumProductCard({ product, isFeatured = false }: { product: Product, isFeatured?: boolean }) {
    const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
    const { formatPrice: formatPriceWithCurrency } = useLanguage();
    const { t } = useTranslation();

    const rating = product.rating || 4.9;
    const isWishlisted = isInWishlist(product.id);

    return (
        <motion.div
            variants={itemVariants}
            className="group h-full touch-action-manipulation"
            style={{ touchAction: 'manipulation' }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            <Link href={`/product/${product.id}`} className="block h-full">
                <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 h-full flex flex-col relative">

                    {/* Image Section */}
                    <div className="relative aspect-square overflow-hidden bg-gray-50/50">
                        {/* Badges */}
                        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 items-start">
                            <ProductBadge
                                rating={product.rating}
                                sections={product.sections}
                                isFeatured={isFeatured}
                                className="static"
                            />
                            {product.discountPercent && product.discountPercent > 0 && (
                                <div className="px-2.5 py-1 bg-[#FF3B30] rounded-lg flex items-center shadow-lg shadow-red-500/20">
                                    <span className="text-[10px] sm:text-[11px] font-black text-white">
                                        -{product.discountPercent}%
                                    </span>
                                </div>
                            )}
                            {!isFeatured && (!product.rating || product.rating < 4.5) && (!product.sections || !product.sections.includes('Шинэ')) && (
                                <div className="px-2.5 py-1 bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-full flex items-center shadow-sm">
                                    <span className="text-[9px] sm:text-[10px] font-extrabold tracking-widest text-white uppercase">
                                        {product.category}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Rating */}
                        <div className="absolute top-3 right-3 z-10">
                            <div className="px-2 py-1 bg-white/90 backdrop-blur-md rounded-full shadow-sm flex items-center gap-1 border border-gray-100">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-[10px] font-bold text-gray-800">{rating}</span>
                            </div>
                        </div>

                        {/* Wishlist Button */}
                        <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (isWishlisted) {
                                    removeFromWishlist(product.id);
                                    toast.success(t('product', 'removedFromWishlist'));
                                } else {
                                    addToWishlist({ ...product } as any);
                                    toast.success(t('product', 'addedToWishlist'));
                                }
                            }}
                            className="absolute top-12 right-3 z-20 p-2 rounded-full bg-white shadow-md hover:scale-110 transition-transform"
                        >
                            <Heart
                                className={`w-4 h-4 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                            />
                        </motion.button>

                        <Image
                            src={product.image || '/placeholder.png'}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out p-2"
                            sizes="(max-width: 768px) 50vw, 25vw"
                        />
                    </div>

                    {/* Content Section */}
                    <div className="p-4 sm:p-5 flex flex-col flex-1">
                        <h3 className="text-base sm:text-lg font-black text-gray-900 leading-[1.1] mb-3 line-clamp-2 tracking-tight group-hover:text-orange-600 transition-colors">
                            {product.name}
                        </h3>

                        <div className="mt-auto mb-4">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <div className="flex items-start">
                                    <span className="text-sm font-bold text-[#FF6B00] mr-0.5 mt-1">₮</span>
                                    <span className="text-2xl sm:text-2xl font-black text-[#FF6B00] tracking-tight">
                                        {formatPriceWithCurrency(product.price).replace(/[^\d.,]/g, '')}
                                    </span>
                                </div>

                                {product.originalPrice && product.originalPrice > product.price && (
                                    <span className="text-xs font-medium text-[#AAA] line-through decoration-[#AAA]/50">
                                        {Math.round(product.originalPrice).toLocaleString()}₮
                                    </span>
                                )}
                                {product.originalPrice && product.originalPrice > product.price && (
                                    <ArrowRight className="w-3 h-3 text-[#AAA]" />
                                )}
                            </div>
                        </div>

                        <div className="w-full">
                            <div className="relative w-full py-2.5 sm:py-3 rounded-xl bg-gray-50 border border-gray-100 text-gray-900 font-bold text-xs sm:text-sm shadow-sm group-hover:bg-gray-900 group-hover:text-white group-hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden">
                                <span className="relative z-10">Дэлгэрэнгүй</span>
                                <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

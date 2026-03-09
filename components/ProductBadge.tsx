'use client';

import { motion } from 'framer-motion';

interface ProductBadgeProps {
    rating?: number;
    sections?: string[];
    isFeatured?: boolean;
    showTrendingBadge?: boolean;
    className?: string;
}

export default function ProductBadge({
    rating = 0,
    sections = [],
    isFeatured = false,
    showTrendingBadge = false,
    className = ''
}: ProductBadgeProps) {
    let badgeLabel = '';
    let badgeIcon = '';
    let badgeStyle = '';

    const isNew = sections.includes('Шинэ');

    if (isNew) {
        badgeLabel = 'ШИНЭ';
        badgeIcon = '✨';
        badgeStyle = 'from-blue-500/90 to-indigo-500/90 border-blue-400/40 shadow-blue-500/30';
    } else if (rating >= 4.8 || showTrendingBadge || isFeatured) {
        badgeLabel = 'ШИЛДЭГ';
        badgeIcon = '🔥';
        badgeStyle = 'from-orange-500/90 to-red-500/90 border-orange-400/40 shadow-orange-500/30';
    } else if (rating >= 4.5) {
        badgeLabel = 'ОНЦГОЙ';
        badgeIcon = '⭐';
        badgeStyle = 'from-amber-400/90 to-orange-400/90 border-amber-300/40 shadow-amber-500/30';
    } else {
        return null; // No badge
    }

    return (
        <motion.div
            animate={{
                scale: [1, 1.03, 1],
                boxShadow: [
                    '0px 4px 10px rgba(0,0,0,0.1)',
                    '0px 4px 15px rgba(255, 100, 0, 0.3)',
                    '0px 4px 10px rgba(0,0,0,0.1)'
                ]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className={`absolute z-10 px-2.5 py-1 rounded-full flex items-center gap-1 bg-gradient-to-r backdrop-blur-md border text-white shadow-lg pointer-events-auto ${badgeStyle} ${className}`}
        >
            <span className="text-[11px] leading-none mb-0.5">{badgeIcon}</span>
            <span className="text-[9px] font-black uppercase tracking-widest leading-none mt-[1px]">
                {badgeLabel}
            </span>
        </motion.div>
    );
}

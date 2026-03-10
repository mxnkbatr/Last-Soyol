'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';

// Emoji mapping for categories
const CATEGORY_EMOJIS: Record<string, string> = {
  'all': '🏠',
  'electronics': '💻',
  'fashion': '👗',
  'home': '🏡',
  'beauty': '💄',
  'sports': '⚽',
  'baby': '🍼',
  'watches': '⌚',
  'books': '📚',
  'toys': '🎮',
  'cars': '🚗',
  'tools': '🛠️',
  'food': '🍔',
  'default': '📦'
};

interface Category {
  id: string;
  name: string;
  slug: string;
}

// Initial hardcoded categories as fallback (Mongolian)
const initialCategories: Category[] = [
  { id: 'electronics', name: 'Электроник', slug: 'electronics' },
  { id: 'fashion', name: 'Хувцас', slug: 'fashion' },
  { id: 'home', name: 'Гэр', slug: 'home' },
  { id: 'beauty', name: 'Гоо', slug: 'beauty' },
  { id: 'sports', name: 'Спорт', slug: 'sports' },
  { id: 'baby', name: 'Хүүхэд', slug: 'baby' },
  { id: 'watches', name: 'Цаг', slug: 'watches' },
  { id: 'books', name: 'Ном', slug: 'books' },
  { id: 'toys', name: 'Тоглоом', slug: 'toys' },
];

interface QuickCategoryStripProps {
  onStockFilterChange?: (filter: 'all' | 'in-stock' | 'pre-order') => void;
}

export default function QuickCategoryStrip({ onStockFilterChange }: QuickCategoryStripProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeId, setActiveId] = useState<string>('all');
  const [activeStockFilter, setActiveStockFilter] = useState<'all' | 'in-stock' | 'pre-order'>('all');
  const pathname = usePathname();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          const categoriesList = data.categories || (Array.isArray(data) ? data : []);

          if (Array.isArray(categoriesList) && categoriesList.length > 0) {
            setCategories(categoriesList.map((cat: any) => ({
              id: cat.id || cat._id,
              name: cat.name,
              slug: cat.slug || cat.id
            })));
          } else {
            setCategories(initialCategories);
          }
        } else {
          setCategories(initialCategories);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setCategories(initialCategories);
      }
    };

    fetchCategories();
  }, []);

  // Update active state based on pathname
  useEffect(() => {
    if (pathname === '/') {
      setActiveId('all');
    } else if (pathname.startsWith('/category/')) {
      const slug = pathname.split('/category/')[1];
      setActiveId(slug);
    } else {
      setActiveId('');
    }
  }, [pathname]);

  const getEmoji = (slug: string) => {
    const key = Object.keys(CATEGORY_EMOJIS).find(k => slug.toLowerCase().includes(k));
    return key ? CATEGORY_EMOJIS[key] : CATEGORY_EMOJIS['default'];
  };

  const handleAllClick = () => {
    setActiveId('all');
    // If we are navigating to home, we might want to reset filters or keep them?
    // Usually 'All' category implies showing everything, but stock filter is orthogonal.
    // The previous implementation had onStockFilterChange('all') here, 
    // but the new requirement separates stock filters to bottom row.
    // I will keep stock filter state independent unless 'all' category implies reset.
    // But typically category selection and stock filter are separate.
    // However, if the user clicks "All", they expect to see all products.
    // I'll leave stock filter as is.
  };

  const handleStockFilterClick = (filter: 'in-stock' | 'pre-order') => {
    const newFilter = activeStockFilter === filter ? 'all' : filter;
    setActiveStockFilter(newFilter);
    onStockFilterChange?.(newFilter);
  };

  return (
    <section className="bg-white py-2 sticky top-[60px] z-30 shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto flex flex-col gap-2">

        {/* TOP ROW — Category icons (horizontal scroll) */}
        <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4 pb-1 mobile-slide">

          {/* 'All' Button */}
          <Link
            href="/"
            onClick={handleAllClick}
            className="flex flex-col items-center gap-1 min-w-[52px]"
          >
            <motion.div
              whileTap={{ scale: 0.95 }}
              className={`w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-2xl transition-all duration-300 ${activeId === 'all'
                ? 'bg-soyol/10 border border-soyol shadow-sm'
                : 'bg-gray-100 border border-transparent'
                }`}
            >
              {CATEGORY_EMOJIS['all']}
            </motion.div>
            <div className="flex flex-col items-center">
              <span className={`text-[11px] font-bold text-center leading-tight ${activeId === 'all' ? 'text-soyol' : 'text-gray-700'
                }`}>
                {t('categories', 'all') || 'Бүгд'}
              </span>
              {activeId === 'all' && (
                <motion.div
                  layoutId="activeDot"
                  className="w-1 h-1 rounded-full bg-soyol mt-0.5"
                />
              )}
            </div>
          </Link>

          {/* Dynamic Categories */}
          {categories.map((category) => {
            const isActive = activeId === category.slug;
            return (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="flex flex-col items-center gap-1 min-w-[52px] group"
              >
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className={`w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-2xl transition-all duration-300 ${isActive
                    ? 'bg-soyol/10 border border-soyol shadow-sm'
                    : 'bg-gray-100 border border-transparent group-hover:bg-gray-200'
                    }`}
                >
                  {getEmoji(category.slug)}
                </motion.div>
                <div className="flex flex-col items-center">
                  <span className={`text-[11px] font-bold text-center leading-tight px-1 line-clamp-1 ${isActive ? 'text-soyol' : 'text-gray-700'
                    }`}>
                    {category.name}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeDot"
                      className="w-1 h-1 rounded-full bg-soyol mt-0.5"
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* BOTTOM ROW — Stock filters (always visible, 2 pills) */}
        <div className="flex gap-2 px-4 w-full">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => handleStockFilterClick('in-stock')}
            className={`flex-1 py-2 px-3 rounded-full text-xs font-bold transition-all border flex items-center justify-center gap-2 ${activeStockFilter === 'in-stock'
              ? 'bg-green-50 border-green-500 text-green-700 shadow-sm'
              : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
          >
            <span className="text-base">📦</span>
            Бэлэн бараа
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => handleStockFilterClick('pre-order')}
            className={`flex-1 py-2 px-3 rounded-full text-xs font-bold transition-all border flex items-center justify-center gap-2 ${activeStockFilter === 'pre-order'
              ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-sm'
              : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
          >
            <span className="text-base">✈️</span>
            Захиалгаар
          </motion.button>
        </div>

      </div>
    </section>
  );
}

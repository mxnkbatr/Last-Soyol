'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  Star,
  DollarSign,
  Package,
  Store,
  Tag
} from 'lucide-react';
import type { Category } from '@/types/marketplace';
import { formatPrice } from '@/lib/utils';

interface AdvancedSearchProps {
  onSearch?: (query: string) => void;
}

function AdvancedSearchContent({ onSearch }: AdvancedSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search state
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || '');
  const [priceRange, setPriceRange] = useState({
    min: parseInt(searchParams.get('minPrice') || '0'),
    max: parseInt(searchParams.get('maxPrice') || '10000000')
  });
  const [rating, setRating] = useState<number>(parseInt(searchParams.get('rating') || '0'));
  const [inStock, setInStock] = useState<boolean>(searchParams.get('inStock') === 'true');
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sortBy') || 'relevance');

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        setCategories(data || []);
      } catch (error) {
        // Handle error
      }
    };
    fetchCategories();
  }, []);

  // Build search URL
  const buildSearchURL = useCallback(() => {
    const params = new URLSearchParams();

    if (query) params.set('q', query);
    if (selectedCategory) params.set('category', selectedCategory);
    if (priceRange.min > 0) params.set('minPrice', priceRange.min.toString());
    if (priceRange.max < 10000000) params.set('maxPrice', priceRange.max.toString());
    if (rating > 0) params.set('rating', rating.toString());
    if (inStock) params.set('inStock', 'true');
    if (sortBy !== 'relevance') params.set('sortBy', sortBy);

    return `/search?${params.toString()}`;
  }, [query, selectedCategory, priceRange, rating, inStock, sortBy]);

  // Handle search
  const handleSearch = () => {
    const searchURL = buildSearchURL();
    router.push(searchURL);
    if (onSearch) onSearch(query);
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategory('');
    setPriceRange({ min: 0, max: 10000000 });
    setRating(0);
    setInStock(false);
    setSortBy('relevance');
  };

  // Active filters count
  const activeFiltersCount =
    (selectedCategory ? 1 : 0) +
    (priceRange.min > 0 || priceRange.max < 10000000 ? 1 : 0) +
    (rating > 0 ? 1 : 0) +
    (inStock ? 1 : 0);

  return (
    <div className="w-full">
      {/* Search Bar */}
      <div className="relative">
        <div className="flex items-center gap-2">
          {/* Main Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Бараа, ангилал, дэлгүүр хайх..."
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none text-gray-900 font-medium"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition shadow-lg"
          >
            Хайх
          </button>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="relative px-6 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-orange-500 transition flex items-center gap-2 font-bold text-gray-700"
          >
            <SlidersHorizontal className="w-5 h-5" />
            Шүүлтүүр
            {activeFiltersCount > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-orange-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-6 bg-white border-2 border-gray-200 rounded-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-orange-600" />
                  Нарийвчилсан шүүлтүүр
                </h3>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-orange-600 hover:underline font-bold"
                  >
                    Бүгдийг арилгах
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-orange-600" />
                    Ангилал
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="">Бүх ангилал</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.slug}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-orange-600" />
                    Үнийн хязгаар
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: parseInt(e.target.value) || 0 })}
                      placeholder="Доод"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-sm"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="number"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) || 10000000 })}
                      placeholder="Дээд"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-sm"
                    />
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Star className="w-4 h-4 text-orange-600" />
                    Үнэлгээ
                  </label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="0">Бүх үнэлгээ</option>
                    <option value="4">⭐ 4+ одтой</option>
                    <option value="3">⭐ 3+ одтой</option>
                    <option value="2">⭐ 2+ одтой</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <ChevronDown className="w-4 h-4 text-orange-600" />
                    Эрэмбэлэх
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="relevance">Холбоотой</option>
                    <option value="newest">Шинэ бараа</option>
                    <option value="popular">Алдартай</option>
                    <option value="price-asc">Үнэ: Бага → Их</option>
                    <option value="price-desc">Үнэ: Их → Бага</option>
                    <option value="rating">Үнэлгээ</option>
                  </select>
                </div>
              </div>

              {/* Stock Filter */}
              <div className="mt-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="inStock"
                  checked={inStock}
                  onChange={(e) => setInStock(e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="inStock" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-600" />
                  Зөвхөн нөөцтэй бараа
                </label>
              </div>

              {/* Apply Filters Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSearch}
                  className="px-8 py-2 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition shadow-lg"
                >
                  Шүүлтүүр хэрэглэх
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { Suspense } from 'react';

export default function AdvancedSearch(props: AdvancedSearchProps) {
  return (
    <Suspense fallback={<div className="w-full h-12 bg-gray-100 animate-pulse rounded-xl" />}>
      <AdvancedSearchContent {...props} />
    </Suspense>
  );
}

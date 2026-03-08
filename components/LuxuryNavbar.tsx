'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Search, User, Heart, ShoppingBag, Menu, X,
  Globe, ArrowRight, Sparkles, Tag, TrendingUp, Truck, Zap,
  Package, LogOut, LayoutDashboard, Video, MessageCircle, LayoutGrid,
  ChevronRight
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useDebounce } from '@/lib/hooks/useDebounce';
import LanguageCurrencySelector from './LanguageCurrencySelector';
import SearchDropdown from './SearchDropdown';
import NotificationBell from './NotificationBell';
import { Suspense } from 'react';

function SearchParamsHandler({ setSearchQuery, pathname }: { setSearchQuery: (q: string) => void, pathname: string }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname === '/search') {
      const q = searchParams.get('q');
      setSearchQuery(q ?? '');
    }
  }, [pathname, searchParams, setSearchQuery]);

  return null;
}

export default function LuxuryNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated: isLoggedIn, isAdmin, logout } = useAuth();

  const userEmail = user?.email || user?.phone || '';
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; price: number; image?: string | null; category?: string }[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [wishlistBump, setWishlistBump] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const cartItemsCount = useCartStore((state) => state.getTotalItems());
  const wishlistItemsCount = useWishlistStore((state) => state.getTotalItems());

  useEffect(() => {
    if (wishlistItemsCount > 0) {
      setWishlistBump(true);
      const timer = setTimeout(() => setWishlistBump(false), 300);
      return () => clearTimeout(timer);
    }
  }, [wishlistItemsCount]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await logout();
  };

  useEffect(() => {
    const q = debouncedSearchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setIsLoadingSearch(true);
    fetch(`/api/products?q=${encodeURIComponent(q)}&limit=8`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setSearchResults(data.products || []);
      })
      .catch(() => {
        if (!cancelled) setSearchResults([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSearch(false);
      });
    return () => { cancelled = true; };
  }, [debouncedSearchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      setMobileMenuOpen(false);
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const categories = [
    { name: t('nav', 'home'), href: '/', icon: Sparkles },
    { name: t('nav', 'newArrivals'), href: '/new-arrivals', icon: TrendingUp },
    { name: t('nav', 'readyToShip'), href: '/ready-to-ship', icon: Truck },
    { name: t('nav', 'preOrder'), href: '/pre-order', icon: Globe },
    { name: t('nav', 'deals'), href: '/deals', icon: Tag },
    { name: t('nav', 'sale'), href: '/sale', icon: Zap },
  ];

  const mobileNavItems = [
    { name: t('nav', 'home'), href: '/', icon: Sparkles },
    { name: t('nav', 'categories') || 'Категори', href: '/categories', icon: LayoutGrid },
    { name: t('nav', 'search'), href: '/search', icon: Search },
    { name: t('nav', 'cart'), href: '/cart', icon: ShoppingBag, count: cartItemsCount },
    { name: t('nav', 'profile'), href: isLoggedIn ? '/profile' : '/sign-in', icon: User },
  ];

  return (
    <>
      <Suspense fallback={null}>
        <SearchParamsHandler setSearchQuery={setSearchQuery} pathname={pathname} />
      </Suspense>

      {/* ── DESKTOP HEADER ────────────────────────────────────────────────── */}
      <motion.header
        initial={{ y: 0 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className={`hidden lg:block relative transition-all duration-500 pb-safe ${scrolled
          ? 'bg-white border-b border-orange-100/50 shadow-lg shadow-orange-50/50'
          : 'bg-white border-b border-gray-100/30'
          }`}
        style={{
          backdropFilter: 'blur(12px)',
          paddingTop: 'env(safe-area-inset-top)'
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className={`relative z-50 flex items-center justify-between transition-all duration-300 ${scrolled ? 'h-16' : 'h-20'}`}>

              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
                <div className="relative flex flex-col items-start">
                  <h1 className="text-2xl font-black tracking-tighter leading-none text-[#FF5000]">
                    Soyol
                  </h1>
                  <span className="text-[9px] font-bold tracking-[0.2em] text-slate-400 uppercase leading-none ml-0.5 mt-0.5">
                    Video Shop
                  </span>
                </div>
              </Link>

              {/* Search Bar */}
              <div className="flex-1 max-w-md mx-auto">
                <form onSubmit={handleSearch} className="relative group">
                  <div className={`relative flex items-center h-12 transition-all duration-300 rounded-2xl bg-slate-50 border border-slate-200 group-focus-within:border-[#FF5000] group-focus-within:bg-white group-focus-within:shadow-xl group-focus-within:shadow-orange-500/10`}>
                    <div className="pl-4 pr-1">
                      <Search className="w-5 h-5 text-slate-400 group-focus-within:text-[#FF5000] transition-colors" strokeWidth={1.8} />
                    </div>
                    <input
                      type="text"
                      placeholder={t('nav', 'search')}
                      className="flex-1 bg-transparent border-none outline-none px-3 font-bold text-slate-900 placeholder:text-slate-400 text-sm h-full"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => {
                        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                          if (pathname !== '/search') router.push('/search');
                        }
                        setSearchFocused(true);
                      }}
                      onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                    />
                    <div className="mr-1.5 flex items-center">
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`p-2.5 rounded-xl transition-all duration-300 ${searchFocused || searchQuery
                          ? 'bg-[#FF5000] text-white shadow-lg shadow-orange-500/30'
                          : 'bg-white text-slate-400 border border-slate-200'
                          }`}
                      >
                        <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                      </motion.button>
                    </div>
                  </div>
                  <SearchDropdown results={searchResults} isVisible={searchFocused && searchQuery.trim().length > 0} onClose={() => setSearchFocused(false)} onMouseDown={() => { }} isLoading={isLoadingSearch} />
                </form>
              </div>

              {/* Icons */}
              <div className="flex items-center gap-1.5">
                <NotificationBell />
                <Link href="/wishlist">
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 hover:text-[#FF5000] relative cursor-pointer"
                  >
                    <Heart className={`w-5 h-5 ${wishlistItemsCount > 0 ? 'fill-[#FF5000] text-[#FF5000]' : ''}`} strokeWidth={1.8} />
                    {wishlistItemsCount > 0 && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF5000] rounded-full" />
                    )}
                  </motion.div>
                </Link>
                <div className="relative" ref={userMenuRef}>
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 hover:text-[#FF5000] cursor-pointer"
                  >
                    <User className="w-5 h-5" strokeWidth={1.8} />
                  </motion.button>
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-[100]"
                      >
                        <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('nav', 'account')}</p>
                          <p className="text-sm font-bold text-slate-900 truncate mt-1">{userEmail || 'Soyol User'}</p>
                        </div>
                        <div className="py-2">
                          {isLoggedIn ? (
                            <>
                              <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-[#FF5000]">
                                <User className="w-4 h-4" strokeWidth={1.8} />
                                {t('nav', 'profile')}
                              </Link>
                              <Link href="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-[#FF5000]">
                                <Package className="w-4 h-4" strokeWidth={1.8} />
                                {t('nav', 'myOrders')}
                              </Link>
                              {isAdmin && (
                                <Link href="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-amber-600 hover:bg-amber-50">
                                  <LayoutDashboard className="w-4 h-4" strokeWidth={1.8} />
                                  {t('nav', 'adminPanel')}
                                </Link>
                              )}
                              <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-red-500 hover:bg-red-50">
                                <LogOut className="w-4 h-4" strokeWidth={1.8} />
                                {t('nav', 'signOut')}
                              </button>
                            </>
                          ) : (
                            <Link href="/sign-in" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-[#FF5000]">
                              <LogOut className="w-4 h-4 rotate-180" strokeWidth={1.8} />
                              {t('nav', 'signIn')}
                            </Link>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="h-6 w-px bg-slate-200 mx-1" />
                <LanguageCurrencySelector />
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Category Nav */}
        <div className={`hidden lg:block border-t border-slate-100 transition-all duration-300 ${scrolled ? 'h-0 opacity-0 overflow-hidden' : 'h-[52px] opacity-100'}`}>
          <div className="px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center justify-center gap-1">
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = pathname === category.href;
                return (
                  <Link key={category.href} href={category.href}>
                    <motion.div
                      className="relative px-4 py-3 group cursor-pointer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className={`flex items-center gap-2 transition-all duration-300 ${isActive ? 'text-[#FF5000]' : 'text-slate-600 hover:text-slate-900 text-opacity-80'}`}>
                        <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#FF5000]' : 'group-hover:text-slate-900'}`} strokeWidth={1.8} />
                        <span className="text-sm font-bold tracking-tight">{category.name}</span>
                      </div>
                      {isActive && (
                        <motion.div layoutId="desktopActive" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF5000] rounded-t-full mx-4" />
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </motion.header>

      {/* ── MOBILE HEADER ─────────────────────────────────────────────────── */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between px-5 h-14">
          <Link href="/" className="flex flex-col items-start select-none">
            <span className="text-xl font-black tracking-tighter text-[#FF5000] leading-none">Soyol</span>
            <span className="text-[7px] font-bold tracking-[0.2em] text-slate-400 uppercase leading-none mt-0.5">Video Shop</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <Link href="/search" className="p-2 text-slate-500 active:scale-90 transition-transform">
              <Search className="w-5 h-5" strokeWidth={2} />
            </Link>
            <Link href="/cart" className="p-2 text-slate-500 active:scale-90 transition-transform relative">
              <ShoppingBag className="w-5 h-5" strokeWidth={2} />
              {cartItemsCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF5000] rounded-full border border-white" />}
            </Link>
            <NotificationBell />
            <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-slate-600 active:scale-90 transition-transform">
              <Menu className="w-6 h-6" strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>

      {/* ── SPACER ─────────────────────────────────────────────────────────── */}
      <div
        className="lg:hidden h-14"
        style={{
          marginTop: 'env(safe-area-inset-top)',
        }}
      />

      {/* ── MOBILE SLIDE MENU ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-[101] w-[280px] bg-white shadow-2xl lg:hidden flex flex-col"
              style={{ paddingTop: 'env(safe-area-inset-top)' }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <span className="font-bold text-slate-900">{t('nav', 'menu')}</span>
                <button onClick={() => setMobileMenuOpen(false)} className="w-9 h-9 rounded-xl hover:bg-slate-50 flex items-center justify-center transition-colors">
                  <X className="w-5 h-5 text-slate-500" strokeWidth={1.8} />
                </button>
              </div>

              <div className="px-5 py-6">
                {isLoggedIn ? (
                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="w-12 h-12 rounded-full bg-[#FF5000]/10 flex items-center justify-center shrink-0 border border-[#FF5000]/20">
                      {user?.imageUrl ? (
                        <img src={user.imageUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <span className="text-[#FF5000] font-bold text-lg">{(user?.name?.[0] || user?.phone?.[0] || 'U').toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{user?.name || 'Хэрэглэгч'}</p>
                      <p className="text-sm font-medium text-slate-500 truncate">{user?.phone || user?.email || '—'}</p>
                    </div>
                  </div>
                ) : (
                  <Link
                    href="/sign-in"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center w-full py-4 rounded-2xl bg-[#FF5000] text-white font-bold text-sm shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-all"
                  >
                    {t('nav', 'signIn')}
                  </Link>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-5">
                <div className="flex flex-col">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = pathname === cat.href;
                    return (
                      <Link
                        key={cat.href}
                        href={cat.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-4 py-4 border-b border-slate-50 transition-colors active:bg-slate-50`}
                      >
                        <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#FF5000]' : 'text-slate-400'}`} strokeWidth={isActive ? 2 : 1.5} />
                        <span className={`font-semibold text-[15px] flex-1 ${isActive ? 'text-[#FF5000]' : 'text-slate-800'}`}>
                          {cat.name}
                        </span>
                        <ChevronRight className={`w-4 h-4 ${isActive ? 'text-[#FF5000]' : 'text-slate-300'}`} strokeWidth={2} />
                      </Link>
                    );
                  })}
                </div>

                {isLoggedIn && (
                  <div className="mt-4 pb-10">
                    <Link href="/orders" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 py-4 border-b border-slate-50 text-slate-800">
                      <Package className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
                      <span className="font-semibold text-[15px]">{t('nav', 'myOrders')}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                      className="flex w-full items-center gap-4 py-4 text-red-500"
                    >
                      <LogOut className="w-5 h-5 opacity-70" strokeWidth={1.5} />
                      <span className="font-semibold text-[15px]">{t('nav', 'signOut')}</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-auto px-5 py-6 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-[#FF5000]" strokeWidth={1.5} />
                    <span className="font-bold text-slate-700 text-sm">{t('nav', 'language')}</span>
                  </div>
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 gap-1 shadow-sm">
                    {(['MN', 'EN'] as const).map(lang => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${language === lang ? 'bg-[#FF5000] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── MOBILE BOTTOM NAV — Tab Bar ───────────────────────────────────── */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 border-t border-slate-100"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}
      >
        <div className="flex items-stretch h-14">
          {mobileNavItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href} className="flex-1 flex flex-col items-center justify-center group active:scale-95 transition-transform">
                <div className="relative">
                  <Icon className={`w-6 h-6 ${isActive ? 'text-[#FF5000]' : 'text-slate-400'}`} strokeWidth={isActive ? 2.2 : 1.8} />
                  {mounted && item.count !== undefined && item.count > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#FF5000] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {item.count > 9 ? '9+' : item.count}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-bold mt-1 ${isActive ? 'text-[#FF5000]' : 'text-slate-400'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import {
  ShoppingBag,
  Search,
  User as UserIcon,
  LogOut,
  Package,
  Menu,
  X,
  Sparkles,
  ChevronDown,
  LayoutDashboard,
  HelpCircle,
  Truck,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

function SearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/products');
    }
  };

  return (
    <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-lg relative items-center">
      <input
        type="text"
        placeholder="Search tech, gadgets, audio, laptops..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full bg-slate-50 hover:bg-white text-slate-900 pl-11 pr-10 py-2.5 text-sm rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all placeholder:text-slate-400 shadow-sm"
      />
      <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
      {searchQuery && (
        <button
          type="button"
          onClick={() => {
            setSearchQuery('');
            router.push('/products');
          }}
          className="absolute right-3.5 text-slate-400 hover:text-slate-600 text-xs bg-slate-200 hover:bg-slate-300 rounded-full w-4 h-4 flex items-center justify-center transition-colors"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </form>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const router = useRouter();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState('');

  // Isolate Admin Portal: Do not render customer storefront navbar inside /admin
  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }

  const handleMobileSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileSearch.trim()) {
      router.push(`/products?search=${encodeURIComponent(mobileSearch.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_2px_15px_-3px_rgba(15,23,42,0.06)]">
      {/* 1. Top Utility Strip (Sprylo Inspired) */}
      <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-600 text-white font-bold text-[10px] uppercase px-2 py-0.5 rounded">
              SALE
            </span>
            <span className="hidden sm:inline text-slate-300">
              Free express delivery on orders over ₹1,000 · 30-day easy returns
            </span>
            <span className="sm:hidden text-slate-300">
              Free shipping over ₹1,000 · 30-day returns
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 font-medium">
            <Link href="/orders" className="hover:text-white transition-colors flex items-center gap-1 text-[11px]">
              <Truck className="w-3.5 h-3.5" />
              <span>Track Order</span>
            </Link>
            <span className="text-slate-700">|</span>
            <Link href="/orders" className="hover:text-white transition-colors flex items-center gap-1 text-[11px]">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Returns</span>
            </Link>
            <span className="text-slate-700">|</span>
            <a href="mailto:support@shopnova.com" className="hover:text-white transition-colors flex items-center gap-1 text-[11px]">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Help</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4 sm:gap-6">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                Shop<span className="text-indigo-600">Nova</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-500 tracking-wider -mt-1 uppercase">
                Shop Smarter. Shop Better.
              </span>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <Suspense fallback={<div className="hidden md:block flex-1 max-w-lg h-10 bg-slate-100 rounded-full animate-pulse" />}>
            <SearchForm />
          </Suspense>

          {/* User Account & Cart Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Account Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/60 transition-all text-xs font-semibold"
                  aria-expanded={isUserMenuOpen}
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shadow-inner">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[110px]">
                      {user.name || 'My Account'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {user.role === 'admin' ? 'Admin' : 'Customer'}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setIsUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                        >
                          <UserIcon className="w-4 h-4 text-slate-400" /> Profile & Addresses
                        </Link>
                        <Link
                          href="/orders"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                        >
                          <Package className="w-4 h-4 text-slate-400" /> My Orders
                        </Link>
                        {user.role === 'admin' && (
                          <Link
                            href="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4 text-indigo-600" /> Admin Dashboard
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            logout();
                          }}
                          className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" /> Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <UserIcon className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}

            {/* Shopping Cart Button */}
            <Link
              href="/cart"
              className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-800 hover:text-indigo-600 transition-all font-semibold text-xs"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4 text-slate-700" />
              <span className="hidden md:inline">Cart</span>
              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shadow-sm">
                {itemCount}
              </span>
            </Link>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl md:hidden transition-colors"
              aria-label="Toggle navigation drawer"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Secondary Category & Main Navigation Bar (Sprylo Inspired) */}
      <nav className="hidden md:block border-t border-slate-100 bg-white" aria-label="Storefront navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-11 text-xs">
          <div className="flex items-center gap-6">
            <Link
              href="/products"
              className="font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 py-2"
            >
              <Menu className="w-3.5 h-3.5" /> All Categories
            </Link>
            <div className="flex items-center gap-6 text-slate-600 font-semibold">
              <Link href="/" className={`hover:text-indigo-600 transition-colors ${pathname === '/' ? 'text-indigo-600 font-bold' : ''}`}>
                Home
              </Link>
              <Link href="/products" className={`hover:text-indigo-600 transition-colors ${pathname.startsWith('/products') ? 'text-indigo-600 font-bold' : ''}`}>
                Shop
              </Link>
              <Link href="/products?category=electronics" className="hover:text-indigo-600 transition-colors">
                Electronics
              </Link>
              <Link href="/products?featured=true" className="hover:text-indigo-600 transition-colors">
                Featured
              </Link>
              <Link href="/orders" className={`hover:text-indigo-600 transition-colors ${pathname.startsWith('/orders') ? 'text-indigo-600 font-bold' : ''}`}>
                Orders
              </Link>
              <a href="mailto:support@shopnova.com" className="hover:text-indigo-600 transition-colors">
                Contact
              </a>
            </div>
          </div>

          <div className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-indigo-600" />
            <span>UP TO <strong>50% OFF</strong> GADGETS</span>
          </div>
        </div>
      </nav>

      {/* 4. Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[108px] z-40 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border-b border-slate-200 px-4 py-6 space-y-5 shadow-2xl max-h-[calc(100vh-108px)] overflow-y-auto">
            {/* Mobile Search */}
            <form onSubmit={handleMobileSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={mobileSearch}
                onChange={(e) => setMobileSearch(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </form>

            {/* Mobile Nav Links */}
            <div className="space-y-1 text-sm font-semibold text-slate-700">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/products"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                All Products
              </Link>
              <Link
                href="/products?category=electronics"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                Electronics & Gadgets
              </Link>
              <Link
                href="/products?featured=true"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                Featured Deals
              </Link>
              <Link
                href="/orders"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                My Orders
              </Link>
              <Link
                href="/cart"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                <span>Shopping Cart</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-xs font-bold">
                  {itemCount}
                </span>
              </Link>
            </div>

            {/* Auth Actions in Mobile Menu */}
            <div className="border-t border-slate-100 pt-4 space-y-2">
              {user ? (
                <>
                  <div className="px-3 py-2 bg-slate-50 rounded-xl mb-2">
                    <p className="text-xs font-bold text-slate-900">{user.name}</p>
                    <p className="text-[11px] text-slate-500">{user.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                  >
                    Profile & Saved Addresses
                  </Link>
                  {user.role === 'admin' && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-3 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-2.5 text-center text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-2.5 text-center text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/20"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

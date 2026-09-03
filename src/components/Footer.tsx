'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, ShieldCheck, Truck, RefreshCw, Headset, ArrowRight } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();

  // Isolate Admin Portal: Do not render customer storefront footer on /admin
  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="bg-slate-900 text-slate-300 mt-20 border-t border-slate-800">
      {/* 1. Value Proposition Features Bar (Sprylo Inspired) */}
      <div className="border-b border-slate-800 bg-slate-950/60 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Fast Delivery</h4>
              <p className="text-xs text-slate-400">Express delivery on orders over ₹1,000</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Secure Payment</h4>
              <p className="text-xs text-slate-400">Razorpay 256-bit encrypted checkout</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/20">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Easy Returns</h4>
              <p className="text-xs text-slate-400">30-day hassle-free replacement</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/20">
              <Headset className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Trusted Products</h4>
              <p className="text-xs text-slate-400">100% authentic curated gear</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Newsletter Strip */}
      <div className="border-b border-slate-800 bg-slate-900 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-indigo-900/60 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <h3 className="text-xl font-bold text-white">
                Get <span className="text-indigo-400">20% Off</span> your first order
              </h3>
              <p className="text-xs text-slate-400 max-w-md">
                Subscribe for exclusive gadget drops, insider discount codes, and tech launches.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const btn = e.currentTarget.querySelector('button');
                if (btn) btn.textContent = 'Subscribed ✓';
              }}
              className="flex w-full md:w-auto gap-2"
            >
              <input
                type="email"
                required
                placeholder="Enter your email address..."
                className="px-4 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-72"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all flex-shrink-0 shadow-lg shadow-indigo-600/30"
              >
                Subscribe <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 3. Links Multi-Column Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-5 gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-lg font-extrabold text-white tracking-tight">
              Shop<span className="text-indigo-400">Nova</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
            Shop Smarter. Shop Better. ShopNova provides cutting-edge tech gadgets, audio gear, smart wearables, and essentials with verified instant Razorpay test checkout.
          </p>
          <div className="pt-2 flex items-center gap-3 text-xs text-slate-400">
            <span className="px-2.5 py-1 bg-slate-800 rounded-md border border-slate-700 font-mono">
              Razorpay Test Mode
            </span>
            <span className="px-2.5 py-1 bg-slate-800 rounded-md border border-slate-700 font-mono">
              256-Bit SSL
            </span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Categories</h4>
          <ul className="space-y-2 text-xs text-slate-400">
            <li>
              <Link href="/products?category=electronics" className="hover:text-indigo-400 transition-colors">
                Electronics & Gadgets
              </Link>
            </li>
            <li>
              <Link href="/products?category=fashion" className="hover:text-indigo-400 transition-colors">
                Wearables & Audio
              </Link>
            </li>
            <li>
              <Link href="/products?category=home-kitchen" className="hover:text-indigo-400 transition-colors">
                Smart Home & Office
              </Link>
            </li>
            <li>
              <Link href="/products?featured=true" className="hover:text-indigo-400 transition-colors">
                Featured Tech Deals
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Customer Care</h4>
          <ul className="space-y-2 text-xs text-slate-400">
            <li>
              <Link href="/orders" className="hover:text-indigo-400 transition-colors">
                Track My Orders
              </Link>
            </li>
            <li>
              <Link href="/cart" className="hover:text-indigo-400 transition-colors">
                View Shopping Cart
              </Link>
            </li>
            <li>
              <Link href="/profile" className="hover:text-indigo-400 transition-colors">
                Account & Addresses
              </Link>
            </li>
            <li>
              <a href="mailto:support@shopnova.com" className="hover:text-indigo-400 transition-colors">
                Help & Support Center
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Portals</h4>
          <ul className="space-y-2 text-xs text-slate-400">
            <li>
              <Link href="/admin" className="hover:text-indigo-400 transition-colors font-semibold text-slate-300">
                Admin Control Center
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-indigo-400 transition-colors">
                Customer Login
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-indigo-400 transition-colors">
                Create Account
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* 4. Bottom Copyright Bar */}
      <div className="border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} ShopNova. All rights reserved. Shop Smarter. Shop Better.</p>
          <p className="text-slate-600">Built with Next.js, React, TypeScript, Tailwind CSS, MongoDB & Razorpay.</p>
        </div>
      </div>
    </footer>
  );
}

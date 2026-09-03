'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/utils';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
} from 'lucide-react';

export default function CartPage() {
  const { user } = useAuth();
  const {
    items,
    itemCount,
    subtotal,
    shipping,
    tax,
    grandTotal,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();
  const router = useRouter();

  const handleProceedToCheckout = () => {
    if (!user) {
      router.push('/login?redirect=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  // Empty Cart State
  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-10 space-y-6">
          <div className="w-20 h-20 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Your cart is empty.
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Explore our fresh tech collection, audio gear, and gadgets to add items to your cart.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-8 py-3.5 rounded-2xl text-xs shadow-lg shadow-indigo-600/30 transition-all"
          >
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const freeShippingThreshold = 1000;
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Shopping Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Review and adjust your selected products before proceeding to secure checkout
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear All
        </button>
      </div>

      {/* Free Shipping Progress Notification */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="flex items-center gap-1.5 text-slate-700">
            <Truck className="w-4 h-4 text-indigo-600" />
            {amountNeededForFreeShipping === 0 ? (
              <span className="text-emerald-600 font-extrabold">
                🎉 Congratulations! You have unlocked FREE Express Delivery.
              </span>
            ) : (
              <span>
                Add <strong>{formatPrice(amountNeededForFreeShipping)}</strong> more to get <strong>FREE Express Shipping</strong>
              </span>
            )}
          </span>
          <span className="text-indigo-600 font-mono">{freeShippingProgress}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${freeShippingProgress}%` }}
          />
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 Cols: Items List */}
        <div className="lg:col-span-8 space-y-4">
          {items.map(({ product, quantity }) => {
            const itemPrice = product.price || 0;
            const itemSubtotal = itemPrice * quantity;

            return (
              <div
                key={product._id}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
              >
                {/* Product Image */}
                <Link
                  href={`/products/${product._id}`}
                  className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0"
                >
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-contain p-2 hover:scale-105 transition-transform"
                  />
                </Link>

                {/* Product Name, Category & Price */}
                <div className="flex-1 text-center sm:text-left space-y-1 w-full">
                  <span className="text-[10px] font-extrabold uppercase text-indigo-600 tracking-wider">
                    {product.category}
                  </span>
                  <Link href={`/products/${product._id}`} className="block">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-slate-500 font-medium">
                    Unit Price: <span className="font-bold text-slate-900">{formatPrice(itemPrice)}</span>
                  </p>
                </div>

                {/* Quantity Controls & Subtotal */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                    <button
                      onClick={() => updateQuantity(product._id, quantity - 1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-xs font-black text-slate-900">
                      {quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(product._id, quantity + 1)}
                      disabled={quantity >= product.stock}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition-colors disabled:opacity-30"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-medium">Subtotal</p>
                    <p className="text-base font-black text-slate-900">{formatPrice(itemSubtotal)}</p>
                  </div>

                  <button
                    onClick={() => removeFromCart(product._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Remove item"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 4 Cols: Order Summary Card */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6 sticky top-24">
          <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-4">
            Order Summary
          </h2>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex justify-between items-center">
              <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
              <span className="font-bold text-slate-900 text-sm">{formatPrice(subtotal)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1">
                Estimated Shipping
              </span>
              {shipping === 0 ? (
                <span className="font-extrabold text-emerald-600 uppercase text-[11px] bg-emerald-50 px-2 py-0.5 rounded">
                  FREE
                </span>
              ) : (
                <span className="font-bold text-slate-900">{formatPrice(shipping)}</span>
              )}
            </div>

            <div className="flex justify-between items-center">
              <span>Estimated GST Tax (18%)</span>
              <span className="font-bold text-slate-900">{formatPrice(tax)}</span>
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-900">Grand Total</span>
              <span className="text-xl font-black text-indigo-600">{formatPrice(grandTotal)}</span>
            </div>
          </div>

          <button
            onClick={handleProceedToCheckout}
            className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
          >
            Proceed to Checkout <ArrowRight className="w-4 h-4" />
          </button>

          <div className="space-y-2 pt-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Razorpay 256-Bit SSL Encrypted Test Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>Express door delivery with online tracking</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

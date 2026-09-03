'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Star, Check, AlertCircle, Eye } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice, calculateDiscountPercentage } from '@/lib/utils';

export interface ProductCardProps {
  _id: string;
  name: string;
  slug?: string;
  image: string;
  price: number;
  mrp?: number;
  originalPrice?: number;
  discount?: number;
  stock: number;
  category: string;
  rating: number;
  numReviews?: number;
  isBestSeller?: boolean;
}

export default function ProductCard({ product }: { product: ProductCardProps }) {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const regularPrice = product.mrp || product.originalPrice || product.price;
  const discountPercent =
    product.discount || calculateDiscountPercentage(regularPrice, product.price);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock <= 0) return;

    setAdding(true);
    setErrorMessage('');

    const res = await addToCart(product._id, 1);
    setAdding(false);

    if (res.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } else {
      setErrorMessage(res.error || 'Failed to add to cart');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  return (
    <article className="group bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden relative">
      {/* Top Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
        {discountPercent > 0 && (
          <span className="bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">
            {discountPercent}% OFF
          </span>
        )}
        {product.isBestSeller && (
          <span className="bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">
            Top Rated
          </span>
        )}
      </div>

      {/* Product Image Area */}
      <Link
        href={`/products/${product._id}`}
        className="block relative aspect-square bg-slate-50 overflow-hidden"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </Link>

      {/* Product Info & Actions */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3 bg-white">
        <div>
          {/* Stock Indicator Dot (Sprylo Inspired) */}
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5">
              {product.stock <= 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Out of stock
                </span>
              ) : product.stock <= 5 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse" /> Only {product.stock} left
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> In stock · {product.stock} items
                </span>
              )}
            </div>

            {/* Star Rating */}
            <div className="flex items-center gap-1 font-bold text-amber-500 text-xs">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{product.rating || 4.8}</span>
              <span className="text-slate-400 font-normal">({product.numReviews || 24})</span>
            </div>
          </div>

          {/* Product Name */}
          <Link href={`/products/${product._id}`} className="block">
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Pricing and Action Buttons */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black text-slate-900">
              {formatPrice(product.price)}
            </span>
            {regularPrice > product.price && (
              <span className="text-xs text-slate-400 line-through">
                {formatPrice(regularPrice)}
              </span>
            )}
          </div>

          {errorMessage && (
            <div className="text-[11px] font-medium text-rose-600 flex items-center gap-1 bg-rose-50 p-1.5 rounded-lg">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Buttons: Add to Cart & View Details */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0 || adding}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                product.stock <= 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : added
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-indigo-600/20'
              }`}
            >
              {adding ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : added ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Added!
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                </>
              )}
            </button>

            <Link
              href={`/products/${product._id}`}
              className="py-2 px-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center gap-1 transition-colors text-center"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" /> View Details
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

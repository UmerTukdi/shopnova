'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatPrice, calculateDiscountPercentage } from '@/lib/utils';
import {
  Star,
  ShoppingCart,
  Check,
  ShieldCheck,
  Truck,
  RotateCcw,
  Plus,
  Minus,
  AlertCircle,
  ChevronRight,
  MessageSquare,
  Send,
  Loader2,
  CheckCircle2,
  Zap,
  ArrowRight,
} from 'lucide-react';

export default function ProductDetailClient({ product: initialProduct }: { product: any }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState(initialProduct);

  const galleryImages: string[] =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [product.image];
  const [activeImage, setActiveImage] = useState<string>(galleryImages[0] || product.image);

  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Review Form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  const regularPrice = product.mrp || product.originalPrice || product.price;
  const discountPercent =
    product.discount || calculateDiscountPercentage(regularPrice, product.price);

  const handleAddToCart = async () => {
    if (product.stock <= 0) return;

    setAdding(true);
    setErrorMsg('');

    const res = await addToCart(product._id, quantity);
    setAdding(false);

    if (res.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } else {
      setErrorMsg(res.error || 'Failed to add item');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleBuyNow = () => {
    if (product.stock <= 0) return;

    // Direct checkout item stored in sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        'shopnova_buy_now',
        JSON.stringify({
          productId: product._id,
          quantity,
          product: {
            _id: product._id,
            name: product.name,
            price: product.price,
            image: product.image,
            stock: product.stock,
            category: product.category,
          },
        })
      );
    }

    const targetUrl = `/checkout?buyNow=1&productId=${product._id}&quantity=${quantity}`;
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(targetUrl)}`);
    } else {
      router.push(targetUrl);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setReviewError('You must be logged in to submit a review.');
      return;
    }
    if (!comment.trim()) {
      setReviewError('Please write your comments before submitting.');
      return;
    }

    try {
      setReviewSubmitting(true);
      setReviewError(null);
      setReviewSuccess(null);

      const res = await fetch(`/api/products/${product._id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setReviewSuccess('Your review was posted successfully!');
        setComment('');
        // Append new review locally
        const newReview = {
          user: user.id,
          userName: user.name || 'Anonymous',
          rating,
          comment,
          createdAt: new Date().toISOString(),
        };
        const currentReviews = product.reviews || [];
        const updatedReviews = [newReview, ...currentReviews];
        const newAvg = (
          updatedReviews.reduce((acc: number, r: any) => acc + r.rating, 0) /
          updatedReviews.length
        ).toFixed(1);

        setProduct({
          ...product,
          reviews: updatedReviews,
          numReviews: updatedReviews.length,
          rating: parseFloat(newAvg),
        });
      } else {
        setReviewError(data.error || data.message || 'Failed to submit review');
      }
    } catch (err: any) {
      setReviewError(err.message || 'Network error while submitting review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 pb-20">
      {/* 1. Breadcrumbs Navigation */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <Link href="/" className="hover:text-indigo-600 transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <Link href="/products" className="hover:text-indigo-600 transition-colors">Shop</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <Link
          href={`/products?category=${product.category}`}
          className="capitalize hover:text-indigo-600 transition-colors"
        >
          {product.category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="text-slate-800 truncate max-w-xs">{product.name}</span>
      </nav>

      {/* 2. Main Product Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column (5 Cols on desktop): Gallery */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Hero Image */}
          <div className="relative aspect-square rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-sm">
            <Image
              src={activeImage}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-contain p-4 transition-all duration-300"
            />
            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 bg-rose-500 text-white text-xs font-black uppercase tracking-wider px-3 py-1 rounded-xl shadow-md">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`relative w-16 h-16 rounded-2xl bg-white border-2 overflow-hidden flex-shrink-0 transition-all ${
                    activeImage === img
                      ? 'border-indigo-600 shadow-md scale-105'
                      : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (7 Cols on desktop): Product Info & Purchasing */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">
                {product.category}
              </span>
              {product.isBestSeller && (
                <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider">
                  Top Rated
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
              {product.name}
            </h1>

            {/* Rating and Stock Row */}
            <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
              <div className="flex items-center gap-1 font-bold text-amber-500">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{product.rating} / 5</span>
                <span className="text-slate-400 font-normal">
                  ({product.numReviews || (product.reviews?.length ?? 0)} customer reviews)
                </span>
              </div>
              <span className="text-slate-300">|</span>
              <div>
                {product.stock <= 0 ? (
                  <span className="inline-flex items-center gap-1.5 font-bold text-rose-600">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Out of stock
                  </span>
                ) : product.stock <= 5 ? (
                  <span className="inline-flex items-center gap-1.5 font-bold text-amber-600">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse" />
                    Only {product.stock} left in stock
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    In stock · {product.stock} items ready to ship
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Row */}
          <div className="flex items-baseline gap-3 pt-3 pb-4 border-y border-slate-100">
            <span className="text-3xl font-black text-slate-900">
              {formatPrice(product.price)}
            </span>
            {regularPrice > product.price && (
              <span className="text-base text-slate-400 line-through">
                {formatPrice(regularPrice)}
              </span>
            )}
            {discountPercent > 0 && (
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                Save {discountPercent}%
              </span>
            )}
          </div>

          {/* Product Description */}
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {product.description}
          </p>

          {/* Quantity & CTA Buttons */}
          <div className="space-y-4 pt-2">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* Quantity Selector */}
              <div className="flex items-center justify-between border border-slate-200 rounded-2xl p-1 bg-slate-50 w-full sm:w-36 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  disabled={quantity <= 1 || product.stock <= 0}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 transition-all font-bold"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-extrabold text-slate-900 text-sm">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.min(product.stock, prev + 1))}
                  disabled={quantity >= product.stock || product.stock <= 0}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 transition-all font-bold"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={product.stock <= 0 || adding}
                className={`flex-1 py-3.5 px-6 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                  product.stock <= 0
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                    : added
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white shadow-indigo-600/30'
                }`}
              >
                {adding ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : added ? (
                  <>
                    <Check className="w-4 h-4" /> Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" /> Add to Cart
                  </>
                )}
              </button>

              {/* Buy Now Button */}
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                className="flex-1 py-3.5 px-6 rounded-2xl text-xs font-bold bg-slate-900 hover:bg-slate-800 active:scale-98 text-white flex items-center justify-center gap-2 transition-all shadow-md disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                <Zap className="w-4 h-4 text-amber-400" /> Buy Now
              </button>
            </div>
          </div>

          {/* Value Props Strip (Sprylo Inspired) */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50">
              <Truck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>Free delivery &gt; ₹1,000</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50">
              <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>Razorpay 256-Bit Encrypted</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50">
              <RotateCcw className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>30-Day Hassle-Free Returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Customer Reviews Section */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm space-y-8">
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" /> Customer Reviews
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Feedback from verified ShopNova purchasers
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 font-bold rounded-xl text-xs">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{product.rating} Average</span>
            </div>
          </div>
        </div>

        {/* Existing Reviews List */}
        <div className="space-y-4">
          {product.reviews && product.reviews.length > 0 ? (
            product.reviews.map((rev: any, idx: number) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                      {rev.userName ? rev.userName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{rev.userName || 'Verified Buyer'}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(rev.createdAt || Date.now()).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[...Array(5)].map((_, starIdx) => (
                      <Star
                        key={starIdx}
                        className={`w-3.5 h-3.5 ${
                          starIdx < rev.rating ? 'fill-amber-400' : 'text-slate-200 fill-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-9">
                  {rev.comment}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-xs text-slate-400">
              No customer reviews yet. Be the first to share your experience with this product!
            </div>
          )}
        </div>

        {/* Write a Review Form */}
        <div className="border-t border-slate-100 pt-6">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Write a Customer Review</h3>
          {user ? (
            <form onSubmit={handleReviewSubmit} className="space-y-4 max-w-xl">
              {reviewSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{reviewSuccess}</span>
                </div>
              )}
              {reviewError && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>{reviewError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Rating</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform"
                      aria-label={`Rate ${s} stars`}
                    >
                      <Star
                        className={`w-6 h-6 ${s <= rating ? 'fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-600 ml-2">{rating} out of 5 stars</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Your Feedback</label>
                <textarea
                  rows={3}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with build quality, battery, performance..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={reviewSubmitting}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
              >
                {reviewSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Submit Review
              </button>
            </form>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 text-xs text-slate-600 flex items-center justify-between gap-4">
              <span>Please log in with your ShopNova customer account to submit a product review.</span>
              <Link
                href={`/login?redirect=/products/${product._id}`}
                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700 transition-colors flex-shrink-0"
              >
                Sign In to Review
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

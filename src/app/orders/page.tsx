'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/utils';
import { Package, ChevronRight, ShoppingBag, Clock, Loader2, ArrowRight, Printer } from 'lucide-react';

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/orders');
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          setOrders(data.orders);
        }
      } catch (err) {
        console.error('Fetch orders error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-8 sm:p-10 space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Login Required</h1>
            <p className="text-xs text-slate-500">
              Please sign in with your customer account to view your past orders and receipts.
            </p>
          </div>
          <Link
            href="/login?redirect=/orders"
            className="block w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-indigo-600/30 transition-all"
          >
            Sign In Now
          </Link>
        </div>
      </div>
    );
  }

  const filteredOrders = activeFilter === 'ALL'
    ? orders
    : orders.filter((o) => (o.orderStatus || '').toUpperCase() === activeFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          My Orders
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Track fulfillment status, view transaction details, and download tax invoices
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => (
          <button
            key={status}
            onClick={() => setActiveFilter(status)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeFilter === status
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span>Loading your order history...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-4 max-w-md mx-auto my-8 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">No Orders Found</h3>
            <p className="text-xs text-slate-500">
              {activeFilter === 'ALL'
                ? "You haven't placed any orders yet."
                : `No orders found with status "${activeFilter}".`}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 transition-all"
            >
              Start Shopping <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isPaid = order.paymentStatus === 'PAID';
            const isCancelled = order.orderStatus === 'CANCELLED';

            return (
              <div
                key={order._id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow space-y-4"
              >
                {/* Order Top Strip */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Order ID
                    </span>
                    <p className="text-sm font-black text-slate-900 font-mono">
                      {order.orderNumber}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                        isCancelled
                          ? 'bg-rose-100 text-rose-800'
                          : order.orderStatus === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {order.orderStatus}
                    </span>

                    <span
                      className={`text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                        isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {order.paymentStatus}
                    </span>

                    <div className="text-right pl-2">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Total</p>
                      <p className="text-base font-black text-slate-900">
                        {formatPrice(order.totalPrice)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 overflow-x-auto max-w-full">
                    {order.items.slice(0, 4).map((it: any, itIdx: number) => (
                      <div
                        key={itIdx}
                        className="relative w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0"
                        title={`${it.name} (${it.quantity}x)`}
                      >
                        <Image
                          src={it.image}
                          alt={it.name}
                          fill
                          className="object-contain p-1.5"
                        />
                      </div>
                    ))}
                    {order.items.length > 4 && (
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                        +{order.items.length - 4}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/orders/${order._id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow transition-all"
                    >
                      <span>View Order</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>

                    <Link
                      href={`/orders/${order._id}?print=true`}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition-all"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                      <span>Order Receipt</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

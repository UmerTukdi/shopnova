'use client';

import React, { useEffect, useState, use, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  MapPin,
  CreditCard,
  Calendar,
  CheckCircle,
  Package,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface OrderDetail {
  _id: string;
  orderNumber: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  items: Array<{
    product: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
  }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine: string;
    apartment?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  itemsPrice: number;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  paymentStatus: string;
  orderStatus: string;
  paymentResult?: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
  };
  paidAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'PROCESSING', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'SHIPPED', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [], // Final state
  CANCELLED: [], // Final state
};

export default function AdminOrderInspectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      if (data.success && data.order) {
        setOrder(data.order);
      } else {
        setError(data.error || data.message || 'Failed to fetch order details');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading order details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleUpdateStatus = async (newStatus: string) => {
    setStatusMsg(null);
    try {
      setUpdating(true);
      const res = await fetch(`/api/admin/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (data.success && data.data?.order) {
        setOrder(data.data.order);
        setStatusMsg({ type: 'success', text: `Status updated to ${newStatus}` });
      } else {
        setStatusMsg({ type: 'error', text: data.message || data.error || 'Failed to update status' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Server error updating status' });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm">Fetching order specification...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 bg-red-500/10 border border-red-500/20 text-center rounded-2xl max-w-lg mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">Order Not Found</h3>
        <p className="text-slate-300 text-sm mb-6">{error}</p>
        <Link
          href="/admin/orders"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium text-sm transition"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  const currentStatus = (order.orderStatus || 'PENDING').toUpperCase();
  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];

  return (
    <div className="space-y-6">
      {/* Top Back Link */}
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Orders List
      </Link>

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white font-mono">{order.orderNumber}</h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                order.paymentStatus === 'PAID'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              PAYMENT: {order.paymentStatus}
            </span>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" /> Placed on {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400">Current Status:</span>
          <span className="px-3 py-1 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-bold text-sm rounded-xl uppercase">
            {order.orderStatus}
          </span>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {statusMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {statusMsg.text}
        </div>
      )}

      {/* Controlled Status Update Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-indigo-400" /> Controlled Status Transition State Machine
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Transitions are restricted to valid sequences: <code className="bg-slate-950 px-1.5 py-0.5 rounded text-indigo-300 font-mono">PENDING → PROCESSING → SHIPPED → DELIVERED</code> or <code className="bg-slate-950 px-1.5 py-0.5 rounded text-red-400 font-mono">PENDING/SHIPPED → CANCELLED</code>
        </p>

        {allowedNext.length === 0 ? (
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 font-medium">
            This order is in a final state (<strong className="text-white">{currentStatus}</strong>). No further status transitions are allowed.
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-slate-300">Advance to Next State:</span>
            {allowedNext.map((nextState) => {
              let btnColor = 'bg-indigo-600 hover:bg-indigo-500 text-white';
              if (nextState === 'CANCELLED') btnColor = 'bg-red-600 hover:bg-red-500 text-white';

              return (
                <button
                  key={nextState}
                  disabled={updating}
                  onClick={() => handleUpdateStatus(nextState)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 disabled:opacity-50 ${btnColor}`}
                >
                  {updating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Set {nextState}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Items & Breakdown */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-400" /> Order Items ({order.items?.length || 0})
            </h3>
            <div className="space-y-4 divide-y divide-slate-800/60">
              {order.items?.map((item, idx) => (
                <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-xl border border-slate-800 bg-slate-950"
                    />
                    <div>
                      <p className="font-bold text-slate-200 text-sm line-clamp-1">{item.name}</p>
                      <p className="text-xs text-slate-400">Qty: {item.quantity} × ₹{item.price.toLocaleString()}</p>
                    </div>
                  </div>
                  <span className="font-bold text-white text-sm">
                    ₹{(item.quantity * item.price).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Summary Breakdown */}
            <div className="mt-6 pt-4 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Items Subtotal</span>
                <span>₹{order.itemsPrice?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>GST Tax (18%)</span>
                <span>₹{order.taxPrice?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Shipping Fee</span>
                <span>{order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice}`}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-white pt-3 border-t border-slate-800">
                <span>Total Amount Paid</span>
                <span className="text-emerald-400">₹{order.totalPrice?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Customer Info, Shipping Address & Payment Meta */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <User className="w-4 h-4 text-indigo-400" /> Customer Information
            </h3>
            <div className="text-xs space-y-1">
              <p className="font-bold text-slate-200">{order.user?.name || 'Customer'}</p>
              <p className="text-slate-400">{order.user?.email}</p>
              <p className="text-slate-400">{order.user?.phone || 'No phone provided'}</p>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <MapPin className="w-4 h-4 text-indigo-400" /> Delivery Address
            </h3>
            <div className="text-xs space-y-1 text-slate-300">
              <p className="font-bold text-white">{order.shippingAddress?.fullName}</p>
              <p>{order.shippingAddress?.addressLine}</p>
              {order.shippingAddress?.apartment && <p>{order.shippingAddress.apartment}</p>}
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}</p>
              <p className="text-slate-400 font-semibold">{order.shippingAddress?.country}</p>
              <p className="text-slate-400 pt-1">Phone: {order.shippingAddress?.phone}</p>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <CreditCard className="w-4 h-4 text-indigo-400" /> Payment Audit Meta
            </h3>
            <div className="text-xs space-y-2 text-slate-300 font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Razorpay Order ID</span>
                <span>{order.paymentResult?.razorpayOrderId || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Razorpay Payment ID</span>
                <span>{order.paymentResult?.razorpayPaymentId || '—'}</span>
              </div>
              {order.paidAt && (
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Paid Timestamp</span>
                  <span className="text-emerald-400 font-sans">{new Date(order.paidAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

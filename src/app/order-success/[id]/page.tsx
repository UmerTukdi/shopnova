import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, ShoppingBag, Package, MapPin, Printer, ArrowRight } from 'lucide-react';
import { notFound } from 'next/navigation';

import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface OrderSuccessPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: 'Order Confirmed — ShopNova',
  description: 'Your order was successfully placed and verified at ShopNova.',
};

export default async function OrderSuccessPage({ params }: OrderSuccessPageProps) {
  const { id } = await params;
  if (!id) notFound();

  await connectDB();

  let order = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    order = await Order.findById(id).lean();
  }
  if (!order) {
    order = await Order.findOne({ orderNumber: id }).lean();
  }
  if (!order) {
    notFound();
  }

  const parsedOrder = JSON.parse(JSON.stringify(order));

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8 pb-20">
      {/* Celebratory Success Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-8 sm:p-12 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="inline-block bg-emerald-50 text-emerald-700 text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider border border-emerald-200">
            ✓ Order Placed Successfully
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Thank You for Your Order!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Your payment was confirmed on the server via Razorpay. We are preparing your order for immediate dispatch.
          </p>
        </div>

        {/* Order Details Grid */}
        <div className="bg-slate-50 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-left max-w-xl mx-auto border border-slate-200/80">
          <div>
            <p className="text-slate-400 font-medium">Order ID</p>
            <p className="font-extrabold text-slate-900 truncate font-mono text-sm">
              {parsedOrder.orderNumber}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Payment Status</p>
            <p className="font-extrabold text-emerald-600 uppercase">
              {parsedOrder.paymentStatus}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Total Paid</p>
            <p className="font-extrabold text-indigo-600 text-sm">
              {formatPrice(parsedOrder.totalPrice)}
            </p>
          </div>
        </div>

        {/* Action Buttons: View Order, Download Receipt, Continue Shopping */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href={`/orders/${parsedOrder._id}`}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
          >
            <Package className="w-4 h-4" /> View Order
          </Link>

          <Link
            href={`/orders/${parsedOrder._id}?print=true`}
            className="px-6 py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-sm transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-slate-500" /> Download Receipt
          </Link>

          <Link
            href="/products"
            className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4 text-slate-500" /> Continue Shopping
          </Link>
        </div>
      </div>

      {/* Summary of Purchased Items */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-indigo-600" /> Purchased Items ({parsedOrder.items.length})
        </h2>

        <div className="divide-y divide-slate-100">
          {parsedOrder.items.map((item: any, idx: number) => (
            <div key={idx} className="py-3.5 first:pt-0 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0">
                  <Image src={item.image} alt={item.name} fill className="object-contain p-1" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{item.name}</p>
                  <p className="text-slate-500">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                </div>
              </div>
              <span className="font-extrabold text-slate-900">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        {/* Delivery Address Summary */}
        <div className="pt-4 border-t border-slate-100 flex items-start gap-3 text-xs bg-slate-50 p-4 rounded-2xl">
          <MapPin className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-slate-900">
              Delivery to {parsedOrder.shippingAddress.fullName} · {parsedOrder.shippingAddress.phone}
            </p>
            <p className="text-slate-600">
              {parsedOrder.shippingAddress.addressLine1 || parsedOrder.shippingAddress.addressLine}, {parsedOrder.shippingAddress.city}, {parsedOrder.shippingAddress.state} - {parsedOrder.shippingAddress.postalCode}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

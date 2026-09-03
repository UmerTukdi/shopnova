import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User'; // Explicit import to prevent MissingSchemaError during serverless cold start
import { getUserFromCookies } from '@/lib/auth';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package,
  MapPin,
  ChevronLeft,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldAlert,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';
import { redirect } from 'next/navigation';
import OrderInvoiceButton from './OrderInvoiceButton';
import { Suspense } from 'react';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: 'Order Invoice & Details — ShopNova',
  description: 'Official ShopNova tax receipt and shipment tracking details.',
};

const TIMELINE_STEPS = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;

  if (!id) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-4">
          <Package className="w-12 h-12 text-slate-400 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Order ID Missing</h2>
          <p className="text-xs text-slate-500">Please select an order from your order history.</p>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-colors"
          >
            Go to My Orders
          </Link>
        </div>
      </div>
    );
  }

  // 1. Verify User Authentication
  const authUser = await getUserFromCookies();
  if (!authUser) {
    redirect(`/login?redirect=/orders/${encodeURIComponent(id)}`);
  }

  await connectDB();

  // 2. Safely Query Order by ObjectId or orderNumber (prevents Mongoose CastError 500s)
  let orderRaw = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    orderRaw = await Order.findById(id).populate('user', 'name email phone').lean();
  }

  if (!orderRaw) {
    orderRaw = await Order.findOne({ orderNumber: id }).populate('user', 'name email phone').lean();
  }

  // 3. Handle Order Not Found Gracefully
  if (!orderRaw) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Order Not Found</h2>
          <p className="text-xs text-slate-500">
            We could not find an order matching reference <strong className="font-mono text-slate-800">{id}</strong>.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/orders"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-colors"
            >
              View My Orders
            </Link>
            <Link
              href="/products"
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const parsedOrder = JSON.parse(JSON.stringify(orderRaw));

  // 4. Authorization Check: Owner or Admin
  const orderUserId = parsedOrder.user?._id?.toString() || parsedOrder.user?.toString();
  const isOwner = orderUserId === authUser.userId;
  const isAdmin = authUser.role === 'admin';

  if (!isOwner && !isAdmin) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500">
            You do not have permission to view this order. You are logged in as{' '}
            <strong className="text-slate-800">{authUser.email}</strong>.
          </p>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-colors"
          >
            Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  // 5. Status & Customer Details
  const currentStatus = (parsedOrder.orderStatus || 'PENDING').toUpperCase();
  const isCancelled = currentStatus === 'CANCELLED';
  const isPaid = parsedOrder.paymentStatus === 'PAID';

  const customerName =
    parsedOrder.shippingAddress?.fullName ||
    parsedOrder.user?.name ||
    authUser.name ||
    'Valued Customer';
  const customerEmail = parsedOrder.user?.email || authUser.email || 'customer@shopnova.com';
  const customerPhone =
    parsedOrder.shippingAddress?.phone ||
    parsedOrder.user?.phone ||
    'Not provided';

  const getStepStatus = (step: string) => {
    if (isCancelled) return 'cancelled';
    if (step === 'PAID') return isPaid ? 'completed' : 'pending';

    const orderIdx = TIMELINE_STEPS.indexOf(currentStatus);
    const stepIdx = TIMELINE_STEPS.indexOf(step);

    if (orderIdx >= stepIdx) return 'completed';
    return 'pending';
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 pb-20">
      {/* Top Navigation & Invoice Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to My Orders
        </Link>
        <Suspense fallback={<div className="h-9 w-48 bg-slate-100 rounded-xl animate-pulse" />}>
          <OrderInvoiceButton />
        </Suspense>
      </div>

      {/* Main Order Receipt Document */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-10 space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Receipt Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-slate-200/80 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Shop<span className="text-indigo-600">Nova</span>
              </h1>
              <p className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
                Official Order Receipt
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1 text-xs">
            <p className="text-slate-400 font-medium">Order Reference</p>
            <p className="font-mono font-black text-slate-900 text-sm">{parsedOrder.orderNumber}</p>
            <p className="text-slate-500">
              Date: {new Date(parsedOrder.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Customer Information & Delivery Address Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs bg-slate-50 p-5 rounded-2xl border border-slate-100">
          <div className="space-y-1.5">
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              Customer Information
            </p>
            <p className="font-bold text-slate-900 text-sm">{customerName}</p>
            <p className="text-slate-600">Email: {customerEmail}</p>
            <p className="text-slate-600">Phone: {customerPhone}</p>
          </div>

          <div className="space-y-1.5">
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              Delivery Address
            </p>
            <p className="text-slate-800 font-medium">
              {parsedOrder.shippingAddress?.addressLine1 || parsedOrder.shippingAddress?.addressLine}
            </p>
            {(parsedOrder.shippingAddress?.addressLine2 || parsedOrder.shippingAddress?.apartment) && (
              <p className="text-slate-800 font-medium">
                {parsedOrder.shippingAddress?.addressLine2 || parsedOrder.shippingAddress?.apartment}
              </p>
            )}
            <p className="text-slate-600">
              {parsedOrder.shippingAddress?.city}, {parsedOrder.shippingAddress?.state} - {parsedOrder.shippingAddress?.postalCode}
            </p>
            <p className="text-slate-500">{parsedOrder.shippingAddress?.country || 'India'}</p>
          </div>
        </div>

        {/* Products Table */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Products Ordered
          </p>
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4 text-center">Quantity</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedOrder.items && parsedOrder.items.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <div className="relative w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 print:hidden">
                            <Image src={item.image} alt={item.name || 'Product'} fill className="object-contain p-1" />
                          </div>
                        )}
                        <span className="font-bold text-slate-900 line-clamp-1">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                      {formatPrice(item.price)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      {formatPrice(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Breakdown & Payment / Order Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          {/* Status & Method Box */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2 text-xs">
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              Order &amp; Payment Status
            </p>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Order Status:</span>
              <span
                className={`font-black uppercase px-2.5 py-0.5 rounded-full text-[11px] ${
                  isCancelled
                    ? 'bg-rose-100 text-rose-800'
                    : currentStatus === 'DELIVERED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-indigo-100 text-indigo-800'
                }`}
              >
                {currentStatus}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Payment Status:</span>
              <span
                className={`font-black uppercase ${
                  isPaid ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {parsedOrder.paymentStatus}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Payment Method:</span>
              <span className="font-semibold text-slate-900">
                {parsedOrder.paymentResult?.razorpayPaymentId?.startsWith('pay_mock_')
                  ? 'Mock Payment (Dev Mode)'
                  : 'Razorpay Gateway'}
              </span>
            </div>
            {parsedOrder.paymentResult?.razorpayPaymentId && (
              <div className="flex justify-between items-center pt-1 text-[11px] border-t border-slate-200">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono text-slate-700 truncate max-w-[160px]">
                  {parsedOrder.paymentResult.razorpayPaymentId}
                </span>
              </div>
            )}
          </div>

          {/* Totals Calculation */}
          <div className="space-y-2.5 text-xs text-slate-600 p-2">
            <div className="flex justify-between items-center">
              <span>Subtotal:</span>
              <span className="font-bold text-slate-900">{formatPrice(parsedOrder.itemsPrice)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>GST Tax (18%):</span>
              <span className="font-bold text-slate-900">{formatPrice(parsedOrder.taxPrice)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Shipping Fee:</span>
              {parsedOrder.shippingPrice === 0 ? (
                <span className="font-extrabold text-emerald-600 uppercase text-[10px]">FREE</span>
              ) : (
                <span className="font-bold text-slate-900">{formatPrice(parsedOrder.shippingPrice)}</span>
              )}
            </div>
            <div className="flex justify-between items-baseline border-t border-slate-200 pt-3 text-sm font-black text-slate-900">
              <span>Grand Total:</span>
              <span className="text-xl font-black text-indigo-600">
                {formatPrice(parsedOrder.totalPrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Order Progress Timeline (Hidden when printing receipt) */}
        <div className="pt-4 border-t border-slate-100 print:hidden space-y-3">
          <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Order Fulfillment Timeline
          </p>
          {isCancelled ? (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-semibold">
              This order has been cancelled. Any captured payments are refunded automatically.
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2 text-center text-xs pt-2">
              {[
                { label: 'Placed', step: 'PENDING' },
                { label: 'Paid', step: 'PAID' },
                { label: 'Processing', step: 'PROCESSING' },
                { label: 'Shipped', step: 'SHIPPED' },
                { label: 'Delivered', step: 'DELIVERED' },
              ].map((item, idx) => {
                const status = getStepStatus(item.step);
                return (
                  <div key={idx} className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        status === 'completed'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-bold ${
                        status === 'completed' ? 'text-indigo-700' : 'text-slate-400'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

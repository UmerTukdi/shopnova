'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import {
  Lock,
  ShieldCheck,
  Truck,
  MapPin,
  User,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Package,
} from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CheckoutItem {
  product: {
    _id: string;
    name: string;
    price: number;
    image: string;
    stock: number;
    category?: string;
  };
  quantity: number;
}

function CheckoutInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { items: cartItems, subtotal: cartSubtotal, refreshCart } = useCart();

  const isBuyNow = searchParams.get('buyNow') === '1';
  const buyNowProductId = searchParams.get('productId');
  const buyNowQty = Math.max(1, parseInt(searchParams.get('quantity') || '1', 10));

  const [buyNowProduct, setBuyNowProduct] = useState<any | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(isBuyNow);

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');

  // Customer Information Form State
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');

  // Delivery Address Form State
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');

  // Processing & Errors
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Sync User info when loaded
  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name || '');
      if (!customerEmail) setCustomerEmail(user.email || '');
      if (!customerPhone && user.phone) setCustomerPhone(user.phone);
    }
  }, [user]);

  // 2. Fetch Buy Now product if direct checkout
  useEffect(() => {
    if (!isBuyNow || !buyNowProductId) return;

    const fetchProduct = async () => {
      try {
        setLoadingProduct(true);
        if (typeof window !== 'undefined') {
          const cached = sessionStorage.getItem('shopnova_buy_now');
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (parsed.productId === buyNowProductId && parsed.product) {
                setBuyNowProduct(parsed.product);
                setLoadingProduct(false);
                return;
              }
            } catch {
              // ignore parse errors
            }
          }
        }

        const res = await fetch(`/api/products/${buyNowProductId}`);
        const data = await res.json();
        if (data.success && data.product) {
          setBuyNowProduct(data.product);
        }
      } catch (err) {
        console.error('Error loading product for direct checkout:', err);
      } finally {
        setLoadingProduct(false);
      }
    };

    fetchProduct();
  }, [isBuyNow, buyNowProductId]);

  // 3. Fetch Saved Addresses for authenticated user
  useEffect(() => {
    if (!user) return;

    const fetchAddresses = async () => {
      try {
        const res = await fetch('/api/addresses');
        const data = await res.json();
        if (data.success && Array.isArray(data.addresses) && data.addresses.length > 0) {
          setSavedAddresses(data.addresses);
          const defaultAddr = data.addresses.find((a: any) => a.isDefault) || data.addresses[0];
          setSelectedAddressId(defaultAddr._id);
          setAddressLine(defaultAddr.addressLine1 || defaultAddr.addressLine || '');
          setCity(defaultAddr.city || '');
          setStateName(defaultAddr.state || '');
          setPincode(defaultAddr.postalCode || '');
          if (!customerPhone && defaultAddr.phone) {
            setCustomerPhone(defaultAddr.phone);
          }
        }
      } catch (err) {
        console.error('Error loading addresses:', err);
      }
    };

    fetchAddresses();
  }, [user]);

  // Handle selecting an existing saved address
  const handleSelectAddress = (addrId: string) => {
    setSelectedAddressId(addrId);
    if (addrId === 'new') {
      setAddressLine('');
      setCity('');
      setStateName('');
      setPincode('');
    } else {
      const selected = savedAddresses.find((a) => a._id === addrId);
      if (selected) {
        setAddressLine(selected.addressLine1 || selected.addressLine || '');
        setCity(selected.city || '');
        setStateName(selected.state || '');
        setPincode(selected.postalCode || '');
        if (selected.phone) setCustomerPhone(selected.phone);
        if (selected.fullName) setCustomerName(selected.fullName);
      }
    }
  };

  // Determine active checkout items
  const activeItems: CheckoutItem[] = isBuyNow && buyNowProduct
    ? [{ product: buyNowProduct, quantity: buyNowQty }]
    : cartItems;

  const subtotal = isBuyNow && buyNowProduct
    ? (buyNowProduct.price || 0) * buyNowQty
    : cartSubtotal;

  const shipping = subtotal > 1000 || subtotal === 0 ? 0 : 99;
  const tax = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + shipping + tax;

  // Validation
  const validateForm = () => {
    setErrorMessage('');

    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name.');
      return false;
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return false;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 8) {
      setErrorMessage('Please enter a valid contact phone number.');
      return false;
    }
    if (!addressLine.trim()) {
      setErrorMessage('Please enter your delivery street address.');
      return false;
    }
    if (!city.trim()) {
      setErrorMessage('Please enter your city.');
      return false;
    }
    if (!stateName.trim()) {
      setErrorMessage('Please enter your state.');
      return false;
    }
    if (!pincode.trim() || pincode.trim().length < 4) {
      setErrorMessage('Please enter a valid pincode / postal code.');
      return false;
    }

    return true;
  };

  // Main Checkout & Payment Submission
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      router.push('/login?redirect=/checkout');
      return;
    }

    if (!validateForm()) return;

    if (activeItems.length === 0) {
      setErrorMessage('Your cart is empty. Please add items to checkout.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      // 1. Create Server-Side Order
      const orderPayload: any = {
        customAddress: {
          fullName: customerName.trim(),
          phone: customerPhone.trim(),
          addressLine: addressLine.trim(),
          addressLine1: addressLine.trim(),
          city: city.trim(),
          state: stateName.trim(),
          postalCode: pincode.trim(),
          country: 'India',
        },
      };

      if (isBuyNow && buyNowProductId) {
        orderPayload.buyNowItem = {
          productId: buyNowProductId,
          quantity: buyNowQty,
        };
      }

      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success || !orderData.order) {
        setErrorMessage(orderData.error || orderData.message || 'Failed to initialize order');
        setSubmitting(false);
        return;
      }

      const createdOrder = orderData.order;

      // 2. Initialize Payment on Server
      const paymentRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: createdOrder._id }),
      });

      const paymentData = await paymentRes.json();
      if (!paymentRes.ok || !paymentData.success) {
        setErrorMessage(paymentData.error || paymentData.message || 'Payment initialization failed');
        setSubmitting(false);
        return;
      }

      const paymentOrderId = paymentData.data?.paymentOrderId || paymentData.razorpayOrder?.id;
      const paymentMethod = paymentData.data?.paymentMethod || paymentData.mode || 'mock';
      const clientKey = paymentData.data?.key || paymentData.key || 'rzp_test_key';
      const paymentAmount = paymentData.data?.amount || paymentData.razorpayOrder?.amount;
      const paymentCurrency = paymentData.data?.currency || 'INR';

      // 3. Handle Mock Payment Flow (Local Testing)
      if (paymentMethod === 'mock') {
        const verifyRes = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: createdOrder._id,
            razorpay_order_id: paymentOrderId,
            razorpay_payment_id: `pay_mock_${Date.now()}`,
            razorpay_signature: 'mock_signature',
          }),
        });

        const verifyData = await verifyRes.json();
        if (verifyRes.ok && verifyData.success) {
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('shopnova_buy_now');
          }
          await refreshCart();
          router.push(`/order-success/${createdOrder._id}`);
          return;
        } else {
          setErrorMessage(verifyData.error || 'Mock payment verification failed');
          setSubmitting(false);
          return;
        }
      }

      // 4. Handle Real Razorpay Test Flow
      if (typeof window.Razorpay === 'undefined') {
        setErrorMessage('Razorpay payment gateway failed to load. Please refresh and try again.');
        setSubmitting(false);
        return;
      }

      const razorpayOptions = {
        key: clientKey,
        amount: paymentAmount,
        currency: paymentCurrency,
        name: 'ShopNova',
        description: `Order #${createdOrder.orderNumber}`,
        order_id: paymentOrderId,
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone,
        },
        theme: {
          color: '#4F46E5', // ShopNova Indigo
        },
        handler: async function (response: any) {
          if (!response || !response.razorpay_payment_id) {
            setErrorMessage('Payment cancelled or rejected by gateway.');
            setSubmitting(false);
            return;
          }

          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: createdOrder._id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              if (typeof window !== 'undefined') {
                sessionStorage.removeItem('shopnova_buy_now');
              }
              await refreshCart();
              router.push(`/order-success/${createdOrder._id}`);
            } else {
              setErrorMessage(verifyData.error || 'Server rejected payment verification.');
              setSubmitting(false);
            }
          } catch (err: any) {
            setErrorMessage(err.message || 'Error communicating with verification server.');
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
          },
        },
      };

      const rzpInstance = new window.Razorpay(razorpayOptions);
      rzpInstance.on('payment.failed', function (resp: any) {
        setErrorMessage(resp.error?.description || 'Payment was declined by payment gateway.');
        setSubmitting(false);
      });
      rzpInstance.open();
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred during checkout.');
      setSubmitting(false);
    }
  };

  if (!isBuyNow && cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm space-y-4">
          <Package className="w-12 h-12 text-slate-400 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Your Cart is Empty</h2>
          <p className="text-xs text-slate-500">
            Please select products to purchase before proceeding to checkout.
          </p>
          <Link
            href="/products"
            className="inline-block px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md"
          >
            Explore Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Checkout
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Complete your delivery details and proceed to secure Razorpay test payment
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Checkout Form & Order Summary 2-Column Grid */}
      <form onSubmit={handlePayment} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 Cols): Customer Information & Delivery Address */}
        <div className="lg:col-span-7 space-y-6">
          {/* SECTION 1: CUSTOMER INFORMATION */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h2 className="text-base font-bold text-slate-900">
                CUSTOMER INFORMATION
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: DELIVERY ADDRESS */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  DELIVERY ADDRESS
                </h2>
              </div>
              <span className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" /> Doorstep Delivery
              </span>
            </div>

            {/* Saved Address Quick Selector if available */}
            {savedAddresses.length > 0 && (
              <div className="space-y-2 pb-2">
                <label className="block text-xs font-semibold text-slate-600">
                  Select a Saved Address:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {savedAddresses.map((addr) => (
                    <button
                      key={addr._id}
                      type="button"
                      onClick={() => handleSelectAddress(addr._id)}
                      className={`text-left p-3 rounded-2xl border text-xs transition-all ${
                        selectedAddressId === addr._id
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                        <span>{addr.label || 'Saved Address'}</span>
                        {selectedAddressId === addr._id && (
                          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                        )}
                      </div>
                      <p className="text-slate-600 line-clamp-1">{addr.addressLine1 || addr.addressLine}</p>
                      <p className="text-slate-500 text-[11px]">{addr.city}, {addr.state} - {addr.postalCode}</p>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleSelectAddress('new')}
                    className={`text-left p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      selectedAddressId === 'new'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700'
                        : 'border-dashed border-slate-300 hover:border-slate-400 text-slate-600'
                    }`}
                  >
                    + Enter New Address
                  </button>
                </div>
              </div>
            )}

            {/* Address Input Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Street Address (Flat, House No., Building, Area) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    placeholder="123 Innovation Way, Apt 4B, Tech Zone"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Bengaluru"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    State <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="Karnataka"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Pincode <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="560100"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 Cols): SECTION 3: ORDER SUMMARY */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6 sticky top-24">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <h2 className="text-base font-bold text-slate-900">
              ORDER SUMMARY
            </h2>
          </div>

          {/* Purchased Items List */}
          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1">
            {activeItems.map((item, idx) => (
              <div key={idx} className="py-3 first:pt-0 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-contain p-1"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 line-clamp-1">{item.product.name}</p>
                    <p className="text-slate-400">Qty: {item.quantity} × {formatPrice(item.product.price)}</p>
                  </div>
                </div>
                <span className="font-bold text-slate-900">
                  {formatPrice(item.product.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing Calculation Breakdown */}
          <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
            <div className="flex justify-between items-center">
              <span>Subtotal</span>
              <span className="font-bold text-slate-900">{formatPrice(subtotal)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span>Shipping</span>
              {shipping === 0 ? (
                <span className="font-bold text-emerald-600 uppercase text-[11px] bg-emerald-50 px-2 py-0.5 rounded">
                  FREE
                </span>
              ) : (
                <span className="font-bold text-slate-900">{formatPrice(shipping)}</span>
              )}
            </div>

            <div className="flex justify-between items-center">
              <span>Tax (GST 18%)</span>
              <span className="font-bold text-slate-900">{formatPrice(tax)}</span>
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-900">Grand Total</span>
              <span className="text-xl font-black text-indigo-600">{formatPrice(grandTotal)}</span>
            </div>
          </div>

          {/* Payment Submission Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Continue to Payment</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>

          {/* Trust badges */}
          <div className="pt-2 text-[11px] text-slate-400 space-y-1.5 text-center">
            <p className="flex items-center justify-center gap-1.5 font-medium text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Razorpay Test Mode Secured (256-Bit SSL)
            </p>
            <p>Verification is confirmed directly on the server before dispatch.</p>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh] text-xs text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mr-2" /> Loading checkout...
        </div>
      }
    >
      <CheckoutInner />
    </Suspense>
  );
}

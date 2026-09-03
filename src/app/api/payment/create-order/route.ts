import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import Payment from '@/models/Payment';
import { getRazorpayInstance } from '@/lib/razorpay';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request payload' },
        { status: 400 }
      );
    }

    const { orderId } = body;
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required to create payment order' },
        { status: 400 }
      );
    }

    await connectDB();

    const order = await Order.findOne({ _id: orderId, user: user._id });
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found or does not belong to current user' },
        { status: 404 }
      );
    }

    if (order.paymentStatus === 'PAID') {
      return NextResponse.json(
        { success: false, error: 'This order has already been paid and confirmed' },
        { status: 400 }
      );
    }

    const paymentMode = (process.env.PAYMENT_MODE || 'razorpay').toLowerCase().trim();
    const amountInPaise = Math.round(order.totalPrice * 100);

    // ==========================================
    // 1. MOCK PAYMENT MODE
    // ==========================================
    if (paymentMode === 'mock') {
      const mockPaymentOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      order.paymentResult = {
        razorpayOrderId: mockPaymentOrderId,
      };
      await order.save();

      await Payment.create({
        order: order._id,
        user: user._id,
        razorpayOrderId: mockPaymentOrderId,
        amount: order.totalPrice,
        currency: 'INR',
        status: 'created',
      });

      return NextResponse.json({
        success: true,
        data: {
          orderId: order._id.toString(),
          paymentOrderId: mockPaymentOrderId,
          amount: amountInPaise,
          currency: 'INR',
          paymentMethod: 'mock',
          key: 'rzp_test_mock_key',
        },
        // Backward-compatible fields
        mode: 'mock',
        razorpayOrder: {
          id: mockPaymentOrderId,
          amount: amountInPaise,
          currency: 'INR',
          status: 'created',
        },
        key: 'rzp_test_mock_key',
        message: 'Mock Payment Mode Active (Development/Testing Only)',
      });
    }

    // ==========================================
    // 2. REAL RAZORPAY PAYMENT MODE
    // ==========================================
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret || keyId === 'your_razorpay_key_id') {
      return NextResponse.json(
        {
          success: false,
          error:
            'Razorpay credentials are missing or unconfigured. Please configure valid RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local, or set PAYMENT_MODE=mock for testing.',
        },
        { status: 500 }
      );
    }

    let razorpay: any;
    try {
      razorpay = getRazorpayInstance();
    } catch (instErr: any) {
      return NextResponse.json(
        {
          success: false,
          error: instErr.message || 'Failed to initialize Razorpay client instance',
        },
        { status: 500 }
      );
    }

    let razorpayOrder: any;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: order.orderNumber,
        notes: {
          shopnovaOrderId: order._id.toString(),
          userEmail: user.email,
        },
      });
    } catch (rzpErr: any) {
      console.error('Razorpay API orders.create error:', rzpErr);
      const errDetail =
        rzpErr?.error?.description ||
        rzpErr?.error?.reason ||
        rzpErr?.description ||
        rzpErr?.message ||
        'Razorpay API rejected order creation';

      return NextResponse.json(
        {
          success: false,
          error: `Razorpay API Error: ${errDetail}. (Configure valid test credentials or set PAYMENT_MODE=mock)`,
        },
        { status: 502 }
      );
    }

    if (!razorpayOrder || !razorpayOrder.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Razorpay API returned an empty order response',
        },
        { status: 502 }
      );
    }

    await Payment.create({
      order: order._id,
      user: user._id,
      razorpayOrderId: razorpayOrder.id,
      amount: order.totalPrice,
      currency: 'INR',
      status: 'created',
    });

    order.paymentResult = {
      ...order.paymentResult,
      razorpayOrderId: razorpayOrder.id,
    };
    await order.save();

    const clientKey =
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || keyId;

    return NextResponse.json({
      success: true,
      data: {
        orderId: order._id.toString(),
        paymentOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        paymentMethod: 'razorpay',
        key: clientKey,
      },
      // Backward-compatible fields
      mode: 'razorpay',
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        status: razorpayOrder.status || 'created',
      },
      key: clientKey,
    });
  } catch (error: any) {
    console.error('Create Payment Order Server Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error creating payment order' },
      { status: 500 }
    );
  }
}

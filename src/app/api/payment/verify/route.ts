import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import Payment from '@/models/Payment';
import Cart from '@/models/Cart';
import Product from '@/models/Product';
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

    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (!orderId || !razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required payment verification details' },
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

    // IDEMPOTENCY CHECK: If order is already paid, return success immediately without deducting stock again
    if (order.paymentStatus === 'PAID') {
      return NextResponse.json({
        success: true,
        message: 'Payment verified and order already confirmed (idempotent)',
        data: {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          paymentId: order.paymentResult?.razorpayPaymentId || razorpay_payment_id,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
        },
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
      });
    }

    const paymentMode = (process.env.PAYMENT_MODE || 'razorpay').toLowerCase().trim();

    if (paymentMode === 'mock') {
      // Mock payment mode accepts mock signature or mock prefix
      if (!razorpay_signature && !razorpay_payment_id.startsWith('pay_mock_')) {
        return NextResponse.json(
          { success: false, error: 'Invalid mock payment credentials' },
          { status: 400 }
        );
      }
    } else {
      // Real Razorpay signature verification
      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (!secret) {
        return NextResponse.json(
          { success: false, error: 'Server configuration error: missing Razorpay secret' },
          { status: 500 }
        );
      }

      if (!razorpay_signature) {
        return NextResponse.json(
          { success: false, error: 'Missing payment signature from payment gateway' },
          { status: 400 }
        );
      }

      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return NextResponse.json(
          { success: false, error: 'Invalid payment signature. Verification failed.' },
          { status: 400 }
        );
      }
    }

    // ATOMIC STOCK DEDUCTION CHECK: Ensure sufficient inventory is available for all items before fulfilling order
    const stockDeductedProducts: { id: any; qty: number }[] = [];

    for (const item of order.items) {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.product, isDeleted: { $ne: true }, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );

      if (!updatedProduct) {
        // Rollback stock for previously deducted items in this order
        for (const rolledBack of stockDeductedProducts) {
          await Product.findByIdAndUpdate(rolledBack.id, { $inc: { stock: rolledBack.qty } });
        }

        order.paymentStatus = 'FAILED';
        order.orderStatus = 'CANCELLED';
        await order.save();

        return NextResponse.json(
          {
            success: false,
            error: `Inventory check failed: Product "${item.name}" has insufficient stock available.`,
          },
          { status: 409 }
        );
      }

      stockDeductedProducts.push({ id: item.product, qty: item.quantity });
    }

    // Update order status upon successful atomic stock deduction
    order.paymentStatus = 'PAID';
    order.orderStatus = 'CONFIRMED';
    order.paidAt = new Date();
    order.paymentResult = {
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature || 'mock_signature',
    };
    await order.save();

    // Update or create payment record
    await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        order: order._id,
        user: user._id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature || 'mock_signature',
        status: 'captured',
      },
      { upsert: true }
    );

    // Only empty the user's database cart if this was NOT a direct "Buy Now" purchase!
    if (!order.isBuyNow) {
      await Cart.findOneAndUpdate({ user: user._id }, { items: [] });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and order confirmed successfully',
      data: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        paymentId: razorpay_payment_id,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
      },
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
    });
  } catch (error: any) {
    console.error('Verify Payment Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to verify payment' },
      { status: 500 }
    );
  }
}

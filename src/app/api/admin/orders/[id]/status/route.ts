import connectDB from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { getAdminUser, jsonSuccess, jsonError } from '@/lib/auth';

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'PROCESSING', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'SHIPPED', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [], // Final state
  CANCELLED: [], // Final state
};

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminUser();
    if (!admin) return jsonError('Unauthorized: Admin access required', 403);

    const { id } = await params;
    const { status } = await req.json();

    if (!status || typeof status !== 'string') {
      return jsonError('New status is required', 400);
    }

    const nextStatus = status.trim().toUpperCase();

    await connectDB();
    const order = await Order.findById(id);
    if (!order) return jsonError('Order not found', 404);

    const currentStatus = (order.orderStatus || 'PENDING').toUpperCase();

    if (currentStatus === nextStatus) {
      return jsonSuccess({ order }, 'Order is already in this status');
    }

    const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(nextStatus)) {
      return jsonError(
        `Invalid status transition: Cannot change order from ${currentStatus} to ${nextStatus}. Allowed next states: [${allowedNext.join(', ')}]`,
        400
      );
    }

    // Handle cancellation: if cancelling an order that was paid or confirmed, return stock to inventory if needed
    if (nextStatus === 'CANCELLED' && currentStatus !== 'CANCELLED' && order.paymentStatus === 'PAID') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
    }

    order.orderStatus = nextStatus as any;
    if (nextStatus === 'DELIVERED') {
      order.deliveredAt = new Date();
    }

    await order.save();

    return jsonSuccess({ order }, `Order status updated to ${nextStatus}`);
  } catch (error: any) {
    console.error('Admin Order Status Update Error:', error);
    return jsonError(error.message || 'Failed to update order status', 500);
  }
}

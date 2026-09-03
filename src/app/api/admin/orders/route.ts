import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { getAdminUser, jsonSuccess, jsonError } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const admin = await getAdminUser();
    if (!admin) return jsonError('Unauthorized: Admin access required', 403);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const search = searchParams.get('search');

    await connectDB();

    const query: any = {};
    if (status) {
      query.orderStatus = status.toUpperCase();
    }
    if (paymentStatus) {
      query.paymentStatus = paymentStatus.toUpperCase();
    }
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: search, $options: 'i' } },
      ];
    }

    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    return jsonSuccess({ orders });
  } catch (error: any) {
    console.error('Admin List Orders Error:', error);
    return jsonError(error.message || 'Failed to fetch orders', 500);
  }
}

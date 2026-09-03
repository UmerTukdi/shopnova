import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import { getUserFromCookies } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromCookies();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    await connectDB();

    let order = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findOne({ _id: id, user: user.userId });
    }

    if (!order) {
      order = await Order.findOne({ orderNumber: id, user: user.userId });
    }

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error('Fetch Order Detail Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}

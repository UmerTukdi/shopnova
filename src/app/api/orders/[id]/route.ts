import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User'; // Prevent MissingSchemaError in serverless cold starts
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
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    let order = null;

    if (user.role === 'admin') {
      if (isObjectId) {
        order = await Order.findById(id).populate('user', 'name email phone').lean();
      }
      if (!order) {
        order = await Order.findOne({ orderNumber: id }).populate('user', 'name email phone').lean();
      }
    } else {
      if (isObjectId) {
        order = await Order.findOne({ _id: id, user: user.userId })
          .populate('user', 'name email phone')
          .lean();
      }
      if (!order) {
        order = await Order.findOne({ orderNumber: id, user: user.userId })
          .populate('user', 'name email phone')
          .lean();
      }
    }

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found or unauthorized' },
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

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Product from '@/models/Product';
import mongoose from 'mongoose';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    let product = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findOne({ _id: id, isDeleted: { $ne: true } });
    }

    if (!product) {
      product = await Product.findOne({ slug: id, isDeleted: { $ne: true } });
    }

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error('Fetch Product Detail Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

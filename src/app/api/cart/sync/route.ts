import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Cart from '@/models/Cart';
import Product from '@/models/Product';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { items } = await req.json();
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: true, message: 'No items to sync' });
    }

    await connectDB();
    let cart = await Cart.findOne({ user: user._id });

    if (!cart) {
      cart = new Cart({ user: user._id, items: [] });
    }

    for (const guestItem of items) {
      const productId = guestItem.productId || guestItem.product?._id || guestItem.product;
      const quantity = Math.max(1, parseInt(guestItem.quantity || 1, 10));

      if (!productId) continue;

      const product = await Product.findById(productId);
      if (!product || product.isDeleted || product.stock < 1) continue;

      const existingIndex = cart.items.findIndex(
        (ci: any) => ci.product.toString() === productId.toString()
      );

      if (existingIndex > -1) {
        cart.items[existingIndex].quantity = Math.min(
          product.stock,
          cart.items[existingIndex].quantity + quantity
        );
      } else {
        cart.items.push({
          product: product._id,
          quantity: Math.min(product.stock, quantity),
        });
      }
    }

    await cart.save();
    const updatedCart = await Cart.findById(cart._id).populate('items.product');

    return NextResponse.json({ success: true, cart: updatedCart });
  } catch (error: any) {
    console.error('Cart sync error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Cart sync failed' }, { status: 500 });
  }
}

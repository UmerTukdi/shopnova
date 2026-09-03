import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Cart from '@/models/Cart';
import Product from '@/models/Product';
import { getUserFromCookies } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getUserFromCookies();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    let cart = await Cart.findOne({ user: user.userId }).populate({
      path: 'items.product',
      model: Product,
    });

    if (!cart) {
      cart = await Cart.create({ user: user.userId, items: [] });
    }

    return NextResponse.json({ success: true, cart });
  } catch (error: any) {
    console.error('Fetch Cart Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromCookies();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { productId, quantity = 1 } = await req.json();
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    if (product.stock < quantity) {
      return NextResponse.json(
        { success: false, error: `Only ${product.stock} items available in stock` },
        { status: 400 }
      );
    }

    let cart = await Cart.findOne({ user: user.userId });
    if (!cart) {
      cart = new Cart({ user: user.userId, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingIndex > -1) {
      const newQuantity = cart.items[existingIndex].quantity + quantity;
      if (product.stock < newQuantity) {
        return NextResponse.json(
          { success: false, error: `Cannot add more. Maximum available stock is ${product.stock}` },
          { status: 400 }
        );
      }
      cart.items[existingIndex].quantity = newQuantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    await cart.populate({
      path: 'items.product',
      model: Product,
    });

    return NextResponse.json({ success: true, cart });
  } catch (error: any) {
    console.error('Add to Cart Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getUserFromCookies();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { productId, quantity } = await req.json();
    if (!productId || typeof quantity !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Product ID and valid quantity are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const cart = await Cart.findOne({ user: user.userId });
    if (!cart) {
      return NextResponse.json(
        { success: false, error: 'Cart not found' },
        { status: 404 }
      );
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Item not in cart' },
        { status: 404 }
      );
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      const product = await Product.findById(productId);
      if (product && product.stock < quantity) {
        return NextResponse.json(
          { success: false, error: `Stock limit reached. Only ${product.stock} left.` },
          { status: 400 }
        );
      }
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();
    await cart.populate({
      path: 'items.product',
      model: Product,
    });

    return NextResponse.json({ success: true, cart });
  } catch (error: any) {
    console.error('Update Cart Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update cart' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getUserFromCookies();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const clearAll = searchParams.get('clearAll');

    await connectDB();

    const cart = await Cart.findOne({ user: user.userId });
    if (!cart) {
      return NextResponse.json({ success: true, cart: { items: [] } });
    }

    if (clearAll === 'true') {
      cart.items = [];
    } else if (productId) {
      cart.items = cart.items.filter(
        (item) => item.product.toString() !== productId
      );
    }

    await cart.save();
    await cart.populate({
      path: 'items.product',
      model: Product,
    });

    return NextResponse.json({ success: true, cart });
  } catch (error: any) {
    console.error('Delete Cart Item Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to modify cart' },
      { status: 500 }
    );
  }
}

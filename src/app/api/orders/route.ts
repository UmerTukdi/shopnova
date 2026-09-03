import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import Cart from '@/models/Cart';
import Product from '@/models/Product';
import Address from '@/models/Address';
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
    const orders = await Order.find({ user: user.userId }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    console.error('Fetch Orders Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch orders' },
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

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request payload' },
        { status: 400 }
      );
    }

    const { addressId, customAddress, buyNowItem } = body;
    await connectDB();

    let itemsPrice = 0;
    const orderItems: any[] = [];
    const isBuyNow = Boolean(buyNowItem && buyNowItem.productId);

    if (isBuyNow) {
      // 1A. Direct Buy Now Flow: Fetch product directly from DB
      const qty = Math.max(1, parseInt(buyNowItem.quantity, 10) || 1);
      const product = await Product.findOne({
        _id: buyNowItem.productId,
        isDeleted: { $ne: true },
      });

      if (!product) {
        return NextResponse.json(
          { success: false, error: 'Product not found or unavailable' },
          { status: 404 }
        );
      }

      if (product.stock < qty) {
        return NextResponse.json(
          {
            success: false,
            error: `Product "${product.name}" has only ${product.stock} items in stock (requested ${qty}).`,
          },
          { status: 400 }
        );
      }

      itemsPrice = product.price * qty;
      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity: qty,
      });
    } else {
      // 1B. Standard Cart Flow: Fetch user cart from DB
      const cart = await Cart.findOne({ user: user.userId }).populate({
        path: 'items.product',
        model: Product,
      });

      if (!cart || !cart.items || cart.items.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Your cart is empty' },
          { status: 400 }
        );
      }

      for (const item of cart.items) {
        const product = item.product as any;
        if (!product || product.isDeleted) {
          return NextResponse.json(
            { success: false, error: 'One or more products in your cart no longer exist' },
            { status: 400 }
          );
        }

        if (product.stock < item.quantity) {
          return NextResponse.json(
            {
              success: false,
              error: `Product "${product.name}" has only ${product.stock} items in stock (requested ${item.quantity}).`,
            },
            { status: 400 }
          );
        }

        itemsPrice += product.price * item.quantity;
        orderItems.push({
          product: product._id,
          name: product.name,
          image: product.image,
          price: product.price,
          quantity: item.quantity,
        });
      }
    }

    // 2. Resolve Shipping Address
    let shippingAddressData = customAddress;
    if (!shippingAddressData && addressId) {
      const dbAddress = await Address.findOne({ _id: addressId, user: user.userId });
      if (!dbAddress) {
        return NextResponse.json(
          { success: false, error: 'Selected address not found' },
          { status: 400 }
        );
      }
      shippingAddressData = {
        fullName: dbAddress.fullName,
        phone: dbAddress.phone,
        addressLine: dbAddress.addressLine1 || dbAddress.addressLine,
        apartment: dbAddress.addressLine2 || dbAddress.apartment || '',
        city: dbAddress.city,
        state: dbAddress.state,
        postalCode: dbAddress.postalCode,
        country: dbAddress.country,
      };
    }

    if (!shippingAddressData) {
      return NextResponse.json(
        { success: false, error: 'Shipping address is required' },
        { status: 400 }
      );
    }

    // 3. Calculate Tax & Shipping Server-Side
    const shippingPrice = itemsPrice > 1000 ? 0 : 99; // Free shipping above ₹1000
    const taxPrice = Math.round(itemsPrice * 0.18); // 18% GST
    const totalPrice = itemsPrice + shippingPrice + taxPrice;

    // 4. Generate Order Number
    const orderNumber = `SN-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 5. Create Order
    const order = await Order.create({
      orderNumber,
      user: user.userId,
      items: orderItems,
      shippingAddress: shippingAddressData,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING',
      isBuyNow,
    });

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error('Create Order Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}

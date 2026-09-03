import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Category from '@/models/Category';
import Product from '@/models/Product';
import { hashPassword } from '@/lib/auth';

const categoriesData = [
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Latest gadgets, smartphones, laptops, and audio gear',
    image: 'https://images.unsplash.com/photo-1498049860654-af1a5c566876?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Fashion',
    slug: 'fashion',
    description: 'Trendy clothing, footwear, and accessories',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Home & Kitchen',
    slug: 'home-kitchen',
    description: 'Modern decor, cookware, appliances, and furniture',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Beauty',
    slug: 'beauty',
    description: 'Skincare, makeup, hair products, and fragrance',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Grocery',
    slug: 'grocery',
    description: 'Fresh produce, pantry staples, beverages, and snacks',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Sports',
    slug: 'sports',
    description: 'Fitness equipment, sportswear, and outdoors equipment',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623266010b?auto=format&fit=crop&w=600&q=80',
  },
];

const productsData = [
  {
    name: 'NovaPulse Wireless Noise-Canceling Headphones',
    slug: 'novapulse-wireless-headphones',
    description: 'Immersive sound quality with 40-hour battery life and active noise cancellation. Built for audiophiles and travelers.',
    price: 4999,
    mrp: 7999,
    discount: 37,
    stock: 25,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    category: 'electronics',
    rating: 4.8,
    numReviews: 124,
    featured: true,
    isBestSeller: true,
  },
  {
    name: 'UltraGlide Smart Watch Series 5',
    slug: 'ultraglide-smart-watch-series-5',
    description: 'AMOLED display, heart rate sensor, SPO2 monitoring, GPS tracking, and water resistance up to 50 meters.',
    price: 3499,
    mrp: 5999,
    discount: 41,
    stock: 18,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    category: 'electronics',
    rating: 4.6,
    numReviews: 89,
    featured: true,
    isBestSeller: false,
  },
  {
    name: 'SonicBass Portable Bluetooth Speaker',
    slug: 'sonicbass-portable-bluetooth-speaker',
    description: 'Punchy bass, IPX7 waterproof body, 20W stereo output, and dual pairing feature for room-filling sound.',
    price: 1999,
    mrp: 2999,
    discount: 33,
    stock: 40,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80',
    category: 'electronics',
    rating: 4.5,
    numReviews: 56,
    featured: false,
    isBestSeller: true,
  },
  {
    name: 'ErgoComfort Minimalist Backpack',
    slug: 'ergocomfort-minimalist-backpack',
    description: 'Water-resistant fabric, 15.6-inch padded laptop compartment, anti-theft back pocket, and USB charging port.',
    price: 1499,
    mrp: 2499,
    discount: 40,
    stock: 30,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    category: 'fashion',
    rating: 4.7,
    numReviews: 210,
    featured: true,
    isBestSeller: true,
  },
  {
    name: 'Classic Vintage Leather Denim Jacket',
    slug: 'classic-vintage-leather-denim-jacket',
    description: 'Premium cotton blend denim jacket with faux leather accents. Designed for comfort, warmth, and timeless style.',
    price: 2999,
    mrp: 4999,
    discount: 40,
    stock: 15,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',
    category: 'fashion',
    rating: 4.4,
    numReviews: 43,
    featured: false,
    isBestSeller: false,
  },
  {
    name: 'AeroCushion Running Sneakers',
    slug: 'aerocushion-running-sneakers',
    description: 'Lightweight breathable mesh upper with responsive foam cushioning for maximum performance during daily runs.',
    price: 2499,
    mrp: 3999,
    discount: 37,
    stock: 22,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    category: 'fashion',
    rating: 4.9,
    numReviews: 312,
    featured: true,
    isBestSeller: true,
  },
  {
    name: 'ChefMaster 10-Piece Stainless Steel Cookware Set',
    slug: 'chefmaster-10-piece-cookware-set',
    description: 'Heavy-gauge encapsulated aluminum base for even heating. Suitable for induction, gas, and oven cooking.',
    price: 5999,
    mrp: 9999,
    discount: 40,
    stock: 12,
    image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80',
    category: 'home-kitchen',
    rating: 4.8,
    numReviews: 67,
    featured: true,
    isBestSeller: false,
  },
  {
    name: 'AromaBrew Programmable Espresso Machine',
    slug: 'aromabrew-espresso-machine',
    description: '15-bar Italian pump pressure system with integrated milk frother wand for lattes, cappuccinos, and Americanos.',
    price: 8999,
    mrp: 14999,
    discount: 40,
    stock: 8,
    image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=800&q=80',
    category: 'home-kitchen',
    rating: 4.7,
    numReviews: 95,
    featured: false,
    isBestSeller: true,
  },
  {
    name: 'PureGlow Vitamin C Hydrating Face Serum',
    slug: 'pureglow-vitamin-c-serum',
    description: 'Infused with 15% pure L-ascorbic acid, hyaluronic acid, and vitamin E to brighten skin tone and reduce spots.',
    price: 799,
    mrp: 1299,
    discount: 38,
    stock: 50,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
    category: 'beauty',
    rating: 4.6,
    numReviews: 180,
    featured: true,
    isBestSeller: true,
  },
  {
    name: 'VelvetMatte Luxury Lipstick Set (Pack of 4)',
    slug: 'velvetmatte-luxury-lipstick-set',
    description: 'Long-lasting, smudge-proof matte lipstick bundle in signature nude and berry red shades.',
    price: 999,
    mrp: 1699,
    discount: 41,
    stock: 35,
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80',
    category: 'beauty',
    rating: 4.5,
    numReviews: 74,
    featured: false,
    isBestSeller: false,
  },
  {
    name: 'OrganoHarvest Organic Extra Virgin Olive Oil 1L',
    slug: 'organoharvest-organic-olive-oil-1l',
    description: 'First cold-pressed single origin olives. Rich in antioxidants and healthy monounsaturated fatty acids.',
    price: 849,
    mrp: 1199,
    discount: 29,
    stock: 60,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80',
    category: 'grocery',
    rating: 4.9,
    numReviews: 230,
    featured: false,
    isBestSeller: true,
  },
  {
    name: 'Artisan Gourmet Roasted Coffee Beans 500g',
    slug: 'artisan-gourmet-roasted-coffee-beans-500g',
    description: '100% Arabica dark roast beans sourced directly from Western Ghats plantations with notes of dark chocolate.',
    price: 649,
    mrp: 899,
    discount: 28,
    stock: 45,
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80',
    category: 'grocery',
    rating: 4.8,
    numReviews: 142,
    featured: true,
    isBestSeller: false,
  },
  {
    name: 'FlexiGrip Non-Slip Yoga Mat (6mm thick)',
    slug: 'flexigrip-non-slip-yoga-mat',
    description: 'Eco-friendly TPE material with laser alignment guides, high-density cushioning, and free carrying strap.',
    price: 1199,
    mrp: 1999,
    discount: 40,
    stock: 25,
    image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=800&q=80',
    category: 'sports',
    rating: 4.7,
    numReviews: 88,
    featured: false,
    isBestSeller: true,
  },
  {
    name: 'PowerFit Adjustable Dumbbell Set (20kg)',
    slug: 'powerfit-adjustable-dumbbell-set',
    description: 'Heavy duty cast iron plates with comfortable chrome knurled handles and secure star-lock collars.',
    price: 3499,
    mrp: 4999,
    discount: 30,
    stock: 14,
    image: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80',
    category: 'sports',
    rating: 4.6,
    numReviews: 104,
    featured: true,
    isBestSeller: false,
  },
  {
    name: 'HydroShield Insulated Stainless Water Bottle 1L',
    slug: 'hydroshield-insulated-water-bottle',
    description: 'Keeps drinks cold for up to 24 hours and hot for 12 hours. Sweat-free powder coat finish with leakproof lid.',
    price: 799,
    mrp: 1299,
    discount: 38,
    stock: 50,
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
    category: 'sports',
    rating: 4.9,
    numReviews: 310,
    featured: false,
    isBestSeller: true,
  },
];

export async function POST() {
  try {
    await connectDB();

    // Reset collections
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});

    // Seed Admin Account
    const adminPassword = await hashPassword('Admin@123');
    const adminUser = await User.create({
      name: 'ShopNova Admin',
      email: 'admin@shopnova.com',
      password: adminPassword,
      phone: '+91 9998887770',
      role: 'admin',
      isVerified: true,
    });

    // Seed Customer Account
    const userPassword = await hashPassword('User@123');
    const customerUser = await User.create({
      name: 'John Customer',
      email: 'user@shopnova.com',
      password: userPassword,
      phone: '+91 9876543210',
      role: 'user',
      isVerified: true,
    });

    // Seed Demo User
    const demoPassword = await hashPassword('Demo@123');
    const demoUser = await User.create({
      name: 'Alex Johnson',
      email: 'demo@shopnova.com',
      password: demoPassword,
      phone: '+91 9123456789',
      role: 'user',
      isVerified: true,
    });

    // Seed Categories
    const categories = await Category.insertMany(categoriesData);

    // Seed Products
    const products = await Product.insertMany(productsData);

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        adminUser: { id: adminUser._id, email: adminUser.email, role: 'admin' },
        customerUser: { id: customerUser._id, email: customerUser.email, role: 'user' },
        demoUser: { id: demoUser._id, email: demoUser.email, role: 'user' },
        categoriesCount: categories.length,
        productsCount: products.length,
      },
    });
  } catch (error: any) {
    console.error('Seed Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to seed database' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Category from '@/models/Category';
import Product from '@/models/Product';
import Address from '@/models/Address';
import { hashPassword } from '@/lib/auth';

// Helper to sanitize any markdown image URLs: [https://...](https://...) -> https://...
function cleanImageUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  const mdMatch = trimmed.match(/\[.*?\]\((https?:\/\/[^\s\)]+)\)/);
  if (mdMatch) {
    return mdMatch[1];
  }
  return trimmed;
}

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

const rawProductsData = [
  {
    name: 'NovaPulse Wireless Noise-Canceling Headphones',
    slug: 'novapulse-wireless-headphones',
    description: 'Immersive sound quality with 40-hour battery life and active noise cancellation. Built for audiophiles and travelers.',
    brand: 'NovaPulse',
    category: 'electronics',
    tags: ['audio', 'wireless', 'headphones', 'bluetooth'],
    price: 4999,
    originalPrice: 7999,
    mrp: 7999,
    discount: 37,
    stock: 25,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80',
    ],
    rating: 4.8,
    numReviews: 124,
    featured: true,
    isBestSeller: true,
    isDeleted: false,
  },
  {
    name: 'UltraGlide Smart Watch Series 5',
    slug: 'ultraglide-smart-watch-series-5',
    description: 'AMOLED display, heart rate sensor, SPO2 monitoring, GPS tracking, and water resistance up to 50 meters.',
    brand: 'UltraGlide',
    category: 'electronics',
    tags: ['wearable', 'smartwatch', 'fitness'],
    price: 3499,
    originalPrice: 5999,
    mrp: 5999,
    discount: 41,
    stock: 18,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'],
    rating: 4.6,
    numReviews: 89,
    featured: true,
    isBestSeller: false,
    isDeleted: false,
  },
  {
    name: 'SonicBass Portable Bluetooth Speaker',
    slug: 'sonicbass-portable-bluetooth-speaker',
    description: 'Punchy bass, IPX7 waterproof body, 20W stereo output, and dual pairing feature for room-filling sound.',
    brand: 'SonicBass',
    category: 'electronics',
    tags: ['audio', 'speaker', 'bluetooth'],
    price: 1999,
    originalPrice: 2999,
    mrp: 2999,
    discount: 33,
    stock: 40,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80',
    rating: 4.5,
    numReviews: 56,
    featured: false,
    isBestSeller: true,
    isDeleted: false,
  },
  {
    name: 'QuantumTab Pro 11-Inch OLED Tablet',
    slug: 'quantumtab-pro-11-inch-oled-tablet',
    description: 'Ultra-slim 120Hz OLED display powered by octa-core processor. Includes pressure-sensitive stylus support.',
    brand: 'QuantumTech',
    category: 'electronics',
    tags: ['tablet', 'oled', 'electronics'],
    price: 29999,
    originalPrice: 34999,
    mrp: 34999,
    discount: 14,
    stock: 10,
    image: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    numReviews: 48,
    featured: true,
    isBestSeller: false,
    isDeleted: false,
  },
  {
    name: 'ErgoComfort Minimalist Backpack',
    slug: 'ergocomfort-minimalist-backpack',
    description: 'Water-resistant fabric, 15.6-inch padded laptop compartment, anti-theft back pocket, and USB charging port.',
    brand: 'ErgoGear',
    category: 'fashion',
    tags: ['bag', 'travel', 'laptop'],
    price: 1499,
    originalPrice: 2499,
    mrp: 2499,
    discount: 40,
    stock: 30,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    numReviews: 210,
    featured: true,
    isBestSeller: true,
    isDeleted: false,
  },
  {
    name: 'Classic Vintage Leather Denim Jacket',
    slug: 'classic-vintage-leather-denim-jacket',
    description: 'Premium cotton blend denim jacket with faux leather accents. Designed for comfort, warmth, and timeless style.',
    brand: 'VintageCo',
    category: 'fashion',
    tags: ['jacket', 'denim', 'outerwear'],
    price: 2999,
    originalPrice: 4999,
    mrp: 4999,
    discount: 40,
    stock: 15,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',
    rating: 4.4,
    numReviews: 43,
    featured: false,
    isBestSeller: false,
    isDeleted: false,
  },
  {
    name: 'AeroCushion Running Sneakers',
    slug: 'aerocushion-running-sneakers',
    description: 'Lightweight breathable mesh upper with responsive foam cushioning for maximum performance during daily runs.',
    brand: 'AeroFit',
    category: 'fashion',
    tags: ['shoes', 'sneakers', 'running'],
    price: 2499,
    originalPrice: 3999,
    mrp: 3999,
    discount: 37,
    stock: 22,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    numReviews: 312,
    featured: true,
    isBestSeller: true,
    isDeleted: false,
  },
  {
    name: 'LuxeCashmere Oversized Knit Sweater',
    slug: 'luxecashmere-oversized-knit-sweater',
    description: '100% Mongolian cashmere knit sweater featuring a ribbed turtleneck and drop-shoulder silhouette.',
    brand: 'LuxeKnit',
    category: 'fashion',
    tags: ['sweater', 'cashmere', 'clothing'],
    price: 3999,
    originalPrice: 5999,
    mrp: 5999,
    discount: 33,
    stock: 16,
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    numReviews: 76,
    featured: false,
    isBestSeller: false,
    isDeleted: false,
  },
  {
    name: 'ChefMaster 10-Piece Stainless Steel Cookware Set',
    slug: 'chefmaster-10-piece-cookware-set',
    description: 'Heavy-gauge encapsulated aluminum base for even heating. Suitable for induction, gas, and oven cooking.',
    brand: 'ChefMaster',
    category: 'home-kitchen',
    tags: ['cookware', 'kitchen', 'pots'],
    price: 5999,
    originalPrice: 9999,
    mrp: 9999,
    discount: 40,
    stock: 12,
    image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    numReviews: 67,
    featured: true,
    isBestSeller: false,
    isDeleted: false,
  },
  {
    name: 'AromaBrew Programmable Espresso Machine',
    slug: 'aromabrew-espresso-machine',
    description: '15-bar Italian pump pressure system with integrated milk frother wand for lattes, cappuccinos, and Americanos.',
    brand: 'AromaBrew',
    category: 'home-kitchen',
    tags: ['coffee', 'appliance', 'espresso'],
    price: 8999,
    originalPrice: 14999,
    mrp: 14999,
    discount: 40,
    stock: 8,
    image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    numReviews: 95,
    featured: false,
    isBestSeller: true,
    isDeleted: false,
  },
  {
    name: 'Artisan Ceramic Stoneware Mug Set (Pack of 4)',
    slug: 'artisan-ceramic-stoneware-mug-set',
    description: 'Handcrafted reactive glaze ceramic mugs (350ml each). Dishwasher and microwave safe.',
    brand: 'ArtisanHome',
    category: 'home-kitchen',
    tags: ['ceramics', 'mugs', 'kitchen'],
    price: 899,
    originalPrice: 1499,
    mrp: 1499,
    discount: 40,
    stock: 24,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    rating: 4.6,
    numReviews: 38,
    featured: false,
    isBestSeller: false,
    isDeleted: false,
  },
  {
    name: 'PureGlow Vitamin C Hydrating Face Serum',
    slug: 'pureglow-vitamin-c-serum',
    description: 'Infused with 15% pure L-ascorbic acid, hyaluronic acid, and vitamin E to brighten skin tone and reduce spots.',
    brand: 'PureGlow',
    category: 'beauty',
    tags: ['skincare', 'serum', 'beauty'],
    price: 799,
    originalPrice: 1299,
    mrp: 1299,
    discount: 38,
    stock: 50,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
    rating: 4.6,
    numReviews: 180,
    featured: true,
    isBestSeller: true,
    isDeleted: false,
  },
  {
    name: 'VelvetMatte Luxury Lipstick Set (Pack of 4)',
    slug: 'velvetmatte-luxury-lipstick-set',
    description: 'Long-lasting, smudge-proof matte lipstick bundle in signature nude and berry red shades.',
    brand: 'VelvetMatte',
    category: 'beauty',
    tags: ['makeup', 'lipstick', 'beauty'],
    price: 999,
    originalPrice: 1699,
    mrp: 1699,
    discount: 41,
    stock: 35,
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80',
    rating: 4.5,
    numReviews: 74,
    featured: false,
    isBestSeller: false,
    isDeleted: false,
  },
  {
    name: 'Botanical Hydration Rosewater Facial Mist',
    slug: 'botanical-hydration-rosewater-facial-mist',
    description: 'Pure organic Damask rose flower water mist for immediate skin refreshing and pH balancing.',
    brand: 'PureGlow',
    category: 'beauty',
    tags: ['skincare', 'mist', 'beauty'],
    price: 499,
    originalPrice: 799,
    mrp: 799,
    discount: 37,
    stock: 40,
    image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    numReviews: 62,
    featured: false,
    isBestSeller: false,
    isDeleted: false,
  },
  {
    name: 'Organic Cold-Pressed Extra Virgin Olive Oil 1L',
    slug: 'organic-cold-pressed-extra-virgin-olive-oil-1l',
    description: 'First cold pressed Spanish olives with low acidity (<0.3%). Perfect for dressings, sauteing, and dip sauces.',
    brand: 'BioNature',
    category: 'grocery',
    tags: ['oliveoil', 'organic', 'grocery'],
    price: 1299,
    originalPrice: 1799,
    mrp: 1799,
    discount: 28,
    stock: 22,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    numReviews: 230,
    featured: true,
    isBestSeller: true,
    isDeleted: false,
  },
  {
    name: 'Artisan Gourmet Roasted Coffee Beans 500g',
    slug: 'artisan-gourmet-roasted-coffee-beans-500g',
    description: '100% Arabica dark roast beans sourced directly from Western Ghats plantations with notes of dark chocolate.',
    brand: 'ArtisanRoast',
    category: 'grocery',
    tags: ['coffee', 'beans', 'gourmet'],
    price: 649,
    originalPrice: 899,
    mrp: 899,
    discount: 28,
    stock: 45,
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    numReviews: 142,
    featured: true,
    isBestSeller: false,
    isDeleted: false,
  },
  {
    name: 'FlexiGrip Non-Slip Yoga Mat (6mm thick)',
    slug: 'flexigrip-non-slip-yoga-mat',
    description: 'Eco-friendly TPE material with laser alignment guides, high-density cushioning, and free carrying strap.',
    brand: 'FlexiFit',
    category: 'sports',
    tags: ['yoga', 'fitness', 'mat'],
    price: 1199,
    originalPrice: 1999,
    mrp: 1999,
    discount: 40,
    stock: 25,
    image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    numReviews: 88,
    featured: false,
    isBestSeller: true,
    isDeleted: false,
  },
  {
    name: 'PowerFit Adjustable Dumbbell Set (20kg)',
    slug: 'powerfit-adjustable-dumbbell-set',
    description: 'Heavy duty cast iron plates with comfortable chrome knurled handles and secure star-lock collars.',
    brand: 'PowerFit',
    category: 'sports',
    tags: ['gym', 'weights', 'dumbbells'],
    price: 3499,
    originalPrice: 4999,
    mrp: 4999,
    discount: 30,
    stock: 14,
    image: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80',
    rating: 4.6,
    numReviews: 104,
    featured: true,
    isBestSeller: false,
    isDeleted: false,
  },
];

export async function POST(req: Request) {
  try {
    await connectDB();

    // Check if client requested hard reset via query (?reset=true)
    const { searchParams } = new URL(req.url);
    const shouldReset = searchParams.get('reset') === 'true';

    if (shouldReset) {
      await Category.deleteMany({});
      await Product.deleteMany({});
      await User.deleteMany({ email: { $in: ['admin@shopnova.com', 'user@shopnova.com', 'demo@shopnova.com'] } });
    }

    // 1. Seed Accounts (Idempotent upsert by email)
    const adminPassword = await hashPassword('Admin@123');
    const userPassword = await hashPassword('User@123');
    const demoPassword = await hashPassword('Demo@123');

    const adminUser = await User.findOneAndUpdate(
      { email: 'admin@shopnova.com' },
      {
        $set: {
          name: 'ShopNova Admin',
          email: 'admin@shopnova.com',
          password: adminPassword,
          phone: '+91 9998887770',
          role: 'admin',
          isVerified: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const customerUser = await User.findOneAndUpdate(
      { email: 'user@shopnova.com' },
      {
        $set: {
          name: 'John Customer',
          email: 'user@shopnova.com',
          password: userPassword,
          phone: '+91 9876543210',
          role: 'user',
          isVerified: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const demoUser = await User.findOneAndUpdate(
      { email: 'demo@shopnova.com' },
      {
        $set: {
          name: 'Alex Johnson',
          email: 'demo@shopnova.com',
          password: demoPassword,
          phone: '+91 9123456789',
          role: 'user',
          isVerified: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 1b. Seed Sample Saved Addresses
    await Address.findOneAndUpdate(
      { user: customerUser._id, label: 'Home' },
      {
        $set: {
          user: customerUser._id,
          fullName: 'John Customer',
          phone: '+91 9876543210',
          label: 'Home',
          addressLine1: '123 Innovation Way, Tech Park',
          addressLine2: 'Flat 4B, Tower 2',
          addressLine: '123 Innovation Way, Tech Park',
          apartment: 'Flat 4B, Tower 2',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560100',
          country: 'India',
          isDefault: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await Address.findOneAndUpdate(
      { user: demoUser._id, label: 'Home' },
      {
        $set: {
          user: demoUser._id,
          fullName: 'Alex Johnson',
          phone: '+91 9123456789',
          label: 'Home',
          addressLine1: '78 Silicon Avenue, Koramangala',
          addressLine2: 'Apt 101',
          addressLine: '78 Silicon Avenue, Koramangala',
          apartment: 'Apt 101',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560034',
          country: 'India',
          isDefault: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 2. Seed Categories (Idempotent upsert by slug)
    for (const cat of categoriesData) {
      await Category.findOneAndUpdate(
        { slug: cat.slug },
        {
          $set: {
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            image: cleanImageUrl(cat.image),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    // 3. Seed Products (Idempotent upsert by slug)
    // Ensures originalPrice is strictly present and >= price for every product
    for (const p of rawProductsData) {
      const sellingPrice = Number(p.price) || 0;
      const originalPrice = Number(p.originalPrice || p.mrp || sellingPrice);
      const mrp = Number(p.mrp || originalPrice);
      const discount = originalPrice > sellingPrice
        ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100)
        : 0;

      const mainImage = cleanImageUrl(p.image);
      const galleryImages = Array.isArray(p.images) && p.images.length > 0
        ? p.images.map(cleanImageUrl)
        : [mainImage];

      await Product.findOneAndUpdate(
        { slug: p.slug },
        {
          $set: {
            name: p.name.trim(),
            slug: p.slug.trim(),
            description: p.description.trim(),
            brand: (p.brand || 'ShopNova').trim(),
            category: p.category.trim().toLowerCase(),
            tags: Array.isArray(p.tags) ? p.tags : [],
            price: sellingPrice,
            originalPrice,
            mrp,
            discount,
            stock: Number(p.stock) >= 0 ? Number(p.stock) : 10,
            image: mainImage,
            images: galleryImages,
            rating: p.rating || 4.5,
            numReviews: p.numReviews || 0,
            featured: Boolean(p.featured),
            isBestSeller: Boolean(p.isBestSeller),
            isDeleted: false,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    const categoriesCount = await Category.countDocuments({});
    const productsCount = await Product.countDocuments({ isDeleted: false });
    const usersCount = await User.countDocuments({});
    const addressesCount = await Address.countDocuments({});

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      categoriesCount,
      productsCount,
      usersCount,
      addressesCount,
      accounts: [
        { email: adminUser.email, role: 'admin', password: 'Admin@123' },
        { email: customerUser.email, role: 'user', password: 'User@123' },
        { email: demoUser.email, role: 'user', password: 'Demo@123' },
      ],
    });
  } catch (error: any) {
    console.error('Seed Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to seed database',
        details: error.errors ? Object.keys(error.errors) : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return POST(req);
}

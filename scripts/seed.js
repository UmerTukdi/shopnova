const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopnova';

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

async function runSeed() {
  try {
    console.log('Connecting to MongoDB at:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    const db = mongoose.connection;
    await db.collection('users').deleteMany({});
    await db.collection('categories').deleteMany({});
    await db.collection('products').deleteMany({});
    await db.collection('orders').deleteMany({});
    await db.collection('reviews').deleteMany({});
    await db.collection('addresses').deleteMany({});

    // Seed Accounts
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const userPassword = await bcrypt.hash('User@123', 10);
    const demoPassword = await bcrypt.hash('Demo@123', 10);

    await db.collection('users').insertOne({
      name: 'ShopNova Admin',
      email: 'admin@shopnova.com',
      password: adminPassword,
      phone: '+91 9998887770',
      role: 'admin',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const userResult = await db.collection('users').insertOne({
      name: 'John Customer',
      email: 'user@shopnova.com',
      password: userPassword,
      phone: '+91 9876543210',
      role: 'user',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const demoResult = await db.collection('users').insertOne({
      name: 'Demo Account',
      email: 'demo@shopnova.com',
      password: demoPassword,
      phone: '+91 9123456789',
      role: 'user',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const customerId = userResult.insertedId;
    const demoId = demoResult.insertedId;

    // Seed Saved Addresses
    await db.collection('addresses').insertMany([
      {
        user: customerId,
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
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        user: customerId,
        fullName: 'John Work',
        phone: '+91 9876543210',
        label: 'Work',
        addressLine1: 'NovaTech Tower, 5th Floor, Cyber City',
        addressLine2: 'Suite 502',
        addressLine: 'NovaTech Tower, 5th Floor, Cyber City',
        apartment: 'Suite 502',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560066',
        country: 'India',
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        user: demoId,
        fullName: 'Demo Customer',
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
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Seed Categories
    await db.collection('categories').insertMany(
      categoriesData.map((c) => ({ ...c, createdAt: new Date(), updatedAt: new Date() }))
    );

    // Sample Reviews
    const sampleReviews = [
      {
        user: customerId,
        userName: 'John Customer',
        rating: 5,
        comment: 'Outstanding sound quality and super comfy! Highly recommended.',
        createdAt: new Date(Date.now() - 10 * 86400000),
      },
      {
        user: demoId,
        userName: 'Demo Account',
        rating: 4,
        comment: 'Very good battery life and fast connectivity.',
        createdAt: new Date(Date.now() - 5 * 86400000),
      },
    ];

    const productsData = [
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
        numReviews: 2,
        reviews: sampleReviews,
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
        stock: 3, // Low Stock example
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'],
        rating: 4.6,
        numReviews: 1,
        reviews: [sampleReviews[0]],
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
        stock: 0, // Out of Stock example
        image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80',
        rating: 4.5,
        numReviews: 0,
        reviews: [],
        featured: false,
        isBestSeller: true,
        isDeleted: false,
      },
      {
        name: 'QuantumTab Pro 11-Inch OLED Tablet',
        slug: 'quantumtab-pro-11-inch-oled-tablet',
        description: 'Ultra-slim 120Hz OLED display powered by octa-core processor. Includes pressure-sensitive stylus stylus support.',
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
        numReviews: 0,
        reviews: [],
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
        numReviews: 1,
        reviews: [sampleReviews[1]],
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
        numReviews: 0,
        reviews: [],
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
        stock: 2, // Low Stock example
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
        rating: 4.9,
        numReviews: 1,
        reviews: [sampleReviews[0]],
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
        stock: 0, // Out of Stock example
        image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
        rating: 4.8,
        numReviews: 0,
        reviews: [],
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
        numReviews: 0,
        reviews: [],
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
        numReviews: 0,
        reviews: [],
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
        stock: 4, // Low Stock example
        image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
        rating: 4.6,
        numReviews: 0,
        reviews: [],
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
        numReviews: 0,
        reviews: [],
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
        numReviews: 0,
        reviews: [],
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
        numReviews: 0,
        reviews: [],
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
        numReviews: 0,
        reviews: [],
        featured: true,
        isBestSeller: true,
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
        numReviews: 0,
        reviews: [],
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
        numReviews: 0,
        reviews: [],
        featured: true,
        isBestSeller: false,
        isDeleted: false,
      },
      {
        name: 'ProGrip Anti-Burst Fitness Exercise Ball',
        slug: 'progrip-anti-burst-fitness-exercise-ball',
        description: '65cm high-density PVC core stability ball designed for Pilates, yoga stretching, and core workouts.',
        brand: 'PowerFit',
        category: 'sports',
        tags: ['fitness', 'ball', 'sports'],
        price: 799,
        originalPrice: 1299,
        mrp: 1299,
        discount: 38,
        stock: 18,
        image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
        rating: 4.4,
        numReviews: 0,
        reviews: [],
        featured: false,
        isBestSeller: false,
        isDeleted: false,
      },
    ];

    const insertedProducts = await db.collection('products').insertMany(
      productsData.map((p) => ({ ...p, createdAt: new Date(), updatedAt: new Date() }))
    );

    const product1Id = Object.values(insertedProducts.insertedIds)[0];
    const product4Id = Object.values(insertedProducts.insertedIds)[4];
    const product6Id = Object.values(insertedProducts.insertedIds)[6];

    // Seed Consistent Historical Orders
    const shippingAddr = {
      fullName: 'John Customer',
      phone: '+91 9876543210',
      addressLine: '123 Innovation Way, Tech Park',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560100',
      country: 'India',
    };

    const orders = [
      {
        orderNumber: 'ORD-1001',
        user: customerId,
        items: [
          {
            product: product1Id,
            name: 'NovaPulse Wireless Noise-Canceling Headphones',
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
            price: 4999,
            quantity: 1,
          },
        ],
        shippingAddress: shippingAddr,
        itemsPrice: 4999,
        taxPrice: 499,
        shippingPrice: 0,
        totalPrice: 5498,
        paymentStatus: 'PAID',
        orderStatus: 'DELIVERED',
        paymentResult: {
          razorpayOrderId: 'order_mock_1001',
          razorpayPaymentId: 'pay_mock_1001',
          razorpaySignature: 'sig_mock_1001',
        },
        paidAt: new Date(Date.now() - 7 * 86400000),
        deliveredAt: new Date(Date.now() - 5 * 86400000),
        createdAt: new Date(Date.now() - 7 * 86400000),
        updatedAt: new Date(Date.now() - 5 * 86400000),
      },
      {
        orderNumber: 'ORD-1002',
        user: customerId,
        items: [
          {
            product: product4Id,
            name: 'ErgoComfort Minimalist Backpack',
            image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
            price: 1499,
            quantity: 1,
          },
          {
            product: product6Id,
            name: 'AeroCushion Running Sneakers',
            image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
            price: 2499,
            quantity: 1,
          },
        ],
        shippingAddress: shippingAddr,
        itemsPrice: 3998,
        taxPrice: 399,
        shippingPrice: 100,
        totalPrice: 4497,
        paymentStatus: 'PAID',
        orderStatus: 'SHIPPED',
        paymentResult: {
          razorpayOrderId: 'order_mock_1002',
          razorpayPaymentId: 'pay_mock_1002',
          razorpaySignature: 'sig_mock_1002',
        },
        paidAt: new Date(Date.now() - 2 * 86400000),
        createdAt: new Date(Date.now() - 2 * 86400000),
        updatedAt: new Date(Date.now() - 1 * 86400000),
      },
      {
        orderNumber: 'ORD-1003',
        user: demoId,
        items: [
          {
            product: product1Id,
            name: 'NovaPulse Wireless Noise-Canceling Headphones',
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
            price: 4999,
            quantity: 1,
          },
        ],
        shippingAddress: shippingAddr,
        itemsPrice: 4999,
        taxPrice: 499,
        shippingPrice: 0,
        totalPrice: 5498,
        paymentStatus: 'PENDING',
        orderStatus: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection('orders').insertMany(orders);

    console.log('Seed executed successfully!');
    console.log('--------------------------------------------------');
    console.log(`Seeded 18 products across 6 categories.`);
    console.log('Demo Credentials Seeded:');
    console.log('Admin Account:    admin@shopnova.com / Admin@123');
    console.log('Customer Account: user@shopnova.com  / User@123');
    console.log('Demo Account:     demo@shopnova.com  / Demo@123');
    console.log('--------------------------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
}

runSeed();

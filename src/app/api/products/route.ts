import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Product from '@/models/Product';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const bestSeller = searchParams.get('bestSeller');
    const sort = searchParams.get('sort');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minRating = searchParams.get('minRating');
    const inStock = searchParams.get('inStock');

    // Customer catalog filter MUST exclude soft-deleted products
    const filter: any = { isDeleted: { $ne: true } };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    if (category && category !== 'all') {
      filter.category = category.toLowerCase();
    }

    if (featured === 'true') {
      filter.featured = true;
    }

    if (bestSeller === 'true') {
      filter.isBestSeller = true;
    }

    if (inStock === 'true') {
      filter.stock = { $gt: 0 };
    }

    if (minRating) {
      const ratingVal = Number(minRating);
      if (!isNaN(ratingVal)) {
        filter.rating = { $gte: ratingVal };
      }
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice && !isNaN(Number(minPrice))) filter.price.$gte = Number(minPrice);
      if (maxPrice && !isNaN(Number(maxPrice))) filter.price.$lte = Number(maxPrice);
    }

    let sortOptions: any = { createdAt: -1 };

    if (sort === 'price_asc') {
      sortOptions = { price: 1 };
    } else if (sort === 'price_desc') {
      sortOptions = { price: -1 };
    } else if (sort === 'rating') {
      sortOptions = { rating: -1 };
    } else if (sort === 'discount') {
      sortOptions = { discount: -1 };
    } else if (sort === 'popular') {
      sortOptions = { numReviews: -1, rating: -1 };
    }

    const products = await Product.find(filter).sort(sortOptions);

    return NextResponse.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error: any) {
    console.error('Fetch Products Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { getAdminUser, jsonSuccess, jsonError } from '@/lib/auth';

// GET /api/admin/products: List products (optionally including soft-deleted)
export async function GET(req: Request) {
  try {
    const admin = await getAdminUser();
    if (!admin) return jsonError('Unauthorized: Admin access required', 403);

    const { searchParams } = new URL(req.url);
    const includeDeleted = searchParams.get('includeDeleted') === 'true';
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    await connectDB();

    const query: any = {};
    if (!includeDeleted) {
      query.isDeleted = { $ne: true };
    }
    if (category) {
      query.category = category;
    }
    if (search) {
      query.$text = { $search: search };
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    return jsonSuccess({ products });
  } catch (error: any) {
    console.error('Admin GET Products Error:', error);
    return jsonError(error.message || 'Failed to fetch products', 500);
  }
}

// POST /api/admin/products: Create a new product with strict validation
export async function POST(req: Request) {
  try {
    const admin = await getAdminUser();
    if (!admin) return jsonError('Unauthorized: Admin access required', 403);

    const body = await req.json();
    const {
      name,
      description,
      brand,
      category,
      tags,
      price,
      originalPrice,
      mrp,
      stock,
      image,
      images,
      featured,
      isBestSeller,
    } = body;

    // Field validations
    if (!name || typeof name !== 'string' || !name.trim()) {
      return jsonError('Product name is required', 400);
    }
    if (!description || typeof description !== 'string' || !description.trim()) {
      return jsonError('Product description is required', 400);
    }
    if (!category || typeof category !== 'string' || !category.trim()) {
      return jsonError('Category is required', 400);
    }
    if (!image || typeof image !== 'string' || !image.trim()) {
      return jsonError('Main image URL is required', 400);
    }

    const numPrice = Number(price);
    const numOriginalPrice = Number(originalPrice || mrp || price);
    const numStock = Number(stock);

    if (isNaN(numPrice) || numPrice < 0) {
      return jsonError('Price must be a number greater than or equal to 0', 400);
    }
    if (isNaN(numStock) || numStock < 0) {
      return jsonError('Stock must be a number greater than or equal to 0', 400);
    }
    if (isNaN(numOriginalPrice) || numOriginalPrice < numPrice) {
      return jsonError('Original price (MRP) cannot be lower than selling price', 400);
    }

    await connectDB();

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`;

    const discount = numOriginalPrice > numPrice
      ? Math.round(((numOriginalPrice - numPrice) / numOriginalPrice) * 100)
      : 0;

    const newProduct = await Product.create({
      name: name.trim(),
      slug,
      description: description.trim(),
      brand: (brand || 'ShopNova').trim(),
      category: category.trim().toLowerCase(),
      tags: Array.isArray(tags) ? tags : [],
      price: numPrice,
      originalPrice: numOriginalPrice,
      mrp: numOriginalPrice,
      discount,
      stock: Math.floor(numStock),
      image: image.trim(),
      images: Array.isArray(images) && images.length > 0 ? images : [image.trim()],
      featured: Boolean(featured),
      isBestSeller: Boolean(isBestSeller),
      isDeleted: false,
    });

    return jsonSuccess({ product: newProduct }, 'Product created successfully', 201);
  } catch (error: any) {
    console.error('Admin Create Product Error:', error);
    return jsonError(error.message || 'Failed to create product', 500);
  }
}

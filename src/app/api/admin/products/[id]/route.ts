import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { getAdminUser, jsonSuccess, jsonError } from '@/lib/auth';

// PUT /api/admin/products/[id]: Edit product details
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminUser();
    if (!admin) return jsonError('Unauthorized: Admin access required', 403);

    const { id } = await params;
    const body = await req.json();

    await connectDB();
    const product = await Product.findById(id);
    if (!product) return jsonError('Product not found', 404);

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
      isDeleted,
    } = body;

    if (name !== undefined) {
      if (!name || typeof name !== 'string' || !name.trim()) {
        return jsonError('Product name cannot be empty', 400);
      }
      product.name = name.trim();
    }

    if (description !== undefined) {
      if (!description || typeof description !== 'string' || !description.trim()) {
        return jsonError('Description cannot be empty', 400);
      }
      product.description = description.trim();
    }

    if (brand !== undefined) product.brand = brand.trim();
    if (category !== undefined) product.category = category.trim().toLowerCase();
    if (tags !== undefined && Array.isArray(tags)) product.tags = tags;
    if (image !== undefined && image) product.image = image.trim();
    if (images !== undefined && Array.isArray(images)) product.images = images;
    if (featured !== undefined) product.featured = Boolean(featured);
    if (isBestSeller !== undefined) product.isBestSeller = Boolean(isBestSeller);
    if (isDeleted !== undefined) product.isDeleted = Boolean(isDeleted);

    let currentPrice = product.price;
    let currentOrig = product.originalPrice || product.mrp || product.price;

    if (price !== undefined) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) {
        return jsonError('Price must be greater than or equal to 0', 400);
      }
      currentPrice = numPrice;
      product.price = numPrice;
    }

    if (originalPrice !== undefined || mrp !== undefined) {
      const numOrig = Number(originalPrice || mrp);
      if (isNaN(numOrig) || numOrig < currentPrice) {
        return jsonError('Original price cannot be lower than selling price', 400);
      }
      currentOrig = numOrig;
      product.originalPrice = numOrig;
      product.mrp = numOrig;
    }

    if (stock !== undefined) {
      const numStock = Number(stock);
      if (isNaN(numStock) || numStock < 0) {
        return jsonError('Stock cannot be negative', 400);
      }
      product.stock = Math.floor(numStock);
    }

    product.discount = currentOrig > currentPrice
      ? Math.round(((currentOrig - currentPrice) / currentOrig) * 100)
      : 0;

    await product.save();

    return jsonSuccess({ product }, 'Product updated successfully');
  } catch (error: any) {
    console.error('Admin Edit Product Error:', error);
    return jsonError(error.message || 'Failed to update product', 500);
  }
}

// DELETE /api/admin/products/[id]: Toggle soft-delete or permanent delete
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminUser();
    if (!admin) return jsonError('Unauthorized: Admin access required', 403);

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const permanent = searchParams.get('permanent') === 'true';

    await connectDB();
    const product = await Product.findById(id);
    if (!product) return jsonError('Product not found', 404);

    if (permanent) {
      await Product.findByIdAndDelete(id);
      return jsonSuccess(null, 'Product permanently deleted');
    } else {
      product.isDeleted = true;
      await product.save();
      return jsonSuccess({ product }, 'Product soft-deleted successfully');
    }
  } catch (error: any) {
    console.error('Admin Delete Product Error:', error);
    return jsonError(error.message || 'Failed to delete product', 500);
  }
}

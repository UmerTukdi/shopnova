import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { getAdminUser, jsonSuccess, jsonError } from '@/lib/auth';

// GET /api/admin/inventory: Get product stock details
export async function GET(req: Request) {
  try {
    const admin = await getAdminUser();
    if (!admin) return jsonError('Unauthorized: Admin access required', 403);

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter'); // 'low' | 'out' | 'all'

    await connectDB();

    const query: any = { isDeleted: { $ne: true } };
    if (filter === 'low') {
      query.stock = { $gt: 0, $lte: 5 };
    } else if (filter === 'out') {
      query.stock = 0;
    }

    const products = await Product.find(query)
      .select('name slug brand category stock price image originalPrice rating numReviews')
      .sort({ stock: 1 });

    const totalProducts = await Product.countDocuments({ isDeleted: { $ne: true } });
    const lowStockCount = await Product.countDocuments({ isDeleted: { $ne: true }, stock: { $gt: 0, $lte: 5 } });
    const outOfStockCount = await Product.countDocuments({ isDeleted: { $ne: true }, stock: 0 });

    return jsonSuccess({
      products,
      summary: {
        totalProducts,
        lowStockCount,
        outOfStockCount,
      },
    });
  } catch (error: any) {
    console.error('Admin Inventory GET Error:', error);
    return jsonError(error.message || 'Failed to fetch inventory', 500);
  }
}

// PATCH /api/admin/inventory: Atomic stock update
export async function PATCH(req: Request) {
  try {
    const admin = await getAdminUser();
    if (!admin) return jsonError('Unauthorized: Admin access required', 403);

    const { productId, stock } = await req.json();

    if (!productId) {
      return jsonError('Product ID is required', 400);
    }

    const newStock = Math.floor(Number(stock));
    if (isNaN(newStock) || newStock < 0) {
      return jsonError('Stock cannot be negative', 400);
    }

    await connectDB();

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId, isDeleted: { $ne: true } },
      { stock: newStock },
      { new: true }
    );

    if (!updatedProduct) {
      return jsonError('Product not found or deleted', 404);
    }

    return jsonSuccess({ product: updatedProduct }, `Stock updated to ${newStock} units`);
  } catch (error: any) {
    console.error('Admin Stock Update Error:', error);
    return jsonError(error.message || 'Failed to update stock', 500);
  }
}

import connectDB from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
import { getAdminUser, jsonSuccess, jsonError } from '@/lib/auth';

export async function GET() {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return jsonError('Unauthorized: Admin access required', 403);
    }

    await connectDB();

    // 1. Order & Revenue Aggregation (Paid Orders only for Revenue)
    const revenueResult = await Order.aggregate([
      {
        $facet: {
          totalRevenue: [
            { $match: { paymentStatus: 'PAID' } },
            { $group: { _id: null, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
          ],
          totalOrdersCount: [{ $count: 'count' }],
          statusBreakdown: [
            { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
          ],
          recentOrders: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            {
              $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'userInfo',
              },
            },
            {
              $project: {
                orderNumber: 1,
                totalPrice: 1,
                paymentStatus: 1,
                orderStatus: 1,
                createdAt: 1,
                customerName: { $arrayElemAt: ['$userInfo.name', 0] },
                customerEmail: { $arrayElemAt: ['$userInfo.email', 0] },
              },
            },
          ],
        },
      },
    ]);

    const facet = revenueResult[0] || {};
    const totalRevenue = facet.totalRevenue?.[0]?.total || 0;
    const paidOrdersCount = facet.totalRevenue?.[0]?.count || 0;
    const totalOrders = facet.totalOrdersCount?.[0]?.count || 0;

    // 2. Customers Count
    const totalCustomers = await User.countDocuments({ role: 'user' });

    // 3. Product & Inventory Metrics
    const totalProducts = await Product.countDocuments({ isDeleted: { $ne: true } });
    const lowStockCount = await Product.countDocuments({ isDeleted: { $ne: true }, stock: { $gt: 0, $lte: 5 } });
    const outOfStockCount = await Product.countDocuments({ isDeleted: { $ne: true }, stock: 0 });

    // 4. Revenue Trend (Daily / Monthly)
    const revenueTrend = await Order.aggregate([
      { $match: { paymentStatus: 'PAID' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 14 },
    ]);

    // 5. Order Status Map
    const statusMap: Record<string, number> = {
      PENDING: 0,
      CONFIRMED: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    (facet.statusBreakdown || []).forEach((item: any) => {
      if (item._id) {
        statusMap[item._id] = item.count;
      }
    });

    return jsonSuccess({
      metrics: {
        totalRevenue,
        paidOrdersCount,
        totalOrders,
        totalCustomers,
        totalProducts,
        lowStockCount,
        outOfStockCount,
      },
      recentOrders: facet.recentOrders || [],
      revenueTrend,
      statusBreakdown: statusMap,
    });
  } catch (error: any) {
    console.error('Admin Stats Error:', error);
    return jsonError(error.message || 'Failed to fetch admin stats', 500);
  }
}

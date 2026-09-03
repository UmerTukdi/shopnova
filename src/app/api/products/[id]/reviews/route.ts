import connectDB from '@/lib/db';
import Product from '@/models/Product';
import Order from '@/models/Order';
import { getAuthenticatedUser, jsonSuccess, jsonError } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: productId } = await params;
    const user = await getAuthenticatedUser();

    if (!user) {
      return jsonError('Authentication required to post a review', 401);
    }

    const { rating, comment } = await req.json();

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return jsonError('Rating must be a number between 1 and 5', 400);
    }

    if (!comment || typeof comment !== 'string' || !comment.trim()) {
      return jsonError('Comment text is required', 400);
    }

    await connectDB();
    const product = await Product.findById(productId);
    if (!product || product.isDeleted) {
      return jsonError('Product not found', 404);
    }

    // VERIFIED PURCHASER CHECK: User must have at least one PAID or DELIVERED order containing this product
    const verifiedOrder = await Order.findOne({
      user: user._id,
      $or: [{ paymentStatus: 'PAID' }, { orderStatus: 'DELIVERED' }],
      'items.product': product._id,
    });

    if (!verifiedOrder) {
      return jsonError('Only verified buyers can review this product.', 403);
    }

    // PREVENT DUPLICATE REVIEWS
    const alreadyReviewed = product.reviews?.some(
      (r) => r.user.toString() === user._id.toString()
    );

    if (alreadyReviewed) {
      return jsonError('You have already submitted a review for this product.', 400);
    }

    const newReview = {
      user: user._id,
      userName: user.name,
      rating: numericRating,
      comment: comment.trim(),
      createdAt: new Date(),
    };

    if (!product.reviews) {
      product.reviews = [];
    }

    product.reviews.push(newReview as any);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => acc + item.rating, 0) / product.reviews.length;

    await product.save();

    return jsonSuccess({ reviews: product.reviews, rating: product.rating, numReviews: product.numReviews }, 'Review submitted successfully', 201);
  } catch (error: any) {
    console.error('Submit review error:', error);
    return jsonError(error.message || 'Failed to submit review', 500);
  }
}

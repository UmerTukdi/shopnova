import connectDB from '@/lib/db';
import User from '@/models/User';
import { getAdminUser, jsonSuccess, jsonError } from '@/lib/auth';

export async function GET() {
  try {
    const admin = await getAdminUser();
    if (!admin) return jsonError('Unauthorized: Admin access required', 403);

    await connectDB();
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });

    return jsonSuccess({ users });
  } catch (error: any) {
    console.error('Admin GET Users Error:', error);
    return jsonError(error.message || 'Failed to fetch users', 500);
  }
}

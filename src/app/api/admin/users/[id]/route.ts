import connectDB from '@/lib/db';
import User from '@/models/User';
import { getAdminUser, jsonSuccess, jsonError } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminUser();
    if (!admin) return jsonError('Unauthorized: Admin access required', 403);

    const { id } = await params;
    const { role } = await req.json();

    if (!role || !['user', 'admin'].includes(role)) {
      return jsonError('Role must be either "user" or "admin"', 400);
    }

    if (id === admin._id.toString() && role === 'user') {
      return jsonError('Cannot demote your own active admin account', 400);
    }

    await connectDB();
    const userToUpdate = await User.findById(id);
    if (!userToUpdate) return jsonError('User not found', 404);

    userToUpdate.role = role;
    await userToUpdate.save();

    return jsonSuccess({ user: { id: userToUpdate._id, name: userToUpdate.name, email: userToUpdate.email, role: userToUpdate.role } }, `Role updated to ${role}`);
  } catch (error: any) {
    console.error('Admin Update User Error:', error);
    return jsonError(error.message || 'Failed to update user role', 500);
  }
}

import { NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function GET() {
  try {
    const payload = await getUserFromCookies();
    if (!payload) {
      return NextResponse.json(
        { success: false, user: null, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findById(payload.userId).select('-password');
    if (!user) {
      return NextResponse.json(
        { success: false, user: null, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error: any) {
    console.error('Me Auth Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Authentication check failed' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const payload = await getUserFromCookies();
    if (!payload?.userId) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { name, phone } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Name cannot be blank' },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    user.name = name.trim();
    if (phone !== undefined) {
      user.phone = phone.trim();
    }
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error: any) {
    console.error('Update Profile Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}


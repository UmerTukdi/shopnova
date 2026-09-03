import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Address from '@/models/Address';
import { getUserFromCookies } from '@/lib/auth';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getUserFromCookies();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const userObjId = mongoose.Types.ObjectId.isValid(user.userId)
      ? new mongoose.Types.ObjectId(user.userId)
      : user.userId;

    const addresses = await Address.find({
      $or: [{ user: userObjId }, { user: user.userId }],
    })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, addresses });
  } catch (error: any) {
    console.error('Fetch Addresses Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch addresses' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromCookies();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      fullName,
      phone,
      label = 'Home',
      addressLine1,
      addressLine2,
      addressLine,
      apartment,
      city,
      state,
      postalCode,
      country,
      isDefault,
    } = body;

    const line1 = (addressLine1 || addressLine || '').trim();
    const line2 = (addressLine2 || apartment || '').trim();

    if (!fullName || !phone || !line1 || !city || !state || !postalCode) {
      return NextResponse.json(
        { success: false, error: 'Please provide all required address fields' },
        { status: 400 }
      );
    }

    await connectDB();

    const userObjId = mongoose.Types.ObjectId.isValid(user.userId)
      ? new mongoose.Types.ObjectId(user.userId)
      : user.userId;

    const userMatch = { $or: [{ user: userObjId }, { user: user.userId }] };

    // Check if user has any existing addresses
    const existingCount = await Address.countDocuments(userMatch);
    const shouldBeDefault = isDefault || existingCount === 0;

    if (shouldBeDefault) {
      await Address.updateMany(userMatch, { isDefault: false });
    }

    const validLabel = ['Home', 'Work', 'Other'].includes(label) ? label : 'Home';

    const address = await Address.create({
      user: userObjId,
      fullName: fullName.trim(),
      phone: phone.trim(),
      label: validLabel,
      addressLine1: line1,
      addressLine2: line2,
      addressLine: line1,
      apartment: line2,
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      country: (country || 'India').trim(),
      isDefault: shouldBeDefault,
    });

    return NextResponse.json({ success: true, address });
  } catch (error: any) {
    console.error('Create Address Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add address' },
      { status: 500 }
    );
  }
}

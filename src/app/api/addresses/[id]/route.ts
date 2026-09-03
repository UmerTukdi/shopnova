import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Address from '@/models/Address';
import { getUserFromCookies } from '@/lib/auth';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromCookies();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    await connectDB();

    const address = await Address.findOne({ _id: id, user: user.userId });
    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address not found or unauthorized' },
        { status: 404 }
      );
    }

    if (body.isDefault) {
      await Address.updateMany({ user: user.userId }, { isDefault: false });
    }

    if (body.addressLine1 !== undefined) {
      address.addressLine1 = body.addressLine1;
      address.addressLine = body.addressLine1;
    } else if (body.addressLine !== undefined) {
      address.addressLine = body.addressLine;
      address.addressLine1 = body.addressLine;
    }

    if (body.addressLine2 !== undefined) {
      address.addressLine2 = body.addressLine2;
      address.apartment = body.addressLine2;
    } else if (body.apartment !== undefined) {
      address.apartment = body.apartment;
      address.addressLine2 = body.apartment;
    }

    if (body.fullName !== undefined) address.fullName = body.fullName;
    if (body.phone !== undefined) address.phone = body.phone;
    if (body.city !== undefined) address.city = body.city;
    if (body.state !== undefined) address.state = body.state;
    if (body.postalCode !== undefined) address.postalCode = body.postalCode;
    if (body.country !== undefined) address.country = body.country;
    if (body.isDefault !== undefined) address.isDefault = Boolean(body.isDefault);
    if (body.label && ['Home', 'Work', 'Other'].includes(body.label)) {
      address.label = body.label;
    }

    await address.save();

    return NextResponse.json({ success: true, address });
  } catch (error: any) {
    console.error('Update Address Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update address' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromCookies();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    await connectDB();

    const deleted = await Address.findOneAndDelete({ _id: id, user: user.userId });
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Address not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Address deleted successfully' });
  } catch (error: any) {
    console.error('Delete Address Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete address' },
      { status: 500 }
    );
  }
}

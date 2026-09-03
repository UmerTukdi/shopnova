import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { name, email, password, phone } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser && existingUser.isVerified) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    const { generateOtp, hashOtp, OTP_EXPIRY_MS } = await import('@/lib/otp');
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    const hashedPassword = await hashPassword(password);

    let user;
    if (existingUser && !existingUser.isVerified) {
      // Re-initialize unverified account with updated credentials & fresh OTP
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.phone = phone || '';
      existingUser.otpHash = otpHash;
      existingUser.otpExpiresAt = otpExpiresAt;
      existingUser.otpAttempts = 0;
      existingUser.otpLastSentAt = new Date();
      await existingUser.save();
      user = existingUser;
    } else {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone: phone || '',
        role: 'user',
        isVerified: false,
        otpHash,
        otpExpiresAt,
        otpAttempts: 0,
        otpLastSentAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      requiresVerification: true,
      email: user.email,
      message: 'Account created! Please enter the 6-digit verification code to activate your account.',
    });
  } catch (error: any) {
    console.error('Registration Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}

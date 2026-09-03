import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { signToken } from '@/lib/auth';
import { verifyOtpHash, MAX_OTP_ATTEMPTS } from '@/lib/otp';

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: 'Email and 6-digit OTP are required' },
        { status: 400 }
      );
    }

    const cleanOtp = String(otp).trim();
    if (cleanOtp.length !== 6) {
      return NextResponse.json(
        { success: false, error: 'OTP must be exactly 6 digits' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() }).select('+otpHash');
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Account not found for this email address' },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { success: false, error: 'Account is already verified. Please log in directly.' },
        { status: 400 }
      );
    }

    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many failed verification attempts. Please request a new OTP.',
          canResend: true,
        },
        { status: 429 }
      );
    }

    if (!user.otpExpiresAt || new Date() > new Date(user.otpExpiresAt)) {
      return NextResponse.json(
        { success: false, error: 'OTP has expired. Please request a new verification code.', canResend: true },
        { status: 400 }
      );
    }

    const isValid = verifyOtpHash(cleanOtp, user.otpHash || '');
    if (!isValid) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();

      const remaining = Math.max(0, MAX_OTP_ATTEMPTS - user.otpAttempts);
      const errorMsg =
        remaining > 0
          ? `Invalid OTP. You have ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
          : 'Too many failed attempts. Please request a new OTP.';

      return NextResponse.json(
        {
          success: false,
          error: errorMsg,
          remainingAttempts: remaining,
          canResend: remaining === 0,
        },
        { status: 400 }
      );
    }

    // OTP Verified Successfully
    user.isVerified = true;
    user.otpHash = undefined;
    user.otpExpiresAt = undefined;
    user.otpAttempts = 0;
    await user.save();

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Account verified successfully! Welcome to ShopNova.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'OTP verification failed' },
      { status: 500 }
    );
  }
}

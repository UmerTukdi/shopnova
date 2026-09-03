import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { generateOtp, hashOtp, OTP_EXPIRY_MS, OTP_RESEND_COOLDOWN_MS } from '@/lib/otp';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email address is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() }).select('+otpHash');
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Account not found for this email' },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { success: false, error: 'Account is already verified. Please log in directly.' },
        { status: 400 }
      );
    }

    // Cooldown check (60 seconds)
    if (user.otpLastSentAt) {
      const elapsed = Date.now() - new Date(user.otpLastSentAt).getTime();
      if (elapsed < OTP_RESEND_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
        return NextResponse.json(
          {
            success: false,
            error: `Please wait ${remainingSeconds} second${remainingSeconds === 1 ? '' : 's'} before requesting a new code.`,
            retryAfter: remainingSeconds,
          },
          { status: 429 }
        );
      }
    }

    const newOtp = generateOtp();
    user.otpHash = hashOtp(newOtp);
    user.otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    user.otpAttempts = 0;
    user.otpLastSentAt = new Date();
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'A new 6-digit verification code has been issued.',
      cooldownSeconds: 60,
    });
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to resend OTP' },
      { status: 500 }
    );
  }
}

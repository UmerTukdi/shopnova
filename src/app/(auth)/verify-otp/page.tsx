'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Sparkles, AlertCircle, CheckCircle2, RotateCcw, ArrowRight } from 'lucide-react';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyOtp, resendOtp } = useAuth();

  const emailParam = searchParams.get('email') || '';
  const redirectPath = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState(emailParam);
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [cooldown, setCooldown] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pasteDigits = value.replace(/\D/g, '').slice(0, 6).split('');
      if (pasteDigits.length > 0) {
        const next = [...digits];
        pasteDigits.forEach((d, i) => {
          if (index + i < 6) next[index + i] = d;
        });
        setDigits(next);
        const nextFocus = Math.min(5, index + pasteDigits.length);
        inputRefs.current[nextFocus]?.focus();
      }
      return;
    }

    const cleanChar = value.replace(/\D/g, '');
    const next = [...digits];
    next[index] = cleanChar;
    setDigits(next);

    if (cleanChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleQuickFillDemoOtp = () => {
    setDigits(['1', '2', '3', '4', '5', '6']);
    inputRefs.current[5]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const otpCode = digits.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    if (!email) {
      setError('Email address is missing. Please return to the login or registration screen.');
      return;
    }

    setLoading(true);
    const res = await verifyOtp(email, otpCode);
    setLoading(false);

    if (res.success) {
      router.push(redirectPath);
    } else {
      setError(res.error || 'Invalid or expired OTP code. Try entering 123456 in demo mode.');
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending || !email) return;

    setError('');
    setSuccessMsg('');
    setResending(true);

    const res = await resendOtp(email);
    setResending(false);

    if (res.success) {
      setSuccessMsg('A fresh verification code was sent! (Demo OTP: 123456)');
      setCooldown(60);
    } else {
      setError(res.error || 'Failed to resend code. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-8 sm:p-10 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white mx-auto shadow-md shadow-indigo-600/30">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Verify Your Account</h1>
        <p className="text-xs text-slate-500">
          Enter the 6-digit code for <strong className="text-slate-900">{email || 'your account'}</strong>
        </p>
      </div>

      {/* Demo OTP Helper Box */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-xs space-y-2 text-indigo-900">
        <div className="flex items-center justify-between">
          <span className="font-bold flex items-center gap-1.5 text-xs text-indigo-900">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Evaluation Demo Mode
          </span>
          <button
            type="button"
            onClick={handleQuickFillDemoOtp}
            className="text-[11px] font-black text-indigo-700 bg-white hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 shadow-sm transition-colors"
          >
            Fill &ldquo;123456&rdquo;
          </button>
        </div>
        <p className="text-[11px] text-slate-600">
          Real SMS/Email OTP is mocked for evaluation. The active test OTP is{' '}
          <strong className="font-mono text-indigo-600 font-bold">123456</strong>.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3.5 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-3.5 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 6 Digit Input Group */}
        <div className="flex justify-center items-center gap-2 sm:gap-3">
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl font-black rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 focus:bg-white focus:outline-none transition-all shadow-sm"
              aria-label={`Digit ${idx + 1}`}
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || digits.join('').length !== 6}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? 'Verifying Code...' : 'Confirm Verification'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Resend Action */}
      <div className="text-center pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Didn&apos;t get the code?</span>
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || resending}
          className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
        </button>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="max-w-md w-full mx-auto py-12 px-4 sm:px-6">
      <Suspense fallback={<div className="h-96 bg-white rounded-3xl border border-slate-200 animate-pulse" />}>
        <VerifyOtpContent />
      </Suspense>
    </div>
  );
}

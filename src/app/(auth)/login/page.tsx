'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Lock, Mail, Sparkles, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      router.push(redirectPath);
    } else if (res.requiresVerification) {
      const targetEmail = res.email || email;
      router.push(`/verify-otp?email=${encodeURIComponent(targetEmail)}&redirect=${encodeURIComponent(redirectPath)}`);
    } else {
      setError(res.error || 'Invalid email or password');
    }
  };

  const handleFillCustomer = () => {
    setEmail('user@shopnova.com');
    setPassword('User@123');
    setError('');
  };

  const handleFillAdmin = () => {
    setEmail('admin@shopnova.com');
    setPassword('Admin@123');
    setError('');
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-8 sm:p-10 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white mx-auto shadow-md shadow-indigo-600/30">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
        <p className="text-xs text-slate-500">Sign in to your ShopNova account to checkout &amp; track orders</p>
      </div>

      {/* Demo Credentials Quick Fill Banner */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 space-y-2 text-xs text-indigo-950">
        <p className="font-bold flex items-center gap-1.5 text-xs text-indigo-900">
          <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Evaluation Demo Accounts
        </p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleFillCustomer}
            className="bg-white hover:bg-indigo-50 border border-indigo-200 text-slate-800 font-semibold p-2.5 rounded-xl text-left transition-colors shadow-sm"
          >
            <p className="font-bold text-[11px] text-slate-900">👤 Customer Account</p>
            <p className="text-[10px] text-slate-500 truncate">user@shopnova.com</p>
          </button>
          <button
            type="button"
            onClick={handleFillAdmin}
            className="bg-white hover:bg-indigo-50 border border-indigo-200 text-slate-800 font-semibold p-2.5 rounded-xl text-left transition-colors shadow-sm"
          >
            <p className="font-bold text-[11px] text-indigo-700">⚡ Admin Account</p>
            <p className="text-[10px] text-slate-500 truncate">admin@shopnova.com</p>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3.5 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Email Address</label>
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
            />
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-slate-700">Password</label>
            <span className="text-[11px] text-slate-400">Pass: User@123 or Admin@123</span>
          </div>
          <div className="relative">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
            />
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? 'Authenticating...' : 'Sign In'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
        Don&apos;t have an account yet?{' '}
        <Link
          href={`/register?redirect=${encodeURIComponent(redirectPath)}`}
          className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          Create an Account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="max-w-md w-full mx-auto py-12 px-4 sm:px-6">
      <Suspense fallback={<div className="h-96 bg-white rounded-3xl border border-slate-200 animate-pulse" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

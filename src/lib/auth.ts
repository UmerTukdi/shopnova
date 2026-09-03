import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User, { IUser } from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'shopnova_default_secret_key';

export interface UserTokenPayload {
  userId: string;
  email: string;
  name: string;
  role?: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}

export function signToken(payload: UserTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserTokenPayload;
  } catch {
    return null;
  }
}

export async function getUserFromCookies(): Promise<UserTokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    return verifyToken(token);
  } catch (error) {
    console.error('Error getting user from cookies:', error);
    return null;
  }
}

/**
 * Server-side user authentication check.
 * Verifies JWT token and fetches current user document from MongoDB database.
 */
export async function getAuthenticatedUser(): Promise<IUser | null> {
  try {
    const payload = await getUserFromCookies();
    if (!payload?.userId) return null;

    await connectDB();
    const user = await User.findById(payload.userId);
    if (!user) return null;

    return user;
  } catch (error) {
    console.error('getAuthenticatedUser error:', error);
    return null;
  }
}

/**
 * Server-side Admin Authorization check.
 * Verifies JWT token AND verifies database record has role === 'admin'.
 * Never relies solely on client-side state or JWT payload.
 */
export async function getAdminUser(): Promise<IUser | null> {
  try {
    const user = await getAuthenticatedUser();
    if (!user || user.role !== 'admin') {
      return null;
    }
    return user;
  } catch (error) {
    console.error('getAdminUser error:', error);
    return null;
  }
}

export function jsonSuccess(data: unknown = null, message?: string, status: number = 200) {
  return NextResponse.json({ success: true, data, message }, { status });
}

export function jsonError(message: string, status: number = 400, errorDetails?: unknown) {
  return NextResponse.json(
    { success: false, message, error: message, ...(process.env.NODE_ENV === 'development' ? { details: errorDetails } : {}) },
    { status }
  );
}

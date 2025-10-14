import { NextResponse } from 'next/server';
// Import the JS helper to avoid TypeScript/lowdb typing mismatches
const auth = require('../../../../lib/auth/index.cjs');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name } = body;
    if (!email || !password) return NextResponse.json({ error: 'missing_credentials' }, { status: 400 });

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return NextResponse.json({ error: 'invalid_email' }, { status: 400 });

    // Basic password rules: minimum 8 chars
    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'weak_password', message: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const user = await auth.createUser(email, password, name);
    return NextResponse.json({ ok: true, user });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 400 });
  }
}

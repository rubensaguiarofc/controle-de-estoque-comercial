import { NextResponse } from 'next/server';
// use JS helper
const auth = require('../../../../lib/auth/index.cjs');

export async function GET(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const match = cookie.split(';').map(s => s.trim()).find(s => s.startsWith('auth='));
    if (!match) return NextResponse.json({ ok: false, user: null });
    const token = match.split('=')[1];
    const data = auth.verifyJwt(token);
    if (!data) return NextResponse.json({ ok: false, user: null });
    const user = await auth.getUserById(data.id);
    return NextResponse.json({ ok: true, user });
  } catch (e: any) {
    return NextResponse.json({ ok: false, user: null, error: e.message }, { status: 500 });
  }
}

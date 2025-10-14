import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

// Import the JS helper to avoid TypeScript/lowdb typing mismatches
const auth = require('../../../../lib/auth/index.cjs');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    // Simple demo authentication: accept password '123456'
    if (password === "123456") {
      const token = randomUUID();
      const user = { email };

      const res = NextResponse.json({ ok: true, user });
      // Set a simple httpOnly cookie with the generated token (demo)
      res.cookies.set("token", token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      return res;
    }

    const user = await auth.verifyUser(email, password);
    if (!user) return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
    const token = auth.signJwt({ id: user.id, email: user.email });
    const res = NextResponse.json({ ok: true, user });
    res.cookies.set({ name: 'auth', value: token, httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7 });
    return res;
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";

const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const client = new OAuth2Client(clientId);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // accept either field name used by client (credential) or idToken
    const idToken = body?.idToken || body?.id_token || body?.credential;
    if (!idToken) {
      return NextResponse.json({ ok: false, error: "Missing id token (credential/idToken)" }, { status: 400 });
    }

    if (!clientId) {
      return NextResponse.json({ ok: false, error: "Server not configured with GOOGLE_CLIENT_ID" }, { status: 500 });
    }

    try {
      const ticket = await client.verifyIdToken({ idToken, audience: clientId });
      const payload = ticket.getPayload();
      if (!payload) {
        return NextResponse.json({ ok: false, error: "Invalid token payload" }, { status: 400 });
      }

  const user = { email: payload.email, name: payload.name, picture: payload.picture, payload };
  // return payload too for easier debugging in dev
  const res = NextResponse.json({ ok: true, user, payload });
      // In production you should create a real session or JWT here. Demo cookie below:
      res.cookies.set("token", "google-verified-demo-token", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      return res;
    } catch (e) {
      console.error("Google token verification failed", e);
      return NextResponse.json({ ok: false, error: "Invalid id token" }, { status: 401 });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

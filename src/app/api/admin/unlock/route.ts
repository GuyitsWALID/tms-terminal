import { NextRequest, NextResponse } from "next/server";

const ADMIN_GATE_COOKIE = "tms_admin_gate";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { code?: string };
  const code = body.code?.trim() ?? "";
  const expectedCode = process.env.ADMIN_HOTKEY_CODE?.trim() ?? "";
  const gateSecret = process.env.ADMIN_GATE_SECRET?.trim() ?? "";

  if (!expectedCode || !gateSecret) {
    return NextResponse.json({ error: "Admin hotkey gate is not configured." }, { status: 500 });
  }

  if (!code || code !== expectedCode) {
    return NextResponse.json({ error: "Invalid team code." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.cookies.set({
    name: ADMIN_GATE_COOKIE,
    value: gateSecret,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return response;
}

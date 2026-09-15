import { NextRequest, NextResponse } from "next/server";
import { verifyLogin } from "@/lib/accounts";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const username = (body?.username || "").toString();
  const password = (body?.password || "").toString();

  if (!username || !password) {
    return NextResponse.json(
      { success: false, message: "Username dan password wajib diisi." },
      { status: 400 }
    );
  }

  const account = await verifyLogin(username, password);
  if (!account) {
    return NextResponse.json(
      { success: false, message: "Username atau password salah." },
      { status: 401 }
    );
  }

  const token = await createSessionToken({ username: account.username, role: account.role });
  await logActivity(account.username, `Berhasil masuk ke dashboard (${account.role})`);

  const res = NextResponse.json({
    success: true,
    account: { username: account.username, role: account.role },
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}

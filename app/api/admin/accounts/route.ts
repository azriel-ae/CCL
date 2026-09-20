import { NextRequest, NextResponse } from "next/server";
import { getPublicAccounts, createAccount, deleteAccount } from "@/lib/accounts";
import { getSession } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-helpers";

export const runtime = "nodejs";

// GET mengembalikan daftar username & role admin. Middleware sudah menolak
// /api/admin/* tanpa sesi valid, tapi POST/DELETE di bawah tetap memeriksa
// sesi sendiri sebagai lapisan kedua — GET dulu tidak. Sekarang konsisten,
// jadi endpoint ini tidak pernah membocorkan daftar akun kalau suatu saat
// matcher middleware berubah.
export const GET = withErrorHandling(async () => {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const accounts = await getPublicAccounts();
  return NextResponse.json({ success: true, accounts });
});

export const POST = withErrorHandling(async (req) => {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = await (req as NextRequest).json().catch(() => null);
  const username = (body?.username || "").toString();
  const password = (body?.password || "").toString();

  const result = await createAccount(username, password, session.username);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.message }, { status: 400 });
  }
  return NextResponse.json({ success: true, account: result.account }, { status: 201 });
});

export const DELETE = withErrorHandling(async (req) => {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const username = (req as NextRequest).nextUrl.searchParams.get("username");
  if (!username) {
    return NextResponse.json({ success: false, error: "username wajib diisi." }, { status: 400 });
  }

  const result = await deleteAccount(username, session.username);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.message }, { status: 400 });
  }
  return NextResponse.json({ success: true });
});

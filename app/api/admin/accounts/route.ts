import { NextRequest, NextResponse } from "next/server";
import { getPublicAccounts, createAccount, deleteAccount } from "@/lib/accounts";
import { getSession } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-helpers";

export const runtime = "nodejs";

export const GET = withErrorHandling(async () => {
  const accounts = await getPublicAccounts();
  return NextResponse.json({ success: true, accounts });
});

export const POST = withErrorHandling(async (req) => {
  const session = await getSession();
  const body = await (req as NextRequest).json().catch(() => null);
  const username = (body?.username || "").toString();
  const password = (body?.password || "").toString();

  const result = await createAccount(username, password, session!.username);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.message }, { status: 400 });
  }
  return NextResponse.json({ success: true, account: result.account }, { status: 201 });
});

export const DELETE = withErrorHandling(async (req) => {
  const session = await getSession();
  const username = (req as NextRequest).nextUrl.searchParams.get("username");
  if (!username) {
    return NextResponse.json({ success: false, error: "username wajib diisi." }, { status: 400 });
  }

  const result = await deleteAccount(username, session!.username);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.message }, { status: 400 });
  }
  return NextResponse.json({ success: true });
});

import { NextRequest, NextResponse } from "next/server";
import { getPublicAccounts, createAccount, deleteAccount } from "@/lib/accounts";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const accounts = await getPublicAccounts();
  return NextResponse.json({ success: true, accounts });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const body = await req.json().catch(() => null);
  const username = (body?.username || "").toString();
  const password = (body?.password || "").toString();

  const result = await createAccount(username, password, session!.username);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.message }, { status: 400 });
  }
  return NextResponse.json({ success: true, account: result.account }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  const username = req.nextUrl.searchParams.get("username");
  if (!username) {
    return NextResponse.json({ success: false, error: "username wajib diisi." }, { status: 400 });
  }

  const result = await deleteAccount(username, session!.username);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.message }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}

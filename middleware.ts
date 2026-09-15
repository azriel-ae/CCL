import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./lib/session";

/**
 * Proteksi server-side yang sesungguhnya untuk area admin.
 *
 * Di versi lama, "login admin" hanya mengecek localStorage/sessionStorage di
 * browser lalu menyembunyikan/menampilkan tombol — siapa pun yang tahu URL
 * /admin.html tetap bisa membuka HTML-nya, dan API tidak pernah memverifikasi
 * siapa pemanggilnya. Middleware ini menolak request di level server
 * (sebelum halaman/route handler admin dijalankan) kalau cookie sesi tidak
 * ada atau tidak valid.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isLoginPage = pathname === "/admin/login";
  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin") && !pathname.startsWith("/api/admin/login");

  if (!isAdminPage && !isAdminApi) return NextResponse.next();
  if (isLoginPage) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    if (isAdminApi) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};

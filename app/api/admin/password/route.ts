import { NextRequest, NextResponse } from "next/server";
import { changePassword } from "@/lib/accounts";
import { getSession } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-helpers";

/**
 * Ubah password admin yang SEDANG LOGIN.
 *
 * Lapisan proteksi:
 * 1. middleware.ts menolak semua request ke /api/admin/* tanpa cookie sesi
 *    valid (dijalankan sebelum route handler ini).
 * 2. getSession() di sini memeriksa ulang sesi di dalam handler, jadi endpoint
 *    ini tetap aman walau matcher middleware suatu saat berubah.
 * 3. Username target diambil DARI SESI, bukan dari body. Body hanya boleh
 *    berisi password lama/baru/konfirmasi. Ini yang mencegah user biasa (atau
 *    admin non-owner) mengubah password akun lain lewat endpoint ini.
 *
 * Tidak ada password maupun hash yang pernah dikembalikan ke frontend, dan
 * tidak ada password yang masuk ke log/aktivitas.
 */

export const runtime = "nodejs";

export const POST = withErrorHandling(async (req) => {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await (req as NextRequest).json().catch(() => null);
  const currentPassword = (body?.currentPassword ?? "").toString();
  const newPassword = (body?.newPassword ?? "").toString();
  const confirmPassword = (body?.confirmPassword ?? "").toString();

  const result = await changePassword(
    session.username,
    currentPassword,
    newPassword,
    confirmPassword
  );

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, message: "Password admin berhasil diperbarui." });
});

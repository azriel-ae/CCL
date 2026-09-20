import { NextRequest, NextResponse } from "next/server";
import { put, list } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import { createHash } from "crypto";
import { withErrorHandling } from "@/lib/api-helpers";
import { getSession } from "@/lib/auth";

/**
 * Upload foto produk.
 *
 * Proteksi: middleware.ts sudah menolak /api/admin/* tanpa sesi valid;
 * getSession() di bawah adalah lapisan kedua di dalam handler.
 *
 * Versi lama menyimpan foto upload sebagai base64 data-URL di localStorage
 * (cepat membengkak & tidak scalable), lalu diganti upload object ke Vercel
 * Blob. Masalah yang masih tersisa dan diperbaiki di sini:
 *
 * - Nama object dulu `products/<timestamp>-<random>.<ext>`, jadi MEMILIH file
 *   yang sama dua kali (atau membatalkan form lalu upload ulang) selalu
 *   membuat object Blob baru, dan yang lama jadi sampah permanen.
 * - Handler ini dipanggil setiap kali admin memilih file di input, bukan saat
 *   menyimpan produk — jadi percobaan/ganti-ganti foto ikut menumpuk object.
 *
 * Sekarang nama object diturunkan dari SHA-256 isi file. File dengan isi sama
 * = pathname sama, jadi:
 * - kalau object-nya sudah ada, upload di-skip total dan URL lama dipakai ulang
 *   (tidak ada object baru, tidak ada transfer byte);
 * - kalau belum ada, diupload satu kali dengan pathname deterministik.
 */

export const runtime = "nodejs";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/** Cache hash -> URL untuk menghindari `list()` berulang di instance yang sama. */
const knownUploads = new Map<string, string>();

function logUpload(detail: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production" && process.env.BLOB_DEBUG !== "1") return;
  console.log(`[blob:upload-image] ${JSON.stringify(detail)}`);
}

const SAFE_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif"]);

function extensionFor(file: File): string {
  const raw = (file.name.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (SAFE_EXT.has(raw)) return raw;
  const fromType = file.type.split("/")[1]?.toLowerCase() || "";
  return SAFE_EXT.has(fromType) ? fromType : "jpg";
}

export const POST = withErrorHandling(async (req) => {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const formData = await (req as NextRequest).formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ success: false, error: "File tidak ditemukan." }, { status: 400 });
  }

  // Validasi SELALU sebelum menyentuh storage, supaya file yang ditolak tidak
  // pernah menghasilkan object Blob.
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ success: false, error: "File harus berupa gambar." }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ success: false, error: "Ukuran gambar maksimal 5MB." }, { status: 400 });
  }

  // Satu buffer saja untuk seluruh proses: dipakai untuk hashing dan (kalau
  // perlu) untuk upload. Tidak ada konversi base64 dan tidak ada salinan kedua.
  const bytes = Buffer.from(await file.arrayBuffer());
  const digest = createHash("sha256").update(bytes).digest("hex").slice(0, 32);
  const filename = `products/${digest}.${extensionFor(file)}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const cachedUrl = knownUploads.get(filename);
    if (cachedUrl) {
      logUpload({ filename, bytes: bytes.length, action: "reuse-cache" });
      return NextResponse.json({ success: true, url: cachedUrl, deduplicated: true });
    }

    const { blobs } = await list({ prefix: filename, limit: 1 });
    const existing = blobs.find((b) => b.pathname === filename);
    if (existing) {
      knownUploads.set(filename, existing.url);
      logUpload({ filename, bytes: bytes.length, action: "reuse-existing" });
      return NextResponse.json({ success: true, url: existing.url, deduplicated: true });
    }

    const blob = await put(filename, bytes, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    knownUploads.set(filename, blob.url);
    logUpload({ filename, bytes: bytes.length, action: "uploaded", by: session.username });
    return NextResponse.json({ success: true, url: blob.url, deduplicated: false });
  }

  // Fallback lokal HANYA untuk development di laptop. Di Vercel, folder
  // project (termasuk public/) read-only saat runtime — kalau sampai ke
  // sini berarti BLOB_READ_WRITE_TOKEN lupa di-set di production.
  if (process.env.VERCEL) {
    return NextResponse.json(
      {
        success: false,
        error:
          "BLOB_READ_WRITE_TOKEN belum di-set di Vercel. Tambahkan di Project Settings → Environment Variables, lalu redeploy.",
      },
      { status: 500 }
    );
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  const localName = filename.replace("products/", "");
  await fs.writeFile(path.join(uploadDir, localName), bytes);

  return NextResponse.json({ success: true, url: `/uploads/${localName}` });
});

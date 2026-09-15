import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import { withErrorHandling } from "@/lib/api-helpers";

// Upload foto produk. Diproteksi middleware.ts (wajib login admin).
//
// Versi lama menyimpan foto upload sebagai base64 data-URL langsung di
// localStorage — praktis untuk demo tapi cepat membengkak & tidak scalable.
// Di sini file benar-benar diupload sebagai object (Vercel Blob di
// production; folder public/uploads sebagai fallback saat development).

export const runtime = "nodejs";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export const POST = withErrorHandling(async (req) => {
  const formData = await (req as NextRequest).formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ success: false, error: "File tidak ditemukan." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ success: false, error: "File harus berupa gambar." }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ success: false, error: "Ukuran gambar maksimal 5MB." }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "jpg";
  const filename = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(filename, file, { access: "public" });
    return NextResponse.json({ success: true, url: blob.url });
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
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(uploadDir, localName), buffer);

  return NextResponse.json({ success: true, url: `/uploads/${localName}` });
});

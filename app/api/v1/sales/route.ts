import { NextRequest, NextResponse } from "next/server";
import { readSales, createSale, upsertSale, deleteSale, deleteAllSales } from "@/lib/sales";
import { getSession } from "@/lib/auth";
import { rateLimit, clientKey } from "@/lib/rate-limit";

// Endpoint ini dipertahankan persis di path yang sama (/api/v1/sales) supaya
// checkout WhatsApp di halaman utama tetap kompatibel tanpa perubahan.
//
// GET    -> daftar pesanan (perlu login admin — berisi data pelanggan)
// POST   -> simpan 1 pesanan baru (publik, dipanggil saat checkout WhatsApp)
// PUT    -> update pesanan (perlu login admin)
// DELETE -> hapus transaksi (perlu login admin)
//
// Catatan keamanan dibanding versi lama: endpoint lama mengizinkan siapa
// saja (CORS "*", tanpa auth) membaca/mengubah/menghapus seluruh data
// penjualan asal tahu URL-nya. Path ini sekarang berada di domain yang sama
// dengan dashboard admin, jadi GET/PUT/DELETE ditutup untuk publik dan hanya
// POST (mencatat pesanan) yang tetap terbuka.

export const runtime = "nodejs";

const MAX_STORED = 500;

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const limitParam = Number(req.nextUrl.searchParams.get("limit"));
    const limit = Math.min(limitParam > 0 ? limitParam : 100, MAX_STORED);
    const sales = await readSales();

    return NextResponse.json(
      { success: true, count: Math.min(sales.length, limit), sales: sales.slice(0, limit) },
      { headers: noStoreHeaders() }
    );
  } catch (err) {
    console.error("GET /api/v1/sales error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data penjualan" },
      { status: 500 }
    );
  }
}

// Batas untuk endpoint publik POST. Setiap POST = 1 baca + 1 tulis Blob,
// jadi batas ini melindungi biaya Blob sekaligus kebersihan data dashboard.
const PUBLIC_POST_LIMIT = 20;
const PUBLIC_POST_WINDOW_MS = 60_000;
const MAX_BODY_BYTES = 8 * 1024;

export async function POST(req: NextRequest) {
  try {
    const gate = rateLimit(`sales:post:${clientKey(req)}`, PUBLIC_POST_LIMIT, PUBLIC_POST_WINDOW_MS);
    if (!gate.allowed) {
      return NextResponse.json(
        { success: false, error: "Terlalu banyak permintaan. Coba lagi sebentar." },
        { status: 429, headers: { "Retry-After": String(gate.retryAfterSeconds) } }
      );
    }

    // Tolak payload raksasa sebelum di-parse: data ini akhirnya ikut tersimpan
    // di file JSON penjualan, jadi ukurannya langsung memengaruhi ukuran Blob.
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { success: false, error: "Data pesanan terlalu besar" },
        { status: 413 }
      );
    }

    let order: unknown = null;
    try {
      order = raw ? JSON.parse(raw) : null;
    } catch {
      order = null;
    }

    if (!order || typeof order !== "object") {
      return NextResponse.json(
        { success: false, error: "Data pesanan tidak valid" },
        { status: 400 }
      );
    }

    const record = await createSale(order as Parameters<typeof createSale>[0]);
    return NextResponse.json({ success: true, order: record }, { status: 201 });
  } catch (err) {
    console.error("POST /api/v1/sales error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal menyimpan data penjualan" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Data update tidak valid" }, { status: 400 });
    }
    if (!body.id && !body.invoice) {
      return NextResponse.json(
        { success: false, error: "id atau invoice wajib diisi untuk update" },
        { status: 400 }
      );
    }

    const updated = await upsertSale(body);
    return NextResponse.json({ success: true, order: updated });
  } catch (err) {
    console.error("PUT /api/v1/sales error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui data penjualan" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = req.nextUrl.searchParams.get("id");

    if (id) {
      const ok = await deleteSale(id);
      if (!ok) {
        return NextResponse.json({ success: false, error: "Transaksi tidak ditemukan" }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: `Transaksi ${id} dihapus` });
    }

    await deleteAllSales();
    return NextResponse.json({ success: true, message: "Semua data penjualan dihapus" });
  } catch (err) {
    console.error("DELETE /api/v1/sales error:", err);
    return NextResponse.json({ success: false, error: "Gagal menghapus data" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getProducts, createProduct, updateProduct, deleteProduct } from "@/lib/products";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

// Semua method di sini sudah dijaga oleh middleware.ts (wajib login admin).
// getSession() dipanggil ulang di sini untuk mencatat siapa yang melakukan
// aksi (activity log), bukan untuk otorisasi itu sendiri.

export const runtime = "nodejs";

export async function GET() {
  const products = await getProducts();
  return NextResponse.json({ success: true, products });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const body = await req.json().catch(() => null);

  if (!body?.name || !body?.desc) {
    return NextResponse.json(
      { success: false, error: "Nama produk dan deskripsi bahan wajib diisi." },
      { status: 400 }
    );
  }

  const product = await createProduct(body);
  await logActivity(session!.username, `Menambahkan produk baru: ${product.name}`);
  return NextResponse.json({ success: true, product }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  const body = await req.json().catch(() => null);

  if (!body?.id) {
    return NextResponse.json({ success: false, error: "id produk wajib diisi." }, { status: 400 });
  }

  const product = await updateProduct(body.id, body);
  if (!product) {
    return NextResponse.json({ success: false, error: "Produk tidak ditemukan." }, { status: 404 });
  }

  await logActivity(session!.username, `Mengubah produk: ${product.name}`);
  return NextResponse.json({ success: true, product });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ success: false, error: "id produk wajib diisi." }, { status: 400 });
  }

  const ok = await deleteProduct(id);
  if (!ok) {
    return NextResponse.json({ success: false, error: "Produk tidak ditemukan." }, { status: 404 });
  }

  await logActivity(session!.username, `Menghapus produk (id: ${id})`);
  return NextResponse.json({ success: true });
}

import "server-only";
import { put, list, del } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";

/**
 * Lapisan penyimpanan data generik berbasis JSON.
 *
 * Project lama menyimpan data produk & akun di localStorage browser (artinya
 * data itu tidak nyata dibagikan antar pengunjung / tidak bisa ditegakkan di
 * server). Data penjualan sudah lebih baik: memakai Vercel Blob sebagai
 * "database" file JSON tunggal. Kita reuse pola itu dan terapkan ke semua
 * data yang perlu server-side enforcement (produk & akun), bukan bikin
 * database baru dari nol.
 *
 * Saat BLOB_READ_WRITE_TOKEN belum di-set (mis. development lokal tanpa
 * akun Vercel), otomatis fallback ke file JSON di folder ./.data supaya
 * `npm run dev` tetap bisa jalan end-to-end.
 */

const useLocalFallback = !process.env.BLOB_READ_WRITE_TOKEN;
const LOCAL_DIR = path.join(process.cwd(), ".data");

async function ensureLocalDir() {
  await fs.mkdir(LOCAL_DIR, { recursive: true });
}

async function readLocal<T>(key: string): Promise<T | null> {
  try {
    const file = path.join(LOCAL_DIR, key);
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeLocal(key: string, value: unknown) {
  await ensureLocalDir();
  const file = path.join(LOCAL_DIR, key);
  await fs.writeFile(file, JSON.stringify(value, null, 2), "utf-8");
}

async function findExistingBlob(key: string) {
  const { blobs } = await list({ prefix: key, limit: 1 });
  return blobs.find((b) => b.pathname === key) || null;
}

export async function readJson<T>(key: string): Promise<T | null> {
  if (useLocalFallback) return readLocal<T>(key);

  const existing = await findExistingBlob(key);
  if (!existing) return null;

  try {
    const bustUrl = `${existing.url}?_t=${Date.now()}`;
    const res = await fetch(bustUrl, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (err) {
    console.error(`Gagal membaca blob ${key}:`, err);
    return null;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  if (useLocalFallback) {
    await writeLocal(key, value);
    return;
  }

  await put(key, JSON.stringify(value), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
}

export async function deleteJson(key: string): Promise<void> {
  if (useLocalFallback) {
    try {
      await fs.unlink(path.join(LOCAL_DIR, key));
    } catch {
      // sudah tidak ada, tidak masalah
    }
    return;
  }

  const existing = await findExistingBlob(key);
  if (existing) {
    await del(existing.url);
  }
}

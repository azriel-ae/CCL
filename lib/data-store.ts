import "server-only";
import { put, list, del } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import { createHash } from "crypto";

/**
 * Lapisan penyimpanan data generik berbasis JSON di atas Vercel Blob.
 *
 * Project lama menyimpan data produk & akun di localStorage browser (artinya
 * data itu tidak nyata dibagikan antar pengunjung / tidak bisa ditegakkan di
 * server). Data penjualan sudah lebih baik: memakai Vercel Blob sebagai
 * "database" file JSON tunggal. Pola itu dipertahankan — tidak ada database
 * baru di sini.
 *
 * Yang DIOPTIMASI di file ini (lihat laporan untuk detail):
 *
 * 1. `list()` tidak lagi dipanggil setiap kali baca. URL blob untuk sebuah key
 *    bersifat stabil (addRandomSuffix: false), jadi URL-nya di-cache di memori
 *    proses. Efeknya: `list()` maksimal 1x per key per cold start.
 * 2. Cache-buster `?_t=Date.now()` dihapus dari jalur baca normal. Dulu param
 *    itu memaksa SETIAP pembacaan menembus CDN & Next.js Data Cache, sehingga
 *    tiap pengunjung homepage = 1 download blob berbayar. Sekarang pembacaan
 *    normal boleh dilayani cache (TTL pendek), dan pembacaan yang wajib segar
 *    (sebelum tulis) memakai `fresh: true`.
 * 3. Cache di memori proses (TTL pendek) untuk pembacaan tampilan.
 * 4. Tulis yang tidak mengubah apa pun di-skip (dedupe berbasis hash isi),
 *    supaya tidak ada versi blob baru yang identik dengan versi sebelumnya.
 *
 * Saat BLOB_READ_WRITE_TOKEN belum di-set (mis. development lokal tanpa
 * akun Vercel), otomatis fallback ke file JSON di folder ./.data supaya
 * `npm run dev` tetap bisa jalan end-to-end.
 */

const useLocalFallback = !process.env.BLOB_READ_WRITE_TOKEN;
const LOCAL_DIR = path.join(process.cwd(), ".data");

/**
 * Berapa lama hasil baca boleh dilayani dari cache sebelum diambil ulang.
 * Jalur tulis selalu membaca dengan `fresh: true`, jadi TTL ini hanya
 * mempengaruhi tampilan (katalog, dashboard), bukan konsistensi data.
 */
const CACHE_TTL_SECONDS = Math.max(0, Number(process.env.DATA_CACHE_TTL_SECONDS ?? 30));

type CacheEntry = { value: unknown; expiresAt: number };

const memoryCache = new Map<string, CacheEntry>();
const blobUrlCache = new Map<string, string>();
/** Hash isi yang terakhir benar-benar ditulis ke Blob, untuk dedupe tulis. */
const lastWrittenHash = new Map<string, string>();

/**
 * Negative cache: key yang sudah dipastikan BELUM ADA di Blob.
 *
 * Tanpa ini, setiap pembacaan key yang belum pernah ditulis memanggil `list()`
 * lagi. Kasus nyatanya bukan teoritis: `products-data.json` baru dibuat saat
 * admin pertama kali mengubah katalog, sedangkan homepage bersifat
 * force-dynamic dan membaca katalog di SETIAP request — jadi pada deploy baru,
 * setiap pengunjung homepage = 1 operasi `list()` berbayar. Hal yang sama
 * terjadi pada `sales-data.json` setelah admin menghapus semua transaksi.
 *
 * TTL-nya pendek, dan entri langsung dibuang saat key benar-benar ditulis,
 * jadi data baru tidak pernah "tersembunyi" oleh cache ini.
 */
const missingUntil = new Map<string, number>();
const MISSING_TTL_MS = Math.max(0, CACHE_TTL_SECONDS) * 1000 || 30_000;

type BlobOp =
  | "blob:list"
  | "blob:download"
  | "blob:upload"
  | "blob:upload-skipped"
  | "blob:delete"
  | "cache:hit";

/**
 * Monitoring ringan operasi Blob. Aktif otomatis di development; di production
 * hanya aktif kalau BLOB_DEBUG=1 supaya log tidak membanjir. Tidak pernah
 * mencatat isi data, password, maupun token — hanya key, ukuran, dan alasan.
 */
function logBlobOp(op: BlobOp, key: string, extra?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production" && process.env.BLOB_DEBUG !== "1") return;
  const detail = extra && Object.keys(extra).length ? ` ${JSON.stringify(extra)}` : "";
  console.log(`[${op}] ${key}${detail}`);
}

function hashOf(serialized: string) {
  return createHash("sha256").update(serialized).digest("hex");
}

function assertLocalFallbackIsSafe() {
  // Di Vercel (serverless), filesystem project bersifat read-only kecuali
  // /tmp — fallback ke folder lokal ./.data HANYA valid untuk development
  // di laptop. Kalau BLOB_READ_WRITE_TOKEN lupa di-set di Vercel, gagalnya
  // dulu berupa error filesystem teknis (EROFS) yang membingungkan. Sekarang
  // dilempar sebagai pesan yang jelas dan actionable.
  if (process.env.VERCEL) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN belum di-set di Vercel. Buka Vercel Dashboard → Storage → Create Database → Blob, lalu tambahkan tokennya di Project Settings → Environment Variables, kemudian redeploy."
    );
  }
}

async function ensureLocalDir() {
  await fs.mkdir(LOCAL_DIR, { recursive: true });
}

/**
 * Membaca file fallback lokal. Sengaja MEMBEDAKAN "file belum ada" (ENOENT)
 * dari "ada tapi gagal dibaca/di-parse", supaya pemanggil seperti
 * lib/accounts.ts tidak salah menyimpulkan bahwa datanya kosong.
 */
async function readLocalResult<T>(key: string): Promise<ReadResult<T>> {
  const file = path.join(LOCAL_DIR, key);
  let raw: string;
  try {
    raw = await fs.readFile(file, "utf-8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return { ok: false, reason: "missing" };
    console.error(`Gagal membaca file lokal ${key}:`, err);
    return { ok: false, reason: "error" };
  }
  try {
    return { ok: true, value: JSON.parse(raw) as T };
  } catch (err) {
    console.error(`File lokal ${key} bukan JSON valid:`, err);
    return { ok: false, reason: "error" };
  }
}

async function writeLocal(key: string, value: unknown) {
  await ensureLocalDir();
  const file = path.join(LOCAL_DIR, key);
  await fs.writeFile(file, JSON.stringify(value, null, 2), "utf-8");
}

/**
 * Mencari URL blob untuk sebuah key. Hasilnya di-cache karena pathname blob
 * kita deterministik (addRandomSuffix: false), jadi URL-nya tidak berubah
 * walau isinya diperbarui.
 */
async function resolveBlobUrl(key: string): Promise<string | null> {
  const cached = blobUrlCache.get(key);
  if (cached) return cached;

  // Sudah dipastikan belum ada baru-baru ini -> jangan panggil list() lagi.
  const negativeUntil = missingUntil.get(key);
  if (negativeUntil && negativeUntil > Date.now()) {
    logBlobOp("cache:hit", key, { reason: "negative cache (blob belum ada)" });
    return null;
  }

  const { blobs } = await list({ prefix: key, limit: 1 });
  logBlobOp("blob:list", key, { reason: "url belum di-cache" });

  const found = blobs.find((b) => b.pathname === key) || null;
  if (!found) {
    if (MISSING_TTL_MS > 0) missingUntil.set(key, Date.now() + MISSING_TTL_MS);
    return null;
  }

  missingUntil.delete(key);
  blobUrlCache.set(key, found.url);
  return found.url;
}

export type ReadOptions = {
  /**
   * Lewati semua cache dan ambil isi terbaru dari Blob. WAJIB dipakai pada
   * jalur read-modify-write (mis. menambah transaksi, mengubah produk,
   * mengubah password) supaya tidak ada perubahan yang hilang.
   */
  fresh?: boolean;
};

/**
 * Hasil pembacaan yang MEMBEDAKAN tiga keadaan:
 *
 * - `ok: true`            -> data berhasil dibaca.
 * - `reason: "missing"`   -> key-nya memang belum pernah ada.
 * - `reason: "error"`     -> storage-nya bermasalah (jaringan, HTTP non-2xx,
 *                            JSON rusak) — isi sebenarnya TIDAK diketahui.
 *
 * Perbedaan ini penting untuk data kredensial: `readJson()` yang lama
 * memulangkan `null` untuk keduanya, sehingga satu kali gangguan jaringan
 * tidak bisa dibedakan dari "belum ada akun" (lihat lib/accounts.ts).
 */
export type ReadResult<T> = { ok: true; value: T } | { ok: false; reason: "missing" | "error" };

export async function readJsonResult<T>(
  key: string,
  options: ReadOptions = {}
): Promise<ReadResult<T>> {
  const { fresh = false } = options;

  if (useLocalFallback) {
    assertLocalFallbackIsSafe();
    return readLocalResult<T>(key);
  }

  if (!fresh && CACHE_TTL_SECONDS > 0) {
    const cached = memoryCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      logBlobOp("cache:hit", key);
      return { ok: true, value: cached.value as T };
    }
  }

  const url = await resolveBlobUrl(key);
  if (!url) return { ok: false, reason: "missing" };

  try {
    // fresh  -> wajib menembus semua cache (cache-buster + no-store).
    // normal -> boleh dilayani Next.js Data Cache / CDN selama TTL, ini yang
    //           menghilangkan 1 download blob berbayar per pengunjung.
    const res = fresh
      ? await fetch(`${url}?_t=${Date.now()}`, { cache: "no-store" })
      : await fetch(url, { next: { revalidate: CACHE_TTL_SECONDS || 30 } });

    logBlobOp("blob:download", key, { fresh });

    if (!res.ok) {
      // 404 = object-nya benar-benar hilang (mis. baru dihapus dari instance
      // lain, sementara URL-nya masih ter-cache di sini). Selain itu anggap
      // gangguan storage, BUKAN "data kosong".
      if (res.status === 404) {
        blobUrlCache.delete(key);
        return { ok: false, reason: "missing" };
      }
      console.error(`Gagal membaca blob ${key}: HTTP ${res.status}`);
      return { ok: false, reason: "error" };
    }

    const value = (await res.json()) as T;

    if (CACHE_TTL_SECONDS > 0) {
      memoryCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_SECONDS * 1000 });
    }
    return { ok: true, value };
  } catch (err) {
    console.error(`Gagal membaca blob ${key}:`, err);
    return { ok: false, reason: "error" };
  }
}

/**
 * Pembacaan sederhana: `null` untuk "tidak ada ATAU gagal dibaca".
 *
 * Tetap dipakai oleh jalur yang punya fallback aman kalau datanya kosong
 * (katalog produk -> DEFAULT_PRODUCTS, penjualan -> array kosong, log
 * aktivitas -> array kosong). Jalur kredensial memakai `readJsonResult()`.
 */
export async function readJson<T>(key: string, options: ReadOptions = {}): Promise<T | null> {
  const result = await readJsonResult<T>(key, options);
  return result.ok ? result.value : null;
}

/**
 * Menyimpan data JSON ke Blob pada pathname yang tetap (bukan object baru
 * setiap kali). Kalau isinya identik dengan yang terakhir ditulis, upload
 * di-skip sepenuhnya.
 *
 * @returns true kalau benar-benar menulis ke Blob, false kalau di-skip.
 */
export async function writeJson(key: string, value: unknown): Promise<boolean> {
  if (useLocalFallback) {
    assertLocalFallbackIsSafe();
    await writeLocal(key, value);
    return true;
  }

  const serialized = JSON.stringify(value);
  const hash = hashOf(serialized);

  if (lastWrittenHash.get(key) === hash) {
    logBlobOp("blob:upload-skipped", key, { reason: "isi identik dengan versi terakhir" });
    // Tetap segarkan cache baca supaya tampilan konsisten.
    if (CACHE_TTL_SECONDS > 0) {
      memoryCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_SECONDS * 1000 });
    }
    return false;
  }

  const blob = await put(key, serialized, {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: CACHE_TTL_SECONDS || 60,
  });

  logBlobOp("blob:upload", key, { bytes: Buffer.byteLength(serialized), newObject: !blobUrlCache.has(key) });

  blobUrlCache.set(key, blob.url);
  lastWrittenHash.set(key, hash);
  // Key ini sekarang jelas ADA -> buang penanda "belum ada".
  missingUntil.delete(key);
  if (CACHE_TTL_SECONDS > 0) {
    memoryCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_SECONDS * 1000 });
  }
  return true;
}

export async function deleteJson(key: string): Promise<void> {
  memoryCache.delete(key);
  lastWrittenHash.delete(key);
  // Setelah dihapus, pembacaan berikutnya tidak perlu list() untuk
  // menemukan bahwa object-nya sudah tidak ada.
  if (MISSING_TTL_MS > 0) missingUntil.set(key, Date.now() + MISSING_TTL_MS);

  if (useLocalFallback) {
    assertLocalFallbackIsSafe();
    try {
      await fs.unlink(path.join(LOCAL_DIR, key));
    } catch {
      // sudah tidak ada, tidak masalah
    }
    return;
  }

  const url = await resolveBlobUrl(key);
  if (url) {
    await del(url);
    logBlobOp("blob:delete", key);
    blobUrlCache.delete(key);
  }
}

/**
 * Hapus satu object Blob berdasarkan URL-nya. Dipakai untuk membersihkan foto
 * produk yang sudah tidak direferensikan produk mana pun (lihat lib/products).
 *
 * Sengaja defensif: hanya mau menghapus URL yang benar-benar milik Vercel Blob
 * dan berada di prefix `products/` — jadi tidak mungkin ikut menghapus gambar
 * statis di /public, URL eksternal, atau file data JSON aplikasi.
 */
export async function deleteUploadedImage(url: string): Promise<boolean> {
  if (useLocalFallback) return false;
  if (!url || !/^https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\//.test(url)) return false;

  let pathname: string;
  try {
    pathname = new URL(url).pathname.replace(/^\//, "");
  } catch {
    return false;
  }
  if (!pathname.startsWith("products/")) return false;

  try {
    await del(url);
    logBlobOp("blob:delete", pathname, { reason: "foto produk tidak lagi direferensikan" });
    return true;
  } catch (err) {
    // Gagal hapus bukan alasan untuk menggagalkan aksi admin.
    console.error("Gagal menghapus foto produk lama:", err);
    return false;
  }
}

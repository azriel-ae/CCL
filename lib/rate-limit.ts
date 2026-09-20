import "server-only";

/**
 * Rate limit sederhana berbasis memori proses.
 *
 * Kenapa perlu: POST /api/v1/sales memang harus tetap publik (dipanggil saat
 * checkout WhatsApp tanpa login). Tapi setiap POST = 1 pembacaan + 1 penulisan
 * ke Vercel Blob. Tanpa batas apa pun, siapa saja yang tahu URL-nya bisa
 * memicu ribuan operasi Blob (dan membanjiri dashboard dengan transaksi palsu)
 * hanya dengan script sederhana.
 *
 * Ini bukan pengganti rate limit tingkat platform (state-nya per-instance dan
 * hilang saat instance mati), tapi cukup untuk memotong penyalahgunaan paling
 * murah dan tidak memerlukan infrastruktur baru.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 5000;

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    // Bersihkan entri kedaluwarsa hanya saat map mulai besar, supaya tidak ada
    // pekerjaan tambahan di jalur normal.
    if (buckets.size > MAX_BUCKETS) {
      for (const [k, v] of buckets) {
        if (v.resetAt <= now) buckets.delete(k);
      }
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Ambil identitas pemanggil sebaik mungkin di belakang proxy Vercel. */
export function clientKey(req: Request): string {
  const h = req.headers;
  const forwarded = h.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  return ip;
}

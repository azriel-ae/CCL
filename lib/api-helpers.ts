import { NextResponse } from "next/server";

/**
 * Next.js secara default mengubah exception yang tidak ditangkap di route
 * handler menjadi halaman error HTML, bukan JSON. Akibatnya, fetch() di
 * client yang memanggil `res.json()` akan gagal parse dan jatuh ke pesan
 * generik seperti "Gagal menghubungi server" — padahal request-nya sampai,
 * cuma responsnya bukan JSON. Wrapper ini memastikan error apa pun (mis.
 * env var belum di-set) tetap dibalas sebagai JSON dengan pesan yang jelas.
 */
export function withErrorHandling(
  handler: (req: Request) => Promise<NextResponse>
): (req: Request) => Promise<NextResponse> {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (err) {
      console.error("Route handler error:", err);
      const message = err instanceof Error ? err.message : "Terjadi kesalahan pada server.";
      return NextResponse.json({ success: false, error: message, message }, { status: 500 });
    }
  };
}

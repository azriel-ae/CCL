import { SignJWT, jwtVerify } from "jose";
import type { SessionPayload } from "./types";

export const SESSION_COOKIE = "ccl_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8; // 8 jam

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET belum di-set (atau terlalu pendek). Set environment variable SESSION_SECRET sebelum menjalankan aplikasi."
    );
  }
  return new TextEncoder().encode(secret);
}

/** Membuat token sesi terenkripsi-tanda-tangan (JWT) untuk disimpan di cookie httpOnly. */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

/**
 * Memverifikasi token sesi. Dipakai baik di middleware (edge runtime)
 * maupun di route handlers/server components (node runtime) — jose
 * kompatibel dengan keduanya, tidak seperti jsonwebtoken.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.username === "string" && typeof payload.role === "string") {
      return { username: payload.username, role: payload.role as SessionPayload["role"] };
    }
    return null;
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = SESSION_DURATION_SECONDS;

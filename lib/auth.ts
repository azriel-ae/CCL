import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "./session";
import type { SessionPayload } from "./types";

/** Ambil sesi admin yang sedang login dari cookie httpOnly. Null kalau belum login/invalid. */
export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Dipakai di route handler untuk menolak request tanpa sesi valid (401). */
export async function requireSession(): Promise<SessionPayload | null> {
  return getSession();
}

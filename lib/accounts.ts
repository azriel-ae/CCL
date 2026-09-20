import "server-only";
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { readJsonResult, writeJson } from "./data-store";
import { logActivity } from "./activity";
import type { AdminAccount, PublicAdminAccount } from "./types";

const ACCOUNTS_KEY = "accounts-data.json";
const scrypt = promisify(scryptCb);

// Password akun Owner saat SEED PERTAMA KALI saja (ketika accounts-data.json
// belum pernah ada). Bisa di-override lewat env ADMIN_DEFAULT_PASSWORD supaya
// deploy baru tidak harus melewati fase "password 123". Tetap ada fallback
// "123" agar deploy yang sudah jalan tidak berubah perilakunya.
//
// Nilai ini tidak dipakai lagi setelah akun ada — mengubahnya TIDAK mereset
// password admin yang sudah tersimpan.
const DEFAULT_OWNER_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || "123";

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const storedBuf = Buffer.from(hashHex, "hex");
  if (storedBuf.length !== derived.length) return false;
  return timingSafeEqual(storedBuf, derived);
}

export const MIN_PASSWORD_LENGTH = 6;

/**
 * Validasi password yang dipakai SELURUH sistem (buat akun baru & ubah
 * password), supaya aturannya tidak bercabang di dua tempat.
 */
export function validatePassword(password: string): string | null {
  if (!password) return "Password wajib diisi.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password minimal ${MIN_PASSWORD_LENGTH} karakter.`;
  }
  return null;
}

async function seedDefaultOwner(): Promise<AdminAccount[]> {
  const owner: AdminAccount = {
    username: "admin",
    role: "Owner",
    passwordHash: await hashPassword(DEFAULT_OWNER_PASSWORD),
    createdAt: new Date().toISOString(),
  };
  await writeJson(ACCOUNTS_KEY, [owner]);
  return [owner];
}

/**
 * `fresh: true` melewati cache baca. Dipakai di semua jalur yang menyangkut
 * kredensial (verifikasi login, ubah password, tambah/hapus akun) supaya
 * perubahan password langsung berlaku dan password lama langsung tidak
 * berlaku lagi.
 *
 * PENTING — kenapa di sini memakai readJsonResult(), bukan readJson():
 *
 * Versi sebelumnya menyeed ulang Owner default setiap kali pembacaan
 * memulangkan `null`. Masalahnya `null` juga muncul saat storage-nya sedang
 * bermasalah (fetch gagal, HTTP 5xx, JSON rusak). Akibatnya satu gangguan
 * jaringan singkat bisa:
 *
 *   1. MENIMPA seluruh daftar akun dengan Owner default — password admin yang
 *      sudah diubah hilang dan kembali ke password seed; dan
 *   2. menulis object Blob BARU dari jalur yang seharusnya read-only
 *      (GET /api/admin/accounts, halaman login). Hash dedupe di writeJson()
 *      tidak menolongnya karena setiap seed memakai salt acak baru, jadi
 *      isinya selalu beda -> selalu upload.
 *
 * Sekarang seed hanya berjalan kalau storage memastikan file-nya BELUM ADA.
 * Kalau storage-nya error, error itu dilempar — lebih baik admin melihat
 * pesan gagal sementara daripada password-nya diam-diam ter-reset.
 */
export async function getAccounts(options: { fresh?: boolean } = {}): Promise<AdminAccount[]> {
  const result = await readJsonResult<AdminAccount[]>(ACCOUNTS_KEY, { fresh: options.fresh });

  if (result.ok && Array.isArray(result.value) && result.value.length > 0) {
    return result.value;
  }

  if (!result.ok && result.reason === "error") {
    throw new Error(
      "Data akun admin sedang tidak bisa dibaca dari storage. Coba lagi sebentar — tidak ada perubahan yang disimpan."
    );
  }

  // Sampai sini berarti file-nya memang belum ada, atau ada tapi isinya array
  // kosong (tidak ada akun sama sekali) -> aman untuk seed Owner pertama.
  return seedDefaultOwner();
}

export function toPublicAccount(account: AdminAccount): PublicAdminAccount {
  const { passwordHash, ...rest } = account;
  void passwordHash;
  return rest;
}

export async function getPublicAccounts(): Promise<PublicAdminAccount[]> {
  const accounts = await getAccounts();
  return accounts.map(toPublicAccount);
}

export async function verifyLogin(
  username: string,
  password: string
): Promise<AdminAccount | null> {
  const cleanUsername = username.trim().toLowerCase();
  const accounts = await getAccounts({ fresh: true });
  const account = accounts.find((a) => a.username.toLowerCase() === cleanUsername);
  if (!account) return null;

  const ok = await verifyPassword(password, account.passwordHash);
  return ok ? account : null;
}

export async function createAccount(
  username: string,
  password: string,
  actingUser: string
): Promise<{ success: true; account: PublicAdminAccount } | { success: false; message: string }> {
  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername || !password) {
    return { success: false, message: "Username dan password wajib diisi." };
  }

  const policyError = validatePassword(password);
  if (policyError) {
    return { success: false, message: policyError };
  }

  const accounts = await getAccounts({ fresh: true });
  if (accounts.some((a) => a.username.toLowerCase() === cleanUsername)) {
    return { success: false, message: "Username ini sudah digunakan." };
  }

  const account: AdminAccount = {
    username: cleanUsername,
    role: "Admin",
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  accounts.push(account);
  await writeJson(ACCOUNTS_KEY, accounts);
  await logActivity(actingUser, `Membuat akun admin baru: ${account.username}`);

  return { success: true, account: toPublicAccount(account) };
}

export async function deleteAccount(
  username: string,
  actingUser: string
): Promise<{ success: true } | { success: false; message: string }> {
  if (username === "admin") {
    return { success: false, message: "Akun Owner utama tidak dapat dihapus." };
  }

  const accounts = await getAccounts({ fresh: true });
  const filtered = accounts.filter((a) => a.username !== username);
  if (filtered.length === accounts.length) {
    return { success: false, message: "Akun tidak ditemukan." };
  }

  await writeJson(ACCOUNTS_KEY, filtered);
  await logActivity(actingUser, `Menghapus akun admin: ${username}`);
  return { success: true };
}

/**
 * Mengubah password akun admin yang sedang login.
 *
 * Aturan keamanan yang ditegakkan di sini (server-side, bukan di UI):
 * - `username` SELALU diambil dari sesi oleh route handler, tidak pernah dari
 *   body request — jadi tidak ada cara mengubah password akun orang lain.
 * - Password lama wajib diverifikasi sebelum password baru diterima.
 * - Password baru di-hash dengan scrypt + salt acak baru (fungsi yang sama
 *   dengan yang dipakai saat membuat akun), tidak pernah disimpan plaintext.
 * - Disimpan ke penyimpanan akun yang SUDAH ada (accounts-data.json), bukan
 *   object Blob baru — lihat writeJson() di lib/data-store.ts.
 * - Tidak ada password/hash yang dikembalikan ke pemanggil.
 */
export async function changePassword(
  username: string,
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<{ success: true } | { success: false; message: string }> {
  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, message: "Semua kolom password wajib diisi." };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, message: "Konfirmasi password tidak cocok." };
  }

  const policyError = validatePassword(newPassword);
  if (policyError) {
    return { success: false, message: policyError };
  }

  const accounts = await getAccounts({ fresh: true });
  const idx = accounts.findIndex((a) => a.username.toLowerCase() === username.trim().toLowerCase());
  if (idx === -1) {
    // Sesi valid tapi akunnya sudah tidak ada (mis. baru dihapus admin lain).
    // Pesannya sengaja sama generiknya dengan password salah.
    return { success: false, message: "Password saat ini tidak valid." };
  }

  const ok = await verifyPassword(currentPassword, accounts[idx].passwordHash);
  if (!ok) {
    return { success: false, message: "Password saat ini tidak valid." };
  }

  if (currentPassword === newPassword) {
    return { success: false, message: "Password baru harus berbeda dari password saat ini." };
  }

  accounts[idx] = { ...accounts[idx], passwordHash: await hashPassword(newPassword) };
  await writeJson(ACCOUNTS_KEY, accounts);
  // Isi log sengaja tidak memuat password apa pun.
  await logActivity(accounts[idx].username, "Mengubah password akunnya sendiri");

  return { success: true };
}

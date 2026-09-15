import "server-only";
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { readJson, writeJson } from "./data-store";
import { logActivity } from "./activity";
import type { AdminAccount, PublicAdminAccount } from "./types";

const ACCOUNTS_KEY = "accounts-data.json";
const scrypt = promisify(scryptCb);

// Password default akun Owner pertama kali deploy. WAJIB diganti lewat tab
// "Kelola Akun" setelah login pertama — ini hanya seed awal, bukan hardcoded
// credential untuk production (lihat README bagian Keamanan).
const DEFAULT_OWNER_PASSWORD = "123";

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

export async function getAccounts(): Promise<AdminAccount[]> {
  const stored = await readJson<AdminAccount[]>(ACCOUNTS_KEY);
  if (!stored || stored.length === 0) return seedDefaultOwner();
  return stored;
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
  const accounts = await getAccounts();
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

  const accounts = await getAccounts();
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

  const accounts = await getAccounts();
  const filtered = accounts.filter((a) => a.username !== username);
  if (filtered.length === accounts.length) {
    return { success: false, message: "Akun tidak ditemukan." };
  }

  await writeJson(ACCOUNTS_KEY, filtered);
  await logActivity(actingUser, `Menghapus akun admin: ${username}`);
  return { success: true };
}

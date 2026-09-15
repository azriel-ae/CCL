"use client";

import { useEffect, useState } from "react";
import { Loader2, UserPlus, Trash2, Inbox, ShieldCheck, CheckCircle2 } from "lucide-react";
import type { PublicAdminAccount } from "@/lib/types";

export default function AkunPage() {
  const [accounts, setAccounts] = useState<PublicAdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function loadAccounts() {
    setLoading(true);
    const res = await fetch("/api/admin/accounts");
    const data = await res.json();
    setAccounts(data.accounts || []);
    setLoading(false);
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const res = await fetch("/api/admin/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();

    if (!data.success) {
      setError(data.error || "Gagal membuat akun.");
      return;
    }

    setUsername("");
    setPassword("");
    showToast(`Akun "${data.account.username}" berhasil dibuat.`);
    loadAccounts();
  }

  async function handleDelete(uname: string) {
    await fetch(`/api/admin/accounts?username=${encodeURIComponent(uname)}`, { method: "DELETE" });
    setConfirmDelete(null);
    showToast("Akun berhasil dihapus.");
    loadAccounts();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold">Kelola Akun Admin</h2>
        <p className="text-xs text-ink/50">Tambahkan admin lain untuk membantu kelola dashboard</p>
      </div>

      {toast && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-ink px-4 py-3 text-xs font-medium text-white animate-fade-in">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      <form onSubmit={handleCreate} className="grid gap-4 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-[1fr_1fr_auto]">
        {error && (
          <p className="sm:col-span-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
            {error}
          </p>
        )}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-ink/60">Username Baru</label>
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input"
            placeholder="cth: kasir1"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-ink/60">Password</label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="Minimal 6 karakter"
          />
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn-primary w-full !py-2.5 text-xs sm:w-auto">
            <UserPlus size={14} /> Tambah Akun
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-bg/60 font-semibold text-ink/50">
              <tr>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Dibuat</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={4} className="py-14 text-center"><Loader2 size={20} className="mx-auto animate-spin text-ink/30" /></td></tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-14 text-center text-ink/40">
                    <Inbox size={26} className="mx-auto mb-2 text-ink/20" /> Belum ada akun.
                  </td>
                </tr>
              ) : (
                accounts.map((a) => (
                  <tr key={a.username} className="hover:bg-bg/50">
                    <td className="px-4 py-3 font-bold">{a.username}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg px-2.5 py-1 font-semibold">
                        <ShieldCheck size={12} /> {a.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink/50">{new Date(a.createdAt).toLocaleDateString("id-ID")}</td>
                    <td className="px-4 py-3 text-center">
                      {a.role !== "Owner" && (
                        <button
                          onClick={() => setConfirmDelete(a.username)}
                          className="rounded-lg p-1.5 text-ink/40 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl">
            <h3 className="font-display text-sm font-bold">Hapus akun &quot;{confirmDelete}&quot;?</h3>
            <p className="mt-2 text-xs text-ink/60">Akun ini tidak akan bisa login lagi setelah dihapus.</p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 rounded-full bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-700">
                Ya, Hapus
              </button>
              <button onClick={() => setConfirmDelete(null)} className="btn-outline flex-1 !py-2.5 text-xs">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

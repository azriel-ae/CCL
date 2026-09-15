"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Pencil, Trash2, X, Inbox } from "lucide-react";
import type { SaleRecord } from "@/lib/types";
import { formatIDR, formatDate } from "@/lib/metrics";
import { StatusBadge } from "@/components/admin/StatCard";

const STATUS_OPTIONS = ["ALL", "COMPLETED", "PENDING", "CANCELLED"] as const;

export default function TransaksiPage() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("ALL");
  const [editTx, setEditTx] = useState<SaleRecord | null>(null);
  const [deleteTx, setDeleteTx] = useState<SaleRecord | null>(null);

  async function loadSales() {
    setLoading(true);
    const res = await fetch("/api/v1/sales?limit=500");
    const data = await res.json();
    setSales(data.sales || []);
    setLoading(false);
  }

  useEffect(() => {
    loadSales();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sales.filter((tx) => {
      const inv = (tx.invoice || tx.id || "").toLowerCase();
      const cust = (tx.customer || "").toLowerCase();
      const prod = (tx.product || "").toLowerCase();
      const matchesSearch = !q || inv.includes(q) || cust.includes(q) || prod.includes(q);

      const s = (tx.status || "Completed").toLowerCase();
      let matchesStatus = true;
      if (statusFilter === "COMPLETED") matchesStatus = /completed|lunas|sukses|success/.test(s);
      else if (statusFilter === "PENDING") matchesStatus = /pending|proses/.test(s);
      else if (statusFilter === "CANCELLED") matchesStatus = /cancel|batal/.test(s);

      return matchesSearch && matchesStatus;
    });
  }, [sales, search, statusFilter]);

  async function handleDelete() {
    if (!deleteTx) return;
    await fetch(`/api/v1/sales?id=${encodeURIComponent(deleteTx.id)}`, { method: "DELETE" });
    setDeleteTx(null);
    loadSales();
  }

  async function handleSaveEdit(updated: SaleRecord) {
    await fetch("/api/v1/sales", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    setEditTx(null);
    loadSales();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold">Data Transaksi Penjualan</h2>
        <p className="text-xs text-ink/50">Cari, filter, edit, atau hapus transaksi yang tercatat</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari invoice, pelanggan, atau produk..."
            className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-xs focus:border-ink focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as (typeof STATUS_OPTIONS)[number])}
          className="rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold"
        >
          <option value="ALL">Semua Status</option>
          <option value="COMPLETED">Selesai</option>
          <option value="PENDING">Pending</option>
          <option value="CANCELLED">Dibatalkan</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-bg/60 font-semibold text-ink/50">
              <tr>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Pelanggan</th>
                <th className="px-4 py-3">Produk</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-ink/40">
                    <Loader2 size={20} className="mx-auto mb-2 animate-spin" /> Memuat data...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-ink/40">
                    <Inbox size={26} className="mx-auto mb-2 text-ink/20" /> Tidak ada transaksi yang cocok.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-bg/50">
                    <td className="px-4 py-3 font-mono font-bold text-accent">{tx.invoice || tx.id}</td>
                    <td className="px-4 py-3 text-ink/50">{formatDate(tx.date)}</td>
                    <td className="px-4 py-3 font-semibold">{tx.customer || "Pelanggan Umum"}</td>
                    <td className="px-4 py-3 text-ink/60">{tx.product}</td>
                    <td className="px-4 py-3">{tx.qty}</td>
                    <td className="px-4 py-3 font-mono font-bold">{formatIDR(tx.total)}</td>
                    <td className="px-4 py-3"><StatusBadge status={tx.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => setEditTx(tx)} className="rounded-lg p-1.5 text-ink/40 hover:bg-bg hover:text-ink">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteTx(tx)} className="rounded-lg p-1.5 text-ink/40 hover:bg-rose-50 hover:text-rose-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editTx && <EditModal tx={editTx} onClose={() => setEditTx(null)} onSave={handleSaveEdit} />}

      {deleteTx && (
        <ConfirmModal
          title={`Hapus transaksi ${deleteTx.invoice || deleteTx.id}?`}
          description="Tindakan ini tidak bisa dibatalkan."
          onCancel={() => setDeleteTx(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

function EditModal({
  tx,
  onClose,
  onSave,
}: {
  tx: SaleRecord;
  onClose: () => void;
  onSave: (updated: SaleRecord) => void;
}) {
  const [form, setForm] = useState(tx);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-sm font-bold">Edit Transaksi {tx.invoice || tx.id}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        <div className="space-y-3">
          <Field label="Pelanggan">
            <input value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} className="input" />
          </Field>
          <Field label="Produk">
            <input value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} className="input" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Qty">
              <input
                type="number"
                value={form.qty}
                onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })}
                className="input"
              />
            </Field>
            <Field label="Total (Rp)">
              <input
                type="number"
                value={form.total}
                onChange={(e) => setForm({ ...form, total: Number(e.target.value) })}
                className="input"
              />
            </Field>
          </div>
          <Field label="Metode Pembayaran">
            <input
              value={form.payment_method}
              onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input">
              <option value="Completed">Selesai</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Dibatalkan</option>
            </select>
          </Field>
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={() => onSave(form)} className="btn-primary flex-1 !py-2.5 text-xs">Simpan Perubahan</button>
          <button onClick={onClose} className="btn-outline flex-1 !py-2.5 text-xs">Batal</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-ink/60">{label}</label>
      {children}
    </div>
  );
}

function ConfirmModal({
  title,
  description,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl">
        <h3 className="font-display text-sm font-bold">{title}</h3>
        <p className="mt-2 text-xs text-ink/60">{description}</p>
        <div className="mt-5 flex gap-2">
          <button onClick={onConfirm} className="flex-1 rounded-full bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-700">
            Ya, Hapus
          </button>
          <button onClick={onCancel} className="btn-outline flex-1 !py-2.5 text-xs">Batal</button>
        </div>
      </div>
    </div>
  );
}

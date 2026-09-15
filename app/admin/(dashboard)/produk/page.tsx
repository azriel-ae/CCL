"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Upload, Save, Pencil, Trash2, Inbox, CheckCircle2 } from "lucide-react";
import type { Product } from "@/lib/types";

const EMPTY_DRAFT = { id: "", name: "", desc: "", subDesc: "", img: "", price: 0 };

export default function ProdukPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<typeof EMPTY_DRAFT>(EMPTY_DRAFT);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadProducts() {
    setLoading(true);
    const res = await fetch("/api/admin/products");
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setDraft((d) => ({ ...d, img: data.url }));
      } else {
        showToast(data.error || "Gagal upload gambar.");
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!draft.name.trim() || !draft.desc.trim()) {
      showToast("Nama produk dan deskripsi bahan wajib diisi.");
      return;
    }

    const isEditing = Boolean(draft.id);
    const res = await fetch("/api/admin/products", {
      method: isEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await res.json();

    if (!data.success) {
      showToast(data.error || "Gagal menyimpan produk.");
      return;
    }

    setDraft(EMPTY_DRAFT);
    showToast(`Produk "${draft.name}" berhasil disimpan!`);
    loadProducts();
  }

  function handleEdit(p: Product) {
    setDraft({ id: p.id, name: p.name, desc: p.desc, subDesc: p.subDesc, img: p.img, price: p.price });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setConfirmDeleteId(null);
    showToast("Produk berhasil dihapus.");
    loadProducts();
  }

  const isEditing = Boolean(draft.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold">Kelola Foto & Produk</h2>
        <p className="text-xs text-ink/50">Produk di sini otomatis tampil di katalog halaman utama</p>
      </div>

      {toast && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-ink px-4 py-3 text-xs font-medium text-white animate-fade-in">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="mb-4 text-sm font-bold">{isEditing ? `Edit Produk: ${draft.name}` : "Tambah / Edit Produk"}</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama Produk">
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="input" placeholder="cth: Custom Design Hoodie" />
          </Field>
          <Field label="Bahan / Kategori Material">
            <input value={draft.desc} onChange={(e) => setDraft({ ...draft, desc: e.target.value })} className="input" placeholder="cth: Fleece Premium Custom Design" />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Deskripsi Singkat">
            <input value={draft.subDesc} onChange={(e) => setDraft({ ...draft, subDesc: e.target.value })} className="input" placeholder="cth: Bahan tebal hangat & awet." />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Harga (Rp, opsional)">
            <input
              type="number"
              value={draft.price}
              onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
              className="input"
              placeholder="0"
            />
          </Field>
        </div>

        <div className="mt-4 space-y-2">
          <label className="text-xs font-semibold text-ink/60">Foto Produk (URL atau Upload)</label>
          <div className="flex flex-wrap gap-2">
            <input
              value={draft.img}
              onChange={(e) => setDraft({ ...draft, img: e.target.value })}
              className="input flex-1 min-w-[180px]"
              placeholder="https://... atau upload foto"
            />
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleUpload} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-outline !px-4 !py-2.5 text-xs"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Upload Foto
            </button>
          </div>
          {draft.img && (
            <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-border">
              <Image src={draft.img} alt="" fill className="object-cover" sizes="64px" />
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-2 border-t border-border pt-4">
          <button onClick={handleSave} className="btn-primary !px-5 !py-2.5 text-xs">
            <Save size={14} /> Simpan Produk
          </button>
          <button onClick={() => setDraft(EMPTY_DRAFT)} className="btn-outline !px-5 !py-2.5 text-xs">
            Batal / Clear
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="border-b border-border p-4">
          <h3 className="text-sm font-bold">Daftar Produk Aktif</h3>
          <p className="text-xs text-ink/50">Produk yang tampil di halaman utama website</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-bg/60 font-semibold text-ink/50">
              <tr>
                <th className="px-4 py-3">Foto</th>
                <th className="px-4 py-3">Nama Produk</th>
                <th className="px-4 py-3">Deskripsi Material</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={4} className="py-14 text-center"><Loader2 size={20} className="mx-auto animate-spin text-ink/30" /></td></tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-14 text-center text-ink/40">
                    <Inbox size={26} className="mx-auto mb-2 text-ink/20" /> Belum ada produk.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-bg/50">
                    <td className="px-4 py-3">
                      <div className="relative h-11 w-11 overflow-hidden rounded-lg border border-border">
                        <Image src={p.img} alt={p.name} fill className="object-cover" sizes="44px" />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold">{p.name}</td>
                    <td className="px-4 py-3 text-ink/55">{p.desc}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => handleEdit(p)} className="rounded-lg p-1.5 text-ink/40 hover:bg-bg hover:text-ink">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setConfirmDeleteId(p.id)} className="rounded-lg p-1.5 text-ink/40 hover:bg-rose-50 hover:text-rose-600">
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

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl">
            <h3 className="font-display text-sm font-bold">Hapus produk ini?</h3>
            <p className="mt-2 text-xs text-ink/60">Produk akan langsung hilang dari katalog halaman utama.</p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => handleDelete(confirmDeleteId)} className="flex-1 rounded-full bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-700">
                Ya, Hapus
              </button>
              <button onClick={() => setConfirmDeleteId(null)} className="btn-outline flex-1 !py-2.5 text-xs">Batal</button>
            </div>
          </div>
        </div>
      )}
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

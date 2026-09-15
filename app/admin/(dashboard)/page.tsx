import Link from "next/link";
import { Wallet, ShoppingBag, TrendingUp, Calendar, ChevronRight, Inbox } from "lucide-react";
import { readSales } from "@/lib/sales";
import { computeMetrics, formatIDR, formatDate } from "@/lib/metrics";
import { StatCard, StatusBadge } from "@/components/admin/StatCard";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const sales = await readSales();
  const metrics = computeMetrics(sales);
  const recent = sales.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold">Ringkasan Dashboard Penjualan</h2>
        <p className="text-xs text-ink/50">Data real-time dari sistem checkout & kasir Corat Coret Layar</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Omzet Penjualan" value={formatIDR(metrics.totalOmzet)} hint="Status lunas & sukses" icon={Wallet} />
        <StatCard
          label="Total Transaksi"
          value={String(metrics.totalTxCount)}
          hint={`${metrics.completedCount} selesai, ${metrics.pendingCount} pending`}
          icon={ShoppingBag}
        />
        <StatCard label="Rata-rata Order" value={formatIDR(metrics.avgTxValue)} hint="Per transaksi selesai" icon={TrendingUp} />
        <StatCard label="Omzet Hari Ini" value={formatIDR(metrics.todayOmzet)} hint={new Date().toLocaleDateString("id-ID")} icon={Calendar} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h3 className="text-sm font-bold">Transaksi Terbaru</h3>
            <p className="text-xs text-ink/50">Daftar transaksi terkini dari sistem checkout</p>
          </div>
          <Link href="/admin/transaksi" className="flex items-center gap-1 text-xs font-bold text-accent hover:text-ink">
            Lihat Semua <ChevronRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-bg/60 font-semibold text-ink/50">
              <tr>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Pelanggan</th>
                <th className="px-4 py-3">Produk</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ink/40">
                    <Inbox size={28} className="mx-auto mb-2 text-ink/20" />
                    Belum ada data transaksi.
                  </td>
                </tr>
              ) : (
                recent.map((tx) => (
                  <tr key={tx.id} className="hover:bg-bg/50">
                    <td className="px-4 py-3 font-mono font-bold text-accent">{tx.invoice || tx.id}</td>
                    <td className="px-4 py-3 text-ink/50">{formatDate(tx.date)}</td>
                    <td className="px-4 py-3 font-semibold">{tx.customer || "Pelanggan Umum"}</td>
                    <td className="px-4 py-3 text-ink/60">{tx.product || "Layanan Cetak"}</td>
                    <td className="px-4 py-3 font-mono font-bold">{formatIDR(tx.total)}</td>
                    <td className="px-4 py-3"><StatusBadge status={tx.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

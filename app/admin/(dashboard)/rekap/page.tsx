"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import type { SaleRecord } from "@/lib/types";
import { getPeriodSales, summarizePeriod, formatIDR, MONTH_NAMES } from "@/lib/metrics";

export default function RekapPage() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"month" | "date">("month");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [isoDate, setIsoDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    fetch("/api/v1/sales?limit=500")
      .then((res) => res.json())
      .then((data) => setSales(data.sales || []))
      .finally(() => setLoading(false));
  }, []);

  const availableYears = useMemo(() => {
    const years = new Set<number>([new Date().getFullYear()]);
    sales.forEach((tx) => {
      const d = new Date(tx.date);
      if (!isNaN(d.getFullYear())) years.add(d.getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [sales]);

  const periodSales = useMemo(
    () => getPeriodSales(sales, mode, year, month, isoDate),
    [sales, mode, year, month, isoDate]
  );
  const summary = useMemo(() => summarizePeriod(periodSales), [periodSales]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold">Rekap Penjualan Bulanan & Harian</h2>
        <p className="text-xs text-ink/50">Ringkasan omzet, produk terlaris, dan metode pembayaran per periode</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface p-4">
        <div className="flex overflow-hidden rounded-xl border border-border text-xs font-semibold">
          <button
            onClick={() => setMode("month")}
            className={`px-4 py-2 ${mode === "month" ? "bg-ink text-white" : "text-ink/60"}`}
          >
            Per Bulan
          </button>
          <button
            onClick={() => setMode("date")}
            className={`px-4 py-2 ${mode === "date" ? "bg-ink text-white" : "text-ink/60"}`}
          >
            Per Tanggal
          </button>
        </div>

        {mode === "month" ? (
          <div className="flex gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="rounded-xl border border-border bg-bg px-3 py-2 text-xs font-semibold"
            >
              {MONTH_NAMES.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-xl border border-border bg-bg px-3 py-2 text-xs font-semibold"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        ) : (
          <input
            type="date"
            value={isoDate}
            onChange={(e) => setIsoDate(e.target.value)}
            className="rounded-xl border border-border bg-bg px-3 py-2 text-xs font-semibold"
          />
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink/40">
          <Loader2 size={16} className="animate-spin" /> Memuat data...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <SummaryCard label="Omzet Periode Ini" value={formatIDR(summary.totalOmzet)} />
            <SummaryCard label="Transaksi Selesai" value={String(summary.completedCount)} />
            <SummaryCard label="Transaksi Pending" value={String(summary.pendingCount)} />
            <SummaryCard label="Total Qty Terjual" value={String(summary.totalQty)} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-border bg-surface">
              <div className="border-b border-border p-4">
                <h3 className="text-sm font-bold">Produk Terlaris</h3>
              </div>
              <ul className="divide-y divide-border text-sm">
                {summary.byProduct.length === 0 ? (
                  <li className="p-6 text-center text-xs text-ink/40">Belum ada data pada periode ini.</li>
                ) : (
                  summary.byProduct.map((p) => (
                    <li key={p.name} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-xs text-ink/45">{p.qty} unit terjual</p>
                      </div>
                      <span className="font-mono text-sm font-bold">{formatIDR(p.total)}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-surface">
              <div className="border-b border-border p-4">
                <h3 className="text-sm font-bold">Metode Pembayaran</h3>
              </div>
              <ul className="divide-y divide-border text-sm">
                {summary.byPayment.length === 0 ? (
                  <li className="p-6 text-center text-xs text-ink/40">Belum ada data pada periode ini.</li>
                ) : (
                  summary.byPayment.map((p) => (
                    <li key={p.method} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="font-semibold">{p.method}</p>
                        <p className="text-xs text-ink/45">{p.count} transaksi</p>
                      </div>
                      <span className="font-mono text-sm font-bold">{formatIDR(p.total)}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-[11px] font-semibold text-ink/50">{label}</p>
      <p className="mt-1.5 font-display text-lg font-bold">{value}</p>
    </div>
  );
}

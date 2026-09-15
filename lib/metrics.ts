import type { SaleRecord } from "./types";

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

export function formatDate(dateString?: string): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function isCompleted(status: string) {
  const s = status.toLowerCase();
  return s.includes("completed") || s.includes("lunas") || s.includes("sukses") || s.includes("success");
}

function isPending(status: string) {
  const s = status.toLowerCase();
  return s.includes("pending") || s.includes("proses") || s.includes("menunggu");
}

export function statusLabel(status?: string): "Selesai" | "Pending" | "Dibatalkan" {
  const s = (status || "Completed").toLowerCase();
  if (isCompleted(s)) return "Selesai";
  if (isPending(s)) return "Pending";
  return "Dibatalkan";
}

export type Metrics = {
  totalOmzet: number;
  totalTxCount: number;
  completedCount: number;
  pendingCount: number;
  avgTxValue: number;
  todayOmzet: number;
};

export function computeMetrics(sales: SaleRecord[]): Metrics {
  const nowStr = new Date().toISOString().slice(0, 10);
  let totalOmzet = 0;
  let completedCount = 0;
  let pendingCount = 0;
  let todayOmzet = 0;

  for (const tx of sales) {
    const amount = Number(tx.total) || 0;
    const status = (tx.status || "Completed").toLowerCase();
    const dateStr = (tx.date || "").slice(0, 10);

    if (isCompleted(status)) {
      totalOmzet += amount;
      completedCount++;
      if (dateStr === nowStr) todayOmzet += amount;
    } else if (isPending(status)) {
      pendingCount++;
    }
  }

  return {
    totalOmzet,
    totalTxCount: sales.length,
    completedCount,
    pendingCount,
    avgTxValue: completedCount > 0 ? totalOmzet / completedCount : 0,
    todayOmzet,
  };
}

export function getPeriodSales(
  sales: SaleRecord[],
  mode: "month" | "date",
  year: number,
  month: number,
  isoDate: string
): SaleRecord[] {
  return sales.filter((tx) => {
    const d = new Date(tx.date);
    if (isNaN(d.getTime())) return false;
    if (mode === "date") {
      return d.toISOString().slice(0, 10) === isoDate;
    }
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export type PeriodSummary = {
  totalOmzet: number;
  completedCount: number;
  pendingCount: number;
  totalQty: number;
  byProduct: { name: string; qty: number; total: number }[];
  byPayment: { method: string; count: number; total: number }[];
};

export function summarizePeriod(periodSales: SaleRecord[]): PeriodSummary {
  let totalOmzet = 0;
  let completedCount = 0;
  let pendingCount = 0;
  let totalQty = 0;

  const productMap = new Map<string, { qty: number; total: number }>();
  const paymentMap = new Map<string, { count: number; total: number }>();

  for (const tx of periodSales) {
    const amount = Number(tx.total) || 0;
    const qty = Number(tx.qty) || 1;
    const status = (tx.status || "Completed").toLowerCase();
    const prodName = tx.product || "Layanan Cetak";
    const payMethod = tx.payment_method || "QRIS";

    if (isCompleted(status)) {
      totalOmzet += amount;
      completedCount++;
      totalQty += qty;

      const prod = productMap.get(prodName) || { qty: 0, total: 0 };
      prod.qty += qty;
      prod.total += amount;
      productMap.set(prodName, prod);

      const pay = paymentMap.get(payMethod) || { count: 0, total: 0 };
      pay.count += 1;
      pay.total += amount;
      paymentMap.set(payMethod, pay);
    } else if (isPending(status)) {
      pendingCount++;
    }
  }

  return {
    totalOmzet,
    completedCount,
    pendingCount,
    totalQty,
    byProduct: Array.from(productMap.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.total - a.total),
    byPayment: Array.from(paymentMap.entries())
      .map(([method, v]) => ({ method, ...v }))
      .sort((a, b) => b.total - a.total),
  };
}

export const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

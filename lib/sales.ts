import "server-only";
import { readJson, writeJson, deleteJson } from "./data-store";
import type { SaleRecord } from "./types";

const SALES_KEY = "sales-data.json";
const MAX_STORED = 500;

/**
 * Membaca daftar penjualan. Tanpa opsi, hasilnya boleh dilayani cache singkat
 * (dipakai untuk tampilan dashboard/rekap). Jalur yang akan MENULIS ulang
 * daftar ini wajib memakai `{ fresh: true }` supaya tidak ada transaksi yang
 * tertimpa.
 */
export async function readSales(options: { fresh?: boolean } = {}): Promise<SaleRecord[]> {
  const data = await readJson<SaleRecord[]>(SALES_KEY, { fresh: options.fresh });
  return Array.isArray(data) ? data : [];
}

async function writeSales(sales: SaleRecord[]): Promise<void> {
  await writeJson(SALES_KEY, sales);
}

function generateId(): string {
  return "TX-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7).toUpperCase();
}

export type CreateSaleInput = Partial<
  Pick<SaleRecord, "id" | "invoice" | "customer" | "product" | "qty" | "total" | "payment_method" | "status" | "date">
>;

export async function createSale(order: CreateSaleInput): Promise<SaleRecord> {
  const generatedId = generateId();
  const record: SaleRecord = {
    id: order.id || generatedId,
    invoice: order.invoice || order.id || generatedId,
    customer: order.customer || "Pelanggan WhatsApp",
    product: order.product || "",
    qty: Number(order.qty) || 0,
    total: Number(order.total) || 0,
    payment_method: order.payment_method || "WhatsApp Order",
    status: order.status || "Completed",
    date: order.date || new Date().toISOString(),
  };

  const sales = await readSales({ fresh: true });
  sales.unshift(record);
  await writeSales(sales.slice(0, MAX_STORED));
  return record;
}

const ALLOWED_UPDATE_FIELDS = [
  "total",
  "payment_method",
  "status",
  "customer",
  "product",
  "qty",
] as const;

export async function upsertSale(
  body: Partial<SaleRecord> & { amount?: number }
): Promise<SaleRecord> {
  const targetKey = (body.id || body.invoice || "").toString();
  const sales = await readSales({ fresh: true });
  const idx = sales.findIndex(
    (s) => (s.id || "").toString() === targetKey || (s.invoice || "").toString() === targetKey
  );

  if (idx === -1) {
    const record: SaleRecord = {
      id: body.id || targetKey,
      invoice: body.invoice || targetKey,
      customer: body.customer || "Pelanggan WhatsApp",
      product: body.product || "",
      qty: Number(body.qty) || 0,
      total: Number(body.total ?? body.amount) || 0,
      payment_method: body.payment_method || "QRIS",
      status: body.status || "Pending",
      date: body.date || new Date().toISOString(),
    };
    sales.unshift(record);
    await writeSales(sales.slice(0, MAX_STORED));
    return record;
  }

  const updated: SaleRecord = { ...sales[idx] };
  for (const field of ALLOWED_UPDATE_FIELDS) {
    const value = (body as Record<string, unknown>)[field];
    if (typeof value !== "undefined") {
      if (field === "total" || field === "qty") {
        (updated as Record<string, unknown>)[field] = Number(value);
      } else {
        (updated as Record<string, unknown>)[field] = value;
      }
    }
  }
  updated.updated_at = new Date().toISOString();
  sales[idx] = updated;
  await writeSales(sales);
  return updated;
}

export async function deleteSale(id: string): Promise<boolean> {
  const sales = await readSales({ fresh: true });
  const filtered = sales.filter(
    (s) => (s.id || "").toString() !== id && (s.invoice || "").toString() !== id
  );
  if (filtered.length === sales.length) return false;
  await writeSales(filtered);
  return true;
}

export async function deleteAllSales(): Promise<void> {
  await deleteJson(SALES_KEY);
}

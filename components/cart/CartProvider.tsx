"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type CartItem = {
  id: string;
  name: string;
  desc: string;
  img: string;
  price: number;
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  isOpen: boolean;
  totalQty: number;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, "qty">) => void;
  updateQty: (name: string, delta: number) => void;
  checkoutToWhatsApp: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "6281333385899";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback((item: Omit<CartItem, "qty">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.name === item.name);
      if (existing) {
        return prev.map((i) => (i.name === item.name ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...item, qty: 1 }];
    });
  }, []);

  const updateQty = useCallback((name: string, delta: number) => {
    setItems((prev) => {
      const next = prev
        .map((i) => (i.name === name ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0);
      return next;
    });
  }, []);

  const checkoutToWhatsApp = useCallback(() => {
    if (items.length === 0) return;

    const lines = items.map((item) => `• ${item.name} (x${item.qty}) - ${item.desc}`);
    const text = `Halo Admin Corat Coret Layar 👋\n\nSaya ingin memesan produk berikut:\n${lines.join("\n")}\n\nMohon info mengenai estimasi pengerjaan & pembayarannya. Terima kasih!`;

    // Catat transaksi ke dashboard admin lewat API — tidak menghambat proses
    // checkout: kalau gagal/lambat, redirect WhatsApp tetap jalan.
    const totalQty = items.reduce((sum, i) => sum + i.qty, 0);
    const totalHarga = items.reduce((sum, i) => sum + i.qty * (Number(i.price) || 0), 0);
    const productSummary = items.map((i) => `${i.name} (x${i.qty})`).join(", ");

    fetch("/api/v1/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: "Pelanggan WhatsApp",
        product: productSummary,
        qty: totalQty,
        total: totalHarga,
        payment_method: "WhatsApp Order",
        status: "Pending",
      }),
    }).catch((err) => console.error("Gagal mencatat transaksi ke dashboard:", err));

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }, [items]);

  const totalQty = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);

  const value = useMemo(
    () => ({ items, isOpen, totalQty, openCart, closeCart, addItem, updateQty, checkoutToWhatsApp }),
    [items, isOpen, totalQty, openCart, closeCart, addItem, updateQty, checkoutToWhatsApp]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart harus dipakai di dalam <CartProvider>");
  return ctx;
}

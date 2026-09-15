"use client";

import Image from "next/image";
import { X, Minus, Plus, ShoppingBag, MessageCircle } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQty, checkoutToWhatsApp } = useCart();

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-ink/40 transition-opacity ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeCart}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-surface shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="flex items-center gap-2 font-display text-sm font-bold">
            <ShoppingBag size={18} className="text-accent" /> Keranjang Pesanan
          </h3>
          <button onClick={closeCart} aria-label="Tutup Keranjang" className="p-1.5 text-ink/50 hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <p className="mt-10 text-center text-sm text-ink/50">Keranjang belanjaanmu masih kosong.</p>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.name} className="flex gap-3 border-b border-border/60 pb-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-bg">
                    <Image src={item.img} alt={item.name} fill className="object-cover" sizes="64px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="truncate text-xs text-ink/50">{item.desc}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.name, -1)}
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-ink/60 hover:border-ink hover:text-ink"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-5 text-center text-xs font-bold">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.name, 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-ink/60 hover:border-ink hover:text-ink"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border p-5">
          <button
            onClick={checkoutToWhatsApp}
            disabled={items.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3.5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:bg-ink/15 disabled:text-ink/40"
          >
            <MessageCircle size={18} /> Pesan via WhatsApp
          </button>
        </div>
      </aside>
    </>
  );
}

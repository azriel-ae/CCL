"use client";

import { ShoppingBag, MessageCircle } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "6281333385899";

export function FloatingActions() {
  const { openCart, totalQty } = useCart();

  return (
    <div className="fixed bottom-6 right-5 z-40 flex flex-col items-center gap-3">
      <button
        onClick={openCart}
        aria-label="Buka Keranjang"
        className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full bg-ink text-white shadow-lg transition hover:bg-accent"
      >
        <ShoppingBag size={20} />
        {totalQty > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white ring-2 ring-bg">
            {totalQty}
          </span>
        )}
      </button>
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noopener"
        aria-label="Chat WhatsApp"
        className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:brightness-95"
      >
        <MessageCircle size={22} />
      </a>
    </div>
  );
}

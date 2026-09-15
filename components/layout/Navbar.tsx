"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X, ShieldCheck } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";

const NAV_LINKS = [
  { href: "#home", label: "Home" },
  { href: "#produk", label: "Katalog" },
  { href: "#cara-order", label: "Cara Order" },
  { href: "#tentang", label: "Tentang" },
];

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "6281333385899";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openCart, totalQty } = useCart();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/90 backdrop-blur">
        <div className="container-edge flex h-[76px] items-center justify-between">
          <Link href="#home" className="flex items-center gap-2.5">
            <Image src="/images/logo-badge.png" alt="Corat Coret Layar" width={36} height={36} className="rounded-full" />
            <span className="font-display text-sm font-bold tracking-tight">Corat Coret Layar</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="text-sm font-medium text-ink/70 transition hover:text-ink">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/admin"
              title="Login Admin"
              className="flex items-center gap-1.5 text-xs font-semibold text-ink/50 transition hover:text-ink"
            >
              <ShieldCheck size={15} />
              Admin
            </Link>
            <button onClick={openCart} className="btn-outline relative !px-4 !py-2.5 text-xs">
              Keranjang
              {totalQty > 0 && (
                <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                  {totalQty}
                </span>
              )}
            </button>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener"
              className="btn-primary !px-5 !py-2.5 text-xs"
            >
              Konsultasi
            </a>
          </div>

          <button
            aria-label="Buka Menu Navigasi"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="p-2 md:hidden"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute right-0 top-0 flex h-full w-[80%] max-w-xs flex-col justify-between bg-surface p-6 shadow-xl animate-fade-in">
            <div>
              <ul className="mt-14 space-y-1">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-xl px-3 py-3 text-sm font-semibold text-ink/80 hover:bg-bg"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
                <li>
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-ink/80 hover:bg-bg"
                  >
                    <ShieldCheck size={16} /> Admin
                  </Link>
                </li>
              </ul>
            </div>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener"
              className="btn-accent w-full"
            >
              Chat WhatsApp Admin
            </a>
          </aside>
        </div>
      )}
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  CalendarRange,
  Receipt,
  Box,
  Users,
  History,
  LogOut,
  Menu,
  X,
  Globe,
} from "lucide-react";
import type { SessionPayload } from "@/lib/types";

const NAV_ITEMS = [
  { href: "/admin", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/admin/rekap", label: "Rekap Penjualan", icon: CalendarRange },
  { href: "/admin/transaksi", label: "Transaksi", icon: Receipt },
  { href: "/admin/produk", label: "Kelola Produk", icon: Box },
  { href: "/admin/akun", label: "Kelola Akun", icon: Users },
  { href: "/admin/aktivitas", label: "Log Aktivitas", icon: History },
];

export function Sidebar({ session }: { session: SessionPayload }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="z-30 flex w-full shrink-0 flex-col justify-between border-b border-border bg-surface md:h-screen md:w-64 md:border-b-0 md:border-r">
      <div>
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent font-bold text-white">
              CC
            </div>
            <div>
              <h1 className="font-display text-sm font-bold tracking-tight">Corat Coret Layar</h1>
              <p className="text-[10px] text-ink/50">Panel Admin</p>
            </div>
          </div>
          <button className="p-2 md:hidden" onClick={() => setMobileOpen((v) => !v)}>
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className={`${mobileOpen ? "block" : "hidden"} space-y-1 p-3 text-sm font-semibold md:block`}>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition ${
                  active ? "bg-ink text-white" : "text-ink/60 hover:bg-bg hover:text-ink"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}

          <a
            href="/"
            className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-border px-3.5 py-2.5 text-ink/50 hover:text-accent"
          >
            <Globe size={16} />
            Ke Website Utama
          </a>
        </nav>
      </div>

      <div className={`${mobileOpen ? "block" : "hidden"} border-t border-border p-4 md:block`}>
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border bg-bg text-xs font-bold">
              {session.username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold">{session.username}</p>
              <p className="text-[10px] text-ink/50">{session.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} title="Keluar Sesi" className="p-2 text-ink/40 hover:text-rose-600">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

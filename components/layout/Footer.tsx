import Image from "next/image";
import { MessageCircle, MapPin } from "lucide-react";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "6281333385899";
const WHATSAPP_DISPLAY = "+62 813-3338-5899";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-edge grid gap-10 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <Image src="/images/logo-badge.png" alt="Corat Coret Layar" width={32} height={32} className="rounded-full" />
            <span className="font-display text-sm font-bold">Corat Coret Layar</span>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-ink/60">
            Layanan custom design merchandise premium untuk kaos, hoodie, stiker, flag, dan
            perlengkapan hobi/komunitas.
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-ink/40">Navigasi Cepat</h4>
          <ul className="space-y-2.5 text-sm text-ink/70">
            <li><a href="#home" className="hover:text-ink">Home</a></li>
            <li><a href="#produk" className="hover:text-ink">Katalog Produk</a></li>
            <li><a href="#cara-order" className="hover:text-ink">Cara Pemesanan</a></li>
            <li><a href="#tentang" className="hover:text-ink">Tentang Kami</a></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-ink/40">Kontak Kami</h4>
          <div className="space-y-3 text-sm text-ink/70">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-2 hover:text-ink"
            >
              <MessageCircle size={16} /> {WHATSAPP_DISPLAY}
            </a>
            <p className="flex items-center gap-2">
              <MapPin size={16} /> Indonesia
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-border py-6">
        <p className="container-edge text-center text-xs text-ink/40">
          &copy; {new Date().getFullYear()} Corat Coret Layar. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}

import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "6281333385899";

export function CtaBand() {
  return (
    <section className="bg-ink py-20 text-white">
      <div className="container-edge flex flex-col items-center gap-6 text-center">
        <h2 className="font-display text-3xl font-bold tracking-tightest md:text-4xl">
          Punya ide merchandise?
        </h2>
        <p className="text-white/60">Ceritakan konsep kamu kepada kami.</p>
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener"
          className="btn-accent !px-8 !py-3.5"
        >
          <MessageCircle size={18} /> Konsultasi via WhatsApp
        </a>
      </div>
    </section>
  );
}

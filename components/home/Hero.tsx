"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const WORDS = [
  "Custom Design T-Shirt",
  "Custom Design Hoodie",
  "Custom Design Flag",
  "Custom Design Sticker",
  "Custom Design Tote Bag",
  "Custom Design Jersey",
];

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "6281333385899";

function useTypingEffect(words: string[]) {
  const [text, setText] = useState("");

  useEffect(() => {
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    function tick() {
      const currentWord = words[wordIndex];
      charIndex += isDeleting ? -1 : 1;
      setText(currentWord.substring(0, charIndex));

      let speed = isDeleting ? 40 : 80;

      if (!isDeleting && charIndex === currentWord.length) {
        speed = 1800;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        speed = 400;
      }

      timeoutId = setTimeout(tick, speed);
    }

    timeoutId = setTimeout(tick, 400);
    return () => clearTimeout(timeoutId);
  }, [words]);

  return text;
}

export function Hero() {
  const typingText = useTypingEffect(WORDS);

  return (
    <section id="home" className="pt-0 md:pt-24">
      {/* Logo CCL — layar pertama di mobile: navbar + logo ini pas satu layar
         (h-[76px] mengikuti tinggi Navbar), jadi begitu website dibuka logo
         langsung dominan tanpa scroll sama sekali. Headline/deskripsi/CTA ada
         di layar berikutnya waktu discroll. Tidak ada delay/loading apa pun —
         ini bagian biasa dari halaman, langsung bisa di-scroll & diklik. */}
      <div className="flex h-[calc(100dvh-76px)] min-h-[360px] items-center justify-center md:hidden">
        <div className="relative aspect-square w-[min(86vw,calc((100dvh-76px)*0.82))] animate-logo-in">
          <Image
            src="/images/logo-badge.png"
            alt="Logo Corat Coret Layar"
            fill
            priority
            className="object-contain"
            sizes="86vw"
          />
        </div>
      </div>

      <div className="container-edge grid items-center gap-14 pt-10 md:grid-cols-2 md:gap-10 md:pt-0">
        <div>
          <p className="eyebrow flex flex-wrap items-center gap-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            Kita siap buat: <strong className="text-ink/80">{typingText}&nbsp;</strong>
          </p>

          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tightest sm:text-5xl md:text-6xl">
            Custom Design Merchandise
            <br />
            <span className="text-accent">Made for Your Idea.</span>
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-ink/60">
            Bikin custom design kaos, hoodie, sticker, flag, tote bag, dan jersey sesuai
            imajinasi kamu. Hasil rapi, detail presisi, dan pengerjaan cepat.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#produk" className="btn-primary">Lihat Katalog</a>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener" className="btn-outline">
              Konsultasi via WhatsApp
            </a>
          </div>

          <div className="mt-9 flex flex-wrap gap-2">
            {["Kaos", "Hoodie", "Sticker", "Flag", "Tote Bag", "Jersey"].map((tag) => (
              <span key={tag} className="rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-ink/60">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="relative hidden aspect-[4/3] w-full overflow-hidden rounded-3xl border border-border bg-surface md:block md:aspect-square">
          <Image
            src="/images/logo-full.png"
            alt="Logo Corat Coret Layar"
            fill
            priority
            className="object-contain p-10"
            sizes="(min-width: 768px) 45vw, 90vw"
          />
        </div>
      </div>
    </section>
  );
}

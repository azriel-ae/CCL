"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Check } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import type { Product } from "@/lib/types";

export function ProductCatalog({ products }: { products: Product[] }) {
  return (
    <section id="produk" className="py-24 md:py-32">
      <div className="container-edge">
        <div className="mb-14 max-w-lg">
          <span className="eyebrow">Katalog Pilihan</span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tightest md:text-4xl">
            Pilih Merchandise Favoritmu
          </h2>
          <p className="mt-3 text-sm text-ink/60">
            Tambahkan ke keranjang untuk memesan secara mudah melalui WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem({ id: product.id, name: product.name, desc: product.desc, img: product.img, price: product.price });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-surface transition hover:border-ink/30">
      <div className="relative aspect-[4/3] overflow-hidden bg-bg">
        <Image
          src={product.img}
          alt={product.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
      </div>
      <div className="p-5">
        <h3 className="font-display text-base font-bold">{product.name}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-ink/55">{product.subDesc || product.desc}</p>
        <button
          onClick={handleAdd}
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-xs font-bold transition ${
            added ? "bg-ink text-white" : "border border-ink/15 text-ink hover:border-ink"
          }`}
        >
          {added ? <Check size={14} /> : <Plus size={14} />}
          {added ? "Ditambahkan!" : "Tambah ke Keranjang"}
        </button>
      </div>
    </article>
  );
}

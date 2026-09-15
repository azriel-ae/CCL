const STEPS = [
  { n: "01", title: "Pilih Produk", desc: "Pilih barang dari katalog atau konsultasikan ide desain kustomu." },
  { n: "02", title: "Konsultasi Desain", desc: "Diskusikan konsep, mockup, dan spesifikasi pesanan dengan admin." },
  { n: "03", title: "Pembayaran", desc: "Lakukan konfirmasi pembayaran aman untuk segera diproses." },
  { n: "04", title: "Proses Produksi", desc: "Design akan diproses dengan teliti sesuai kemauan pelanggan." },
  { n: "05", title: "Design Akan Dikirim", desc: "Hasil karya & design dikirim." },
];

export function OrderProcess() {
  return (
    <section id="cara-order" className="py-24 md:py-32">
      <div className="container-edge">
        <div className="mb-14 max-w-lg">
          <span className="eyebrow">Alur Pemesanan</span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tightest md:text-4xl">
            5 Langkah Mudah Order
          </h2>
          <p className="mt-3 text-sm text-ink/60">
            Proses praktis dan transparan dari awal hingga produk tiba di tempatmu.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-5">
          {STEPS.map((step) => (
            <div key={step.n}>
              <span className="font-display text-2xl font-bold text-accent">{step.n}</span>
              <h3 className="mt-3 text-sm font-bold">{step.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-ink/55">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

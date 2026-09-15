const FEATURES = [
  {
    index: "01",
    title: "Design Premium",
    desc: "Design premium dengan standar kerapian tinggi di setiap detail hasil akhir.",
  },
  {
    index: "02",
    title: "Full Custom Design",
    desc: "Bebas berkreasi tanpa batas minimum order untuk beragam pilihan merchandise.",
  },
  {
    index: "03",
    title: "Proses Cepat",
    desc: "Estimasi waktu pengerjaan fleksibel dan tepat waktu agar siap dipakai saat event.",
  },
];

export function WhyChooseUs() {
  return (
    <section id="tentang" className="py-24 md:py-32">
      <div className="container-edge">
        <div className="mb-14 max-w-lg">
          <span className="eyebrow">Kenapa Memilih Kami</span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tightest md:text-4xl">
            Kualitas Terbaik Tanpa Kompromi
          </h2>
        </div>

        <div className="divide-y divide-border border-t border-border">
          {FEATURES.map((f) => (
            <div key={f.index} className="grid grid-cols-[auto_1fr] gap-6 py-8 md:grid-cols-[80px_280px_1fr] md:gap-10">
              <span className="font-display text-2xl font-bold text-ink/20">{f.index}</span>
              <h3 className="font-display text-xl font-bold">{f.title}</h3>
              <p className="max-w-md text-sm leading-relaxed text-ink/60">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

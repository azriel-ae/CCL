import { getProducts } from "@/lib/products";
import { CartProvider } from "@/components/cart/CartProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FloatingActions } from "@/components/layout/FloatingActions";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Hero } from "@/components/home/Hero";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { ProductCatalog } from "@/components/home/ProductCatalog";
import { OrderProcess } from "@/components/home/OrderProcess";
import { CtaBand } from "@/components/home/CtaBand";

// Halaman ini sengaja TIDAK di-generate statis saat build (force-dynamic),
// dirender ulang di server setiap ada request. Dua alasan:
// 1) Data produk berasal dari admin (bisa berubah kapan saja) — dynamic
//    rendering membuatnya selalu up-to-date tanpa perlu redeploy.
// 2) Prerender saat build butuh env var (BLOB_READ_WRITE_TOKEN) sudah
//    tersedia PADA SAAT BUILD, yang tidak selalu terjamin (mis. saat
//    deploy pertama kali sebelum semua env var sempat diisi) — ini pernah
//    bikin build gagal total. Dengan force-dynamic, proses build tidak lagi
//    bergantung pada ketersediaan data saat itu.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await getProducts();

  return (
    <CartProvider>
      <Navbar />
      <main>
        <Hero />
        <WhyChooseUs />
        <ProductCatalog products={products} />
        <OrderProcess />
        <CtaBand />
      </main>
      <Footer />
      <FloatingActions />
      <CartDrawer />
    </CartProvider>
  );
}

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

// Revalidate secara berkala supaya perubahan produk dari admin ikut muncul
// di halaman publik tanpa perlu redeploy (ISR).
export const revalidate = 60;

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

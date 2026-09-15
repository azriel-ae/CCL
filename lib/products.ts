import "server-only";
import { readJson, writeJson } from "./data-store";
import type { Product } from "./types";

const PRODUCTS_KEY = "products-data.json";

// Katalog default — persis dengan DEFAULT_PRODUCTS di assets/js/index.js &
// admin.js pada versi lama, supaya katalog tidak kosong saat pertama deploy.
export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Custom Design T-Shirt",
    desc: "Cotton Combed Premium Custom Design",
    subDesc: "Cotton combed berkualitas dengan sablon tajam & lembut.",
    img: "/images/t-shirt.jpg",
    price: 0,
  },
  {
    id: "p2",
    name: "Custom Design Hoodie",
    desc: "Fleece Premium Custom Design",
    subDesc: "Bahan tebal hangat dengan hasil print detail & awet.",
    img: "/images/hoodie.png",
    price: 0,
  },
  {
    id: "p3",
    name: "Custom Design Flag",
    desc: "Bahan Kain Satin/Satinet Custom Design",
    subDesc: "Bendera komunitas / event dengan warna tajam anti pudar.",
    img: "/images/flag.png",
    price: 0,
  },
  {
    id: "p4",
    name: "Custom Design Sticker",
    desc: "Stiker Vinyl Waterproof Custom Design",
    subDesc: "Vinyl waterproof, die-cut/kiss-cut siap tempel.",
    img: "/images/sticker.png",
    price: 0,
  },
  {
    id: "p5",
    name: "Custom Design Tote Bag",
    desc: "Kanvas Premium Custom Design",
    subDesc: "Kanvas tebal kuat untuk kebutuhan harian & hobi.",
    img: "/images/totebag.png",
    price: 0,
  },
  {
    id: "p6",
    name: "Custom Design Jersey",
    desc: "Dryfit Sublimation Custom Design",
    subDesc: "Sublimasi full print untuk tim olahraga atau esport.",
    img: "/images/jersey.png",
    price: 0,
  },
  {
    id: "p7",
    name: "Custom Design Lainnya",
    desc: "Request Khusus Custom Design Customer",
    subDesc: "Punya ide unik lain? Konsultasikan langsung dengan kami.",
    img: "/images/lainnya.png",
    price: 0,
  },
];

export async function getProducts(): Promise<Product[]> {
  try {
    const stored = await readJson<Product[]>(PRODUCTS_KEY);
    if (!stored || !Array.isArray(stored) || stored.length === 0) {
      await writeJson(PRODUCTS_KEY, DEFAULT_PRODUCTS);
      return DEFAULT_PRODUCTS;
    }
    return stored;
  } catch (err) {
    // Jangan sampai halaman utama ikut down hanya karena penyimpanan data
    // (mis. BLOB_READ_WRITE_TOKEN belum di-set) sedang bermasalah — tampilkan
    // katalog default dulu, sambil error-nya tetap tercatat di log server.
    console.error("getProducts() gagal, fallback ke DEFAULT_PRODUCTS:", err);
    return DEFAULT_PRODUCTS;
  }
}

export async function saveProducts(products: Product[]): Promise<void> {
  await writeJson(PRODUCTS_KEY, products);
}

export async function createProduct(
  input: Omit<Product, "id" | "price"> & { price?: number }
): Promise<Product> {
  const products = await getProducts();
  const newProduct: Product = {
    id: "p_" + Date.now().toString(36),
    name: input.name.trim(),
    desc: input.desc.trim(),
    subDesc: (input.subDesc || "").trim(),
    img: input.img?.trim() || `https://placehold.co/400x300/e7e5e4/78716c?text=${encodeURIComponent(input.name)}`,
    price: Number(input.price) || 0,
  };
  products.push(newProduct);
  await saveProducts(products);
  return newProduct;
}

export async function updateProduct(
  id: string,
  updates: Partial<Omit<Product, "id">>
): Promise<Product | null> {
  const products = await getProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return null;

  products[idx] = { ...products[idx], ...updates };
  await saveProducts(products);
  return products[idx];
}

export async function deleteProduct(id: string): Promise<boolean> {
  const products = await getProducts();
  const filtered = products.filter((p) => p.id !== id);
  if (filtered.length === products.length) return false;
  await saveProducts(filtered);
  return true;
}

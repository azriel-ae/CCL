/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Produk & logo statis dilayani dari /public. Dua pattern tambahan di
    // bawah ini untuk: (1) placeholder otomatis saat admin belum upload
    // foto produk, dan (2) hasil upload foto produk yang disimpan di
    // Vercel Blob Storage (lib/data-store.ts & app/api/admin/upload).
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;

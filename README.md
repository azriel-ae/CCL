# Corat Coret Layar — Next.js + TypeScript

Migrasi dari website statis (HTML/CSS/JS + 1 serverless function) ke Next.js 14
(App Router) + TypeScript + Tailwind CSS. Dokumen ini menjelaskan cara
menjalankan project, apa yang dipertahankan, apa yang diperbaiki, dan apa yang
**belum bisa saya verifikasi sendiri**.

---

## ⚠️ Batasan penting yang perlu kamu tahu

Project ini saya tulis manual di sandbox yang **tidak punya akses internet**,
jadi saya **tidak bisa menjalankan** `npm install`, `npm run build`, atau
`npm run dev` untuk memverifikasi project ini benar-benar compile & jalan
mulus. Saya sudah teliti soal sintaks TypeScript/JSX, kompatibilitas Next.js
14 App Router, dan konsistensi tipe data — tapi **kamu wajib menjalankan
langkah di bawah ini sendiri** sebelum deploy, dan kabari saya kalau ada
error saat build supaya bisa langsung saya perbaiki.

```bash
npm install
npm run dev      # cek di http://localhost:3000
npm run build    # wajib lulus sebelum deploy ke Vercel
```

---

## Setup

1. **Environment variables** — salin `.env.example` menjadi `.env.local` lalu isi:
   - `BLOB_READ_WRITE_TOKEN` — dari Vercel Dashboard → Storage → Create Database → Blob.
     Kalau dikosongkan saat development, data otomatis disimpan di folder lokal
     `./.data/` (lihat `lib/data-store.ts`) supaya `npm run dev` tetap bisa
     dites end-to-end tanpa akun Vercel.
   - `SESSION_SECRET` — string acak panjang untuk menandatangani cookie sesi admin.
     Generate dengan: `node -e "console.log(crypto.randomBytes(48).toString('hex'))"`
   - `NEXT_PUBLIC_WHATSAPP_NUMBER` — nomor WhatsApp tujuan checkout (format `62xxxx`).

2. **Login admin pertama kali**: buka `/admin/login`
   - Username: `admin`
   - Password: `123`
   - **WAJIB ganti password ini** setelah login pertama (lewat tab "Kelola Akun",
     atau buat akun baru lalu hapus akun `admin` default — akun Owner utama
     `admin` sendiri tidak bisa dihapus dari UI sebagai pengaman, jadi minimal
     buat kebiasaan mengganti password-nya secara berkala).

3. Deploy ke Vercel seperti biasa (`vercel` CLI atau hubungkan repo Git). Jangan
   lupa tambahkan ketiga environment variable di atas di Vercel Project Settings.

---

## Struktur project

```
app/
├── page.tsx                    → Homepage (hero, katalog, cara order, dst)
├── admin/
│   ├── login/page.tsx          → Login admin (tanpa sidebar)
│   └── (dashboard)/            → Route group: semua halaman butuh sesi login
│       ├── layout.tsx          → Shell sidebar, verifikasi sesi (lapis ke-2)
│       ├── page.tsx            → Ringkasan/metrics
│       ├── rekap/              → Rekap bulanan/harian
│       ├── transaksi/          → CRUD transaksi
│       ├── produk/             → CRUD produk + upload foto
│       ├── akun/               → CRUD akun admin
│       └── aktivitas/          → Log aktivitas
└── api/
    ├── v1/sales/route.ts       → Endpoint sama seperti versi lama (checkout WA)
    └── admin/                  → login, logout, products, accounts, upload

lib/                             → Semua logic server (data store, auth, metrics)
components/                      → UI, dipisah home/ cart/ layout/ admin/
middleware.ts                    → Proteksi server-side untuk /admin & /api/admin
```

---

## ✅ Checklist fungsionalitas (lama → baru)

| Fitur lama | Status | Catatan |
|---|---|---|
| Homepage, hero, katalog produk | ✅ Dipertahankan | Didesain ulang sesuai brief (anti AI-slop, editorial) |
| Cart drawer (tambah/kurang/hapus) | ✅ Dipertahankan | `components/cart/CartProvider.tsx` |
| Checkout via WhatsApp | ✅ Dipertahankan | Nomor WA dari `NEXT_PUBLIC_WHATSAPP_NUMBER` |
| Pencatatan order ke dashboard saat checkout | ✅ Dipertahankan | POST ke `/api/v1/sales`, sama seperti lama |
| Login admin (produk & akun) | ✅ Ditingkatkan | Dulu client-side saja (localStorage) → sekarang cookie httpOnly + JWT + verifikasi di middleware |
| Login dashboard penjualan | ✅ Digabung dengan login admin | Lihat "Perubahan arsitektur" di bawah |
| CRUD produk + upload foto | ✅ Dipertahankan & ditingkatkan | Foto upload asli (bukan base64) ke Vercel Blob / `public/uploads` saat dev |
| CRUD akun admin | ✅ Dipertahankan | Password sekarang di-hash (scrypt), dulu plaintext di localStorage |
| Dashboard metrics (omzet, dsb) | ✅ Dipertahankan | `lib/metrics.ts`, logic sama seperti `penjualan.js` |
| Rekap bulanan/harian per produk & metode bayar | ✅ Dipertahankan | `/admin/rekap` |
| Cari/filter/edit/hapus transaksi | ✅ Dipertahankan | `/admin/transaksi` |
| Log aktivitas | ✅ Dipertahankan & server-side | Dulu di localStorage (hilang kalau ganti browser), sekarang tersimpan di server |
| Pengaturan "API Base URL" | ❌ Dihapus (lihat catatan) | Sudah tidak relevan — dijelaskan di bawah |
| `assets/js/script.js` | ❌ Tidak dimigrasikan | File ini tidak dipakai di halaman manapun pada project lama (dead code) |

---

## Perubahan arsitektur yang disengaja (bukan pengurangan fitur)

1. **Dua sistem login admin digabung jadi satu.** Versi lama punya dua
   auth terpisah yang tidak saling kenal: `admin.html` (localStorage
   `ccl_session`) untuk kelola produk/akun, dan `penjualan.html`
   (localStorage `ccl_current_session`, hash SHA-256 client-side) untuk
   dashboard penjualan — dua deployment berbeda yang harus saling menunjuk
   lewat pengaturan "API Base URL". Sekarang semuanya satu aplikasi, satu
   login, satu sesi. **Semua fitur dari kedua sistem itu tetap ada**, hanya
   pintu masuknya disatukan.

2. **Tab "Pengaturan → API Base URL" dihapus.** Fitur itu ada karena dashboard
   penjualan dulu di-deploy terpisah dari situs utama dan perlu tahu ke mana
   harus memanggil API. Sekarang keduanya satu aplikasi Next.js di satu
   domain, jadi API selalu dipanggil relatif (`/api/v1/sales`) — pengaturan
   ini jadi tidak berguna secara struktural, bukan fitur yang sengaja dicabut.

3. **Keamanan API `/api/v1/sales` diperketat.** Versi lama: `GET`, `PUT`,
   `DELETE` bisa dipanggil siapa saja tanpa login (CORS `*`, tanpa autentikasi)
   — artinya siapa pun yang tahu URL bisa membaca/mengubah/menghapus **seluruh
   data pelanggan**. Sekarang hanya `POST` (mencatat pesanan) yang publik;
   `GET/PUT/DELETE` wajib login admin. Ini konsekuensi langsung dari instruksi
   "authorization harus ditegakkan server-side, bukan cuma UI".

4. **Produk & akun dipindah dari localStorage ke penyimpanan server** (Vercel
   Blob, pola yang sama dengan yang sudah dipakai untuk data penjualan).
   Di versi lama, kalau admin menambah produk dari satu browser, pengunjung
   lain di browser lain tidak akan pernah melihatnya — localStorage itu
   per-browser, bukan database sungguhan. Ini bukan database baru "demi
   kemudahan migrasi", tapi prasyarat supaya perlindungan server-side pada
   poin di atas bisa benar-benar ditegakkan.

---

## Keamanan

- Sesi admin: JWT (HS256, lib `jose`) di cookie **httpOnly + Secure (production) + SameSite=Lax**, kedaluwarsa 8 jam.
- Password akun admin: **scrypt** + salt acak per akun (`lib/accounts.ts`), tidak pernah disimpan/plaintext.
- `middleware.ts` menolak akses ke `/admin/*` dan `/api/admin/*` **di level server** sebelum halaman/route handler dijalankan — bukan sekadar menyembunyikan tombol di UI.
- Akun Owner default (`admin`) tidak bisa dihapus dari UI, sebagai pengaman supaya tidak ada yang terkunci total dari dashboard.

## Yang belum/tidak saya kerjakan (transparan supaya tidak ada ekspektasi salah)

- **Belum saya build/test sendiri** (lihat peringatan di atas — tidak ada akses internet di sandbox saya).
- Halaman detail produk per-slug (`/katalog/[slug]`) belum dibuat sebagai
  halaman terpisah — katalog masih satu halaman seperti versi lama (anchor
  `#produk`), karena UX aslinya memang single-page dan brief mengizinkan tidak
  memaksakan struktur folder kalau versi existing lebih pas.
- Belum ada test otomatis (unit/e2e) — tidak diminta di brief, tapi beri tahu saya kalau kamu mau saya tambahkan.
- Rate limiting untuk endpoint login belum ada (brute-force protection) — worth ditambahkan sebelum production kalau trafiknya publik.

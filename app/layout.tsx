import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "./__font_stub";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://coratcoretlayar.vercel.app"),
  title: {
    default: "Corat Coret Layar — Custom Merchandise Made For Your Idea",
    template: "%s — Corat Coret Layar",
  },
  description:
    "Custom design premium: kaos, hoodie, flag, sticker, tote bag, jersey, dan lainnya. Harga terjangkau, cepat, full custom design.",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Corat Coret Layar — Custom Merchandise Made For Your Idea",
    description:
      "Jasa design custom untuk kaos, hoodie, flag, sticker, tote bag, dan jersey. File siap cetak + mockup.",
    url: "https://coratcoretlayar.vercel.app",
    siteName: "Corat Coret Layar",
    locale: "id_ID",
    type: "website",
  },
};

export const viewport = {
  themeColor: "#F7F5F0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}

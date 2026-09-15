import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/admin/Sidebar";

// Middleware.ts sudah menolak request tanpa sesi valid sebelum sampai ke
// sini. Pengecekan ulang di layout ini adalah lapisan kedua (defense in
// depth) sekaligus untuk mengambil data session yang ditampilkan di sidebar.
export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink md:flex-row">
      <Sidebar session={session} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl p-5 md:p-8">{children}</div>
      </main>
    </div>
  );
}

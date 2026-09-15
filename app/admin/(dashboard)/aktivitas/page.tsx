import { History, Inbox } from "lucide-react";
import { getActivityLogs } from "@/lib/activity";
import { formatDate } from "@/lib/metrics";

export const dynamic = "force-dynamic";

export default async function AktivitasPage() {
  const logs = await getActivityLogs();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold">Log Aktivitas Admin</h2>
        <p className="text-xs text-ink/50">Jejak setiap aksi penting: login, ubah produk, kelola akun</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        {logs.length === 0 ? (
          <div className="py-16 text-center text-ink/40">
            <Inbox size={26} className="mx-auto mb-2 text-ink/20" />
            Belum ada aktivitas tercatat.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {logs.map((log) => (
              <li key={log.id} className="flex items-start gap-3 px-5 py-4">
                <div className="mt-0.5 rounded-lg border border-border bg-bg p-2 text-ink/50">
                  <History size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-bold">{log.username}</span>{" "}
                    <span className="text-ink/70">{log.action}</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink/40">{formatDate(log.timestamp)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

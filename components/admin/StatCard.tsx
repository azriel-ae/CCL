import type { LucideIcon } from "lucide-react";
import { statusLabel } from "@/lib/metrics";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-ink/50">{label}</span>
        <div className="rounded-xl border border-border bg-bg p-2.5 text-ink/70">
          <Icon size={18} />
        </div>
      </div>
      <div>
        <p className="font-display text-2xl font-bold tracking-tight">{value}</p>
        <p className="mt-1 text-[11px] font-medium text-ink/45">{hint}</p>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status?: string }) {
  const label = statusLabel(status);
  const styles: Record<string, string> = {
    Selesai: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Dibatalkan: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${styles[label]}`}>
      {label}
    </span>
  );
}

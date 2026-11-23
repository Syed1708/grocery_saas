import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatTone = "neutral" | "rose" | "emerald" | "info" | "blue" | "amber" | "fuchsia";

const toneStyles: Record<StatTone, { title: string; value: string }> = {
  neutral: { title: "text-neutral-400", value: "text-neutral-900 dark:text-neutral-100" },
  rose: { title: "text-rose-500", value: "text-rose-600" },
  emerald: { title: "text-emerald-500", value: "text-emerald-600" },
  info: { title: "text-neutral-400", value: "text-blue-600" },
  blue: { title: "text-blue-500", value: "text-blue-600" },
  amber: { title: "text-amber-500", value: "text-amber-600" },
  fuchsia: { title: "text-fuchsia-500", value: "text-fuchsia-600" },
};

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: LucideIcon;
  tone?: StatTone;
}

export function StatCard({ title, value, subtitle, icon: Icon, tone = "neutral" }: StatCardProps) {
  const styles = toneStyles[tone];

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
      <span
        className={cn(
          "text-[11px] font-bold uppercase tracking-wider mb-1",
          styles.title,
          Icon ? "flex items-center gap-1" : "block"
        )}
      >
        {Icon && <Icon size={13} />} {title}
      </span>
      <span className={cn("text-2xl font-black font-mono", styles.value)}>{value}</span>
      {subtitle && <span className="text-[11px] text-neutral-400 block mt-1">{subtitle}</span>}
    </div>
  );
}

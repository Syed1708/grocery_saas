import { LucideIcon } from "lucide-react";

interface ReportKpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

const variantStyles = {
  default: "text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800 text-neutral-600",
  success: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600",
  warning: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-600",
  danger: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 text-red-600",
  info: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 text-blue-600",
};

export function ReportKpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
}: ReportKpiCardProps) {
  return (
    <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{title}</span>
        <div className={`p-2 rounded-lg ${variantStyles[variant]}`}>
          <Icon size={16} />
        </div>
      </div>
      <div className="mt-2">
        <span className="text-xl font-bold font-mono tracking-tight">{value}</span>
        {subtitle && (
          <p className="text-[11px] text-neutral-400 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
import Link from "next/link";
import { LucideIcon, ArrowRight } from "lucide-react";

interface ReportCategoryCardProps {
  title: string;
  subtitleEn: string;
  description: string;
  href: string;
  badge?: string;
  metricLabel?: string;
  metricValue?: string;
  icon: LucideIcon;
  colorScheme: "blue" | "emerald" | "amber" | "violet" | "rose" | "indigo" | "cyan";
}

const colorMap = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400 group-hover:bg-violet-600 group-hover:text-white",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white",
  indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white",
  cyan: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400 group-hover:bg-cyan-600 group-hover:text-white",
};

export function ReportCategoryCard({
  title,
  subtitleEn,
  description,
  href,
  badge,
  metricLabel,
  metricValue,
  icon: Icon,
  colorScheme,
}: ReportCategoryCardProps) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col justify-between p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2.5 rounded-xl transition-colors duration-200 ${colorMap[colorScheme]}`}>
            <Icon size={20} />
          </div>
          {badge && (
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
              {badge}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {title}
        </h3>
        <p className="text-[11px] font-medium text-neutral-400 mb-2">{subtitleEn}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>

      {/* Footer / Live Metric Preview */}
      <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs">
        {metricLabel && metricValue ? (
          <div>
            <span className="text-[10px] text-neutral-400 block">{metricLabel}</span>
            <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">{metricValue}</span>
          </div>
        ) : (
          <span className="text-[11px] font-medium text-neutral-400">View deep analytics</span>
        )}

        <div className="w-7 h-7 rounded-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-800 text-neutral-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
          <ArrowRight size={14} />
        </div>
      </div>
    </Link>
  );
}
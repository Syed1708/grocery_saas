import React from "react";
import { Search } from "lucide-react";
import Breadcrumbs from "@/components/common/Breadcrumbs";

export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  action,
}: {
  title: string;
  subtitle?: string;
  breadcrumb: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: "ক্যাটালগ ও ইনভেন্টরি" }, { label: breadcrumb }]} />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">{title}</h1>
          {subtitle && <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
    </div>
  );
}

export function TableSearch({
  value,
  onChange,
  placeholder = "অনুসন্ধান করুন...",
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-2xl shadow-xs">
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-2.5 text-neutral-400" size={15} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-neutral-900 dark:text-neutral-100"
        />
      </div>
    </div>
  );
}
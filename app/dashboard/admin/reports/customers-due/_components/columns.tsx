import { ColumnDef } from "@tanstack/react-table";
import { ICustomerDueRow } from "@/types/index";
import { BookOpen, Phone, MapPin } from "lucide-react";

export const getCustomerDueColumns = (
  currency: string,
  onOpenKhata: (customer: ICustomerDueRow) => void
): ColumnDef<ICustomerDueRow>[] => [
  {
    accessorKey: "name",
    header: "কাস্টমার বিবরণ (Customer)",
    cell: ({ row }) => (
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100">
            {row.original.name}
          </span>
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded uppercase bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
            {row.original.type === "PERMANENT" ? "স্থায়ী" : "চলতি"}
          </span>
        </div>
        
        <div className="flex items-center gap-3 text-[11px] text-neutral-500 dark:text-neutral-400">
          {row.original.phone && (
            <span className="flex items-center gap-1 font-mono">
              <Phone size={10} /> {row.original.phone}
            </span>
          )}
          {row.original.village && (
            <span className="flex items-center gap-0.5">
              <MapPin size={10} /> {row.original.village}
            </span>
          )}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "currentDue",
    header: "মোট বাকি (Outstanding Due)",
    cell: ({ row }) => (
      <div className="font-mono">
        <span className="text-sm font-black text-red-600 dark:text-red-400 block">
          {currency}{row.original.currentDue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </span>
        {row.original.openingDue > 0 && (
          <span className="text-[10px] text-neutral-400">
            প্রারম্ভিক: {currency}{row.original.openingDue.toFixed(0)}
          </span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "creditLimit",
    header: "বাকি লিমিট ও ব্যবহার (Credit Limit)",
    cell: ({ row }) => {
      const percent = row.original.limitUsagePercent;
      const isExceeded = percent > 100;

      return (
        <div className="w-36 space-y-1">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-neutral-500">{currency}{row.original.creditLimit.toFixed(0)}</span>
            <span className={`font-bold ${isExceeded ? "text-red-600" : percent > 80 ? "text-amber-600" : "text-emerald-600"}`}>
              {percent}%
            </span>
          </div>
          {/* Visual Progress Bar */}
          <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${isExceeded ? "bg-red-600" : percent > 80 ? "bg-amber-500" : "bg-emerald-500"}`}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "overdueDays",
    header: "মেয়াদোত্তীর্ণ অবস্থা (Aging)",
    cell: ({ row }) => {
      const days = row.original.overdueDays;
      if (days === 0) {
        return <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">নিয়মিত</span>;
      }
      return (
        <div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            days > 60
              ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 font-mono"
              : days > 30
              ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-mono"
              : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-mono"
          }`}>
            {days} দিন বকেয়া
          </span>
          <span className="block text-[10px] text-neutral-400 mt-0.5 font-mono">
            শেষ পরিশোধ: {row.original.lastPaymentDate ? new Date(row.original.lastPaymentDate).toLocaleDateString() : "কখনও না"}
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "অ্যাকশন",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <button
          onClick={() => onOpenKhata(row.original)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition cursor-pointer"
        >
          <BookOpen size={13} />
          <span>খাতা বিবরণী</span>
        </button>
      </div>
    ),
  },
];
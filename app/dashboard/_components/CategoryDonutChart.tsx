"use client";

import { ICategorySalesShare } from "@/types/dashboard";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export function CategoryDonutChart({ data }: { data: ICategorySalesShare[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
      <h3 className="text-base font-bold text-slate-900 dark:text-white">শীর্ষ বিক্রিত ক্যাটাগরি</h3>
      <p className="text-xs text-slate-500 mb-2">মোট ইনভেন্টরি খরচের আনুপাতিক শেয়ার</p>

      <div className="h-52.5 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(val: any) => [`৳${Number(val).toLocaleString()}`, ""]} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-1.5 mt-2">
        {data.map((cat) => (
          <div key={cat.name} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
              {cat.name}
            </span>
            <span className="font-semibold text-slate-900 dark:text-white">{cat.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
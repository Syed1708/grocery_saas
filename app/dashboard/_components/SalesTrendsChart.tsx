"use client";

import { ISalesTrendPoint } from "@/types/dashboard";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function SalesTrendsChart({ data }: { data: ISalesTrendPoint[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">গত ৩০ দিনের বিক্রয় ও নিট লাভের ট্রেন্ড</h3>
          <p className="text-xs text-slate-500">বিক্রয়মূল্য বনাম ক্রয়মূল্য ও দোকান পরিচালন খরচ (OPEX)</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-blue-600"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" />মোট বিক্রয়</span>
          <span className="flex items-center gap-1.5 text-emerald-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />নিট লাভ</span>
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `৳${v / 1000}k`} />
            <Tooltip
              formatter={(value: any) => [`৳${Number(value).toLocaleString()}`, ""]}
              contentStyle={{ borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
            />
            <Area type="monotone" dataKey="sales" name="বিক্রয়" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
            <Area type="monotone" dataKey="netProfit" name="নিট লাভ" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#profitGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
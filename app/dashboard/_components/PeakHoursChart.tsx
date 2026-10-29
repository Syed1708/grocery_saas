"use client";

import { IHourlyRushPoint } from "@/types/dashboard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export function PeakHoursChart({ data }: { data: IHourlyRushPoint[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">দোকানের ব্যস্ততম সময় (Peak Hours)</h3>
          <p className="text-xs text-slate-500">সকাল ৯টা থেকে রাত ১০টা পর্যন্ত কাস্টমার ইনভয়েস ফ্লো</p>
        </div>
      </div>

      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <XAxis dataKey="hour" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip
              formatter={(val: any, name: any) => [name === "orders" ? `${val} Orders` : `৳${Number(val).toLocaleString()}`, ""]}
              contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
            />
            <Bar dataKey="orders" name="orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
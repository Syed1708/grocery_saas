"use client";

import { IDashboardKpi } from "@/types/dashboard";
import { TrendingUp, TrendingDown, DollarSign, Wallet, Users, Truck, AlertTriangle } from "lucide-react";

export function DashboardKpis({ kpis }: { kpis: IDashboardKpi }) {
  const isPositive = kpis.todaySalesDelta >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Today Sales */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">আজকের মোট বিক্রয়</span>
          <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-lg text-blue-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            ৳{kpis.todaySales.toLocaleString()}
          </span>
          <span className={`inline-flex items-center text-xs font-semibold ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
            {isPositive ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
            {Math.abs(kpis.todaySalesDelta)}%
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">মোট {kpis.todayOrdersCount} টি ইনভয়েস সম্পন্ন</p>
      </div>

      {/* 2. Cash & Bank Balance */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">ক্যাশ ও ব্যাংক তহবিল</span>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg text-emerald-600">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          ৳{kpis.activeCashAndBank.toLocaleString()}
        </div>
        <p className="text-xs text-slate-400 mt-1">ড্রয়ার + ব্যাংক + bKash/Nagad</p>
      </div>

      {/* 3. Customer Khata Dues */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">কাস্টমার বাকি (খাতা)</span>
          <div className="p-2 bg-amber-50 dark:bg-amber-950/50 rounded-lg text-amber-600">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
          ৳{kpis.customerDuesTotal.toLocaleString()}
        </div>
        <p className="text-xs text-slate-400 mt-1">মার্কেটে অনাদায়ী বকেয়া পাওনা</p>
      </div>

      {/* 4. Supplier Payables & Stock Warnings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">সাপ্লায়ার দেনা ও অ্যালার্ট</span>
          <div className="p-2 bg-rose-50 dark:bg-rose-950/50 rounded-lg text-rose-600">
            <Truck className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
          ৳{kpis.supplierPayablesTotal.toLocaleString()}
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-0.5 text-amber-600 font-semibold">
            <AlertTriangle className="w-3 h-3" /> {kpis.lowStockCount} লো স্টক
          </span>
          <span>•</span>
          <span className="text-rose-600 font-semibold">{kpis.expiringSoonCount} মেয়াদোত্তীর্ণ</span>
        </div>
      </div>
    </div>
  );
}
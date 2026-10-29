"use client";

import { IRecentSaleInvoice, IStockAlertItem } from "@/types/dashboard";
import { AlertCircle, Clock, ShoppingCart } from "lucide-react";

export function DashboardSideWidgets({
  recentSales,
  stockAlerts,
}: {
  recentSales: IRecentSaleInvoice[];
  stockAlerts: IStockAlertItem[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Recent POS Sales */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-emerald-600" /> সাম্প্রতিক বিক্রয় রশিদ (POS)
          </h3>
          <span className="text-xs text-slate-500">লাইভ ট্রানজ্যাকশন</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recentSales.map((sale) => (
            <div key={sale.id} className="py-2.5 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white">{sale.invoiceNo}</span>
                <p className="text-slate-500">{sale.customerName}</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-900 dark:text-white">৳{sale.grandTotal.toLocaleString()}</span>
                <div>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    sale.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {sale.paymentMethod} • {sale.paymentStatus}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Low Stock & Expiry Alerts */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" /> ইনভেন্টরি জরুরি অ্যালার্ট
          </h3>
          <span className="text-xs text-rose-600 font-semibold">স্টক পূরণ প্রয়োজন</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {stockAlerts.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">সব পণ্যের পর্যাপ্ত স্টক ও মেয়াদ সঠিক আছে।</p>
          ) : (
            stockAlerts.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</span>
                  <p className="text-slate-400">SKU: {item.sku}</p>
                </div>
                <div className="text-right">
                  {item.type === "LOW_STOCK" ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                      অবশিষ্ট: {item.stock} টি
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      <Clock className="w-3 h-3" /> দ্রুত মেয়াদ শেষ
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
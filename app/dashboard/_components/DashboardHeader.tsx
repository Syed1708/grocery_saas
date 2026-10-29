"use client";

import Link from "next/link";
import { PlusCircle, ShoppingBag, Receipt, ShieldCheck } from "lucide-react";

interface Props {
  branchName: string;
  userName: string;
  userRole: string;
}

export function DashboardHeader({ branchName, userName, userRole }: Props) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            স্বাগতম, {userName}
          </h1>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <ShieldCheck className="w-3 h-3" /> {userRole}
          </span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          সক্রিয় আউটলেট: <strong className="text-slate-700 dark:text-slate-200">{branchName}</strong> — আজকের সার্বিক ব্যবসায়িক হিসাব ও রিয়েলটাইম সামারি
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        <Link
          href="/dashboard/pos"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition"
        >
          <ShoppingBag className="w-4 h-4" /> দ্রুত পিওএস (POS)
        </Link>
        <Link
          href="/dashboard/admin/expenses"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-sm font-medium transition"
        >
          <PlusCircle className="w-4 h-4" /> খরচ এন্ট্রি
        </Link>
        <Link
          href="/dashboard/admin/reports/closings"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-sm font-medium transition"
        >
          <Receipt className="w-4 h-4" /> ডে-এন্ড জেড-ক্লোজিং
        </Link>
      </div>
    </div>
  );
}
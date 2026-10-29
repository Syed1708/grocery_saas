"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ShoppingBag, 
  ArrowLeft, 
  LayoutDashboard, 
  Search, 
  HelpCircle 
} from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full text-center relative z-10 space-y-6">
        {/* Animated Grocery Cart Icon Badge */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none mx-auto relative group">
          <ShoppingBag className="w-10 h-10 text-emerald-600 transition-transform group-hover:scale-110 duration-300" />
          <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center shadow">
            ?
          </div>
        </div>

        {/* Error Code & Headings */}
        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Error 404 • পৃষ্ঠাটি খুঁজে পাওয়া যায়নি
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            পেজ বা পণ্য অনুপস্থিত!
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
            আপনি যে পেজ বা রসিদের লিঙ্কটি খুঁজছেন তা মুছে ফেলা হয়েছে, স্থানান্তরিত হয়েছে অথবা ভুল টাইপ করা হয়েছে।
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => router.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold shadow-sm transition"
          >
            <ArrowLeft className="w-4 h-4" /> পেছনে যান
          </button>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-600/20 transition"
          >
            <LayoutDashboard className="w-4 h-4" /> ড্যাশবোর্ড
          </Link>
        </div>

        {/* Quick Help Footer Links */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center gap-6 text-xs text-slate-400">
          <Link 
            href="/dashboard/pos" 
            className="inline-flex items-center gap-1 hover:text-emerald-600 transition"
          >
            <Search className="w-3.5 h-3.5" /> পিওএস কাউন্টার
          </Link>
          <span>•</span>
          <Link 
            href="/dashboard/admin/reports" 
            className="inline-flex items-center gap-1 hover:text-emerald-600 transition"
          >
            <HelpCircle className="w-3.5 h-3.5" /> রিপোর্ট হাব
          </Link>
        </div>
      </div>
    </div>
  );
}
import { ShoppingBag } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] w-full px-4 select-none">
      <div className="relative flex items-center justify-center">
        {/* Ambient Emerald Glow */}
        <div className="absolute w-24 h-24 bg-emerald-500/15 dark:bg-emerald-500/10 rounded-full blur-xl animate-pulse" />

        {/* Outer Rotating Gradient Ring */}
        <div className="w-16 h-16 rounded-full border-2 border-emerald-500/20 dark:border-emerald-500/10 border-t-emerald-600 dark:border-t-emerald-400 animate-spin" />

        {/* Inner Counter-Rotating Ring */}
        <div 
          className="absolute w-12 h-12 rounded-full border-2 border-transparent border-b-emerald-400/60 dark:border-b-emerald-300/40 animate-spin" 
          style={{ animationDirection: "reverse", animationDuration: "1.2s" }}
        />

        {/* Centered Branded Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <ShoppingBag className="w-6 h-6 text-emerald-600 dark:text-emerald-400 transition-transform animate-pulse" />
        </div>
      </div>

      {/* Status Typography */}
      <div className="mt-5 text-center space-y-1">
        <h3 className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-200">
          তথ্য লোড হচ্ছে...
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন
        </p>
      </div>

      {/* Sleek Indeterminate Loading Bar */}
      <div className="w-32 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-4">
        <div className="h-full bg-emerald-500 rounded-full animate-indeterminate" />
      </div>
    </div>
  );
}
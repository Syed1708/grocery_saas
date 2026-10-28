// components/common/ForbiddenAccess.tsx
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function ForbiddenAccess({
  title = "Access Denied",
  message = "You do not have the required permissions or role to view this page. Contact your store owner if you believe this is a mistake.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-4 text-center">
      <div className="p-4 rounded-full bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 mb-4 shadow-xs">
        <ShieldAlert size={40} />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
        {title}
      </h2>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mt-1.5 mb-6 leading-relaxed">
        {message}
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs cursor-pointer"
      >
        <ArrowLeft size={14} /> Back to Dashboard Overview
      </Link>
    </div>
  );
}
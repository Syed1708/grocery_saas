// app/(dashboard)/error.tsx
"use client";

import { useEffect } from "react";
import ForbiddenAccess from "@/components/common/ForbiddenAccess";
import { Button } from "@/components/common/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error caught:", error);
  }, [error]);

  const isForbidden = error.message?.includes("FORBIDDEN") || error.message?.includes("UNAUTHORIZED");

  if (isForbidden) {
    const cleanMessage = error.message.replace(/^(FORBIDDEN|UNAUTHORIZED):\s*/, "");
    return (
      <ForbiddenAccess 
        title="Restricted Access"
        message={cleanMessage || "You do not have permission to access this module."}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-4 text-center">
      <div className="p-4 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 mb-4">
        <AlertCircle size={40} />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
        Something went wrong!
      </h2>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mt-1 mb-6">
        {error.message || "An unexpected error occurred while loading this section."}
      </p>
      <Button onClick={reset} size="sm" className="gap-1.5 cursor-pointer">
        <RotateCcw size={14} /> Try Again
      </Button>
    </div>
  );
}
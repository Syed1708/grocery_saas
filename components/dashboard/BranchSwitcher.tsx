"use client";

import { useState } from "react";
import { GitBranch, Check, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { switchBranchAction } from "@/app/actions/branch-actions";
import { useSession } from "next-auth/react";

interface BranchOption {
  id: string;
  name: string;
  code: string;
  isMain: boolean;
}

interface BranchSwitcherProps {
  branches: BranchOption[];
  currentBranchId?: string | null;
  currentBranchName?: string | null;
  userRole?: string;
}

export default function BranchSwitcher({
  branches,
  currentBranchId,
  currentBranchName = "Main Branch",
  userRole,
}: BranchSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { data: session, update } = useSession();

  // 👈 Pulls role directly from session token, eliminating the Cashier fallback bug
  const activeRole = session?.user?.role || userRole;
  const isOwner = activeRole === "OWNER" || activeRole === "ADMIN" || activeRole === "SUPER_ADMIN";

  // If Manager or Cashier (or only 1 branch exists), render locked static badge
  if (!isOwner || branches.length <= 1) {
    return (
      <div 
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold select-none cursor-default"
        title="Your assigned outlet"
      >
        <GitBranch size={13} className="text-blue-600 dark:text-blue-400" />
        <span className="truncate max-w-32.5">{currentBranchName}</span>
      </div>
    );
  }

  // 👈 Owner Switch Handler (Can switch to ANY branch including Main Branch)
  async function handleSwitch(branch: BranchOption) {
    if (branch.id === currentBranchId) {
      setOpen(false);
      return;
    }

    setLoading(true);
    const res = await switchBranchAction(branch.id);

    if (res.success) {
      toast.success(`Switched to ${branch.name}`);
      setOpen(false);
      
      // Update NextAuth JWT token and reload clean state
      await update({ branchId: branch.id, branchName: branch.name });
      window.location.reload();
    } else {
      setLoading(false);
      toast.error(res.error || "Failed to switch branch");
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-750 transition text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-70"
        title="Switch active outlet"
      >
        {loading ? (
          <Loader2 size={13} className="animate-spin text-blue-600" />
        ) : (
          <GitBranch size={13} className="text-blue-600" />
        )}
        <span className="truncate max-w-[140px]">
          {currentBranchName || "Select Outlet"}
        </span>
        <ChevronDown size={12} className="text-neutral-400 shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl p-1.5 z-50 space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-2 py-1 block">
              All Outlets (Owner Access)
            </span>

            {branches.map((b) => {
              const isActive = b.id === currentBranchId;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleSwitch(b)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-lg transition cursor-pointer text-left ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 font-bold"
                      : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
                >
                  <div className="truncate">
                    <span className="block truncate">{b.name}</span>
                    <span className="text-[10px] font-mono text-neutral-400">
                      [{b.code}] {b.isMain && "• Principal Main"}
                    </span>
                  </div>
                  {isActive && <Check size={14} className="shrink-0 text-blue-600" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
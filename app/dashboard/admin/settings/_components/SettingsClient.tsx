"use client";

import { useState } from "react";
import { Store, Printer, Percent, GitBranch } from "lucide-react";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import ShopProfileTab from "./ShopProfileTab";
import ReceiptSettingsTab from "./ReceiptSettingsTab";
import VatSettingsTab from "./VatSettingsTab";
import BranchManagementTab from "./BranchManagementTab";
import { IShopSettings, IBranchSettings } from "@/types/settings";


export default function SettingsClient({
  shop,
  branches,
  activeBranch,
  userRole = "OWNER", // 👈 Default to OWNER if undefined
}: {
  shop: IShopSettings;
  branches: IBranchSettings[];
  activeBranch?: IBranchSettings | null;
  userRole?: string;
}
) {
  const [activeTab, setActiveTab] = useState<"profile" | "receipt" | "vat" | "branches">("profile");

  const isOwner = userRole === "OWNER" || userRole === "SUPER_ADMIN" || userRole === "ADMIN";
  // Branch Managers only see Profile & Receipt configuration
  const tabs = [
    { id: "profile" as const, label: "আউটলেট প্রোফাইল (Outlet Profile)", icon: Store, show: true },
    { id: "receipt" as const, label: "রসিদ ও প্রিন্টার (POS Receipt)", icon: Printer, show: true },
    { id: "vat" as const, label: "ভ্যাট ও কর (VAT & Tax)", icon: Percent, show: isOwner }, // 👈 Hidden for Managers
    { id: "branches" as const, label: `ব্রাঞ্চসমূহ (${branches.length})`, icon: GitBranch, show: isOwner }, // 👈 Hidden for Managers
  ].filter((t) => t.show);

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Store Settings" }]} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight">দোকান ও সিস্টেম সেটিংস (Store Configuration)</h1>
          <p className="text-xs text-neutral-500">Manage grocery profile, thermal POS receipt parameters, and branch outlets</p>
        </div>

        {/* 👈 Visual Active Branch Indicator */}
        {activeBranch && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/40 text-xs">
            <span className="text-neutral-500">সক্রিয় শাখা:</span>
            <strong className="text-blue-700 dark:text-blue-400 font-bold">
              {activeBranch.name} [{activeBranch.code}]
            </strong>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-neutral-200 dark:border-neutral-800">
        <nav className="flex space-x-2 overflow-x-auto no-scrollbar py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition cursor-pointer ${isActive
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-bold"
                  : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Panels */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
        {activeTab === "profile" && (
          <ShopProfileTab
            key={`shop-profile-${activeBranch?.id || "main"}`} // 👈 Component Key automatically re-initializes state!
            shop={shop}
            activeBranch={activeBranch}
            isOwner={isOwner}

          />
        )}
        {activeTab === "receipt" && (
          <ReceiptSettingsTab shop={shop} activeBranch={activeBranch} />
        )}
        {activeTab === "vat" && <VatSettingsTab shop={shop} />}
        {activeTab === "branches" && <BranchManagementTab branches={branches} />}
      </div>
    </div>
  );
}
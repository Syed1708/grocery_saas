"use client";

import { useState } from "react";
import { Input } from "@/components/common/ui/Input";
import { Textarea } from "@/components/common/ui/Textarea";
import { IShopSettings, IBranchSettings } from "@/types/settings";
import { updateShopProfileAction } from "@/app/actions/settings-actions";
import { toast } from "sonner";
import { Save, Loader2, GitBranch, Building2 } from "lucide-react";

interface ShopProfileTabProps {
  shop: IShopSettings;
  activeBranch?: IBranchSettings | null;
  isOwner?: boolean; // 👈 Declare isOwner here
}
export default function ShopProfileTab({
  shop,
  activeBranch,
  isOwner = true, // 👈 Default to true if not specified
}: ShopProfileTabProps) {
  const [loading, setLoading] = useState(false);

  // 👈 Bound strictly to Active Branch info (No fallback to main branch data)
  const [formData, setFormData] = useState({
    // Branch specifics
    branchName: activeBranch?.name || "",
    phone: activeBranch?.phone || "",
    email: activeBranch?.email || "",
    address: activeBranch?.address || "",

    // Central Shop specifics
    shopName: shop.name || "",
    nameEn: shop.nameEn || "",
    tradeLicense: shop.tradeLicense || "",
    binVatNumber: shop.binVatNumber || "",
    currencySymbol: shop.currencySymbol || "৳",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await updateShopProfileAction(formData);
    setLoading(false);

    if (res.success) {
      toast.success(`Profile updated for ${formData.branchName}!`);
    } else {
      toast.error(res.error || "Failed to save profile.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* ==================================================== */}
      {/* 1. ACTIVE BRANCH / OUTLET INFORMATION                */}
      {/* ==================================================== */}
      <div className="space-y-4 p-4 rounded-xl border border-blue-100 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20">
        <div className="flex items-center justify-between pb-2 border-b border-blue-200 dark:border-blue-900">
          <div className="flex items-center gap-2">
            <GitBranch size={18} className="text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                সক্রিয় আউটলেট তথ্য (Active Outlet Profile)
              </h2>
              <p className="text-xs text-neutral-500">
                This branch&apos;s specific name, phone, and address printed on invoices
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-blue-600 text-white">
            কোড: {activeBranch?.code || "MAIN"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="আউটলেটের নাম (Branch Name) *"
            required
            placeholder="e.g. Syed Hussain and Brothers"
            value={formData.branchName}
            onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
          />

          <Input
            label="আউটলেটের ফোন নম্বর (Branch Phone) *"
            required
            placeholder="01700000000"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <Input
            label="আউটলেটের ইমেইল (Branch Email)"
            type="email"
            placeholder="branch@grocery.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <div className="md:col-span-2">
            <Textarea
              label="আউটলেটের সম্পূর্ণ ঠিকানা (Physical Outlet Address) *"
              required
              rows={2}
              placeholder="দোকান নং, রোড নং, এলাকা..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. CENTRAL SHOP / HEAD OFFICE CREDENTIALS            */}
      {/* ==================================================== */}

      {/* 🛑 Hide Central Company Info if not Owner */}
    {isOwner && (
      <div className="space-y-4 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <Building2 size={18} className="text-neutral-600 dark:text-neutral-400" />
          <div>
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              হেড অফিস ও বাণিজ্যিক লাইসেন্স (Company Legal Info)
            </h2>
            <p className="text-xs text-neutral-500">
              Central business legal credentials shared across all branches
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="প্রতিষ্ঠানের বাণিজ্যিক নাম (Company Brand Name) *"
            required
            placeholder="e.g. মেসার্স মদিনা জেনারেল স্টোর"
            value={formData.shopName}
            onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
          />

          <Input
            label="Company Name (English)"
            placeholder="e.g. Madina General Store"
            value={formData.nameEn || ""}
            onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
          />

          <Input
            label="ট্রেড লাইসেন্স নম্বর (Trade License)"
            placeholder="TRAD/DNCC/09124/..."
            value={formData.tradeLicense || ""}
            onChange={(e) => setFormData({ ...formData, tradeLicense: e.target.value })}
          />

          <Input
            label="কারেন্সি সিম্বল *"
            required
            placeholder="৳"
            value={formData.currencySymbol}
            onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
          />
        </div>
      </div>

  )}

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-6 py-2.5 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          <span>সংরক্ষণ করুন (Save Changes)</span>
        </button>
      </div>
    </form>
  );
}
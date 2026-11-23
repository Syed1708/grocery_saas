"use client";
import { useState } from "react";
import FormModal from "@/components/common/FormModal";
import { FormField } from "@/components/common/ui/form/FormField";
import { ICompanyAsset } from "@/types";

export default function AssetModal({ isOpen, onClose, onSubmit, loading, asset, currencySymbol, errors = {} }: { isOpen: boolean; onClose: () => void; onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void; loading: boolean; asset?: ICompanyAsset | null; currencySymbol: string; errors?: Record<string, string> }) {
  const isEditing = Boolean(asset);
  const [defaultAssetCode] = useState(() => `AST-${Date.now().toString().slice(-4)}`);

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={onSubmit} title={isEditing ? "Edit Company Asset" : "Add Company Asset (স্থায়ী সম্পদ)"} description="Track store furniture, refrigerators, scales, and computers." loading={loading} isEditing={isEditing} maxWidth="lg">
      {asset && <input type="hidden" name="id" value={asset.id} />}
      <div className="grid grid-cols-2 gap-3">
        <FormField type="text" label="Asset Name" name="name" required defaultValue={asset?.name || ""} placeholder="e.g. Deep Freezer 300L" error={errors.name} />
        <FormField type="text" label="Asset Code" name="assetCode" required defaultValue={asset?.assetCode || defaultAssetCode} error={errors.assetCode} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <FormField type="date" label="Purchase Date" name="purchaseDate" required defaultValue={asset?.purchaseDate ? new Date(asset.purchaseDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]} error={errors.purchaseDate} />
        <FormField type="number" label={`Purchase Cost (${currencySymbol})`} name="purchaseCost" step="0.01" required defaultValue={asset?.purchaseCost ?? ""} placeholder="0.00" error={errors.purchaseCost} />
        <FormField type="number" label={`Current Valuation (${currencySymbol})`} name="currentValue" step="0.01" required defaultValue={asset?.currentValue ?? ""} placeholder="0.00" error={errors.currentValue} />
      </div>
      <FormField type="select" label="Condition" name="condition" defaultValue={asset?.condition || "GOOD"} options={[{ label: "Good", value: "GOOD" }, { label: "Maintenance Needed", value: "MAINTENANCE" }, { label: "Damaged", value: "DAMAGED" }, { label: "Disposed", value: "DISPOSED" }]} error={errors.condition} />
      <FormField type="select" label="Paid From" name="paymentMethod" defaultValue="cash" options={[{ label: "Cash Drawer", value: "cash" }, { label: "Bank Account", value: "bank" }, { label: "bKash", value: "bkash" }, { label: "Nagad", value: "nagad" }, { label: "Rocket", value: "rocket" }, { label: "Other", value: "other" }]} error={errors.paymentMethod} />
      <FormField type="textarea" label="Notes / Serial Number" name="notes" rows={2} defaultValue={asset?.notes || ""} error={errors.notes} />
    </FormModal>
  );
}

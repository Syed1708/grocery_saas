"use client";
import FormModal from "@/components/common/FormModal";
import { Input } from "@/components/common/ui/Input";
import { Select } from "@/components/common/ui/Select";
import { Textarea } from "@/components/common/ui/Textarea";
import { ICompanyAsset } from "@/types";

export default function AssetModal({ isOpen, onClose, onSubmit, loading, asset, currencySymbol }: { isOpen: boolean; onClose: () => void; onSubmit: (e: any) => void; loading: boolean; asset?: ICompanyAsset | null; currencySymbol: string }) {
  const isEditing = Boolean(asset);
  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={onSubmit} title={isEditing ? "Edit Company Asset" : "Add Company Asset (স্থায়ী সম্পদ)"} description="Track store furniture, refrigerators, scales, and computers." loading={loading} isEditing={isEditing} maxWidth="lg">
      {asset && <input type="hidden" name="id" value={asset.id} />}
      <div className="grid grid-cols-2 gap-3">
        <Input label="Asset Name *" name="name" required defaultValue={asset?.name || ""} placeholder="e.g. Deep Freezer 300L" />
        <Input label="Asset Code *" name="assetCode" required defaultValue={asset?.assetCode || `AST-${Date.now().toString().slice(-4)}`} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Input label="Purchase Date *" name="purchaseDate" type="date" required defaultValue={asset?.purchaseDate ? new Date(asset.purchaseDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]} />
        <Input label={`Purchase Cost (${currencySymbol}) *`} name="purchaseCost" type="number" step="0.01" required defaultValue={asset?.purchaseCost ?? ""} placeholder="0.00" />
        <Input label={`Current Valuation (${currencySymbol}) *`} name="currentValue" type="number" step="0.01" required defaultValue={asset?.currentValue ?? ""} placeholder="0.00" />
      </div>
      <Select label="Condition" name="condition" defaultValue={asset?.condition || "GOOD"} options={[{ label: "Good", value: "GOOD" }, { label: "Maintenance Needed", value: "MAINTENANCE" }, { label: "Damaged", value: "DAMAGED" }, { label: "Disposed", value: "DISPOSED" }]} />
      <Textarea label="Notes / Serial Number" name="notes" rows={2} defaultValue={asset?.notes || ""} />
    </FormModal>
  );
}
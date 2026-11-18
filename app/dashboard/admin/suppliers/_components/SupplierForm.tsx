"use client";

import { ISupplier } from "@/types";
import { FormField } from "@/components/common/ui/form/FormField";

interface Props {
  supplier: ISupplier | null;
  currencySymbol: string;
  errors?: Record<string, string>;
}

export default function SupplierForm({ supplier, currencySymbol, errors = {} }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          type="text"
          label="Distributor / Company Name"
          name="companyName"
          required
          defaultValue={supplier?.companyName || ""}
          placeholder="e.g. Unilever Bangladesh Ltd."
          error={errors.companyName}
        />

        <FormField
          type="text"
          label="Contact Person / SR Name"
          name="name"
          required
          defaultValue={supplier?.name || ""}
          placeholder="e.g. Tariqul Islam (SR)"
          error={errors.name}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          type="text"
          label="Phone Number"
          name="phone"
          required
          defaultValue={supplier?.phone || ""}
          placeholder="01700000000"
          error={errors.phone}
        />

        {!supplier && (
          <FormField
            type="number"
            label={`Opening Debt Owed (${currencySymbol})`}
            name="openingBalance"
            step="0.01"
            defaultValue={0}
            placeholder="0.00"
            error={errors.openingBalance}
          />
        )}
      </div>

      <FormField
        type="text"
        label="Address / Office Location"
        name="addressLine"
        defaultValue={supplier?.address || ""}
        placeholder="Warehouse #14, Tejgaon Industrial Area..."
        error={errors.addressLine}
      />

      {/* 👈 Multi-Branch Scope Toggle */}
      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
        <FormField
          type="checkbox"
          label="সকল শাখার জন্য প্রযোজ্য (Global Corporate Supplier)"
          name="isGlobal"
          defaultValue={supplier ? !supplier.branchId : false}
          hint="Enable for major brands (Unilever, Pran) so all branches can purchase from this vendor"
          error={errors.isGlobal}
        />
      </div>
    </div>
  );
}

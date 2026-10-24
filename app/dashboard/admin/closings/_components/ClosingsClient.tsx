"use client";

import { useState } from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { ICashRegisterClosing, ICurrentShiftSummary } from "@/types/index";
import { getClosingColumns } from "./columns";
import ClosingFormModal from "./closing-form-modal";
import ZReportSlip from "./z-report-slip";

interface ClosingsClientProps {
  data: ICashRegisterClosing[];
  shiftSummary: ICurrentShiftSummary;
  currencySymbol?: string;
  shop: {
    name: string;
    phone?: string | null;
    address?: string | null;
  };
  branchName: string;
}

export default function ClosingsClient({
  data,
  shiftSummary,
  currencySymbol = "৳",
  shop,
  branchName,
}: ClosingsClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<ICashRegisterClosing | null>(null);

  const handlePrint = (closing: ICashRegisterClosing) => {
    setActiveReceipt(closing);
    // Allow DOM to render the receipt before calling print
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const columns = getClosingColumns(currencySymbol, handlePrint);
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="space-y-4">
      <div className="space-y-4 print:hidden">
        <Breadcrumbs items={[{ label: "Reports" }, { label: "Day-End Z-Report" }]} />

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Day-End Z-Report Closings</h1>
            <p className="text-xs text-neutral-500">Reconcile cash drawer float and commit register closures</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition cursor-pointer"
          >
            <Plus size={15} /> Perform Closing
          </button>
        </div>

        <DataTable table={table} columns={columns} />

        <ClosingFormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          summary={shiftSummary}
          currencySymbol={currencySymbol}
        />
      </div>

      {/* Isolated 80mm Print Area */}
      {activeReceipt && (
        <ZReportSlip
          closing={activeReceipt}
          currency={currencySymbol}
          shop={shop}
          branchName={branchName}
        />
      )}
    </div>
  );
}
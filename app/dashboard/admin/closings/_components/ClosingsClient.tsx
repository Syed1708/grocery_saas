"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  total: number;
  page: number;
  pageSize: number;
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
  total,
  page,
  pageSize,
  shiftSummary,
  currencySymbol = "৳",
  shop,
  branchName,
}: ClosingsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<ICashRegisterClosing | null>(null);

  const updatePagination = (nextPage: number, nextPageSize: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPageSize !== pageSize) {
      params.set("pageSize", String(nextPageSize));
      params.delete("page");
    } else if (nextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePrint = (closing: ICashRegisterClosing) => {
    setActiveReceipt(closing);
    // Allow DOM to render the receipt before calling print
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const columns = getClosingColumns(currencySymbol, handlePrint);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    state: { pagination: { pageIndex: page - 1, pageSize } },
    onPaginationChange: (updater) => {
      const current = { pageIndex: page - 1, pageSize };
      const next = typeof updater === "function" ? updater(current) : updater;
      updatePagination(next.pageIndex + 1, next.pageSize);
    },
  });

  return (
    <div className="space-y-4">
      <div className="space-y-4 print:hidden">
        <Breadcrumbs items={[{ label: "Reports" }, { label: "Day-End Closings" }]} />

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

        <DataTable table={table} columns={columns} totalCount={total} />

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
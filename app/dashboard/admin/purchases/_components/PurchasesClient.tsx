"use client";
"use no memo";

import { useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Plus, Trash2, Receipt, PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/common/data-table/DataTable";
import Modal from "@/components/common/Modal";
import { createPurchaseAction } from "@/app/actions/purchase-actions";
import { IPurchase } from "@/types";

interface ProductOption {
  id: string;
  name: string;
  costPrice: number;
  stockQuantity: number;
}

interface SupplierOption {
  id: string;
  name: string;
  companyName: string;
}

interface NewItemRow {
  productId: string;
  quantity: number;
  unitCost: number;
  commission: number;
}

export default function PurchasesClient({
  data,
  products,
  suppliers,
  currencySymbol = "৳",
}: {
  data: IPurchase[];
  products: ProductOption[];
  suppliers: SupplierOption[];
  currencySymbol?: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [supplierId, setSupplierId] = useState("");
  const [chalanNo, setChalanNo] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [transportCost, setTransportCost] = useState(0);
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<NewItemRow[]>([
    { productId: products[0]?.id || "", quantity: 1, unitCost: products[0]?.costPrice || 0, commission: 0 },
  ]);

  // Totals Calculation
  const subtotal = items.reduce(
    (sum, item) => sum + (item.quantity * item.unitCost - (item.commission || 0)),
    0
  );
  const grandTotal = Math.max(0, subtotal - discount) + transportCost;
  const dueAmount = Math.max(0, grandTotal - paidAmount);

  function addItemRow() {
    setItems([
      ...items,
      { productId: products[0]?.id || "", quantity: 1, unitCost: products[0]?.costPrice || 0, commission: 0 },
    ]);
  }

  function removeItemRow(index: number) {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof NewItemRow, value: any) {
    const updated = [...items];
    if (field === "productId") {
      const selected = products.find((p) => p.id === value);
      updated[index] = {
        ...updated[index],
        productId: value,
        unitCost: selected?.costPrice || 0,
      };
    } else {
      updated[index] = { ...updated[index], [field]: Number(value) };
    }
    setItems(updated);
  }

  async function handlePurchaseSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierId || !chalanNo) {
      toast.error("Please select a supplier and type chalan/invoice number.");
      return;
    }

    setLoading(true);

    const res = await createPurchaseAction({
      supplierId,
      chalanNo,
      paymentMethod,
      paidAmount,
      discount,
      transportCost,
      notes,
      items,
    });

    setLoading(false);

    if (res.success) {
      toast.success("Purchase recorded & branch stock incremented successfully!");
      setModalOpen(false);
      setChalanNo("");
      setPaidAmount(0);
      setDiscount(0);
      setTransportCost(0);
      setItems([{ productId: products[0]?.id || "", quantity: 1, unitCost: products[0]?.costPrice || 0, commission: 0 }]);
    } else {
      toast.error(res.error || "Failed to record purchase.");
    }
  }

  const columns: ColumnDef<IPurchase>[] = [
    {
      accessorKey: "chalanNo",
      header: "Chalan #",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
          <Receipt size={13} className="text-neutral-400" />
          #{row.getValue("chalanNo")}
        </span>
      ),
    },
    {
      accessorKey: "supplierCompany",
      header: "Distributor / Supplier",
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-neutral-800 dark:text-neutral-200 block">
            {row.original.supplierCompany || row.original.supplierName}
          </span>
          <span className="text-[11px] text-neutral-400">
            Contact: {row.original.supplierName}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "grandTotal",
      header: "Total Bill",
      cell: ({ row }) => (
        <span className="font-bold text-neutral-900 dark:text-neutral-100">
          {currencySymbol}{Number(row.getValue("grandTotal")).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: "paymentStatus",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.paymentStatus;
        return (
          <span
            className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
              status === "PAID"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                : status === "PARTIAL"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                : "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
            }`}
          >
            {status} ({currencySymbol}{row.original.dueAmount.toFixed(2)} due)
          </span>
        );
      },
    },
    {
      accessorKey: "purchaseDate",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-neutral-500 text-xs">
          {new Date(row.original.purchaseDate).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            Purchases & Stock Inward
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Record supplier bills to replenish branch inventory and update distributor ledgers
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
        >
          <PackagePlus size={16} /> New Purchase Bill
        </button>
      </div>

      <DataTable table={table} columns={columns} />

      {/* Stock Inward Purchase Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Purchase Bill (Stock Inward)"
        description="Select products to increment active branch stock and manage payables."
        maxWidth="2xl"
      >
        <form onSubmit={handlePurchaseSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Distributor / Supplier *
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="" disabled>Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.companyName || s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Chalan / Invoice # *
              </label>
              <input
                type="text"
                required
                value={chalanNo}
                onChange={(e) => setChalanNo(e.target.value)}
                placeholder="e.g. CHAL-8041"
                className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Purchase Items (Stock to Add)
              </span>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                + Add Another Product
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto p-1">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700"
                >
                  <select
                    value={item.productId}
                    onChange={(e) => updateItem(index, "productId", e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stock: {p.stockQuantity})
                      </option>
                    ))}
                  </select>

                  <div className="w-20">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", e.target.value)}
                      placeholder="Qty"
                      className="w-full px-2 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none"
                    />
                  </div>

                  <div className="w-24">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={item.unitCost}
                      onChange={(e) => updateItem(index, "unitCost", e.target.value)}
                      placeholder="Cost"
                      className="w-full px-2 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none"
                    />
                  </div>

                  <span className="text-xs font-bold w-20 text-right pr-1">
                    {currencySymbol}{(item.quantity * item.unitCost).toFixed(2)}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeItemRow(index)}
                    className="p-1 text-neutral-400 hover:text-red-600 transition cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Totals & Payments */}
          <div className="p-3 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between items-center font-bold text-sm">
              <span>Total Bill Amount:</span>
              <span>{currencySymbol}{grandTotal.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-neutral-200 dark:border-neutral-700">
              <div>
                <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none"
                >
                  <option value="cash">Cash</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Paid Amount Now ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={grandTotal}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none"
                />
              </div>

              <div>
                <span className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Due Debt Added:
                </span>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400 block pt-1">
                  {currencySymbol}{dueAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || grandTotal <= 0}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Adding Stock..." : "Save Bill & Add Stock"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
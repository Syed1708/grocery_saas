// app/dashboard/admin/purchases/[id]/edit/_components/EditPurchaseClient.tsx
"use client";
"use no memo";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  Receipt,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { updatePurchaseAction } from "@/app/actions/purchase-actions";

interface ProductItem {
  id: string;
  name: string;
  barcode: string;
  costPrice: number;
  stockQuantity: number;
  unitCode: string;
}

interface SupplierItem {
  id: string;
  name: string;
  companyName: string;
  phone: string;
  currentDue: number;
  payableBalance?: number;
}

interface PurchaseRow {
  rowId: string;
  productId: string;
  name: string;
  barcode: string;
  unit: string;
  stock: number;
  quantity: number;
  unitCost: number;
  commission: number;
}

export default function EditPurchaseClient({
  purchase,
  products,
  suppliers,
  activeBranchName,
  currencySymbol = "৳",
}: {
  purchase: any;
  products: ProductItem[];
  suppliers: SupplierItem[];
  activeBranchName: string;
  currencySymbol?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Pre-populate Supplier & Previous Due
  const [selectedSupplierId, setSelectedSupplierId] = useState(purchase.supplierId || "");
  const [supplierSearchQuery, setSupplierSearchQuery] = useState(
    purchase.supplier ? `${purchase.supplier.name} (${purchase.supplier.companyName || ""})` : ""
  );
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [supplierPreviousDue, setSupplierPreviousDue] = useState<number>(
    Number(purchase.previousDue || 0)
  );

  // Pre-populate Chalan Meta
  const [chalanNo, setChalanNo] = useState(purchase.chalanNo || "");
  const [purchaseDate, setPurchaseDate] = useState(
    purchase.purchaseDate ? new Date(purchase.purchaseDate).toISOString().split("T")[0] : ""
  );

  // Barcode & Product Live Search
  const [barcodeSearch, setBarcodeSearch] = useState("");
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);

  // Pre-populate Items Table
  const [items, setItems] = useState<PurchaseRow[]>(() => {
    if (purchase.items && purchase.items.length > 0) {
      return purchase.items.map((item: any) => ({
        rowId: `row-${item.id || Date.now()}-${Math.random()}`,
        productId: item.productId,
        name: item.product?.name || "",
        barcode: item.product?.barcode || "",
        unit: item.product?.unit?.shortCode || "pcs",
        stock: item.product?.stocks?.[0]?.quantity || 0,
        quantity: Number(item.quantity || 1),
        unitCost: Number(item.unitCost || 0),
        commission: Number(item.commission || 0),
      }));
    }
    return [
      {
        rowId: `row-${Date.now()}`,
        productId: "",
        name: "",
        barcode: "",
        unit: "pcs",
        stock: 0,
        quantity: 1,
        unitCost: 0,
        commission: 0,
      },
    ];
  });

  // Pre-populate Payment & Financials
  const [paymentMethod, setPaymentMethod] = useState(purchase.paymentMethod || "cash");
  const [notes, setNotes] = useState(purchase.notes || "");
  const [discount, setDiscount] = useState<number>(Number(purchase.discount || 0));
  const [transportCost, setTransportCost] = useState<number>(Number(purchase.transportCost || 0));
  const [vatPercent, setVatPercent] = useState<number>(Number(purchase.vatPercent || 0));
  const [paidAmount, setPaidAmount] = useState<number>(Number(purchase.paidAmount || 0));

  function handleSelectSupplier(supplier: SupplierItem) {
    setSelectedSupplierId(supplier.id);
    setSupplierSearchQuery(`${supplier.name} (${supplier.phone || supplier.companyName || "Vendor"})`);
    setSupplierPreviousDue(Number(supplier.currentDue ?? supplier.payableBalance ?? 0));
    setShowSupplierDropdown(false);
  }

  function handleSupplierDropdownChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const sId = e.target.value;
    setSelectedSupplierId(sId);
    const found = suppliers.find((s) => s.id === sId);
    if (found) {
      setSupplierSearchQuery(`${found.name} (${found.phone || found.companyName || "Vendor"})`);
      setSupplierPreviousDue(Number(found.currentDue ?? found.payableBalance ?? 0));
    } else {
      setSupplierSearchQuery("");
      setSupplierPreviousDue(0);
    }
  }

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearchQuery.trim()) return [];
    const q = supplierSearchQuery.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.companyName?.toLowerCase().includes(q) ||
        s.phone?.includes(q)
    );
  }, [suppliers, supplierSearchQuery]);

  const filteredProducts = useMemo(() => {
    if (!barcodeSearch.trim()) return [];
    const q = barcodeSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q)
    );
  }, [products, barcodeSearch]);

  function addEmptyRow() {
    const newBlankRow: PurchaseRow = {
      rowId: `row-${Date.now()}-${Math.random()}`,
      productId: "",
      name: "",
      barcode: "",
      unit: "pcs",
      stock: 0,
      quantity: 1,
      unitCost: 0,
      commission: 0,
    };
    setItems((prev) => [...prev, newBlankRow]);
  }

  function addOrIncrementProduct(product: ProductItem) {
    const existingIndex = items.findIndex((i) => i.productId && i.productId === product.id);

    if (existingIndex > -1) {
      setItems((prev) => {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + 1,
        };
        return next;
      });
      setHighlightedRowId(items[existingIndex].rowId);
      setTimeout(() => setHighlightedRowId(null), 600);
    } else {
      const blankIndex = items.findIndex((i) => !i.productId);
      if (blankIndex > -1) {
        setItems((prev) => {
          const next = [...prev];
          next[blankIndex] = {
            ...next[blankIndex],
            productId: product.id,
            name: product.name,
            barcode: product.barcode,
            unit: product.unitCode || "pcs",
            stock: product.stockQuantity || 0,
            quantity: 1,
            unitCost: Number(product.costPrice) || 0,
            commission: 0,
          };
          return next;
        });
        setHighlightedRowId(items[blankIndex].rowId);
        setTimeout(() => setHighlightedRowId(null), 600);
      } else {
        const newRow: PurchaseRow = {
          rowId: `row-${Date.now()}-${Math.random()}`,
          productId: product.id,
          name: product.name,
          barcode: product.barcode,
          unit: product.unitCode || "pcs",
          stock: product.stockQuantity || 0,
          quantity: 1,
          unitCost: Number(product.costPrice) || 0,
          commission: 0,
        };
        setItems((prev) => [...prev, newRow]);
      }
    }

    setBarcodeSearch("");
    setShowProductSuggestions(false);
    barcodeInputRef.current?.focus();
  }

  function handleBarcodeKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = barcodeSearch.trim();
      if (!code) return;
      const matched = products.find((p) => p.barcode.toLowerCase() === code.toLowerCase());
      if (matched) addOrIncrementProduct(matched);
      else toast.error(`Barcode "${code}" not found.`);
    }
  }

  function updateRow(rowId: string, field: keyof PurchaseRow, value: any) {
    setItems((prev) =>
      prev.map((r) => {
        if (r.rowId !== rowId) return r;
        if (field === "productId") {
          if (!value) {
            return {
              ...r,
              productId: "",
              name: "",
              barcode: "",
              unit: "pcs",
              stock: 0,
              unitCost: 0,
            };
          }
          const selected = products.find((p) => p.id === value);
          if (!selected) return r;
          return {
            ...r,
            productId: selected.id,
            name: selected.name,
            barcode: selected.barcode,
            unit: selected.unitCode || "pcs",
            stock: selected.stockQuantity || 0,
            unitCost: Number(selected.costPrice) || 0,
          };
        }
        return { ...r, [field]: value };
      })
    );
  }

  function removeRow(rowId: string) {
    if (items.length === 1) {
      setItems([
        {
          rowId: `row-${Date.now()}`,
          productId: "",
          name: "",
          barcode: "",
          unit: "pcs",
          stock: 0,
          quantity: 1,
          unitCost: 0,
          commission: 0,
        },
      ]);
      return;
    }
    setItems((prev) => prev.filter((r) => r.rowId !== rowId));
  }

  // Financial Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      if (!item.productId) return sum;
      const line = Number(item.quantity) * Number(item.unitCost) - Number(item.commission || 0);
      return sum + Math.max(0, line);
    }, 0);
  }, [items]);

  const totalQuantity = useMemo(() => {
    return items.reduce((sum, item) => {
      if (!item.productId) return sum;
      return sum + (Number(item.quantity) || 0);
    }, 0);
  }, [items]);

  const baseAmount = Math.max(0, subtotal - discount);
  const vatAmount = (baseAmount * vatPercent) / 100;
  const grandTotal = baseAmount + transportCost + vatAmount;
  const netTotalPayable = grandTotal + supplierPreviousDue;
  const currentDue = Math.max(0, netTotalPayable - paidAmount);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedSupplierId) {
      toast.error("Please select a supplier.");
      return;
    }
    if (!chalanNo.trim()) {
      toast.error("Please enter a chalan number.");
      return;
    }

    const validItems = items.filter((i) => i.productId && i.productId.trim() !== "");
    if (validItems.length === 0) {
      toast.error("Please select at least one product.");
      return;
    }

    setLoading(true);

    const payload = {
      id: purchase.id,
      supplierId: selectedSupplierId,
      chalanNo: chalanNo.trim(),
      paymentMethod,
      paidAmount: Number(paidAmount) || 0,
      discount: Number(discount) || 0,
      transportCost: Number(transportCost) || 0,
      vatPercent: Number(vatPercent) || 0,
      notes,
      items: validItems.map((i) => ({
        productId: i.productId,
        quantity: Number(i.quantity),
        unitCost: Number(i.unitCost),
        commission: Number(i.commission) || 0,
      })),
    };

    const res = await updatePurchaseAction(payload);
    setLoading(false);

    if (res.success) {
      toast.success("Purchase bill updated successfully!");
      router.push("/dashboard/admin/purchases");
      router.refresh();
    } else {
      toast.error(res.error || "Failed to update purchase.");
    }
  }

  return (
    <div className="space-y-6 pb-16">
      <Breadcrumbs
        items={[
          { label: "Purchases & Procurement", href: "/dashboard/admin/purchases" },
          { label: `Edit Chalan #${purchase.chalanNo}` },
        ]}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight flex items-center gap-2">
            <Receipt className="text-blue-600" size={22} />
            Edit Purchase Bill #{purchase.chalanNo}
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Update line items, pricing, and re-sync supplier ledger balances
          </p>
        </div>

        <Link
          href="/dashboard/admin/purchases"
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
        >
          <ArrowLeft size={14} /> Back to Purchases
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Supplier Dual Selector */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                🔍 Search Supplier
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-neutral-400" size={15} />
                <input
                  type="text"
                  value={supplierSearchQuery}
                  onChange={(e) => {
                    setSupplierSearchQuery(e.target.value);
                    setShowSupplierDropdown(true);
                  }}
                  onFocus={() => setShowSupplierDropdown(true)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {showSupplierDropdown && filteredSuppliers.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-700">
                  {filteredSuppliers.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleSelectSupplier(s)}
                      className="p-3 text-xs flex justify-between items-center hover:bg-neutral-50 dark:hover:bg-neutral-700/60 cursor-pointer"
                    >
                      <div>
                        <strong className="text-neutral-900 dark:text-neutral-100 block">{s.name}</strong>
                        <span className="text-[11px] text-neutral-500">{s.companyName} • {s.phone}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                        Due: {currencySymbol}{Number(s.currentDue ?? s.payableBalance ?? 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                📋 Select from Dropdown <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedSupplierId}
                onChange={handleSupplierDropdownChange}
                required
                className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">-- Choose Supplier from List --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.companyName || "Vendor"}) - Due: {currencySymbol}
                    {Number(s.currentDue ?? s.payableBalance ?? 0).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Chalan / Memo No <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={chalanNo}
                onChange={(e) => setChalanNo(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Purchase Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Receiving Branch
              </label>
              <input
                type="text"
                disabled
                value={activeBranchName}
                className="w-full px-3 py-2 text-xs font-semibold bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Barcode Scanner */}
        <div className="bg-blue-50/50 dark:bg-blue-950/20 border-2 border-dashed border-blue-400 dark:border-blue-600 rounded-2xl p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <span className="text-2xl p-2 bg-blue-100 dark:bg-blue-900/60 rounded-xl text-blue-600">📷</span>
            <div className="flex-1 w-full relative">
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeSearch}
                onChange={(e) => {
                  setBarcodeSearch(e.target.value);
                  setShowProductSuggestions(true);
                }}
                onKeyDown={handleBarcodeKeyDown}
                placeholder="Scan Barcode with Gun or search product to add/increment..."
                className="w-full px-4 py-2.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-neutral-100 shadow-xs"
              />
            </div>
            <button
              type="button"
              onClick={addEmptyRow}
              className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer shrink-0 shadow-xs flex items-center justify-center gap-1.5"
            >
              <Plus size={16} /> Add Product Row
            </button>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3.5 min-w-[280px]">Select Product</th>
                  <th className="p-3.5 text-center w-28">Stock</th>
                  <th className="p-3.5 w-32">Quantity</th>
                  <th className="p-3.5 w-32">Unit Cost ({currencySymbol})</th>
                  <th className="p-3.5 w-32">Commission ({currencySymbol})</th>
                  <th className="p-3.5 text-right w-36">Line Total</th>
                  <th className="p-3.5 text-center w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-800 dark:text-neutral-200">
                {items.map((row) => {
                  const lineTotal = row.productId
                    ? Math.max(0, row.quantity * row.unitCost - (row.commission || 0))
                    : 0;

                  return (
                    <tr
                      key={row.rowId}
                      className={highlightedRowId === row.rowId ? "bg-emerald-50 dark:bg-emerald-950/40" : ""}
                    >
                      <td className="p-3">
                        <select
                          value={row.productId}
                          onChange={(e) => updateRow(row.rowId, "productId", e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none cursor-pointer"
                        >
                          <option value="">-- Choose Product from List --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.barcode})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                          {row.stock} {row.unit}
                        </span>
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={row.quantity}
                          onChange={(e) => updateRow(row.rowId, "quantity", Number(e.target.value))}
                          className="w-20 px-2 py-1 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none bg-white dark:bg-neutral-800 text-center font-bold"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={row.unitCost}
                          onChange={(e) => updateRow(row.rowId, "unitCost", Number(e.target.value))}
                          className="w-24 px-2 py-1 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none bg-white dark:bg-neutral-800 text-center font-bold"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          step="0.01"
                          value={row.commission}
                          onChange={(e) => updateRow(row.rowId, "commission", Number(e.target.value))}
                          className="w-20 px-2 py-1 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none bg-white dark:bg-neutral-800 text-center"
                        />
                      </td>
                      <td className="p-3 text-right font-bold text-xs">
                        {currencySymbol}{lineTotal.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeRow(row.rowId)}
                          className="p-1 rounded text-neutral-400 hover:text-red-600 transition cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Card with 5-Line Math */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none"
              >
                <option value="cash">ক্যাশ ড্রয়ার (Cash Drawer)</option>
                <option value="bank">ব্যাংক একাউন্ট (Bank Account)</option>
                <option value="bkash">বিকাশ মার্চেন্ট (bKash)</option>
                <option value="nagad">নগদ (Nagad)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Notes / Memo Details
              </label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs space-y-3 text-xs">
            <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
              <span>Subtotal:</span>
              <strong className="text-neutral-900 dark:text-neutral-100">{currencySymbol}{subtotal.toFixed(2)}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span>Discount (-):</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-28 px-2.5 py-1 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none text-right font-bold bg-white dark:bg-neutral-800"
              />
            </div>
            <div className="flex justify-between items-center">
              <span>Transport / Freight (+):</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={transportCost}
                onChange={(e) => setTransportCost(Number(e.target.value))}
                className="w-28 px-2.5 py-1 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none text-right font-bold bg-white dark:bg-neutral-800"
              />
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-neutral-200 dark:border-neutral-800 text-sm font-bold text-neutral-900 dark:text-neutral-100">
              <span>Invoice Total (চালান মূল্য):</span>
              <span className="text-blue-600 dark:text-blue-400">{currencySymbol}{grandTotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center p-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 font-semibold">
              <span>Previous Due (পূর্বের বাকি):</span>
              <span>{currencySymbol}{supplierPreviousDue.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t-2 border-neutral-200 dark:border-neutral-800 text-base font-extrabold text-neutral-900 dark:text-neutral-100">
              <span>Net Total Payable (সর্বমোট দেয়):</span>
              <span>{currencySymbol}{netTotalPayable.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="font-bold text-neutral-800 dark:text-neutral-200">Paid Amount:</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
                className="w-32 px-2.5 py-1 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none text-right font-extrabold text-emerald-600 bg-white dark:bg-neutral-800"
              />
            </div>

            <div className="flex justify-between items-center p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-bold text-sm">
              <span>Current Due (বর্তমান বাকি):</span>
              <span>{currencySymbol}{currentDue.toFixed(2)}</span>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading || items.filter((i) => i.productId).length === 0}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Update Purchase &amp; Sync Ledger
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
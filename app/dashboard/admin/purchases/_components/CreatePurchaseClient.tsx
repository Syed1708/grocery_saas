// app/dashboard/admin/purchases/create/_components/CreatePurchaseClient.tsx
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
import { createPurchaseAction } from "@/app/actions/purchase-actions";

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
  productId: string; // Empty string "" represents a blank row
  name: string;
  barcode: string;
  unit: string;
  stock: number;
  quantity: number;
  unitCost: number;
  commission: number;
}

export default function CreatePurchaseClient({
  products,
  suppliers,
  activeBranchName,
  currencySymbol = "৳",
  autoChalan,
}: {
  products: ProductItem[];
  suppliers: SupplierItem[];
  activeBranchName: string;
  currencySymbol?: string;
  autoChalan: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 1. Supplier Dual Selector State
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [supplierSearchQuery, setSupplierSearchQuery] = useState("");
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [supplierPreviousDue, setSupplierPreviousDue] = useState(0);

  // 2. Chalan Meta Details State
  const [chalanNo, setChalanNo] = useState(autoChalan);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);

  // 3. Barcode & Product Live Search
  const [barcodeSearch, setBarcodeSearch] = useState("");
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);

  // 4. Initial Rows State (Starts with 1 blank row ready for selection)
  const [items, setItems] = useState<PurchaseRow[]>([
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

  // 5. Payment & Financial Summary State
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState<number>(0);
  const [transportCost, setTransportCost] = useState<number>(0);
  const [vatPercent, setVatPercent] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  function handleSelectSupplier(supplier: SupplierItem) {
    setSelectedSupplierId(supplier.id);
    setSupplierSearchQuery(`${supplier.name} (${supplier.phone || supplier.companyName || "Vendor"})`);
    const due = Number(supplier.currentDue ?? supplier.payableBalance ?? 0);
    setSupplierPreviousDue(due);
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

  // 👈 FIX: Appends a completely BLANK row with no product pre-selected
  function addEmptyRow() {
    const newBlankRow: PurchaseRow = {
      rowId: `row-${Date.now()}-${Math.random()}`,
      productId: "", // Empty: user will choose from the select dropdown
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

  // Adding via Barcode Scanner or Autocomplete
  function addOrIncrementProduct(product: ProductItem) {
    // 1. If already exists in table -> increment quantity by 1
    const existingIndex = items.findIndex(
      (i) => i.productId && i.productId === product.id
    );

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
      // 2. If a blank row is available, fill that blank row instead of adding a new one
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
        // 3. Otherwise append new populated row
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

      const matched = products.find(
        (p) => p.barcode.toLowerCase() === code.toLowerCase()
      );

      if (matched) {
        addOrIncrementProduct(matched);
      } else {
        toast.error(`Barcode "${code}" not found in catalog.`);
      }
    }
  }

  // 👈 Updates row when user chooses product from dropdown or changes Qty/Cost
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
      // If only 1 row left, reset it to blank instead of leaving an empty table
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
      if (!item.productId) return sum; // Ignore blank rows
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

  // Submit Handler
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedSupplierId) {
      toast.error("Please select a supplier.");
      return;
    }

    if (!chalanNo.trim()) {
      toast.error("Please enter a chalan / memo number.");
      return;
    }

    // 👈 Filter out any empty/unselected rows before submitting
    const validItems = items.filter((i) => i.productId && i.productId.trim() !== "");

    if (validItems.length === 0) {
      toast.error("Please select at least one product for this purchase.");
      return;
    }

    setLoading(true);

    const payload = {
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

    const res = await createPurchaseAction(payload);
    setLoading(false);

    if (res.success) {
      toast.success("Purchase recorded & branch stock incremented successfully!");
      router.push("/dashboard/admin/purchases");
      router.refresh();
    } else {
      toast.error(res.error || "Failed to record purchase.");
    }
  }

  return (
    <div className="space-y-6 pb-16">
      <Breadcrumbs
        items={[
          { label: "Purchases & Procurement", href: "/dashboard/admin/purchases" },
          { label: "New Stock-In Entry" },
        ]}
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight flex items-center gap-2">
            <Receipt className="text-blue-600" size={22} />
            New Purchase / Stock-In (পণ্য ক্রয় ও চালান এন্ট্রি)
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Search supplier, scan barcodes, and restock inventory directly to this branch
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
        {/* ========================================================= */}
        {/* 1. DUAL SUPPLIER SELECTOR & CHALAN META                   */}
        {/* ========================================================= */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* LEFT: AJAX Live Search */}
            <div className="relative">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                🔍 Option 1: Search Supplier (নাম বা ফোন দিয়ে সার্চ)
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
                  placeholder="Type name, company, or phone..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Suggestions Popup */}
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
                        <span className="text-[11px] text-neutral-500">{s.companyName || "Vendor"} • {s.phone}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        Number(s.currentDue ?? s.payableBalance) > 0
                          ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                      }`}>
                        Due: {currencySymbol}{Number(s.currentDue ?? s.payableBalance ?? 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: Dropdown Selector */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                📋 Option 2: Or Select Supplier from Dropdown <span className="text-red-500">*</span>
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

          {/* Meta Details Row */}
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
                placeholder="e.g. CHAL-8902"
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
                className="w-full px-3 py-2 text-xs font-semibold bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. BARCODE SCANNER & FAST SEARCH CARD                    */}
        {/* ========================================================= */}
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
                placeholder="Scan Barcode with Gun or type product name/SKU and press Enter..."
                className="w-full px-4 py-2.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-neutral-100 shadow-xs"
              />

              {/* Suggestions Popup */}
              {showProductSuggestions && filteredProducts.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-700">
                  {filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => addOrIncrementProduct(p)}
                      className="p-3 text-xs flex justify-between items-center hover:bg-neutral-50 dark:hover:bg-neutral-700/60 cursor-pointer"
                    >
                      <div>
                        <strong className="text-neutral-900 dark:text-neutral-100 block">{p.name}</strong>
                        <span className="font-mono text-[11px] text-neutral-400">({p.barcode})</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-blue-600 block">{currencySymbol}{p.costPrice.toFixed(2)}</span>
                        <span className="text-[10px] text-neutral-400">Stock: {p.stockQuantity} {p.unitCode}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 👈 FIX: Adds a blank row without selecting first product or incrementing */}
            <button
              type="button"
              onClick={addEmptyRow}
              className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer shrink-0 shadow-xs flex items-center justify-center gap-1.5"
            >
              <Plus size={16} /> Add Product Row
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. PURCHASED ITEMS TABLE                                 */}
        {/* ========================================================= */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
            <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              Purchased Items List
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              {items.filter((i) => i.productId).length} Selected Items
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3.5 min-w-70">Select Product</th>
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
                  const isHighlighted = highlightedRowId === row.rowId;

                  return (
                    <tr
                      key={row.rowId}
                      className={`transition-colors ${
                        isHighlighted
                          ? "bg-emerald-50 dark:bg-emerald-950/40"
                          : "hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40"
                      }`}
                    >
                      {/* Product Selector with Default Blank Option */}
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
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            required
                            value={row.quantity}
                            onChange={(e) => updateRow(row.rowId, "quantity", Number(e.target.value))}
                            className="w-20 px-2 py-1 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none bg-white dark:bg-neutral-800 text-center font-bold"
                          />
                          <span className="text-[11px] text-neutral-400">{row.unit}</span>
                        </div>
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

        {/* ========================================================= */}
        {/* 4. PRICING, TAXES & DUES CALCULATOR                       */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left: Payment details */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="cash">ক্যাশ ড্রয়ার (Cash Drawer)</option>
                <option value="bank">ব্যাংক একাউন্ট (Bank Account)</option>
                <option value="bkash">বিকাশ মার্চেন্ট (bKash)</option>
                <option value="nagad">নগদ (Nagad)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Notes / Special Instructions
              </label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="চালানের বিশেষ মন্তব্য..."
                className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Right: Summary Calculator */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs space-y-3 text-xs">
            <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
              <span>Total Quantity (মোট পরিমাণ):</span>
              <strong className="text-neutral-900 dark:text-neutral-100">{totalQuantity.toFixed(2)}</strong>
            </div>

            <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
              <span>Subtotal:</span>
              <strong className="text-neutral-900 dark:text-neutral-100">{currencySymbol}{subtotal.toFixed(2)}</strong>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-neutral-600 dark:text-neutral-400">Discount (-):</span>
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
              <span className="text-neutral-600 dark:text-neutral-400">Labor / Freight (+):</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={transportCost}
                onChange={(e) => setTransportCost(Number(e.target.value))}
                className="w-28 px-2.5 py-1 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none text-right font-bold bg-white dark:bg-neutral-800"
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-neutral-600 dark:text-neutral-400">VAT / Tax Rate (%):</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={vatPercent}
                  onChange={(e) => setVatPercent(Number(e.target.value))}
                  className="w-16 px-2 py-1 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none text-right font-bold bg-white dark:bg-neutral-800"
                />
                <span className="text-[11px] text-neutral-400">({currencySymbol}{vatAmount.toFixed(2)})</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-neutral-200 dark:border-neutral-800 text-sm font-bold text-neutral-900 dark:text-neutral-100">
              <span>Invoice Total (চালান মূল্য):</span>
              <span className="text-blue-600 dark:text-blue-400">{currencySymbol}{grandTotal.toFixed(2)}</span>
            </div>

            {/* Previous Due Row */}
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
                className="w-32 px-2.5 py-1 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none text-right font-extrabold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-neutral-800"
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
                Complete Purchase &amp; Stock-In
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
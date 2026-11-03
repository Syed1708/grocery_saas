"use client";
"use no memo"; // 👈 Required for React 19 compiler safety

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createPurchaseAction,
  updatePurchaseAction,
} from "@/app/actions/purchase-actions";

export interface PurchaseRow {
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

export function usePurchaseForm({
  mode = "create",
  initialData,
  products = [],
  suppliers = [],
  autoChalan = "",
  onFocusBarcode,
}: {
  mode?: "create" | "edit";
  initialData?: any;
  products: any[];
  suppliers: any[];
  autoChalan?: string;
  onFocusBarcode?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

// 1. Supplier state (Direct lazy initialization without cascading renders)
  const [selectedSupplierId, setSelectedSupplierId] = useState(
    initialData?.supplierId || ""
  );

  const [supplierSearchQuery, setSupplierSearchQuery] = useState<string>(() => {
    if (!initialData?.supplierId) return "";
    const s = suppliers.find((sup) => sup.id === initialData.supplierId);
    return s ? `${s.name} (${s.companyName || "Vendor"})` : "";
  });

  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  const [supplierPreviousDue, setSupplierPreviousDue] = useState<number>(() => {
    if (initialData?.previousDue !== undefined && initialData?.previousDue !== null) {
      return Number(initialData.previousDue);
    }
    if (initialData?.supplierId) {
      const s = suppliers.find((sup) => sup.id === initialData.supplierId);
      return Number(s?.currentDue ?? 0);
    }
    return 0;
  });

  // Chalan Meta state
  const [chalanNo, setChalanNo] = useState(initialData?.chalanNo || autoChalan);
  const [purchaseDate, setPurchaseDate] = useState(
    initialData?.purchaseDate
      ? new Date(initialData.purchaseDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
  );

  // Barcode & Product search
  const [barcodeSearch, setBarcodeSearch] = useState("");
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);

  // Inside app/dashboard/admin/purchases/_components/form/usePurchaseForm.ts

  // Add this state inside usePurchaseForm:
  const [filterBySupplier, setFilterBySupplier] = useState<boolean>(true);

  // 1. Resolve currently selected supplier object
  const selectedSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === selectedSupplierId) || null;
  }, [suppliers, selectedSupplierId]);

  // 2. Extract brand keywords from supplier (e.g. "PRAN", "Unilever", "Square", "Akij", "Fresh", "Nestle")
  const supplierKeywords = useMemo(() => {
    if (!selectedSupplier) return [];
    const text =
      `${selectedSupplier.companyName || ""} ${selectedSupplier.name || ""}`.toLowerCase();

    // Clean punctuation and common distributor words
    const words = text
      .replace(/[(),.\-—]/g, " ")
      .split(/\s+/)
      .filter(
        (w) =>
          w.length >= 3 &&
          ![
            "ltd",
            "limited",
            "distribution",
            "distributor",
            "supply",
            "enterprise",
            "foods",
          ].includes(w),
      );

    return words;
  }, [selectedSupplier]);

  // 3. Filter products matching this company's brands
  const supplierFilteredProducts = useMemo(() => {
    // If toggle is OFF or no supplier selected, show all products
    if (
      !filterBySupplier ||
      !selectedSupplier ||
      supplierKeywords.length === 0
    ) {
      return products;
    }

    const matched = products.filter((p) => {
      const brandName = (p.brand?.name || p.brandName || "").toLowerCase();
      const productName = (p.name || "").toLowerCase();
      const productEn = (p.nameEn || "").toLowerCase();

      // Check if product brand or name matches any supplier keyword
      return supplierKeywords.some(
        (kw) =>
          brandName.includes(kw) ||
          productName.includes(kw) ||
          productEn.includes(kw),
      );
    });

    // Fallback: If no products match this vendor yet, gracefully show all products
    return matched.length > 0 ? matched : products;
  }, [products, filterBySupplier, selectedSupplier, supplierKeywords]);

  // 4. Update Barcode/Search to search strictly within this company's products
  const filteredProducts = useMemo(() => {
    if (!barcodeSearch.trim()) return [];
    const q = barcodeSearch.toLowerCase().trim();

    // Searches within supplierFilteredProducts
    return supplierFilteredProducts.filter(
      (p) =>
        p.barcode?.toLowerCase() === q ||
        p.name?.toLowerCase().includes(q) ||
        p.nameEn?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q),
    );
  }, [supplierFilteredProducts, barcodeSearch]);

  // 5. Update handleBarcodeKeyDown to match within company products first
  function handleBarcodeKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = barcodeSearch.trim().toLowerCase();
      if (!code) return;

      // Search in supplier catalog first, fallback to all products
      const matched =
        supplierFilteredProducts.find(
          (p) =>
            p.barcode?.toLowerCase() === code ||
            p.sku?.toLowerCase() === code ||
            p.name?.toLowerCase() === code,
        ) ||
        products.find(
          (p) =>
            p.barcode?.toLowerCase() === code ||
            p.sku?.toLowerCase() === code ||
            p.name?.toLowerCase() === code,
        );

      if (matched) {
        addOrIncrementProduct(matched);
      } else {
        toast.error(`পণ্য বা বারকোড "${code}" পাওয়া যায়নি।`);
      }
    }
  }
  // Initial Rows
  const [items, setItems] = useState<PurchaseRow[]>(() => {
    if (initialData?.items && initialData.items.length > 0) {
      return initialData.items.map((it: any) => ({
        rowId: `row-${it.id || it.productId}`,
        productId: it.productId,
        name: it.productName || it.name || it.product?.name,
        barcode: it.barcode || it.product?.barcode || "",
        unit: it.unitCode || it.unit || it.product?.unit?.shortCode || "pcs",
        stock: it.stock || it.product?.stocks?.[0]?.quantity || 0,
        quantity: Number(it.quantity),
        unitCost: Number(it.unitCost),
        commission: Number(it.commission || 0),
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

  // Financial States
  const [paymentMethod, setPaymentMethod] = useState(
    initialData?.paymentMethod || "cash",
  );
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [discount, setDiscount] = useState<number>(
    Number(initialData?.discount || 0),
  );
  const [transportCost, setTransportCost] = useState<number>(
    Number(initialData?.transportCost || 0),
  );
  const [vatPercent, setVatPercent] = useState<number>(
    Number(initialData?.vatPercent || 0),
  );
  const [paidAmount, setPaidAmount] = useState<number>(
    Number(initialData?.paidAmount || 0),
  );

  const sanitizeNumber = (val: any) => Math.max(0, Number(val) || 0);

  // Auto-focus barcode on mount
  useEffect(() => {
    onFocusBarcode?.();
  }, [onFocusBarcode]);


 

  function handleSelectSupplier(supplier: any) {
    setSelectedSupplierId(supplier.id);
    setSupplierSearchQuery(
      `${supplier.name} (${supplier.phone || supplier.companyName || "Vendor"})`,
    );
    setSupplierPreviousDue(Number(supplier.currentDue ?? 0));
    setShowSupplierDropdown(false);
  }

  function addEmptyRow() {
    setItems((prev) => [
      ...prev,
      {
        rowId: `row-${Date.now()}-${Math.random()}`,
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
  }

  function addOrIncrementProduct(product: any) {
    const existingIndex = items.findIndex(
      (i) => i.productId && i.productId === product.id,
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
      const blankIndex = items.findIndex((i) => !i.productId);
      if (blankIndex > -1) {
        setItems((prev) => {
          const next = [...prev];
          next[blankIndex] = {
            ...next[blankIndex],
            productId: product.id,
            name: product.name,
            barcode: product.barcode,
            unit: product.unitCode || product.unit?.shortCode || "pcs",
            stock: product.stockQuantity || product.stock || 0,
            quantity: 1,
            unitCost: Number(product.costPrice ?? product.purchasePrice ?? 0),
            commission: 0,
          };
          return next;
        });
        setHighlightedRowId(items[blankIndex].rowId);
        setTimeout(() => setHighlightedRowId(null), 600);
      } else {
        setItems((prev) => [
          ...prev,
          {
            rowId: `row-${Date.now()}-${Math.random()}`,
            productId: product.id,
            name: product.name,
            barcode: product.barcode,
            unit: product.unitCode || product.unit?.shortCode || "pcs",
            stock: product.stockQuantity || product.stock || 0,
            quantity: 1,
            unitCost: Number(product.costPrice ?? product.purchasePrice ?? 0),
            commission: 0,
          },
        ]);
      }
    }
    setBarcodeSearch("");
    setShowProductSuggestions(false);
    onFocusBarcode?.();
  }

  function updateRow(rowId: string, field: keyof PurchaseRow, value: any) {
    setItems((prev) =>
      prev.map((r) => {
        if (r.rowId !== rowId) return r;
        if (field === "productId") {
          const selected = products.find((p) => p.id === value);
          if (!selected)
            return {
              ...r,
              productId: "",
              name: "",
              barcode: "",
              stock: 0,
              unitCost: 0,
            };
          return {
            ...r,
            productId: selected.id,
            name: selected.name,
            barcode: selected.barcode,
            unit: selected.unitCode || selected.unit?.shortCode || "pcs",
            stock: selected.stockQuantity || selected.stock || 0,
            unitCost: Number(selected.costPrice ?? selected.purchasePrice ?? 0),
          };
        }
        return { ...r, [field]: value };
      }),
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

  // Reactive Math
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      if (!item.productId) return sum;
      return (
        sum +
        Math.max(
          0,
          Number(item.quantity) * Number(item.unitCost) -
            Number(item.commission || 0),
        )
      );
    }, 0);
  }, [items]);

  const totalQuantity = useMemo(() => {
    return items.reduce(
      (sum, item) =>
        item.productId ? sum + (Number(item.quantity) || 0) : sum,
      0,
    );
  }, [items]);

  const baseAmount = Math.max(0, subtotal - discount);
  const vatAmount = Math.round(((baseAmount * vatPercent) / 100) * 100) / 100;
  const grandTotal =
    Math.round((baseAmount + transportCost + vatAmount) * 100) / 100;
  const chalanDue = Math.max(0, grandTotal - paidAmount);
  const netTotalPayable = grandTotal + supplierPreviousDue;
  const finalSupplierBalance = Math.max(0, netTotalPayable - paidAmount);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSupplierId) return toast.error("সরবরাহকারী নির্বাচন করুন।");
    if (!chalanNo.trim()) return toast.error("চালান নম্বর লিখুন।");

    const validItems = items.filter(
      (i) => i.productId && i.productId.trim() !== "",
    );
    if (validItems.length === 0)
      return toast.error("অন্তত একটি পণ্য সিলেক্ট করুন।");

    setLoading(true);

    const payload = {
      ...(mode === "edit" ? { id: initialData.id } : {}),
      supplierId: selectedSupplierId,
      chalanNo: chalanNo.trim(),
      purchaseDate,
      paymentMethod,
      paidAmount: sanitizeNumber(paidAmount),
      discount: sanitizeNumber(discount),
      transportCost: sanitizeNumber(transportCost),
      vatPercent: sanitizeNumber(vatPercent),
      notes,
      items: validItems.map((i) => ({
        productId: i.productId,
        quantity: sanitizeNumber(i.quantity),
        unitCost: sanitizeNumber(i.unitCost),
        commission: sanitizeNumber(i.commission),
      })),
    };

    const res =
      mode === "edit"
        ? await updatePurchaseAction(payload as any)
        : await createPurchaseAction(payload);
    setLoading(false);

    if (res.success) {
      toast.success(
        mode === "edit"
          ? "চালান আপডেট সম্পন্ন হয়েছে!"
          : "পণ্য ক্রয় ও স্টক সম্পন্ন হয়েছে!",
      );
      router.push("/dashboard/admin/purchases");
      router.refresh();
    } else {
      toast.error(res.error || "অপারেশন ব্যর্থ হয়েছে।");
    }
  }

  return {
    items,
    subtotal,
    totalQuantity,
    grandTotal,
    chalanDue,
    netTotalPayable,
    finalSupplierBalance,
    selectedSupplierId,
    setSelectedSupplierId,
    supplierSearchQuery,
    setSupplierSearchQuery,
    showSupplierDropdown,
    setShowSupplierDropdown,
    supplierPreviousDue,
    handleSelectSupplier,
    chalanNo,
    setChalanNo,
    purchaseDate,
    setPurchaseDate,
    barcodeSearch,
    setBarcodeSearch,
    showProductSuggestions,
    setShowProductSuggestions,
    highlightedRowId,
    addEmptyRow,
    selectedSupplier,
    filterBySupplier,
    setFilterBySupplier,
    supplierFilteredProducts, // 👈 Used by table dropdowns & search
    filteredProducts,
    handleBarcodeKeyDown,
    addOrIncrementProduct,
    updateRow,
    removeRow,
    paymentMethod,
    setPaymentMethod,
    notes,
    setNotes,
    discount,
    setDiscount,
    transportCost,
    setTransportCost,
    vatPercent,
    setVatPercent,
    paidAmount,
    setPaidAmount,
    sanitizeNumber,
    loading,
    handleSubmit,
  };
}

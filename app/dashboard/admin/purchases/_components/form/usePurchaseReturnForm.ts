"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ReturnReason, ReturnSettlementType } from "@/types/purchase-return";
import { createPurchaseReturnAction } from "@/app/actions/purchase-return-actions";

export interface ReturnRow {
  rowId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  availableStock: number;
  reason: ReturnReason;
  lineTotal: number;
}

interface Props {
  products: any[];
  suppliers: any[];
  onFocusBarcode?: () => void;
}

export function usePurchaseReturnForm({ products = [], suppliers = [], onFocusBarcode }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Supplier state
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [supplierSearchQuery, setSupplierSearchQuery] = useState("");
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [filterBySupplier, setFilterBySupplier] = useState(true);

  // Form details
  const [returnDate, setReturnDate] = useState(new Date().toISOString().slice(0, 10));
  const [referenceChalan, setReferenceChalan] = useState("");
  const [items, setItems] = useState<ReturnRow[]>([]);

  // Settlement
  const [settlementType, setSettlementType] = useState<ReturnSettlementType>("DUE_DEDUCTION");
  const [refundAmount, setRefundAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");

  // Product search
  const [barcodeSearch, setBarcodeSearch] = useState("");
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.id === selectedSupplierId),
    [suppliers, selectedSupplierId]
  );

  const supplierPreviousDue = Number(selectedSupplier?.currentDue || 0);

  const supplierFilteredProducts = useMemo(() => {
    if (!filterBySupplier || !selectedSupplierId) return products;
    return products.filter((p) => !p.supplierId || p.supplierId === selectedSupplierId);
  }, [products, filterBySupplier, selectedSupplierId]);

  const filteredProducts = useMemo(() => {
    if (!barcodeSearch.trim()) return [];
    const q = barcodeSearch.toLowerCase();
    return supplierFilteredProducts.filter(
      (p) => p.name?.toLowerCase().includes(q) || p.barcode?.toLowerCase().includes(q)
    );
  }, [supplierFilteredProducts, barcodeSearch]);

  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    [items]
  );

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0),
    [items]
  );

  // Settlement math
  const dueDeduction = useMemo(() => {
    if (settlementType === "CASH_REFUND") return 0;
    return Math.max(0, totalAmount - refundAmount);
  }, [settlementType, totalAmount, refundAmount]);

  const finalSupplierDue = Math.max(0, supplierPreviousDue - dueDeduction);

  const sanitizeNumber = (val: any) => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  const addOrIncrementProduct = (product: any) => {
    const cost = Number(product.costPrice ?? product.purchasePrice ?? 0);
    const stock = Number(product.stockQuantity ?? product.stock ?? 0);

    setItems((prev) => {
      const idx = prev.findIndex((i) => i.productId === product.id);
      if (idx > -1) {
        const next = [...prev];
        const newQty = next[idx].quantity + 1;
        if (newQty > stock) {
          toast.warning(`স্টকের বেশি ফেরত দেওয়া সম্ভব নয়! বর্তমান স্টক: ${stock}`);
          return prev;
        }
        next[idx].quantity = newQty;
        next[idx].lineTotal = newQty * next[idx].unitCost;
        return next;
      }
      return [
        ...prev,
        {
          rowId: `row-${Date.now()}-${Math.random()}`,
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitCost: cost,
          availableStock: stock,
          reason: "DAMAGED",
          lineTotal: cost,
        },
      ];
    });

    setBarcodeSearch("");
    setShowProductSuggestions(false);
    onFocusBarcode?.();
  };

  const addEmptyRow = () => {
    setItems((prev) => [
      ...prev,
      {
        rowId: `row-${Date.now()}`,
        productId: "",
        productName: "",
        quantity: 1,
        unitCost: 0,
        availableStock: 0,
        reason: "DAMAGED",
        lineTotal: 0,
      },
    ]);
  };

  const updateRow = (rowId: string, patch: Partial<ReturnRow>) => {
    setItems((prev) =>
      prev.map((row) => {
        if (row.rowId !== rowId) return row;
        const updated = { ...row, ...patch };
        if (patch.productId) {
          const p = products.find((x) => x.id === patch.productId);
          if (p) {
            updated.productName = p.name;
            updated.unitCost = Number(p.costPrice ?? p.purchasePrice ?? 0);
            updated.availableStock = Number(p.stockQuantity ?? p.stock ?? 0);
          }
        }
        updated.lineTotal = (Number(updated.quantity) || 0) * (Number(updated.unitCost) || 0);
        return updated;
      })
    );
  };

  const removeRow = (rowId: string) => {
    setItems((prev) => prev.filter((r) => r.rowId !== rowId));
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredProducts.length === 1) {
        addOrIncrementProduct(filteredProducts[0]);
      }
    }
  };

  const handleSelectSupplier = (s: any) => {
    setSelectedSupplierId(s.id);
    setShowSupplierDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      toast.error("অনুগ্রহ করে সরবরাহকারী নির্বাচন করুন।");
      return;
    }
    const validItems = items.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      toast.error("কমপক্ষে একটি ফেরত পণ্য যুক্ত করুন।");
      return;
    }

    setLoading(true);
    const res = await createPurchaseReturnAction({
      supplierId: selectedSupplierId,
      returnDate,
      settlementType,
      refundAmount,
      paymentMethod,
      notes,
      items: validItems.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitCost: i.unitCost,
        reason: i.reason,
      })),
    });
    setLoading(false);

    if (res.success) {
      toast.success(`পণ্য ফেরত ভাউচার #${res.returnNo} সফলভাবে তৈরি হয়েছে!`);
      router.push("/dashboard/admin/purchases");
    } else {
      toast.error(res.error || "পণ্য ফেরত সম্পন্ন করা যায়নি।");
    }
  };

  return {
    loading,
    selectedSupplierId,
    selectedSupplier,
    supplierPreviousDue,
    supplierSearchQuery,
    setSupplierSearchQuery,
    showSupplierDropdown,
    setShowSupplierDropdown,
    handleSelectSupplier,
    filterBySupplier,
    setFilterBySupplier,
    supplierFilteredProducts,
    returnDate,
    setReturnDate,
    referenceChalan,
    setReferenceChalan,
    items,
    totalQuantity,
    totalAmount,
    settlementType,
    setSettlementType,
    refundAmount,
    setRefundAmount,
    paymentMethod,
    setPaymentMethod,
    dueDeduction,
    finalSupplierDue,
    notes,
    setNotes,
    barcodeSearch,
    setBarcodeSearch,
    showProductSuggestions,
    setShowProductSuggestions,
    filteredProducts,
    addOrIncrementProduct,
    addEmptyRow,
    updateRow,
    removeRow,
    handleBarcodeKeyDown,
    handleSubmit,
    sanitizeNumber,
  };
}
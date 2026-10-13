"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { toast } from "sonner";
import { checkoutAction } from "@/app/actions/sale-actions";

export interface PosProduct {
  id: string;
  name: string;
  nameEn?: string | null;
  barcode: string;
  unitPrice: number;
  costPrice: number;
  unitId: string;
  unitCode: string;
  categoryId: string;
  categoryName: string;
  stockAvailable: number;
  alertQuantity?: number;
}

export interface PosCartItem extends PosProduct {
  quantity: number;
  lineTotal: number;
}

export function usePosCart(
  products: PosProduct[],
  customers: any[],
  shop: any,
  cashierName: string,
  branchName: string
) {
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [discount, setDiscount] = useState(0);

  // Payment states
  const [showSplitPay, setShowSplitPay] = useState(false);
  const [cashPaid, setCashPaid] = useState<number>(0);
  const [bkashPaid, setBkashPaid] = useState<number>(0);
  const [bankPaid, setBankPaid] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Modals
  const [quickCustomerModalOpen, setQuickCustomerModalOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<any | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Selected customer info
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.lineTotal, 0);
  }, [cart]);

  const vatPercent = shop?.enableVat ? Number(shop.vatPercent || 0) : 0;
  const baseAmount = Math.max(0, subtotal - discount);
  const vatAmount = (baseAmount * vatPercent) / 100;
  const grandTotal = Math.round((baseAmount + vatAmount) * 100) / 100;

  const totalPaid = (cashPaid || 0) + (bkashPaid || 0) + (bankPaid || 0);
  const dueAmount = Math.max(0, grandTotal - totalPaid);
  const changeAmount = Math.max(0, totalPaid - grandTotal);

  // Add Item to Cart
  function addToCart(product: PosProduct) {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                lineTotal: (item.quantity + 1) * item.unitPrice,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          ...product,
          quantity: 1,
          lineTotal: product.unitPrice,
        },
      ];
    });
  }

  function updateQty(productId: string, newQty: number) {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId
          ? { ...item, quantity: newQty, lineTotal: newQty * item.unitPrice }
          : item
      )
    );
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  }

  function clearCart() {
    setCart([]);
    setDiscount(0);
    setCashPaid(0);
    setBkashPaid(0);
    setBankPaid(0);
    setShowSplitPay(false);
  }

  // Quick Cash Handlers
  function setQuickCash(amount: number) {
    setCashPaid(amount);
  }

  function setExactCash() {
    setCashPaid(grandTotal);
    setBkashPaid(0);
    setBankPaid(0);
  }

  // Barcode Gun Enter
  function handleBarcodeSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.trim().toLowerCase();
    const match = products.find(
      (p) =>
        p.barcode.toLowerCase() === query ||
        p.name.toLowerCase().includes(query) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(query))
    );

    if (match) {
      addToCart(match);
      setSearchQuery("");
      toast.success(`যোগ করা হয়েছে: ${match.name}`);
    } else {
      toast.error(`কোন পণ্য পাওয়া যায়নি: "${searchQuery}"`);
    }
  }

  // Submit Sale Action
  async function submitSale() {
    if (cart.length === 0) {
      toast.error("কার্ট বর্তমানে খালি!");
      return;
    }

    if (dueAmount > 0 && !selectedCustomerId) {
      toast.error("বাকি বিক্রয়ের ক্ষেত্রে কাস্টমার নির্বাচন করা বাধ্যতামূলক!");
      return;
    }

    setLoading(true);

    const res = await checkoutAction({
      customerId: selectedCustomerId || null,
      items: cart.map((i) => ({
        productId: i.id,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        unitId: i.unitId,
      })),
      discount,
      vatPercent,
      cashPaid,
      bkashPaid,
      bankPaid,
    });

    setLoading(false);

    if (res.success) {
      toast.success("বিক্রয় সফল হয়েছে!");

      setCompletedSale({
        invoiceNo: res.invoiceNo,
        date: new Date(),
        items: [...cart],
        subtotal,
        discount,
        vatAmount,
        grandTotal,
        paidAmount: totalPaid,
        changeAmount,
        dueAmount,
        customer: selectedCustomer,
        cashierName,
        branchName,
      });

      clearCart();
    } else {
      toast.error(res.error || "বিক্রয় সম্পন্ন করা যায়নি।");
    }
  }

  // Global Keyboard Shortcuts ([F2] Complete Sale, [/] Scan Barcode)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "F2") {
        e.preventDefault();
        submitSale();
      } else if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, grandTotal, totalPaid, selectedCustomerId]);

  return {
    cart,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    selectedCustomerId,
    setSelectedCustomerId,
    selectedCustomer,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    discount,
    setDiscount,
    showSplitPay,
    setShowSplitPay,
    cashPaid,
    setCashPaid,
    bkashPaid,
    setBkashPaid,
    bankPaid,
    setBankPaid,
    subtotal,
    vatPercent,
    vatAmount,
    grandTotal,
    totalPaid,
    dueAmount,
    changeAmount,
    setQuickCash,
    setExactCash,
    handleBarcodeSubmit,
    submitSale,
    loading,
    quickCustomerModalOpen,
    setQuickCustomerModalOpen,
    completedSale,
    setCompletedSale,
    barcodeInputRef,
  };
}
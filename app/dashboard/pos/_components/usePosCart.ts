"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { toast } from "sonner";
import { checkoutAction } from "@/app/actions/sale-actions";
import { IPosProduct, IPosCustomer, IPosShopConfig, ISaleCartItem, ICompletedSale } from "@/types/sale";

export function usePosCart(
  products: IPosProduct[],
  customers: IPosCustomer[],
  shop: IPosShopConfig,
  cashierName: string,
  branchName: string
) {
  const [cart, setCart] = useState<ISaleCartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [discount, setDiscount] = useState<number>(0);

  const [showSplitPay, setShowSplitPay] = useState(false);
  const [cashPaid, setCashPaid] = useState<number>(0);
  const [bkashPaid, setBkashPaid] = useState<number>(0);
  const [bankPaid, setBankPaid] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const [quickCustomerModalOpen, setQuickCustomerModalOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<ICompletedSale | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.lineTotal, 0);
  }, [cart]);

  const vatPercent = shop.enableVat ? Number(shop.vatPercent || 0) : 0;
  const baseAmount = Math.max(0, subtotal - discount);
  const vatAmount = Math.round(((baseAmount * vatPercent) / 100) * 100) / 100;
  const grandTotal = Math.round((baseAmount + vatAmount) * 100) / 100;

  const totalPaid = (cashPaid || 0) + (bkashPaid || 0) + (bankPaid || 0);
  const dueAmount = Math.max(0, grandTotal - totalPaid);
  const changeAmount = Math.max(0, totalPaid - grandTotal);

  function addToCart(product: IPosProduct) {
    const available = Number(product.stockAvailable ?? 0);
    if (available <= 0) {
      toast.error(`"${product.name}" এর স্টক নেই!`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity + 1 > available) {
          toast.warning(`স্টক সীমাবদ্ধ! সর্বোচ্চ মজুদ: ${available} ${product.unitCode}`);
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                lineTotal: Math.round((item.quantity + 1) * item.unitPrice * 100) / 100,
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
      prev.map((item) => {
        if (item.id === productId) {
          const available = Number(item.stockAvailable ?? 0);
          const safeQty = Math.min(newQty, available);
          if (newQty > available) {
            toast.warning(`স্টক পর্যাপ্ত নয়! সর্বোচ্চ মজুদ: ${available}`);
          }
          return {
            ...item,
            quantity: safeQty,
            lineTotal: Math.round(safeQty * item.unitPrice * 100) / 100,
          };
        }
        return item;
      })
    );
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  }

  function clearCart() {
    setCart([]);
    setSelectedCustomerId("");
    setSearchQuery("");
    setDiscount(0);
    setCashPaid(0);
    setBkashPaid(0);
    setBankPaid(0);
    setShowSplitPay(false);
    setTimeout(() => barcodeInputRef.current?.focus(), 100);
  }

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
      if (match.stockAvailable <= 0) {
        toast.error(`"${match.name}" এই শাখায় স্টকে নেই!`);
        return;
      }
      addToCart(match);
      setSearchQuery("");
      toast.success(`যোগ করা হয়েছে: ${match.name}`);
    } else {
      toast.error(`পণ্য পাওয়া যায়নি: "${searchQuery}"`);
    }
  }

  async function submitSale() {
    if (cart.length === 0) {
      toast.error("কার্ট খালি!");
      return;
    }

    if (dueAmount > 0 && !selectedCustomerId) {
      toast.error("বাকি বিক্রয়ে কাস্টমার নির্বাচন আবশ্যক!");
      return;
    }

    setLoading(true);

    const res = await checkoutAction({
      customerId: selectedCustomerId || null,
      items: cart.map((i) => ({
        productId: i.id,
        quantity: i.quantity,
        unitId: i.unitId,
        unitPrice: i.unitPrice,
      })),
      discount: Math.max(0, discount),
      cashPaid: Math.max(0, cashPaid),
      bkashPaid: Math.max(0, bkashPaid),
      bankPaid: Math.max(0, bankPaid),
    });

    setLoading(false);

    if (res.success && res.invoiceNo) {
      toast.success("বিক্রয় সফল হয়েছে!");
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
      toast.error(res.error || "বিক্রয় সম্পন্ন করা সম্ভব হয়নি।");
    }
  }

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
    setQuickCash: (amt: number) => setCashPaid(amt),
    setExactCash: () => {
      setCashPaid(grandTotal);
      setBkashPaid(0);
      setBankPaid(0);
    },
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
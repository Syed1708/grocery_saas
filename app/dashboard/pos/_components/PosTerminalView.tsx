"use client";

import { usePosCart } from "./usePosCart";
import PosTopBar from "./PosTopBar";
import PosCatalog from "./PosCatalog";
import PosCart from "./PosCart";
import PosModals from "./PosModals";

export default function PosTerminalView({
  catalog,
  customers,
  categories,
  shop,
  cashierName,
  branchName,
}: {
  catalog: any[];
  customers: any[];
  categories: any[];
  shop: any;
  cashierName: string;
  branchName: string;
}) {
  const pos = usePosCart(catalog, customers, shop, cashierName, branchName);

  return (
    <div className="h-screen flex flex-col bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 overflow-hidden font-sans">
      {/* 1. TOP BAR */}
      <PosTopBar
        branchName={branchName}
        cashierName={cashierName}
        customers={customers}
        selectedCustomerId={pos.selectedCustomerId}
        onCustomerChange={pos.setSelectedCustomerId}
        selectedCustomer={pos.selectedCustomer}
        onOpenQuickCustomer={() => pos.setQuickCustomerModalOpen(true)}
        currencySymbol={shop.currencySymbol}
      />

      {/* 2. MAIN 2-COLUMN DESK */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Catalog & Barcode */}
        <PosCatalog
          products={catalog}
          categories={categories}
          selectedCategory={pos.selectedCategory}
          onSelectCategory={pos.setSelectedCategory}
          searchQuery={pos.searchQuery}
          onSearchChange={pos.setSearchQuery}
          onBarcodeSubmit={pos.handleBarcodeSubmit}
          barcodeInputRef={pos.barcodeInputRef}
          onAddToCart={pos.addToCart}
          cartProductIds={pos.cart.map((i) => i.id)}
          currencySymbol={shop.currencySymbol}
        />

        {/* Right Column: Cart, Quick Cash & Checkout */}
        <PosCart
          cart={pos.cart}
          onUpdateQty={pos.updateQty}
          onRemove={pos.removeFromCart}
          onClear={pos.clearCart}
          subtotal={pos.subtotal}
          vatPercent={pos.vatPercent}
          vatAmount={pos.vatAmount}
          discount={pos.discount}
          onDiscountChange={pos.setDiscount}
          grandTotal={pos.grandTotal}
          showSplitPay={pos.showSplitPay}
          onToggleSplitPay={() => pos.setShowSplitPay(!pos.showSplitPay)}
          cashPaid={pos.cashPaid}
          onCashPaidChange={pos.setCashPaid}
          bkashPaid={pos.bkashPaid}
          onBkashPaidChange={pos.setBkashPaid}
          bankPaid={pos.bankPaid}
          onBankPaidChange={pos.setBankPaid}
          changeAmount={pos.changeAmount}
          dueAmount={pos.dueAmount}
          onSetQuickCash={pos.setQuickCash}
          onSetExactCash={pos.setExactCash}
          onSubmitSale={pos.submitSale}
          loading={pos.loading}
          enableVat={shop.enableVat}
          currencySymbol={shop.currencySymbol}
        />
      </div>

      {/* 3. MODALS (Quick Customer & Receipt Print) */}
      <PosModals
        customerModalOpen={pos.quickCustomerModalOpen}
        onCloseCustomerModal={() => pos.setQuickCustomerModalOpen(false)}
        completedSale={pos.completedSale}
        onCloseCompletedSale={() => pos.setCompletedSale(null)}
        shop={shop}
      />
    </div>
  );
}
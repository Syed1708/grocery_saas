"use client";

import FormModal from "@/components/common/FormModal";
import Modal from "@/components/common/Modal";
import { CheckCircle2, Printer } from "lucide-react";
import { createCustomerAction } from "@/app/actions/customer-actions";
import { toast } from "sonner";

interface PosModalsProps {
  customerModalOpen: boolean;
  onCloseCustomerModal: () => void;
  completedSale: any | null;
  onCloseCompletedSale: () => void;
  shop: any;
}

export default function PosModals({
  customerModalOpen,
  onCloseCustomerModal,
  completedSale,
  onCloseCompletedSale,
  shop,
}: PosModalsProps) {
  async function handleQuickCustomer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await createCustomerAction(formData);
    if (res.success) {
      toast.success("Customer added!");
      onCloseCustomerModal();
    } else {
      toast.error(res.error || "Failed to add customer.");
    }
  }

  function printThermalReceipt() {
    if (!completedSale) return;

    const printWindow = window.open("", "_blank", "width=420,height=600");
    if (!printWindow) return;

    const itemsHtml = completedSale.items
      .map(
        (it: any) => `
        <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:11px;">
          <div style="flex:1;">${it.name}<br/><span style="color:#666;">${it.quantity} x ${shop.currencySymbol || "৳"}${it.unitPrice.toFixed(2)}</span></div>
          <div style="font-weight:bold;">${shop.currencySymbol || "৳"}${it.lineTotal.toFixed(2)}</div>
        </div>
      `
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt #${completedSale.invoiceNo}</title>
        <style>
          @page { size: ${shop.thermalWidth || "80mm"} auto; margin: 0; }
          body { font-family: monospace; width: ${shop.thermalWidth || "80mm"}; margin: 0 auto; padding: 10px; font-size: 11px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .row { display: flex; justify-content: space-between; margin: 2px 0; }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size:14px;">${shop.name}</div>
        <div class="center" style="font-size:10px;">${shop.address || ""}</div>
        <div class="center" style="font-size:10px;">Phone: ${shop.phone}</div>
        <div class="divider"></div>
        <div class="row"><span>Invoice: #${completedSale.invoiceNo}</span><span>${new Date().toLocaleTimeString()}</span></div>
        <div class="row"><span>Cashier: ${completedSale.cashierName}</span><span>Branch: ${completedSale.branchName}</span></div>
        ${completedSale.customer ? `<div class="row"><span>Customer: ${completedSale.customer.name}</span><span>${completedSale.customer.phone || ""}</span></div>` : ""}
        <div class="divider"></div>
        ${itemsHtml}
        <div class="divider"></div>
        <div class="row"><span>Subtotal:</span><span>${shop.currencySymbol || "৳"}${completedSale.subtotal.toFixed(2)}</span></div>
        ${completedSale.discount > 0 ? `<div class="row"><span>Discount:</span><span>-${shop.currencySymbol || "৳"}${completedSale.discount.toFixed(2)}</span></div>` : ""}
        ${completedSale.vatAmount > 0 ? `<div class="row"><span>VAT:</span><span>+${shop.currencySymbol || "৳"}${completedSale.vatAmount.toFixed(2)}</span></div>` : ""}
        <div class="row bold" style="font-size:13px;"><span>GRAND TOTAL:</span><span>${shop.currencySymbol || "৳"}${completedSale.grandTotal.toFixed(2)}</span></div>
        <div class="row"><span>Paid:</span><span>${shop.currencySymbol || "৳"}${completedSale.paidAmount.toFixed(2)}</span></div>
        <div class="row"><span>Change:</span><span>${shop.currencySymbol || "৳"}${completedSale.changeAmount.toFixed(2)}</span></div>
        ${completedSale.dueAmount > 0 ? `<div class="row bold" style="color:red;"><span>Due Debt:</span><span>${shop.currencySymbol || "৳"}${completedSale.dueAmount.toFixed(2)}</span></div>` : ""}
        <div class="divider"></div>
        <div class="center" style="font-size:10px; margin-top:8px;">${shop.invoiceFooter || "ধন্যবাদ আবার আসবেন!"}</div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }

  return (
    <>
      {/* 1. Quick Add Customer Modal */}
      <FormModal
        isOpen={customerModalOpen}
        onClose={onCloseCustomerModal}
        onSubmit={handleQuickCustomer}
        title="Quick Add Permanent Customer (+ কাস্টমার)"
        description="Add customer phone and credit limit directly from the cash counter."
      >
        <div>
          <label className="block text-xs font-medium mb-1">Customer Full Name *</label>
          <input
            type="text"
            name="name"
            required
            placeholder="e.g. মোশাররফ হোসেন"
            className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Mobile Phone *</label>
          <input
            type="text"
            name="phone"
            required
            placeholder="01700000000"
            className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Credit Limit (৳)</label>
          <input
            type="number"
            name="creditLimit"
            defaultValue={5000}
            className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
          />
        </div>
      </FormModal>

      {/* 2. Completed Sale & Thermal Print Modal */}
      {completedSale && (
        <Modal
          isOpen={Boolean(completedSale)}
          onClose={onCloseCompletedSale}
          title="Sale Completed Successfully!"
          description={`Invoice #${completedSale.invoiceNo}`}
          maxWidth="sm"
        >
          <div className="space-y-4 text-center">
            <div className="inline-flex p-3 rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={32} />
            </div>

            <div>
              <span className="text-2xl font-black text-neutral-900 dark:text-neutral-100 block font-mono">
                {shop.currencySymbol || "৳"}{completedSale.grandTotal.toFixed(2)}
              </span>
              {completedSale.changeAmount > 0 && (
                <span className="text-xs text-emerald-600 font-bold block mt-1">
                  Change Return: {shop.currencySymbol || "৳"}{completedSale.changeAmount.toFixed(2)}
                </span>
              )}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={printThermalReceipt}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer size={15} /> Print Thermal Slip ({shop.thermalWidth || "80mm"})
              </button>
              <button
                type="button"
                onClick={onCloseCompletedSale}
                className="w-full py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold text-xs rounded-xl hover:bg-neutral-200 transition cursor-pointer"
              >
                Next Customer (নতুন বিক্রয়)
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
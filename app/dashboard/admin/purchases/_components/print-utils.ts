// app/dashboard/admin/purchases/_components/print-utils.ts

export function printPurchaseInvoice({
  invoice,
  shopName,
  currencySymbol = "৳",
}: {
  invoice: any;
  shopName: string;
  currencySymbol?: string;
}) {
  const printWindow = window.open("", "_blank", "width=850,height=900");
  if (!printWindow) return;

  const invoiceTotal = Number(invoice.grandTotal || 0);
  const pastDue = Number(invoice.previousDue || 0);
  const netPayable = invoiceTotal + pastDue;
  const paid = Number(invoice.paidAmount || 0);
  const currentClosingDue = Number(invoice.dueAmount || Math.max(0, netPayable - paid));

  const itemsHtml = (invoice.items || [])
    .map(
      (item: any, idx: number) => `
    <tr>
      <td style="padding: 7px; border: 1px solid #ddd; text-align: center;">${idx + 1}</td>
      <td style="padding: 7px; border: 1px solid #ddd;">${item.product?.name || item.productName || "Product"}</td>
      <td style="padding: 7px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 7px; border: 1px solid #ddd; text-align: right;">${currencySymbol}${Number(item.unitCost).toFixed(2)}</td>
      <td style="padding: 7px; border: 1px solid #ddd; text-align: right;">${currencySymbol}${Number(item.commission || 0).toFixed(2)}</td>
      <td style="padding: 7px; border: 1px solid #ddd; text-align: right; font-weight: bold;">
        ${currencySymbol}${Number(item.lineTotal || item.quantity * item.unitCost).toFixed(2)}
      </td>
    </tr>
  `
    )
    .join("");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Purchase Chalan #${invoice.chalanNo}</title>
      <style>
        @page { size: A4 portrait; margin: 12mm; }
        body { font-family: Arial, sans-serif; color: #111; margin: 0; padding: 10px; }
        .header { text-align: center; border-bottom: 2px solid #222; padding-bottom: 8px; margin-bottom: 15px; }
        .header h1 { margin: 0; font-size: 20px; text-transform: uppercase; }
        .header p { margin: 2px 0; font-size: 12px; color: #555; }
        .meta-grid { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #f3f4f6; border: 1px solid #ddd; padding: 8px; text-align: left; }
        .summary { float: right; width: 320px; margin-top: 15px; font-size: 12px; }
        .summary div { display: flex; justify-content: space-between; padding: 3px 0; }
        .summary .total { font-weight: bold; border-top: 2px solid #000; font-size: 14px; padding-top: 5px; }
        .summary .net { font-weight: bold; border-top: 1px dashed #777; font-size: 13px; padding-top: 4px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${shopName}</h1>
        <p>Purchase Chalan & Stock-In Memo (ক্রয় চালান ও মেমো)</p>
      </div>
      <div class="meta-grid">
        <div>
          <strong>Supplier:</strong> ${invoice.supplierCompany || invoice.supplierName || "—"}<br/>
          <strong>Contact:</strong> ${invoice.supplierName || "—"}
        </div>
        <div style="text-align: right;">
          <strong>Chalan No:</strong> #${invoice.chalanNo}<br/>
          <strong>Date:</strong> ${new Date(invoice.purchaseDate).toLocaleDateString()}
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 25px; text-align: center;">#</th>
            <th>Product Description</th>
            <th style="width: 60px; text-align: center;">Qty</th>
            <th style="width: 80px; text-align: right;">Cost</th>
            <th style="width: 70px; text-align: right;">Comm.</th>
            <th style="width: 90px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml || '<tr><td colspan="6" style="text-align: center; padding: 10px;">Item details not recorded</td></tr>'}
        </tbody>
      </table>
      <div class="summary">
        <div><span>Bill Total (আজকের চালান):</span><span>${currencySymbol}${invoiceTotal.toFixed(2)}</span></div>
        <div style="color: #b91c1c;"><span>(+) Previous Due (পূর্বের বাকি):</span><span>+${currencySymbol}${pastDue.toFixed(2)}</span></div>
        <div class="net"><span>(=) Net Payable (সর্বমোট দেয়):</span><span>${currencySymbol}${netPayable.toFixed(2)}</span></div>
        <div style="color: #047857; font-weight: bold;"><span>(-) Paid Today (পরিশোধ):</span><span>-${currencySymbol}${paid.toFixed(2)}</span></div>
        <div class="total" style="color: #b91c1c;"><span>Closing Due (বর্তমান বাকি):</span><span>${currencySymbol}${currentClosingDue.toFixed(2)}</span></div>
      </div>
      <script>
        window.onload = function() { window.focus(); window.print(); window.close(); }
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

export function printSupplierVoucher({
  details,
  shopName,
  currencySymbol = "৳",
}: {
  details: {
    voucherNo: string;
    supplierName: string;
    companyName: string;
    phone: string;
    amountPaid: number;
    previousDue: number;
    remainingDue: number;
    paymentMethod: string;
    reference?: string;
    date: Date;
  };
  shopName: string;
  currencySymbol?: string;
}) {
  const printWindow = window.open("", "_blank", "width=650,height=700");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Voucher #${details.voucherNo}</title>
      <style>
        @page { size: A5 landscape; margin: 10mm; }
        body { font-family: Arial, sans-serif; color: #111; margin: 0; padding: 15px; }
        .voucher-box { border: 2px solid #222; padding: 15px; border-radius: 6px; }
        .header { text-align: center; border-bottom: 2px dashed #444; padding-bottom: 8px; margin-bottom: 12px; }
        .header h1 { margin: 0; font-size: 18px; text-transform: uppercase; }
        .header p { margin: 2px 0; font-size: 11px; color: #555; }
        .meta { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 12px; }
        .ledger-table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; }
        .ledger-table th, .ledger-table td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        .ledger-table th { background: #f3f4f6; }
        .signatures { display: flex; justify-content: space-between; margin-top: 45px; font-size: 11px; border-top: 1px dotted #999; padding-top: 8px; }
      </style>
    </head>
    <body>
      <div class="voucher-box">
        <div class="header">
          <h1>${shopName}</h1>
          <p>Debit Voucher / Supplier Payment Receipt (মহাজন পেমেন্ট ভাউচার)</p>
        </div>
        <div class="meta">
          <div>
            <strong>Paid To (প্রাপক):</strong> ${details.companyName} (${details.supplierName})<br/>
            <strong>Mobile:</strong> ${details.phone || "—"}
          </div>
          <div style="text-align: right;">
            <strong>Voucher No:</strong> #${details.voucherNo}<br/>
            <strong>Date:</strong> ${new Date(details.date).toLocaleDateString()}
          </div>
        </div>
        <table class="ledger-table">
          <thead>
            <tr>
              <th>Particulars (বিবরণ)</th>
              <th style="text-align: right;">Amount (${currencySymbol})</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Previous Payable Debt (পূর্বের দেনা):</td>
              <td style="text-align: right; color: #b91c1c;">${currencySymbol}${details.previousDue.toFixed(2)}</td>
            </tr>
            <tr>
              <td>
                <strong>Payment Disbursed (পরিশোধিত অর্থ):</strong><br/>
                <small style="color: #666;">Method: ${details.paymentMethod.toUpperCase()} ${details.reference ? `| Ref: ${details.reference}` : ""}</small>
              </td>
              <td style="text-align: right; font-weight: bold; color: #047857;">-${currencySymbol}${details.amountPaid.toFixed(2)}</td>
            </tr>
            <tr style="background: #fafafa; font-weight: bold;">
              <td>Remaining Debt Balance (অবশিষ্ট দেনা):</td>
              <td style="text-align: right; color: #b91c1c; font-size: 14px;">${currencySymbol}${details.remainingDue.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        <div class="signatures">
          <div>Prepared By (প্রস্তুতকারক)</div>
          <div>Manager / Store Owner Sign</div>
          <div>Supplier / Representative Signature</div>
        </div>
      </div>
      <script>
        window.onload = function() { window.focus(); window.print(); window.close(); }
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
import { prisma } from "@/lib/prisma";
import { 
  ICustomerDueKPIs, 
  ICustomerDueRow, 
  ICustomerKhataEntry,
  ICustomerKhataSummary 
} from "@/types/index";

export async function getCustomerDueReportData(
  shopId: string,
  search?: string,
  customerType?: string,
  agingFilter?: string
): Promise<{
  kpis: ICustomerDueKPIs;
  customers: ICustomerDueRow[];
}> {
  const where: any = {
    shopId,
    status: "active",
    currentDue: { gt: 0 },
  };

  if (customerType && customerType !== "all") {
    where.type = customerType;
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { phone: { contains: search } },
      { village: { contains: search } },
    ];
  }

  const rawCustomers = await prisma.customer.findMany({
    where,
    include: {
      sales: {
        where: { dueAmount: { gt: 0 } },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { createdAt: true },
      },
      payments: {
        orderBy: { paymentDate: "desc" },
        take: 1,
        select: { paymentDate: true },
      },
      _count: {
        select: { sales: true },
      },
    },
    orderBy: { currentDue: "desc" },
  });

  const now = new Date().getTime();
  let overdue30DaysAmount = 0;
  let creditExceededCount = 0;
  let totalDue = 0;

  let customers: ICustomerDueRow[] = rawCustomers.map((c) => {
    const due = Number(c.currentDue);
    const limit = Number(c.creditLimit) || 10000;
    const openingDue = Number(c.openingDue) || 0;
    totalDue += due;

    if (due > limit) creditExceededCount++;

    const oldestInvoice = c.sales[0]?.createdAt || null;
    let overdueDays = 0;

    if (oldestInvoice) {
      const diffTime = Math.abs(now - new Date(oldestInvoice).getTime());
      overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (overdueDays > 30) overdue30DaysAmount += due;
    }

    const usagePercent = limit > 0 ? Number(((due / limit) * 100).toFixed(0)) : 100;

    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      village: c.village,
      address: c.address,
      type: c.type,
      openingDue,
      creditLimit: limit,
      currentDue: due,
      limitUsagePercent: usagePercent,
      lastPaymentDate: c.payments[0]?.paymentDate || null,
      oldestUnpaidInvoiceDate: oldestInvoice,
      overdueDays,
      totalInvoicesCount: c._count.sales,
    };
  });

  // Optional aging filter
  if (agingFilter === "overdue30") {
    customers = customers.filter((c) => c.overdueDays > 30);
  } else if (agingFilter === "overlimit") {
    customers = customers.filter((c) => c.currentDue > c.creditLimit);
  }

  const kpis: ICustomerDueKPIs = {
    totalDueAmount: totalDue,
    totalDueCustomers: customers.length,
    overdue30DaysAmount,
    creditExceededCustomersCount: creditExceededCount,
    averageDuePerCustomer: customers.length > 0 ? totalDue / customers.length : 0,
  };

  return { kpis, customers };
}

export async function getCustomerKhataLedger(
  customerId: string,
  shopId: string
): Promise<{
  summary: ICustomerKhataSummary;
  ledger: ICustomerKhataEntry[];
}> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      openingDue: true,
      currentDue: true,
      createdAt: true,
    },
  });

  const openingDue = Number(customer?.openingDue || 0);

  // 1. Fetch Sales
  const sales = await prisma.sale.findMany({
    where: { customerId, shopId },
    select: {
      id: true,
      invoiceNo: true,
      grandTotal: true,
      paidAmount: true,
      dueAmount: true,
      paymentMethod: true,
      createdAt: true,
    },
  });

  // 2. Fetch Direct Payments (Installments / Collections)
  const payments = await prisma.customerPayment.findMany({
    where: { customerId },
    select: {
      id: true,
      receiptNo: true,
      amount: true,
      paymentMethod: true,
      paymentDate: true,
      note: true,
    },
  });

  // 3. Fetch Returns
  const returns = await prisma.saleReturn.findMany({
    where: { customerId, shopId },
    select: {
      id: true,
      returnNo: true,
      totalRefund: true,
      refundMethod: true,
      returnDate: true,
      notes: true,
    },
  });

  const events: any[] = [];

  // Opening Balance Entry
  if (openingDue > 0) {
    events.push({
      id: "opening-balance",
      date: customer?.createdAt || new Date(),
      type: "OPENING" as const,
      title: "পূর্বের বাকি (Opening Balance)",
      referenceNo: "OB-001",
      invoiceTotal: openingDue,
      paidAtPos: 0,
      debit: openingDue,
      credit: 0,
      note: "প্রারম্ভিক বকেয়া জের",
    });
  }

  // Sales Entries
  sales.forEach((s) => {
    const grand = Number(s.grandTotal);
    const paid = Number(s.paidAmount);
    const due = Number(s.dueAmount);

    events.push({
      id: s.id,
      date: s.createdAt,
      type: "SALE" as const,
      title: due > 0 ? "পণ্য ক্রয় (বাকি বিক্রয়)" : "পণ্য ক্রয় (নগদ পরিশোধ)",
      referenceNo: s.invoiceNo,
      invoiceTotal: grand,
      paidAtPos: paid,
      debit: due, // Only the unpaid portion adds to the customer's debt
      credit: 0,
      note: `মোট বিল: ৳${grand.toFixed(2)}${paid > 0 ? ` | জমা: ৳${paid.toFixed(2)}` : ""}`,
    });
  });

  // Subsequent Payment Collections
  payments.forEach((p) => {
    events.push({
      id: p.id,
      date: p.paymentDate,
      type: "PAYMENT" as const,
      title: `বকেয়া জমা (${p.paymentMethod.toUpperCase()})`,
      referenceNo: p.receiptNo,
      invoiceTotal: 0,
      paidAtPos: Number(p.amount),
      debit: 0,
      credit: Number(p.amount),
      note: p.note || "খাতার বকেয়া টাকা পরিশোধ",
    });
  });

  // Returns
  returns.forEach((r) => {
    const refund = Number(r.totalRefund);
    const isBalanceDeduction = r.refundMethod?.toLowerCase() === "balance";

    if (isBalanceDeduction) {
      // Adjusted with Khata: Reduces Debt
      events.push({
        id: r.id,
        date: r.returnDate,
        type: "RETURN" as const,
        title: "পণ্য ফেরত (বাকি সমন্বয়)",
        referenceNo: r.returnNo,
        invoiceTotal: refund,
        paidAtPos: 0,
        debit: 0,
        credit: refund, // Reduces debt
        note: "খাতার বাকি থেকে কর্তন করা হয়েছে",
      });
    } else {
      // Cash Refund: Handed cash to customer, so DEBT DOES NOT CHANGE
      events.push({
        id: r.id,
        date: r.returnDate,
        type: "RETURN" as const,
        title: "পণ্য ফেরত (নগদ রিফান্ড দেওয়া হয়েছে)",
        referenceNo: r.returnNo,
        invoiceTotal: refund,
        paidAtPos: refund,
        debit: 0,
        credit: 0, // 0 Effect on due balance!
        note: `নগদ ৳${refund.toFixed(2)} ক্যাশ থেকে ফেরত দেওয়া হয়েছে (বাকিতে প্রভাব নেই)`,
      });
    }
  });

  // Sort Chronologically
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let runningBalance = 0;
  let totalBilled = 0;
  let totalPaid = 0;

  const ledger: ICustomerKhataEntry[] = events.map((item) => {
    runningBalance += item.debit - item.credit;
    if (item.type === "SALE") totalBilled += item.invoiceTotal;
    if (item.paidAtPos) totalPaid += item.paidAtPos;
    if (item.type === "PAYMENT") totalPaid += item.credit;

    return {
      ...item,
      balance: runningBalance,
    };
  });

  return {
    summary: {
      openingDue,
      totalBilled,
      totalPaid,
      currentDue: Number(customer?.currentDue || runningBalance),
    },
    ledger,
  };
}
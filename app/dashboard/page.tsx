import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Users,
  ArrowRight,
  Receipt,
  Tags,
} from "lucide-react";

export default async function DashboardOverviewPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId) {
    redirect("/login");
  }

  const { shopId, role, name } = session.user;
  const isCashier = role === "CASHIER";

  // Real-time queries from MySQL via Prisma
  const [categoryCount, staffCount] = await Promise.all([
    prisma.category.count({ where: { shopId } }),
    prisma.user.count({ where: { shopId } }),
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            Welcome back, {name} 👋
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            {isCashier
              ? "You are logged in as Cashier. Ready to process customer sales?"
              : "Here is your store summary and key performance indicators."}
          </p>
        </div>

        <Link
          href="/pos"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
        >
          <ShoppingCart size={16} /> Open POS Terminal
        </Link>
      </div>

      {/* OWNER / MANAGER VIEW */}
      {!isCashier && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs transition-colors">
              <div className="flex justify-between items-center text-neutral-500 dark:text-neutral-400 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider">Today&apos;s Sales</span>
                <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <DollarSign size={16} />
                </span>
              </div>
              <div className="text-2xl font-black text-neutral-900 dark:text-neutral-100">$0.00</div>
              <span className="text-[11px] text-neutral-400 mt-1 inline-block">0 transactions</span>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs transition-colors">
              <div className="flex justify-between items-center text-neutral-500 dark:text-neutral-400 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider">Active Categories</span>
                <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  <Tags size={16} />
                </span>
              </div>
              <div className="text-2xl font-black text-neutral-900 dark:text-neutral-100">{categoryCount}</div>
              <span className="text-[11px] text-neutral-400 mt-1 inline-block">Grocery item groups</span>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs transition-colors">
              <div className="flex justify-between items-center text-neutral-500 dark:text-neutral-400 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider">Low Stock Items</span>
                <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                  <AlertTriangle size={16} />
                </span>
              </div>
              <div className="text-2xl font-black text-neutral-900 dark:text-neutral-100">0</div>
              <span className="text-[11px] text-neutral-400 mt-1 inline-block">Items need reorder</span>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs transition-colors">
              <div className="flex justify-between items-center text-neutral-500 dark:text-neutral-400 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider">Staff Accounts</span>
                <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                  <Users size={16} />
                </span>
              </div>
              <div className="text-2xl font-black text-neutral-900 dark:text-neutral-100">{staffCount}</div>
              <span className="text-[11px] text-neutral-400 mt-1 inline-block">Store users active</span>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs transition-colors">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-4">Quick Store Shortcuts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                href="/dashboard/admin/categories"
                className="p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition flex items-center justify-between"
              >
                <div>
                  <h3 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Categories ({categoryCount})</h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Manage grocery item groups</p>
                </div>
                <ArrowRight size={15} className="text-neutral-400" />
              </Link>

              <Link
                href="/dashboard/admin/products"
                className="p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition flex items-center justify-between"
              >
                <div>
                  <h3 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Products & Barcodes</h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Add grocery items & images</p>
                </div>
                <ArrowRight size={15} className="text-neutral-400" />
              </Link>

              <Link
                href="/dashboard/admin/customers"
                className="p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition flex items-center justify-between"
              >
                <div>
                  <h3 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Customers (Khata)</h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Track permanent credit ledger</p>
                </div>
                <ArrowRight size={15} className="text-neutral-400" />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
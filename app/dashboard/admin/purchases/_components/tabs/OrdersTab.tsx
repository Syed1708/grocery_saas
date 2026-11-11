"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
    ColumnDef,
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    ClipboardList,
    Search,
    Calendar,
    MessageCircle,
    PackageCheck,
    Trash2,
    Edit2,
    Eye,
    Lock,
    Clock,
    CheckCircle2,
} from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import { IPurchaseOrder } from "@/types/purchase-order";
import { deletePurchaseOrderAction } from "@/app/actions/purchase-order-actions";
import ViewOrderModal from "../modals/ViewOrderModal";
import EditOrderModal from "../modals/EditOrderModal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { toast } from "sonner";

interface Props {
    orders: IPurchaseOrder[];
    currencySymbol?: string;
    shopName: string;
}

export default function OrdersTab({
    orders = [],
    currencySymbol = "৳",
    shopName,
}: Props) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    // Modal states
    const [viewingOrder, setViewingOrder] = useState<IPurchaseOrder | null>(null);
    const [editingOrder, setEditingOrder] = useState<IPurchaseOrder | null>(null);
    const [deletingOrder, setDeletingOrder] = useState<IPurchaseOrder | null>(null);
    const [loading, setLoading] = useState(false);

    const filteredOrders = useMemo(() => {
        return orders.filter((o) => {
            if (search) {
                const q = search.toLowerCase();
                const matchesNo = o.orderNo.toLowerCase().includes(q);
                const matchesSupplier =
                    o.supplierCompany?.toLowerCase().includes(q) ||
                    o.supplierName.toLowerCase().includes(q);
                if (!matchesNo && !matchesSupplier) return false;
            }
            if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
            return true;
        });
    }, [orders, search, statusFilter]);

    const handleDeleteConfirm = async () => {
        if (!deletingOrder) return;
        setLoading(true);
        const res = await deletePurchaseOrderAction(deletingOrder.id);
        setLoading(false);

        if (res.success) {
            toast.success(`অর্ডার #${deletingOrder.orderNo} মুছে ফেলা হয়েছে!`);
            setDeletingOrder(null);
        } else {
            toast.error(res.error || "মুছে ফেলা সম্ভব হয়নি।");
        }
    };

    const columns: ColumnDef<IPurchaseOrder>[] = [
        {
            accessorKey: "orderNo",
            header: "অর্ডার #",
            cell: ({ row }) => (
                <span className="font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                    <ClipboardList size={13} className="text-neutral-400" />
                    #{row.getValue("orderNo")}
                </span>
            ),
        },
        {
            accessorKey: "supplierCompany",
            header: "ডিস্ট্রিবিউটর / সাপ্লায়ার",
            cell: ({ row }) => (
                <div>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
                        {row.original.supplierCompany || row.original.supplierName}
                    </span>
                    <span className="text-[11px] text-neutral-400">SR: {row.original.supplierName}</span>
                </div>
            ),
        },
        {
            accessorKey: "totalItems",
            header: "মোট আইটেম",
            cell: ({ row }) => (
                <span className="font-mono text-xs text-center block">
                    {row.original.items.length} টি পণ্য
                </span>
            ),
        },
        {
            accessorKey: "estimatedTotal",
            header: "আনুমানিক মূল্য",
            cell: ({ row }) => (
                <span className="font-bold text-neutral-900 dark:text-neutral-100 text-xs font-mono">
                    {currencySymbol}{Number(row.getValue("estimatedTotal")).toFixed(2)}
                </span>
            ),
        },
        {
            accessorKey: "status",
            header: "অবস্থা",
            cell: ({ row }) => {
                const s = row.original.status;
                return (
                    <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase inline-flex items-center gap-1 ${s === "CONVERTED"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"
                            }`}
                    >
                        {s === "CONVERTED" ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                        {s === "CONVERTED" ? "চালানে রূপান্তরিত" : "ড্রাফট অর্ডার"}
                    </span>
                );
            },
        },
        {
            accessorKey: "orderDate",
            header: "তারিখ",
            cell: ({ row }) => (
                <span className="text-neutral-500 text-xs flex items-center gap-1 font-mono">
                    <Calendar size={12} className="text-neutral-400" />
                    {new Date(row.original.orderDate).toLocaleDateString()}
                </span>
            ),
        },
        {
            id: "actions",
            header: "অ্যাকশন",
            cell: ({ row }) => {
                const o = row.original;
                const isConverted = o.status === "CONVERTED";

                return (
                    <div className="flex items-center gap-1">
                        {/* Convert or Locked Status */}
                        {isConverted ? (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 text-[10px] font-bold border border-neutral-200 dark:border-neutral-700 cursor-not-allowed">
                                <Lock size={11} /> ইনওয়ার্ড সম্পন্ন
                            </span>
                        ) : (
                            <Link
                                href={`/dashboard/admin/purchases/create?fromPO=${o.id}`}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold hover:bg-emerald-100 transition"
                                title="মাল আসলে চালানে রূপান্তর করুন"
                            >
                                <PackageCheck size={13} /> রূপান্তর করুন
                            </Link>
                        )}

                        {/* View Details */}
                        <button
                            type="button"
                            onClick={() => setViewingOrder(o)}
                            className="p-1.5 text-neutral-500 hover:text-blue-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                            title="বিস্তারিত দেখুন"
                        >
                            <Eye size={15} />
                        </button>

                        {/* Edit (Only enabled for DRAFT) */}
                        {!isConverted && (
                            <button
                                type="button"
                                onClick={() => setEditingOrder(o)}
                                className="p-1.5 text-neutral-500 hover:text-emerald-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                                title="অর্ডার পরিবর্তন করুন"
                            >
                                <Edit2 size={15} />
                            </button>
                        )}

                        {/* Delete (Only enabled for DRAFT) */}
                        {!isConverted && (
                            <button
                                type="button"
                                onClick={() => setDeletingOrder(o)}
                                className="p-1.5 text-neutral-500 hover:text-red-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                                title="অর্ডার মুছুন"
                            >
                                <Trash2 size={15} />
                            </button>
                        )}
                    </div>
                );
            },
        },
    ];

    const table = useReactTable({
        data: filteredOrders,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <div className="space-y-4">
            {/* Search & Status Filters */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl space-y-3 shadow-xs">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="অর্ডার নম্বর বা সরবরাহকারীর নাম দিয়ে খুঁজুন..."
                        className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 shrink-0 mr-1">
                        ফিল্টার:
                    </span>
                    {[
                        { label: "সকল অর্ডার (All)", value: "ALL" },
                        { label: "ড্রাফট অর্ডার (Drafts)", value: "DRAFT" },
                        { label: "চালানে রূপান্তরিত (Converted)", value: "CONVERTED" },
                    ].map((pill) => (
                        <button
                            key={pill.value}
                            type="button"
                            onClick={() => setStatusFilter(pill.value)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer ${statusFilter === pill.value
                                    ? "bg-blue-600 text-white font-semibold shadow-xs"
                                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200"
                                }`}
                        >
                            {pill.label}
                        </button>
                    ))}
                </div>
            </div>

            <DataTable table={table} columns={columns} />

            {/* View Modal */}
            <ViewOrderModal
                order={viewingOrder}
                onClose={() => setViewingOrder(null)}
                currencySymbol={currencySymbol}
            />
            {/* Edit Modal: key forces a clean mount with current order data */}
            {editingOrder && (
                <EditOrderModal
                    key={editingOrder.id}
                    order={editingOrder}
                    onClose={() => setEditingOrder(null)}
                    currencySymbol={currencySymbol}
                />
            )}

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={Boolean(deletingOrder)}
                onClose={() => setDeletingOrder(null)}
                onConfirm={handleDeleteConfirm}
                title="ড্রাফট অর্ডার মুছে ফেলুন"
                message={`আপনি কি নিশ্চিতভাবে অর্ডার #${deletingOrder?.orderNo} মুছে ফেলতে চান?`}
                confirmLabel="অর্ডার মুছুন"
                loading={loading}
            />
        </div>
    );
}
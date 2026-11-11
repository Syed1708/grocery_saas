"use client";

import React, { useState, useMemo } from "react";
import {
    ColumnDef,
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    AlertOctagon,
    Search,
    Calendar,
    Printer,
    Eye,
    Trash2,
    Edit2
} from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import { IStockWastage } from "@/types/stock-wastage";



interface Props {
    wastages: IStockWastage[];
    currencySymbol?: string;
    onView: (w: IStockWastage) => void;
    onEdit?: (w: IStockWastage) => void; // 👈 Add this
    onPrint: (w: IStockWastage, format?: "80mm" | "a4") => void;
    onDelete?: (w: IStockWastage) => void;
}
const REASON_LABELS: Record<string, { label: string; color: string }> = {
    ROTTEN_PERISHABLE: { label: "পচে নষ্ট (Produce)", color: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300" },
    BROKEN_DAMAGED: { label: "ভেঙে নষ্ট (Broken)", color: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300" },
    EXPIRED_NO_RETURN: { label: "মেয়াদোত্তীর্ণ (Expired)", color: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300" },
    PEST_DAMAGE: { label: "ইঁদুর/কীটপতঙ্গ (Pest)", color: "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300" },
    INTERNAL_STORE_USE: { label: "দোকানের ব্যবহার", color: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300" },
    OTHER: { label: "অন্যান্য", color: "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300" },
};

export default function WastageTab({
    wastages = [],
    currencySymbol = "৳",
    onView,
    onPrint,
    onDelete,
    onEdit
}: Props) {
    const [search, setSearch] = useState("");
    const [reasonFilter, setReasonFilter] = useState("ALL");

    const filtered = useMemo(() => {
        return wastages.filter((w) => {
            if (search) {
                const q = search.toLowerCase();
                const matchesNo = w.wastageNo.toLowerCase().includes(q);
                const matchesItem = w.items.some((i) => i.productName.toLowerCase().includes(q));
                if (!matchesNo && !matchesItem) return false;
            }
            if (reasonFilter !== "ALL" && w.reason !== reasonFilter) return false;
            return true;
        });
    }, [wastages, search, reasonFilter]);

    const columns: ColumnDef<IStockWastage>[] = [
        {
            accessorKey: "wastageNo",
            header: "ভাউচার #",
            cell: ({ row }) => (
                <span className="font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                    <AlertOctagon size={13} className="text-red-500" />
                    #{row.getValue("wastageNo")}
                </span>
            ),
        },
        {
            accessorKey: "reason",
            header: "প্রধান কারণ",
            cell: ({ row }) => {
                const r = row.original.reason;
                const config = REASON_LABELS[r] || REASON_LABELS.OTHER;
                return (
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${config.color}`}>
                        {config.label}
                    </span>
                );
            },
        },
        {
            accessorKey: "totalQuantity",
            header: "নষ্টের পরিমাণ",
            cell: ({ row }) => (
                <span className="font-mono text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    {row.original.totalQuantity} টি / কেজি
                </span>
            ),
        },
        {
            accessorKey: "totalCost",
            header: "আর্থিক ক্ষতি (P&L Loss)",
            cell: ({ row }) => (
                <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">
                    {currencySymbol}{row.original.totalCost.toFixed(2)}
                </span>
            ),
        },
        {
            accessorKey: "date",
            header: "তারিখ",
            cell: ({ row }) => (
                <span className="text-neutral-500 text-xs flex items-center gap-1 font-mono">
                    <Calendar size={12} className="text-neutral-400" />
                    {new Date(row.original.date).toLocaleDateString()}
                </span>
            ),
        },
        {
            id: "actions",
            header: "অ্যাকশন",
            cell: ({ row }) => {
                const w = row.original;
                return (
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => onPrint(w, "80mm")}
                            className="p-1.5 text-neutral-500 hover:text-purple-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                            title="80mm থার্মাল প্রিন্ট"
                        >
                            <Printer size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={() => onView(w)}
                            className="p-1.5 text-neutral-500 hover:text-blue-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                            title="বিস্তারিত দেখুন"
                        >
                            <Eye size={14} />
                        </button>
                        {/* Edit Button */}
                        {onEdit && (
                            <button
                                type="button"
                                onClick={() => onEdit(w)}
                                className="p-1.5 text-neutral-500 hover:text-emerald-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                                title="রেকর্ড সম্পাদনা করুন"
                            >
                                <Edit2 size={14} />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                type="button"
                                onClick={() => onDelete(w)}
                                className="p-1.5 text-neutral-500 hover:text-red-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                                title="রেকর্ড মুছুন ও স্টক রোলব্যাক"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                );
            },
        },
    ];

    const table = useReactTable({
        data: filtered,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl space-y-3 shadow-xs">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="ভাউচার নম্বর বা নষ্ট পণ্যের নাম দিয়ে খুঁজুন..."
                        className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 shrink-0 mr-1">
                        কারণ:
                    </span>
                    {[
                        { label: "সব ক্ষতি (All)", value: "ALL" },
                        { label: "পচে নষ্ট (Produce)", value: "ROTTEN_PERISHABLE" },
                        { label: "ভেঙে নষ্ট (Broken)", value: "BROKEN_DAMAGED" },
                        { label: "মেয়াদোত্তীর্ণ (Expired)", value: "EXPIRED_NO_RETURN" },
                        { label: "কীটপতঙ্গ (Pest)", value: "PEST_DAMAGE" },
                    ].map((pill) => (
                        <button
                            key={pill.value}
                            type="button"
                            onClick={() => setReasonFilter(pill.value)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer ${reasonFilter === pill.value
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
        </div>
    );
}
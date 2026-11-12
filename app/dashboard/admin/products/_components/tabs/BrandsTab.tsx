"use client";

import React from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { ExtraOption } from "../ProductsClient";

interface Props {
  brands: ExtraOption[];
  onAdd: () => void;
  onEdit: (brand: ExtraOption) => void;
  onDelete: (brand: ExtraOption) => void;
  userRole?: string;
}

export default function BrandsTab({
  brands = [],
  onAdd,
  onEdit,
  onDelete,
  userRole = "OWNER",
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            ব্র্যান্ড ও সরবরাহকারী কোম্পানি (Brands)
          </h2>
          <p className="text-xs text-neutral-500">উৎপাদক কোম্পানি ও পরিবেশক প্রতিনিধি (SR) তথ্য পরিচালনা করুন</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
        >
          <Plus size={15} /> ব্র্যান্ড যোগ করুন
        </button>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-3.5 border-b border-neutral-100 dark:border-neutral-800 font-bold text-xs">
          সকল ব্র্যান্ড ({brands.length})
        </div>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {brands.map((b) => (
            <div
              key={b.id}
              className="p-3.5 flex items-center justify-between text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">{b.name}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                      b.status === "active"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {b.status || "active"}
                  </span>
                </div>
                <span className="text-[11px] text-neutral-400 block mt-0.5">
                  কোম্পানি: <strong>{b.companyName || "—"}</strong> • SR: <strong>{b.contactPerson || "None"}</strong> ({b.phone || "No Phone"}) • {b._count.products} টি পণ্য
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onEdit(b)}
                  className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
                  title="সম্পাদনা"
                >
                  <Edit2 size={15} />
                </button>
                {userRole === "OWNER" && (
                  <button
                    type="button"
                    onClick={() => onDelete(b)}
                    className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
"use client";

import React from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { ExtraOption } from "../ProductsClient";

interface Props {
  sections: ExtraOption[];
  onAdd: () => void;
  onEdit: (section: ExtraOption) => void;
  onDelete: (section: ExtraOption) => void;
  userRole?: string;
}

export default function SectionsTab({
  sections = [],
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
            দোকানের তাক ও র্যাক সেকশন (Shelves & Racks)
          </h2>
          <p className="text-xs text-neutral-500">দোকানের ডিসপ্লে তাক ও গোডাউনের লোকেশন ট্র্যাকিং</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
        >
          <Plus size={15} /> নতুন তাক যোগ
        </button>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-3.5 border-b border-neutral-100 dark:border-neutral-800 font-bold text-xs">
          সকল তাক ({sections.length})
        </div>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {sections.map((s) => (
            <div
              key={s.id}
              className="p-3.5 flex items-center justify-between text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">{s.name}</span>
                  <span className="font-mono text-[10px] bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.2 rounded font-bold">
                    {s.code || "No Code"}
                  </span>
                </div>
                <span className="text-[11px] text-neutral-400 block mt-0.5">
                  {s.description || "কোন বিবরণ নেই"} • {s._count.products} টি পণ্য এই তাকে রাখা আছে
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onEdit(s)}
                  className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
                  title="সম্পাদনা"
                >
                  <Edit2 size={15} />
                </button>
                {userRole === "OWNER" && (
                  <button
                    type="button"
                    onClick={() => onDelete(s)}
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
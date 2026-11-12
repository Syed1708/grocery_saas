"use client";

import React, { useState } from "react";
import { Scale, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { IUnitOption } from "@/types";
import { createUnitAction, seedDefaultUnitsAction } from "@/app/actions/unit-actions";

interface Props {
  units: IUnitOption[];
  onDeleteUnit: (unit: IUnitOption) => void;
  userRole?: string;
}

export default function UnitsTab({ units = [], onDeleteUnit, userRole = "OWNER" }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleCreateUnit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const res = await createUnitAction(new FormData(form));
    setLoading(false);

    if (res.success) {
      toast.success("পরিমাপ একক সফলভাবে তৈরি হয়েছে!");
      form.reset();
    } else {
      toast.error(res.error || "একক তৈরি ব্যর্থ হয়েছে।");
    }
  }

  async function handleLoadDefaultUnits() {
    setLoading(true);
    const res = await seedDefaultUnitsAction();
    setLoading(false);
    if (res.success) {
      toast.success("১০টি প্রমিত মুদি একক সফলভাবে লোড হয়েছে!");
    } else {
      toast.error(res.error || "একক লোড ব্যর্থ হয়েছে।");
    }
  }

  return (
    <div className="space-y-6">
      {/* Unit Creation Form */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
        <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-3">
          পরিমাপ একক যোগ করুন (Measurement Units)
        </h2>
        <form onSubmit={handleCreateUnit} className="flex flex-col sm:flex-row items-end gap-3">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              এককের নাম *
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="যেমন: Carton, Packet, Liter, Dozen"
              className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-full sm:w-48">
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              প্রতীক বা কোড *
            </label>
            <input
              type="text"
              name="code"
              required
              placeholder="যেমন: ctn, pkt, ltr, dzn"
              className="w-full px-3 py-2 text-xs font-mono uppercase bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer shrink-0 disabled:opacity-50"
          >
            একক তৈরি করুন
          </button>
        </form>
      </div>

      {/* Units List */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center text-xs">
          <span className="font-bold">দোকানের সক্রিয় পরিমাপ একক ({units.length})</span>
          <button
            type="button"
            onClick={handleLoadDefaultUnits}
            disabled={loading}
            className="text-blue-600 hover:underline font-semibold cursor-pointer"
          >
            + ১০টি প্রমিত মুদি একক রিলোড করুন
          </button>
        </div>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {units.map((u) => (
            <div
              key={u.id}
              className="p-3.5 flex items-center justify-between text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
            >
              <div className="flex items-center gap-3">
                <Scale size={16} className="text-neutral-400" />
                <div>
                  <span className="font-semibold block">{u.name}</span>
                  <span className="text-[10px] text-neutral-400">{u._count?.products || 0} টি পণ্যে ব্যবহৃত</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs font-bold uppercase bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
                  {u.code}
                </span>
                {userRole === "OWNER" && (
                  <button
                    type="button"
                    onClick={() => onDeleteUnit(u)}
                    disabled={(u._count?.products || 0) > 0}
                    className="p-1.5 text-neutral-400 hover:text-red-600 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                    title="একক মুছুন"
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
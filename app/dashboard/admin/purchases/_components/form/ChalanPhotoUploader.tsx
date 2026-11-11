"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Upload, Trash2, Eye, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { removeChalanImageAction, uploadChalanImageAction } from "@/app/actions/upload-actions";


interface Props {
  imageUrl?: string | null;
  onImageChange: (url: string | null) => void;
}

export default function ChalanPhotoUploader({ imageUrl, onImageChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadChalanImageAction(formData);

      if (res.success && res.url) {
        // If there was an old image, remove it from disk
        if (imageUrl) {
          await removeChalanImageAction(imageUrl);
        }
        onImageChange(res.url);
        toast.success("চালানের ছবি আপলোড সম্পন্ন হয়েছে!");
      } else {
        toast.error(res.error || "আপলোড ব্যর্থ হয়েছে।");
      }
    } catch {
      toast.error("ছবি আপলোড করার সময় সমস্যা হয়েছে।");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!imageUrl) return;
    const oldUrl = imageUrl;
    onImageChange(null);
    await removeChalanImageAction(oldUrl);
    toast.success("চালানের ছবি মুছে ফেলা হয়েছে।");
  };

  const isPdf = imageUrl?.endsWith(".pdf");

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 bg-neutral-50/50 dark:bg-neutral-800/20 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
          <Camera size={14} className="text-blue-600" />
          কাগজের আসল মেমো / চালান কপি (প্রমাণ হিসেবে সংরক্ষণ)
        </label>
        {imageUrl && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-[11px] text-red-500 hover:text-red-600 flex items-center gap-1 transition cursor-pointer"
          >
            <Trash2 size={12} /> ছবি মুছুন
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleUpload(e.target.files[0]);
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleUpload(e.target.files[0]);
        }}
      />

      {uploading ? (
        <div className="flex items-center justify-center py-6 text-xs text-neutral-500 gap-2">
          <Loader2 size={16} className="animate-spin text-blue-600" />
          ছবি আপলোড ও সংরক্ষণ হচ্ছে...
        </div>
      ) : imageUrl ? (
        <div className="flex items-center gap-3 p-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl">
          {isPdf ? (
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center font-bold text-xs">
              <FileText size={20} />
            </div>
          ) : (

            <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-neutral-200">
              <Image
                src={imageUrl}
                alt="Chalan Memo"
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 block truncate">
              {imageUrl.split("/").pop()}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold">সংরক্ষিত রয়েছে</span>
          </div>

          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-neutral-500 hover:text-blue-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
            title="বড় করে দেখুন"
          >
            <Eye size={16} />
          </a>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-xl hover:bg-blue-100/50 transition cursor-pointer"
          >
            <Camera size={15} /> ক্যামেরা দিয়ে ছবি তুলুন
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold rounded-xl hover:bg-neutral-100 transition cursor-pointer"
          >
            <Upload size={15} /> ফাইল / স্ক্যান কপি বাছাই করুন
          </button>
        </div>
      )}
    </div>
  );
}
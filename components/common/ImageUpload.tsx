"use client";

import { useState, useRef } from "react";
import { UploadCloud, X, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  name: string;
  defaultImage?: string | null;
  label?: string;
}

export default function ImageUpload({
  name,
  defaultImage,
  label = "Upload Image",
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(defaultImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  }

  function handleRemove() {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
          {label}
        </label>
      )}

      {preview ? (
        <div className="relative w-full h-40 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 group">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg hover:bg-black/80 transition cursor-pointer"
            title="Remove Image"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-36 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 bg-neutral-50/50 dark:bg-neutral-800/40 transition"
        >
          <UploadCloud size={24} className="text-neutral-400 mb-1" />
          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
            Click to upload photo
          </span>
          <span className="text-[10px] text-neutral-400 mt-0.5">
            PNG, JPG, WEBP up to 5MB
          </span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        name={name}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
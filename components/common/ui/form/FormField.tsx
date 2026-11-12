"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import ImageUpload from "@/components/common/ImageUpload";
import { cn } from "@/lib/utils";

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface FormFieldProps {
  type?: "text" | "number" | "email" | "password" | "date" | "textarea" | "select" | "image" | "checkbox";
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string | number | boolean | null;
  value?: any;
  onChange?: (e: any) => void;
  placeholder?: string;
  options?: SelectOption[];
  rows?: number;
  hint?: string;        // 👈 Fixed: added hint support
  helperText?: string;  // 👈 Supported alias
  error?: string;
  className?: string;
  disabled?: boolean;
}

export function FormField({
  type = "text",
  label,
  name,
  required = false,
  defaultValue,
  value,
  onChange,
  placeholder,
  options = [],
  rows = 2,
  hint,
  helperText,
  error,
  className = "",
  disabled = false,
}: FormFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const displayHint = hint || helperText;

  const baseInputStyles = cn(
    "w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50",
    error && "border-red-500 focus:ring-red-500 dark:border-red-500",
    className
  );

  return (
    <div className="space-y-1 w-full">
      {type !== "checkbox" && (
        <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {type === "password" ? (
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name={name}
            required={required}
            defaultValue={defaultValue ? String(defaultValue) : undefined}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(baseInputStyles, "pr-9")}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition"
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      ) : type === "textarea" ? (
        <textarea
          name={name}
          required={required}
          defaultValue={defaultValue ? String(defaultValue) : undefined}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className={baseInputStyles}
        />
      ) : type === "select" ? (
        <select
          name={name}
          required={required}
          defaultValue={defaultValue !== null && defaultValue !== undefined ? String(defaultValue) : ""}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={cn(baseInputStyles, "cursor-pointer")}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === "image" ? (
        <ImageUpload
          name={name}
          defaultImage={typeof defaultValue === "string" ? defaultValue : undefined}
          label={placeholder || label}
        />
      ) : type === "checkbox" ? (
        <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
          <input
            type="checkbox"
            name={name}
            value="true"
            defaultChecked={Boolean(defaultValue)}
            checked={value}
            onChange={onChange}
            disabled={disabled}
            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
          />
          <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
            {label} {required && <span className="text-red-500">*</span>}
          </span>
        </label>
      ) : (
        <input
          type={type}
          name={name}
          required={required}
          defaultValue={defaultValue !== null && defaultValue !== undefined ? String(defaultValue) : undefined}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={baseInputStyles}
        />
      )}

      {displayHint && !error && (
        <p className="text-[10px] text-neutral-400 dark:text-neutral-500">{displayHint}</p>
      )}

      {error && (
        <p className="text-[10px] text-red-500 font-medium animate-in fade-in duration-150">
          {error}
        </p>
      )}
    </div>
  );
}
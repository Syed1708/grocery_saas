import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, ...props }, ref) => {
    return (
      <div className="space-y-1 w-full">
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            className={cn(
              "mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800",
              className
            )}
            ref={ref}
            {...props}
          />
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">
              {label}
            </span>
            {description && (
              <span className="text-[11px] text-neutral-400 block">
                {description}
              </span>
            )}
          </div>
        </label>
        {error && <p className="text-[10px] text-red-500 font-medium">{error}</p>}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";
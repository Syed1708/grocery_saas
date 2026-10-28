"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "destructive" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "default",
      size = "default",
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none";

    const variants = {
      default: "bg-blue-600 text-white hover:bg-blue-700 shadow-xs",
      destructive: "bg-red-600 text-white hover:bg-red-700 shadow-xs",
      outline: "border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-850 shadow-xs",
      secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-750",
      ghost: "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300",
      link: "text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline p-0 h-auto",
    };

    const sizes = {
      default: "h-9 px-4 py-2 text-xs rounded-xl",
      sm: "h-8 px-3 text-xs rounded-lg",
      lg: "h-10 px-6 text-sm rounded-xl",
      icon: "h-9 w-9 p-0 rounded-xl",
    };

    const combinedClassName = `${baseStyles} ${variants[variant] || variants.default} ${
      sizes[size] || sizes.default
    } ${className}`;

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={combinedClassName}
        {...props}
      >
        {loading && <Loader2 size={14} className="animate-spin mr-1.5 shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
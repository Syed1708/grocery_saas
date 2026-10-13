"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
        {/* Root Dashboard Home Icon */}
        <li className="flex items-center">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-neutral-500 hover:text-blue-600 dark:hover:text-blue-400 transition"
          >
            <Home size={14} />
            <span className="sr-only">Dashboard Home</span>
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-1.5">
              <ChevronRight size={13} className="text-neutral-400 shrink-0" />
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate max-w-50">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
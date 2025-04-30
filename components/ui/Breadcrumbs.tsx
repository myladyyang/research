import React from "react";
import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav className={`flex items-center text-sm ${className}`}>
      <ol className="flex flex-wrap items-center">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center">
              {item.href && !item.isCurrent ? (
                <Link
                  href={item.href}
                  className="text-muted-foreground hover:text-primary"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={`${
                    item.isCurrent ? "text-primary font-medium" : "text-muted-foreground"
                  } truncate max-w-[200px]`}
                >
                  {item.label}
                </span>
              )}
              
              {!isLast && (
                <span className="mx-2 text-muted-foreground">/</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
} 
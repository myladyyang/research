import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface RelatedItem {
  id: string;
  title: string;
  url: string;
}

interface RelatedContentProps {
  items: RelatedItem[];
  title?: string;
  className?: string;
}

export function RelatedContent({
  items,
  title = "相关研究",
  className = "",
}: RelatedContentProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className={`mt-10 border-t border-border pt-8 ${className}`}>
      <h2 className="text-2xl font-semibold mb-6">{title}</h2>
      <div className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.url}
            className="py-4 border-b border-border flex justify-between items-center hover:bg-accent/20 px-3 -mx-3 rounded-md transition-colors group"
          >
            <span className="text-base group-hover:text-primary transition-colors">{item.title}</span>
            <span className="text-muted-foreground group-hover:text-primary transition-colors">
              <ChevronRight size={18} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
} 
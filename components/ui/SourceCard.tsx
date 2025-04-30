import React from "react";
import Image from "next/image";

interface SourceCardProps {
  title: string;
  source: string;
  sourceIcon?: string;
  imageUrl?: string;
  className?: string;
}

export function SourceCard({
  title,
  source,
  sourceIcon,
  imageUrl,
  className = "",
}: SourceCardProps) {
  return (
    <div className={`flex-1 min-w-[220px] max-w-[280px] border-2 border-border rounded-xl overflow-hidden flex flex-col shadow-sm ${className}`}>
      <div className="p-4 flex items-center gap-3 text-sm text-muted-foreground border-b border-border">
        <div className="w-5 h-5 rounded-full bg-muted overflow-hidden flex items-center justify-center text-primary">
          {sourceIcon ? (
            <span className="text-base">{sourceIcon}</span>
          ) : (
            <span className="font-semibold">{source.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <span className="font-medium">{source}</span>
      </div>
      
      <div className="p-4 flex-1">
        {imageUrl && (
          <div className="w-full h-[120px] mb-3 relative rounded-lg overflow-hidden">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <h3 className="text-base font-medium line-clamp-3">{title}</h3>
      </div>
    </div>
  );
} 
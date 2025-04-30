import React from "react";

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingState({
  message = "加载中...",
  size = "md",
  className = "",
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} border-t-transparent border-primary rounded-full animate-spin`}
      />
      {message && <p className="mt-2 text-sm text-muted-foreground">{message}</p>}
    </div>
  );
} 
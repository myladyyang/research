import React from "react";
import { Button } from "./Button";

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorDisplay({
  title = "发生错误",
  message = "处理您的请求时出错了，请稍后再试。",
  onRetry,
  className = "",
}: ErrorDisplayProps) {
  return (
    <div
      className={`p-4 border border-destructive/20 bg-destructive/10 rounded-lg ${className}`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-destructive"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-medium text-destructive mb-1">
            {title}
          </h3>
          <p className="text-sm text-destructive/80">{message}</p>
          {onRetry && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                重试
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
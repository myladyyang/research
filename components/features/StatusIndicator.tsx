import React from "react";
import { Settings, FileSearch, Database, ChartBar } from "lucide-react";

interface StatusIndicatorProps {
  status: string;
  isVisible: boolean;
}

export function StatusIndicator({
  status,
  isVisible,
}: StatusIndicatorProps) {
  if (!isVisible) return null;

  // 根据状态文本选择合适的图标
  const getIcon = () => {
    if (status.includes("数据") || status.includes("获取")) {
      return <Database className="h-5 w-5 mr-3 text-indigo-500 animate-pulse" />;
    } else if (status.includes("分析") || status.includes("评估")) {
      return <ChartBar className="h-5 w-5 mr-3 text-emerald-500 animate-pulse" />;
    } else if (status.includes("研究") || status.includes("发现")) {
      return <FileSearch className="h-5 w-5 mr-3 text-amber-500 animate-pulse" />;
    }
    return <Settings className="h-5 w-5 mr-3 text-primary animate-spin" />;
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-background/95 backdrop-blur-sm border border-border/70 rounded-full shadow-lg px-5 py-3.5">
        <div className="flex items-center">
          {getIcon()}
          <span className="font-medium text-sm">{status}</span>
          <span className="ml-3 flex space-x-1">
            <span className="h-2 w-2 rounded-full bg-primary/70 animate-pulse" style={{ animationDelay: '0ms' }}></span>
            <span className="h-2 w-2 rounded-full bg-primary/70 animate-pulse" style={{ animationDelay: '300ms' }}></span>
            <span className="h-2 w-2 rounded-full bg-primary/70 animate-pulse" style={{ animationDelay: '600ms' }}></span>
          </span>
        </div>
      </div>
    </div>
  );
} 
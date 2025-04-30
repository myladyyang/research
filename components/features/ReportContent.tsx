import React from "react";
import Link from "next/link";

interface ReportContentProps {
  title: string;
  content: React.ReactNode;
  sources?: Array<{
    id: string;
    title: string;
    url: string;
    source: string;
  }>;
  className?: string;
}

export function ReportContent({
  title,
  content,
  sources,
  className = "",
}: ReportContentProps) {
  return (
    <div className={`w-full max-w-3xl mx-auto ${className}`}>
      <div className="mb-6">
        <div className="flex items-center text-sm text-muted-foreground mb-3">
          <Link href="/" className="hover:text-primary">
            首页
          </Link>
          <span className="mx-2">/</span>
          <Link href="/research" className="hover:text-primary">
            研究
          </Link>
          <span className="mx-2">/</span>
          <span className="text-primary font-medium truncate max-w-[300px]">
            {title}
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold mb-4 text-foreground">
          {title}
        </h1>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>生成时间: {new Date().toLocaleDateString()}</span>
          <span>来源: {sources?.length || 0} 个数据源</span>
        </div>
      </div>

      <div className="report-tabs mb-6">
        <div className="flex border-b border-border">
          <div className="px-4 py-2 text-sm font-medium text-primary border-b-2 border-primary">
            报告
          </div>
          <div className="px-4 py-2 text-sm font-medium text-muted-foreground">
            数据
          </div>
          <div className="px-4 py-2 text-sm font-medium text-muted-foreground">
            来源
          </div>
        </div>
      </div>

      <div className="report-content prose prose-sm max-w-none mb-8">
        {content}
      </div>

      {sources && sources.length > 0 && (
        <div className="mt-8 pt-6 border-t border-border">
          <h2 className="text-lg font-semibold mb-4">参考来源</h2>
          <ul className="space-y-2">
            {sources.map((source) => (
              <li key={source.id}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline text-primary"
                >
                  {source.title} - {source.source}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-border flex gap-4">
        <button className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2">
          <span>📝</span> 导出报告
        </button>
        <button className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2">
          <span>🔄</span> 刷新数据
        </button>
        <button className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2">
          <span>💾</span> 保存
        </button>
      </div>
    </div>
  );
} 
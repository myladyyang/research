import React, { useState, useEffect, useRef, useCallback } from "react";
import { FileText, Download, Loader2, Settings, BarChart, ListChecks } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { RelatedContent } from "@/components/features/RelatedContent";
import { Button } from "@/components/ui/Button";
import { StatusIndicator } from "@/components/features/StatusIndicator";
import Image from "next/image";
import { 
  ResearchReportProps,
  Task
} from "@/types/chat";
import "@/app/githubcss.css"; // 引入GitHub Markdown CSS

// 扩展Task类型以兼容不同的格式
interface ExtendedTask extends Task {
  name?: string;
  description?: string;
}

// 仅保留动画相关的CSS
const animationStyles = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.4s ease-out forwards;
  opacity: 0;
}


/* 交错动画 - 为不同元素设置不同的动画延迟 */
.markdown-body > p { animation-delay: 0.05s; }
.markdown-body > ul, .markdown-body > ol { animation-delay: 0.1s; }
.markdown-body > blockquote { animation-delay: 0.15s; }
.markdown-body > h2 { animation-delay: 0.05s; }
.markdown-body > h3 { animation-delay: 0.08s; }
.markdown-body > img { animation-delay: 0.2s; }

/* 加载动画 */
@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

.animate-pulse {
  animation: pulse 1.5s infinite ease-in-out;
}

/* 逐段显示动画 */
.stream-section {
  opacity: 0;
  transform: translateY(5px);
  animation: fadeIn 0.5s ease-out forwards;
}

/* 内容容器 - 固定最小高度避免布局跳动 */
.content-container {
  min-height: 300px; /* 提供足够空间防止布局跳动 */
  position: relative;
}

/* 避免布局跳动的占位样式 */
.content-placeholder {
  height: 1px;
  margin-bottom: 300px;
}

/* 来源引用样式 */
.source-reference {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background-color: var(--primary);
  color: var(--primary-foreground);
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 0.25rem;
  border: 1px solid var(--primary);
  opacity: 0.9;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* 段落间距优化 */
.content-section {
  margin-bottom: 0.8rem;
}
`;

export function ResearchReport({
  message,
  markdownContent,
  sources = [],
  related = [],
  data,
  status,
  date,
  isLoading = false,
  isContentComplete = false,
  onExport,
  versions = [],
  currentVersion,
  onVersionChange,
  tasks = [],
}: ResearchReportProps) {
  // 内容节点的前一个状态，用于对比新内容
  const previousContentRef = useRef<string>("");
  // 用于存储分段的内容
  const [contentSections, setContentSections] = useState<string[]>([]);
  // 最新内容区域的ref
  const latestContentRef = useRef<HTMLDivElement>(null);
  // 内容容器ref
  const contentContainerRef = useRef<HTMLDivElement>(null);
  // 当前激活的标签页
  const [tab, setTab] = useState<"report" | "data" | "source" | "tasks">("report");
  // 状态指示器控制
  const [currentStatus, setCurrentStatus] = useState(status || "初始化研究...");

  // 状态指示器文本更新
  useEffect(() => {
    if (status) {
      setCurrentStatus(status);
    } 
  }, [status, isContentComplete, isLoading]);



  // 添加滚动跟踪和控制
  const scrollToBottom = useCallback(() => {
    // 滚动到内容容器底部
    if (contentContainerRef.current) {
      const containerBottom = contentContainerRef.current.getBoundingClientRect().bottom;
      const scrollPosition = containerBottom + window.scrollY - window.innerHeight + 100;
      window.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
      console.log("滚动到新内容", scrollPosition);
    }
  }, []);

  
  // 将内容分成有意义的段落
  const splitContentIntoSections = (content: string): string[] => {
    // 使用更智能的分段策略，处理流式内容
    
    // 1. 首先按双换行符分割获取原始段落
    const rawParagraphs = content.split(/\n\n+/);
    
    // 2. 合并段落，确保标题与其内容在一起
    const sections: string[] = [];
    let currentSection = "";
    
    for (let i = 0; i < rawParagraphs.length; i++) {
      const paragraph = rawParagraphs[i].trim();
      if (!paragraph) continue; // 跳过空段落
      
      // 检查是否是标题行
      const isHeading = /^#{1,6} /.test(paragraph);
      
      // 如果是新标题且当前段落不为空，保存当前段落并开始新段落
      if (isHeading && currentSection.trim()) {
        sections.push(currentSection.trim());
        currentSection = paragraph + "\n\n";
      }
      // 如果是标题且当前段落为空，开始新段落
      else if (isHeading) {
        currentSection = paragraph + "\n\n";
      }
      // 如果是列表项或引用的开始
      else if (/^([\*\-\+] |\d+\. |> )/.test(paragraph)) {
        // 如果当前段落已有内容且不是相关列表，则保存并开始新段落
        if (currentSection.trim() && !currentSection.match(/([\*\-\+] |\d+\. |> )[^\n]*$/)) {
          sections.push(currentSection.trim());
          currentSection = paragraph + "\n\n";
        } else {
          currentSection += paragraph + "\n\n";
        }
      }
      // 常规段落
      else {
        // 如果当前段落非空，加上段落内容
        if (currentSection) {
          currentSection += paragraph + "\n\n";
        } else {
          currentSection = paragraph + "\n\n";
        }
        
        // 如果累积内容过长，保存当前段落
        if (currentSection.length > 1000) {
          sections.push(currentSection.trim());
          currentSection = "";
        }
      }
    }
    
    // 添加最后一个段落
    if (currentSection.trim()) {
      sections.push(currentSection.trim());
    }
    
    return sections;
  };

  // 监听markdownContent变化，更新内容分段
  useEffect(() => {
    // 检查是否有内容可显示
    const hasContent = markdownContent && markdownContent.trim() !== '' && markdownContent.trim() !== `# ${message}`;
    
    if (hasContent) {
      const currentContent = markdownContent;
      
      // 检查是否有新内容
      if (currentContent !== previousContentRef.current) {
        // 无论是全新内容还是增量内容，都重新分段
        const sections = splitContentIntoSections(currentContent);
        setContentSections(sections);
        
        // 更新引用值
        previousContentRef.current = currentContent;
        
        // 内容更新后滚动到底部 - 延迟执行以等待DOM更新
        setTimeout(scrollToBottom, 100);
      }
    } else {
      // 没有内容时重置
      setContentSections([]);
      previousContentRef.current = "";
    }
  }, [markdownContent, message, scrollToBottom]);
  
  // 生成报告内容，支持流式渲染
  const renderContent = () => {
    // 检查是否有内容可显示
    const hasContent = markdownContent && markdownContent.trim() !== '' && markdownContent.trim() !== `# ${message}`;
    
    if (!hasContent && isLoading) {
      return (
        <div className="content-container py-10 flex flex-col items-center justify-center space-y-4 animate-pulse">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-lg text-muted-foreground">正在准备研究报告...</p>
          <div className="content-placeholder"></div>
        </div>
      );
    } else if (!hasContent) {
      return (
        <div className="content-container py-10 flex flex-col items-center justify-center space-y-4">
          <p className="text-lg text-muted-foreground">尚无研究报告内容</p>
          <div className="content-placeholder"></div>
        </div>
      );
    }

    // 使用分段内容渲染
    return (
      <div ref={contentContainerRef} className="content-container mb-12 markdown-body">
        {contentSections.map((section, index) => (
          <div 
            key={index} 
            className={`content-section ${!isContentComplete && isLoading ? "stream-section" : ""}`}
            style={{ 
              animationDelay: !isContentComplete && isLoading ? `${Math.min(index * 0.12, 1.5)}s` : "0s",
            }}
            ref={index === contentSections.length - 1 ? latestContentRef : null}
          >
            <ReactMarkdown
              components={{
                // 自定义图片组件以避免嵌套问题
                img: ({ alt, src, ...props }) => {
                  // 过滤掉不兼容的props，提取必要属性
                  const { width, height, ...otherProps } = props;
                  return (
                    <Image 
                      src={src as string}
                      alt={alt || "图表图像"}
                      width={width ? Number(width) : 800} // 转换为数字或使用默认值
                      height={height ? Number(height) : 600} // 转换为数字或使用默认值
                      {...otherProps}
                    />
                  );
                },
                // 自定义引用标记组件
                sup: ({ children }) => (
                  <sup className="source-reference">{children}</sup>
                ),
              }}
              remarkPlugins={[remarkGfm]}
            >
              {section}
            </ReactMarkdown>
          </div>
        ))}
        
        {/* 添加底部占位区，保持滚动稳定，并作为滚动锚点 */}
        <div style={{ height: '40px' }} />
    
      </div>
    );
  };


  return (
    <div className="w-full max-w-none sm:max-w-full lg:max-w-screen-xl mx-auto pt-4 sm:pt-8 pb-16 px-3 sm:px-6 lg:px-8 bg-slate-50/70">
      {/* 添加内联样式 */}
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      
      {/* 标题、时间、来源数 */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              {message}
            </h1>
            <div className="mt-1 text-sm text-slate-500 flex flex-wrap gap-4">
              <span>生成时间: {date}</span>
              <span>来源: {sources.length} 个数据源</span>
              {isLoading && <span className="text-primary animate-pulse">正在更新...</span>}
            </div>
          </div>

          {/* 版本选择器 */}
          {versions.length > 1 && (
            <div className="md:ml-4 mt-4 md:mt-0">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">版本:</span>
                <select 
                  className="text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white"
                  value={currentVersion}
                  onChange={(e) => onVersionChange && onVersionChange(Number(e.target.value))}
                >
                  {versions.sort().map(version => (
                    <option key={version} value={version}>V{version}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors relative ${
            tab === "report" 
              ? "text-primary border-primary" 
              : "text-slate-600 border-transparent hover:text-primary hover:border-primary/50"
          }`}
          onClick={() => setTab("report")}
        >
          报告
          {!isContentComplete && (
            <Settings className="h-4 w-4 ml-2 inline-block animate-spin text-primary" />
          )}
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === "data" 
              ? "text-primary border-primary" 
              : "text-slate-600 border-transparent hover:text-primary hover:border-primary/50"
          }`}
          onClick={() => setTab("data")}
        >
          数据
          <BarChart className="h-4 w-4 ml-2 inline-block text-current" />
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === "tasks" 
              ? "text-primary border-primary" 
              : "text-slate-600 border-transparent hover:text-primary hover:border-primary/50"
          }`}
          onClick={() => setTab("tasks")}
        >
          任务
          <ListChecks className="h-4 w-4 ml-2 inline-block text-current" />
          {tasks.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium">
              {tasks.length}
            </span>
          )}
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === "source" 
              ? "text-primary border-primary" 
              : "text-slate-600 border-transparent hover:text-primary hover:border-primary/50"
          }`}
          onClick={() => setTab("source")}
        >
          来源
          {sources.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium">
              {sources.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab内容区域 */}
      <div className="min-h-[500px]">
        {tab === "report" && (
          <div className="card border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="font-medium text-slate-800 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" />
                研究报告内容
              </h3>
            </div>
            <div className="p-6 bg-white">
              {renderContent()}
            </div>
          </div>
        )}
        
        {tab === "data" && (
          <div className="card border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="font-medium text-slate-800 flex items-center gap-1.5">
                <BarChart className="h-4 w-4 text-primary" />
                数据分析
              </h3>
            </div>
            <div className="p-6 bg-white">
              {data ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {JSON.stringify(data)}
                </ReactMarkdown>
              ) : (
                <div className="py-10 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                    <BarChart className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-base text-slate-600">正在整理数据分析...</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {tab === "tasks" && (
          <div className="card border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="font-medium text-slate-800 flex items-center gap-1.5">
                <ListChecks className="h-4 w-4 text-primary" />
                研究任务
              </h3>
            </div>
            <div className="p-6 bg-white">
              {tasks && tasks.length > 0 ? (
                <div className="space-y-4">
                  {tasks.map((task) => {
                    // 将task转换为ExtendedTask类型
                    const extendedTask = task as ExtendedTask;
                    return (
                      <div 
                        key={extendedTask.id} 
                        className="p-4 border border-slate-200 rounded-lg transition-all hover:border-primary/30 hover:bg-slate-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              extendedTask.status === 'finished' || extendedTask.status === 'succeeded'
                                ? 'bg-green-100 text-green-600' 
                                : extendedTask.status === 'failed' 
                                ? 'bg-red-100 text-red-600' 
                                : 'bg-blue-100 text-blue-600'
                            }`}>
                              {extendedTask.status === 'finished' || extendedTask.status === 'succeeded' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M20 6L9 17l-5-5" />
                                </svg>
                              ) : extendedTask.status === 'failed' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-slate-800">{extendedTask.title || extendedTask.name}</h4>
                              <p className="text-sm text-slate-500">{extendedTask.nodeType || extendedTask.description}</p>
                            </div>
                          </div>
                          
                          <div className="text-right text-sm text-slate-500">
                            {extendedTask.elapsedTime && (
                              <div>耗时: {(extendedTask.elapsedTime / 1000).toFixed(1)}s</div>
                            )}
                            {extendedTask.totalTokens && (
                              <div>Token: {extendedTask.totalTokens}</div>
                            )}
                          </div>
                        </div>
                        
                        {extendedTask.error && (
                          <div className="mt-2 p-2 bg-red-50 text-red-700 rounded text-sm">
                            错误: {extendedTask.error}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                    <ListChecks className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-base text-slate-600">尚无任务数据</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {tab === "source" && (
          <div className="card border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="font-medium text-slate-800 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" />
                参考来源
              </h3>
            </div>
            <div className="p-6 bg-white">
              <ul className="space-y-3">
                {sources.map((source, index) => (
                  <li key={source.id} className="animate-in fade-in-50 duration-300" style={{ animationDelay: `${index * 100}ms` }}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:underline text-primary flex items-center group"
                    >
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-primary/10 text-primary mr-3 text-xs font-semibold group-hover:bg-primary group-hover:text-white transition-colors">
                        {index + 1}
                      </span>
                      {source.title} - <span className="ml-1 text-slate-500">{source.source}</span>
                    </a>
                  </li>
                ))}
              </ul>
              {sources.length === 0 && <p className="text-slate-500">暂无参考来源</p>}
            </div>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      {isContentComplete && (
        <div className="flex flex-wrap gap-4 mt-6">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onExport} 
            leftIcon={<Download className="w-4 h-4" />}
            className="text-sm border border-slate-200 hover:bg-slate-50"
          >
            导出报告
          </Button>
        </div>
      )}

      {/* 相关研究 */}
      {related && related.length > 0 && (
        <div className="mt-8">
          <RelatedContent items={related} />
        </div>
      )}

      {/* 状态指示器 */}
      <StatusIndicator 
        status={currentStatus}
        isVisible={!isContentComplete}
      />
    </div>
  );
} 
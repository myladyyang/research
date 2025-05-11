"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { ResearchReport } from "@/components/features/ResearchReport";
import { useResearchManager } from "@/hooks/useResearchManager";
import { UploadedFile, ResearchResult, Research } from "@/types/chat";

export default function ResearchReportPage() {
  const params = useParams();
  const id = params.id as string;
  const [researchDataReady, setResearchDataReady] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  // 使用初始会话创建管理器
  const manager = useResearchManager();

  // 添加一个标记，避免重复启动SSE
  const hasStartedSSE = useRef(false);

  // 加载报告
  useEffect(() => {
    manager.load(id).then((loadedReport: Research) => {
      setResearchDataReady(true);

      // 使用Promise返回的数据而非状态
      if (loadedReport.results && loadedReport.results.length > 0) {
        const latestVersion = Math.max(...loadedReport.results.map((r: ResearchResult) => r.version));
        setSelectedVersion(latestVersion);
      }
    }).catch(error => {
      console.error("加载报告失败:", error);
    });
  }, [id]);
  
  // 获取当前选择的结果
  const currentResult = useCallback((): ResearchResult | undefined => {
    if (!manager.report.results || manager.report.results.length === 0) {
      return manager.report.currentResult;
    }
    
    // 如果有选择的版本，查找对应的结果
    if (selectedVersion !== null) {
      return manager.report.results.find(r => r.version === selectedVersion);
    }
    
    // 默认返回当前结果
    return manager.report.currentResult;
  }, [manager.report.results, manager.report.currentResult, selectedVersion]);
  
  // 提取所有需要的状态数据
  const result = currentResult();
  const [isContentComplete, setIsContentComplete] = useState(result?.isComplete || false);
  const [isLoading, setIsLoading] = useState(!result?.isComplete);
  
  // 监听loading状态和content变化，设置内容完成状态
  useEffect(() => {
    if (researchDataReady) {
      const result = currentResult();
      console.log("result", result);
      console.log("result is complete", result?.isComplete);
      if (result?.isComplete) {
        console.log("result is complete", result);
        // 如果结果已完成，直接设置状态
        setIsContentComplete(true);
        setIsLoading(false);
        // 重置标记，允许在切换到未完成版本时重新启动
        hasStartedSSE.current = false;
      } else {
        // 如果结果未完成且是当前结果，且还没启动过SSE
        if ((!selectedVersion || selectedVersion === manager.report.currentResult?.version) && !hasStartedSSE.current) {
          // 标记已启动SSE，避免重复调用
          hasStartedSSE.current = true;
          manager.report.fetch();
          setIsContentComplete(false);
          setIsLoading(true);
        }
      }
    }
  }, [researchDataReady, currentResult, selectedVersion, manager.report]);

  // 处理后续提问
  const handleFollowup = useCallback(async (message: string, files?: UploadedFile[], model?: string, source?: string) => {
    console.log("提交后续问题", message, files, model, source);
  }, []);

  // 导出报告函数
  const handleExport = useCallback(() => {
    console.log("导出报告", manager.report.id);
    // 导出逻辑实现
  }, [manager.report.id]);

  // 切换版本
  const handleVersionChange = useCallback((version: number) => {
    setSelectedVersion(version);
  }, []);
  
  // 获取当前报告的标题
  const reportTitle = manager.report.title || "";
  
  // 生成默认面包屑
  const breadcrumbs = [
    { label: "首页", href: "/" },
    { label: "个人空间", href: "/myspace" },
    { label: reportTitle || "研究报告", isCurrent: true },
  ];

  // 预处理props值，避免频繁重新计算
  const sources = manager.sources.getAll();
  const relatedItems = manager.related.getItems();
  
  return (
    <ResearchReport 
      message={reportTitle}
      markdownContent={result?.markdownContent || ""}
      sources={sources}
      related={relatedItems}
      date={manager.report.date}
      data={result?.data as Record<string, unknown> || {}}
      tasks={result?.tasks || []}
      status={result?.status || ""}
      isContentComplete={isContentComplete}
      isLoading={isLoading}
      breadcrumbs={breadcrumbs}
      onSendFollowup={handleFollowup}
      onExport={handleExport}
      versions={manager.report.results?.map(r => r.version) || []}
      currentVersion={selectedVersion || undefined}
      onVersionChange={handleVersionChange}
    />
  );
} 
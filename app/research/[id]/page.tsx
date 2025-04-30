"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { ResearchReport } from "@/components/features/ResearchReport";
import { useResearchManager } from "@/hooks/useResearchManager";
import { UploadedFile } from "@/types/chat";

export default function ResearchReportPage() {
  const params = useParams();
  const id = params.id as string;

  const [researchDataReady, setResearchDataReady] = useState(false);

  // 使用初始会话创建管理器
  const manager = useResearchManager();


  // 加载报告
  useEffect(() => {
    manager.load(id).then(() => {
      setResearchDataReady(true);
    }).catch(error => {
      console.error("加载报告失败:", error);
    });
  }, [id]);
  
  // 提取所有需要的状态数据
  const [isContentComplete, setIsContentComplete] = useState(manager.report.isComplete);
  const [isLoading, setIsLoading] = useState(!manager.report.isComplete);
  
  // 监听loading状态和content变化，设置内容完成状态
  useEffect(() => {
    if (researchDataReady) {
      if (manager.report.isComplete) {
        // 延迟一点，确保内容已经完全渲染
        const timer = setTimeout(() => {
          setIsContentComplete(true);
          setIsLoading(false);
        }, 500);
        return () => clearTimeout(timer);
      } else {
        //stream content
        manager.report.fetch();
        setIsContentComplete(false);
        setIsLoading(true);
      }
    } 
  }, [researchDataReady, manager.report.isComplete]);

  // 处理后续提问
  const handleFollowup = useCallback(async (message: string, files?: UploadedFile[], model?: string, source?: string) => {
    console.log("提交后续问题", message, files, model, source);
  }, []);

  // 导出报告函数
  const handleExport = useCallback(() => {
    console.log("导出报告", manager.report.id);
    // 导出逻辑实现
  }, [manager.report.id]);

  
  // 获取当前报告的标题
  const reportTitle = manager.report.title || "";
  
  // 生成默认面包屑
  const breadcrumbs = [
    { label: "首页", href: "/" },
    { label: "研究", href: "/research" },
    { label: reportTitle || "研究报告", isCurrent: true },
  ];

  // 预处理props值，避免频繁重新计算
  const sources = manager.sources.getAll();
  const relatedItems = manager.related.getItems();
  return (
    <ResearchReport 
      message={reportTitle}
      markdownContent={manager.report.content}
      sources={sources}
      related={relatedItems}
      date={manager.report.date}
      data={manager.report.data}
      status={manager.report.status}
      isContentComplete={isContentComplete}
      isLoading={isLoading}
      breadcrumbs={breadcrumbs}
      onSendFollowup={handleFollowup}
      onExport={handleExport}
    />
  );
} 
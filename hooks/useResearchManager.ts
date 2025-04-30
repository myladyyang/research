import { useState, useCallback, useRef, useEffect } from "react";
import { Research, ResearchQuestion } from "@/types/chat";
import { researchService, StreamChunk } from '@/services/research';



/**
 * 研究管理器Hook - 闭包模式
 * 提供面向对象风格的API，隐藏SSE和流式处理实现细节
 */
export function useResearchManager() {
  
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const abortControllerRef = useRef<(() => void) | null>(null);
  const contentBufferRef = useRef<string>("");
  const [report, setReport] = useState<Research | null>(null);
  

  // 断开SSE连接
  const disconnectSSE = useCallback(() => {
    if (abortControllerRef.current) {
      console.log("中止streamResearch请求");
      abortControllerRef.current();
      abortControllerRef.current = null;
    }
  }, []);

  // 处理流式数据
  const handleStreamChunk = useCallback((chunk: StreamChunk) => {
    
    // 根据返回的chunk类型更新报告内容
    if (chunk.content) {
      // 更新内容缓冲区
      contentBufferRef.current += chunk.content;
      
      // 更新报告内容
      setReport(prevReport => ({
        ...prevReport || {},
        markdownContent: contentBufferRef.current
      }) as Research);
      
      console.log(`内容已更新，当前长度: ${contentBufferRef.current.length}`);
    }
    
    if (chunk.sources) {

      // 检查是否为空数组
      if (Array.isArray(chunk.sources) && chunk.sources.length > 0) {
        setReport(prevReport => ({
          ...prevReport || {},
          sources: chunk.sources
        }) as Research);
        console.log(`已更新sources数据，长度: ${chunk.sources.length}`);
      } else {
        console.log(`忽略空的sources数据`);
      }
    }
    
    if (chunk.related) {
      
      // 检查是否为空数组
      if (Array.isArray(chunk.related) && chunk.related.length > 0) {
        setReport(prevReport => ({
          ...prevReport || {},
          related: chunk.related
        }) as Research);
        console.log(`已更新related数据，长度: ${chunk.related.length}`);
      } else {
        console.log(`忽略空的related数据`);
      }
    }

    if (chunk.status) {
      console.log(`收到status数据:`, JSON.stringify(chunk.status, null, 2));
      setReport(prevReport => ({
        ...prevReport || {},
        status: chunk.status
      }) as Research);
    }

    if (chunk.data) {
      console.log("收到data数据:", chunk.data);
      setReport(prevReport => ({
        ...prevReport || {},
        data: chunk.data
      }) as Research);

    }
    
    if (chunk.status === 'complete') {
      // 完成流式传输
      console.log('研究报告生成完成');
      setReport(prevReport => ({
        ...prevReport || {},
        complete: true
      }) as Research);
      
      // 断开SSE连接
      disconnectSSE();
    }
  }, [disconnectSSE]);
  
  // 连接SSE并启动流程
  const connectSSE = useCallback(() => {
    try {
      console.log("===== 使用researchService启动流式处理 =====");
      
      
      // 断开任何现有的SSE连接
      if (abortControllerRef.current) {
        console.log("断开现有的SSE连接");
        abortControllerRef.current();
        abortControllerRef.current = null;
      }
      
      // 重置内容缓冲区
      contentBufferRef.current = "";
      console.log("内容缓冲区已重置");
            
      // 使用researchService启动流式请求
      console.log("调用researchService.streamResearch... with currentReportId:", currentReportId);
      if (currentReportId) {
        const streamResponse = researchService.streamResearch(
          currentReportId,
          handleStreamChunk // 传入处理流数据的回调函数
        );
      
      // 保存中止函数，以便之后可以中止请求
      abortControllerRef.current = streamResponse.abort;
      console.log("SSE连接已初始化，abort函数已保存");
      }else{
        console.log("没有报告ID，无法启动SSE连接");
      }
      
    } catch (error) {
      console.error("创建SSE连接失败:", error);
    }
  }, [currentReportId]);





  // 当组件卸载时，中止当前请求
  useEffect(() => {
    return () => {
      disconnectSSE();
      if (abortControllerRef.current) {
        abortControllerRef.current();
      }
    };
  }, [disconnectSSE]);
  
  // 创建闭包对象，封装所有功能
  return {
    load(reportId: string)  {
      return new Promise((resolve, reject) => {
        if (reportId) {
          researchService.getResearch(reportId).then(report => {
            setReport(report);
            setCurrentReportId(reportId);
            resolve(report);
          }).catch(error => {
            reject(error);
          });
        } else {
          reject(new Error("报告ID不能为空"));
        }
      });
    },
    // 报告状态和内容
    report: {
      id: currentReportId,
      title: report?.title || "",
      content: report?.markdownContent || "",
      data: report?.data || "",
      date: report?.date,
      isComplete: !!report?.complete,
      fetch: connectSSE,
      status: report?.status || ""
    },
    
    // 参考来源相关方法
    sources: {
      getAll: () => report?.sources || [],
      count: report?.sources?.length || 0,
      // 提供排序方法
      getSortedByRelevance: () => {
        return [...(report?.sources || [])].sort((a, b) => {
          // 假设mainSources中的顺序表示相关性
          const aIndex = report?.sources?.findIndex(s => s.id === a.id) ?? -1;
          const bIndex = report?.sources?.findIndex(s => s.id === b.id) ?? -1;
          
          // 如果都不在mainSources中，按原顺序
          if (aIndex === -1 && bIndex === -1) return 0;
          // 如果只有一个在mainSources中，它优先
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          // 都在mainSources中，按索引排序
          return aIndex - bIndex;
        });
      }
    },
    
    // 相关内容方法
    related: {
      getItems: () => report?.related || [],
      count: report?.related?.length || 0,
      isEmpty: !(report?.related?.length)
    },
    
    // 问题提交
    question: {
      submit: async (question: ResearchQuestion) => {
        try {
          // 调用addQuestion并直接返回它，保持Promise特性
          const reportId = await researchService.addQuestion(question);
          return reportId;
        } catch (error) {
          console.error("提交问题失败:", error);
          throw error; // 重新抛出异常以便调用者处理
        }
      },
    },
    
    // 实用工具方法
    utils: {
      // 获取报告摘要（提取第一段内容）
      getSummary: () => {
        const content = report?.markdownContent || "";
        const firstParagraph = content.split('\n\n')[0];
        // 移除标题标记和换行符
        return firstParagraph
          .replace(/^#+ .*$/gm, '')
          .replace(/\n/g, ' ')
          .trim();
      },
    }
  };
} 
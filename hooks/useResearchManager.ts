import { useState, useCallback, useRef, useEffect } from "react";
import { Research, ResearchResult, Source, RelatedItem } from "@/types/chat";


// 从研究服务移植过来的类型定义
export type StreamResponse = {
  promise: Promise<void>;
  abort: () => void;
};

export interface StreamChunk {
  content?: string;
  sources?: Source[];
  related?: RelatedItem[];
  status?: string;
  data?: Record<string, unknown>;
}

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

  // 更新当前结果
  const updateCurrentResult = useCallback((updateFn: (result: ResearchResult) => ResearchResult) => {
    setReport(prevReport => {
      if (!prevReport) return null;
      
      // 获取当前结果或创建新结果
      const currentResult = prevReport.currentResult || {
        id: "",
        version: 1,
        createdAt: new Date().toISOString(),
        questionId: prevReport.request && typeof prevReport.request === 'object' && 'id' in prevReport.request ? 
          (prevReport.request.id as string) || "" : "",
        researchId: prevReport.id,
        isComplete: false,
        progress: 0
      } as ResearchResult;
      
      // 更新结果
      const updatedResult = updateFn(currentResult);
      
      // 如果results数组不存在，则创建
      const results = prevReport.results || [];
      
      // 查找并更新结果，或添加新结果
      const resultIndex = results.findIndex(r => r.id === updatedResult.id);
      const updatedResults = resultIndex >= 0 
        ? [...results.slice(0, resultIndex), updatedResult, ...results.slice(resultIndex + 1)]
        : [...results, updatedResult];
      
      return {
        ...prevReport,
        currentResult: updatedResult,
        results: updatedResults
      };
    });
  }, []);

  // 处理流式数据
  const handleStreamChunk = useCallback((chunk: StreamChunk) => {
    
    // 根据返回的chunk类型更新报告内容
    if (chunk.content) {
      // 更新内容缓冲区
      contentBufferRef.current += chunk.content;
      
      // 更新报告内容
      updateCurrentResult(currentResult => ({
        ...currentResult,
        markdownContent: contentBufferRef.current,
        isComplete: false
      }));
      
      //console.log(`内容已更新，当前长度: ${contentBufferRef.current.length}`);
    }
    
    if (chunk.sources) {
      // 检查是否为空数组
      if (Array.isArray(chunk.sources) && chunk.sources.length > 0) {
        updateCurrentResult(currentResult => ({
          ...currentResult,
          sources: chunk.sources
        }));
        //console.log(`已更新sources数据，长度: ${chunk.sources.length}`);
      } else {
        //console.log(`忽略空的sources数据`);
      }
    }
    
    if (chunk.related) {
      
      // 检查是否为空数组
      if (Array.isArray(chunk.related) && chunk.related.length > 0) {
        setReport(prevReport => ({
          ...prevReport || {},
          related: chunk.related
        }) as Research);
        //console.log(`已更新related数据，长度: ${chunk.related.length}`);
      } else {
        //console.log(`忽略空的related数据`);
      }
    }

    if (chunk.status) {
      //console.log(`收到status数据:`, JSON.stringify(chunk.status, null, 2));
      updateCurrentResult(currentResult => ({
        ...currentResult,
        status: chunk.status
      }));
    }
    

    if (chunk.data) {
      //console.log("收到data数据:", chunk.data);
      updateCurrentResult(currentResult => ({
        ...currentResult,
        data: chunk.data as unknown as Record<string, unknown>
      }));
    }
    
    if (chunk.status === 'complete') {
      // 完成流式传输
      console.log('研究报告生成完成');
      
      updateCurrentResult(currentResult => ({
        ...currentResult,
        status: 'complete',
        isComplete: true
      }));
      
      setReport(prevReport => {
        if (!prevReport) return null;
        return {
          ...prevReport,
          currentResult: {
            ...prevReport.currentResult as ResearchResult,
            isComplete: true
          }
        };
      });

      
      // 断开SSE连接
      disconnectSSE();
    }
  }, [disconnectSSE, updateCurrentResult]);
  
  /**
   * 流式处理研究问题
   * 使用SSE实现流式响应，接收数据块并通过回调函数返回
   */
  const streamResearch = useCallback(
    (researchId: string): StreamResponse => {
      console.log("===== streamResearch 开始 =====");
      console.log("请求参数:", JSON.stringify(researchId, null, 2));
      
      // 创建控制器用于中止请求
      const controller = new AbortController();
      
      // 创建事件源变量和心跳超时变量，便于在abort时引用
      let eventSource: EventSource | null = null;
      let heartbeatTimeout: NodeJS.Timeout | null = null;
      
      // 创建Promise处理整个流式响应
      const promise = new Promise<void>(async (resolve, reject) => {
        try {
          console.log(`创建SSE连接 ID: ${researchId}`);
          
          // 创建带有生成指令的URL
          const sseUrl = `/api/research/stream/${researchId}?generate=true`;
          console.log(`SSE连接URL: ${sseUrl}`);
          
          // 检查EventSource是否可用
          if (typeof EventSource === 'undefined') {
            console.error('此浏览器不支持EventSource/SSE');
            reject(new Error('此浏览器不支持服务器发送事件(SSE)'));
            return;
          }
          
          console.log(`创建EventSource连接...`);
          
          // 创建EventSource连接 - 直接连接带有generate=true参数的GET路由
          eventSource = new EventSource(sseUrl, {
            withCredentials: true
          });
          
          console.log(`EventSource已创建, readyState:`, eventSource.readyState);
          
          // 添加心跳超时检测
          const resetHeartbeat = () => {
            if (heartbeatTimeout) clearTimeout(heartbeatTimeout);
            heartbeatTimeout = setTimeout(() => {
              console.warn('SSE心跳超时，关闭连接');
              if (eventSource) eventSource.close();
              reject(new Error('研究报告生成超时，请稍后重试'));
            }, 60000); // 60秒无心跳则超时
          };
          
          // 初始化心跳检测
          resetHeartbeat();
          console.log("心跳检测已初始化");
          

          
          // 添加heartbeat事件监听器
          eventSource.addEventListener('heartbeat', (event: MessageEvent) => {
            try {
              // 处理心跳事件，重置超时计时器
              resetHeartbeat();
              console.debug('收到SSE心跳(heartbeat):', event.data);
            } catch (error) {
              console.error('解析heartbeat事件数据失败:', error);
            }
          });
          
          eventSource.addEventListener('start', (event: MessageEvent) => {
            try {
              resetHeartbeat();
              const data = JSON.parse(event.data);
              console.log('收到start事件:', data);
              
              handleStreamChunk({
                status: 'start research',
              });
            } catch (error) {
              console.error('解析start事件数据失败:', error);
            }
          });

          eventSource.addEventListener('status', (event: MessageEvent) => {
            try {
              const data = JSON.parse(event.data);
              handleStreamChunk({
                status: data.status,
              });
            } catch (error) {
              console.error('解析status事件数据失败:', error);
            }
          });

          eventSource.addEventListener('data', (event: MessageEvent) => {
            try {
              console.log('收到data事件:', event.data);
              const data = JSON.parse(event.data);
              if (data.data) {
                handleStreamChunk({
                  data: data.data,
                });
              }
            } catch (error) {
              console.error('解析data事件数据失败:', error);
            }
          });
          
          eventSource.addEventListener('content', (event: MessageEvent) => {
            try {
              resetHeartbeat();
              console.log('收到content事件:', event.data);
              const data = JSON.parse(event.data);
              if (data.content) {
                handleStreamChunk({
                  content: data.content,
                });
              }
            } catch (error) {
              console.error('解析content事件数据失败:', error);
            }
          });
          
          eventSource.addEventListener('sources', (event: MessageEvent) => {
            try {
              resetHeartbeat();
              console.log('收到sources事件:', event.data);
              const data = JSON.parse(event.data);
              if (data.sources && Array.isArray(data.sources)) {
                handleStreamChunk({
                  sources: data.sources,
                });
              } else {
                console.warn('收到的sources不是数组:', data);
              }
            } catch (error) {
              console.error('解析sources事件数据失败:', error);
            }
          });
          
          eventSource.addEventListener('related', (event: MessageEvent) => {
            try {
              resetHeartbeat();
              console.log('收到related事件:', event.data);
              const data = JSON.parse(event.data);
              if (data.related && Array.isArray(data.related)) {
                handleStreamChunk({
                  related: data.related,
                });
              } else {
                console.warn('收到的related不是数组:', data);
              }
            } catch (error) {
              console.error('解析related事件数据失败:', error);
            }
          });
          
          eventSource.addEventListener('complete', (event: MessageEvent) => {
            console.log('收到complete事件:', event.data);
            try {
              handleStreamChunk({
                status: 'complete',
              });
              
              // 清除心跳检测
              if (heartbeatTimeout) clearTimeout(heartbeatTimeout);
              
              // 关闭连接并解析Promise
              if (eventSource) {
                eventSource.close();
                eventSource = null;
              }
              resolve();
            } catch (error) {
              console.error('解析complete事件数据失败:', error);
            }
          });
          
          eventSource.addEventListener('error', (event: MessageEvent) => {
            // 清除心跳检测
            if (heartbeatTimeout) clearTimeout(heartbeatTimeout);
            
            try {
              let errorMessage = '研究报告生成失败';
              try {
                if (event.data) {
                  const data = JSON.parse(event.data);
                  errorMessage = data.message || errorMessage;
                }
              } catch {
                // 解析错误，使用默认错误消息
              }
              
              console.error('SSE错误:', errorMessage);
              if (eventSource) {
                eventSource.close();
                eventSource = null;
              }
              reject(new Error(errorMessage));
            } catch (error) {
              console.error('处理error事件失败:', error);
              if (eventSource) {
                eventSource.close();
                eventSource = null;
              }
              reject(new Error('研究报告生成失败'));
            }
          });
          
          // 添加连接建立事件
          eventSource.addEventListener('open', () => {
            console.log(`SSE连接已建立: ${researchId}`);
          });
          
          // 添加连接成功事件
          eventSource.addEventListener('connected', (event: MessageEvent) => {
            try {
              resetHeartbeat();
              const data = JSON.parse(event.data);
              console.log('收到connected事件:', data);
            } catch (error) {
              console.error('解析connected事件数据失败:', error);
            }
          });
          
          // 添加连接关闭处理
          eventSource.addEventListener('close', () => {
            console.log(`SSE连接已关闭: ${researchId}`);
            if (heartbeatTimeout) clearTimeout(heartbeatTimeout);
          });
          
          // 添加连接错误处理
          eventSource.onerror = (event) => {
            console.error('SSE连接错误:', event);
            if (heartbeatTimeout) clearTimeout(heartbeatTimeout);
            if (eventSource) {
              eventSource.close();
              eventSource = null;
            }
            reject(new Error('SSE连接出错，请稍后重试'));
          };
          
        } catch (error) {
          console.error('初始化SSE连接失败:', error);
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          reject(error);
        }
      });

      return {
        promise,
        abort: () => {
          console.log('主动中断SSE连接...');
          try {
            // 确保安全地中止和清理资源
            if (eventSource) {
              console.log('关闭EventSource连接');
              eventSource.close();
              eventSource = null;
            }
            
            if (heartbeatTimeout) {
              console.log('清除心跳超时');
              clearTimeout(heartbeatTimeout);
              heartbeatTimeout = null;
            }
            
            // 中止fetch请求
            console.log('中止fetch请求');
            controller.abort();
          } catch (error) {
            console.error('中止SSE连接时出错:', error);
          }
        }
      };
    },
    [handleStreamChunk]
  );
  
  // 连接SSE并启动流程
  const connectSSE = useCallback(() => {
    try {
      //console.log("===== 使用researchService启动流式处理 =====");
      
      // 断开任何现有的SSE连接
      if (abortControllerRef.current) {
        console.log("断开现有的SSE连接");
        abortControllerRef.current();
        abortControllerRef.current = null;
      }
      
      // 保留已有内容，而不是重置
      if (!contentBufferRef.current && report?.currentResult?.markdownContent) {
        contentBufferRef.current = report.currentResult.markdownContent;
        //console.log("使用已有内容初始化缓冲区，长度:", contentBufferRef.current.length);
      } else {
        //console.log("使用现有缓冲区，长度:", contentBufferRef.current.length);
      }
      
      // 使用researchService启动流式请求
      //console.log("调用researchService.streamResearch... with currentReportId:", currentReportId);
      if (currentReportId) {
        const streamResponse = streamResearch(currentReportId);
      
      // 保存中止函数，以便之后可以中止请求
      abortControllerRef.current = streamResponse.abort;
      //console.log("SSE连接已初始化，abort函数已保存");
      } else {
        //console.log("没有报告ID，无法启动SSE连接");
      }
      
    } catch (error) {
      console.error("创建SSE连接失败:", error);
    }
  }, [currentReportId, streamResearch, report]);

  /**
   * 获取研究报告
   */
  const getResearch = useCallback(async (researchId: string): Promise<Research> => {
    const response = await fetch(`/api/research/${researchId}`);
    return response.json();
  }, []);



  /**
   * 获取用户的研究列表
   */
  const getUserResearches = useCallback(async (): Promise<Research[]> => {
    const response = await fetch('/api/research/user');
    return response.json();
  }, []);

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
    load(reportId: string): Promise<Research> {
      console.log("load reportId", reportId);
      return new Promise((resolve, reject) => {
        if (reportId) {
          getResearch(reportId).then(report => {
            setReport(report);
            setCurrentReportId(reportId);
            console.log("load report", report);
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
      content: report?.currentResult?.markdownContent || "",
      data: report?.currentResult?.data || {},
      date: report?.date,
      isComplete: !!report?.currentResult?.isComplete,
      fetch: connectSSE,
      status: report?.currentResult?.status || "",
      results: report?.results || [],
      currentResult: report?.currentResult
    },
    
    // 参考来源相关方法
    sources: {
      getAll: () => report?.currentResult?.sources || [],
      count: report?.currentResult?.sources?.length || 0,
      // 提供排序方法
      getSortedByRelevance: () => {
        return [...(report?.currentResult?.sources || [])].sort((a: Source, b: Source) => {
          // 假设sources中的顺序表示相关性
          const aIndex = report?.currentResult?.sources?.findIndex(s => s.id === a.id) ?? -1;
          const bIndex = report?.currentResult?.sources?.findIndex(s => s.id === b.id) ?? -1;
          
          // 如果都不在sources中，按原顺序
          if (aIndex === -1 && bIndex === -1) return 0;
          // 如果只有一个在sources中，它优先
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          // 都在sources中，按索引排序
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
    

    
    // 结果相关方法
    results: {
      getCurrent: () => report?.currentResult || null,
      getAll: () => report?.results || [],
      count: report?.results?.length || 0
    },
    
    // 提供底层API
    api: {
      streamResearch,
      getResearch,
      getUserResearches
    },
    
    // 实用工具方法
    utils: {
      // 获取报告摘要（提取第一段内容）
      getSummary: () => {
        const content = report?.currentResult?.markdownContent || "";
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
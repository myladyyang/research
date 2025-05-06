import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/services/db';

// 格式化SSE消息
const formatSSEMessage = (event: string, data: unknown, reportId: string): string => {
  // 确保数据中包含 reportId (如果是完成事件)
  if (event === 'complete' && typeof data === 'object' && data !== null) {
    data = {
      ...(data as object),
      reportId: (data as Record<string, unknown>).reportId || reportId,
      timestamp: Date.now()
    };
  }
  
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
};

// 从数据库获取最新研究结果内容
async function getLatestContent(reportId: string, resultId?: string) {
  try {
    // 获取研究报告信息
    const research = await dbService.getResearch(reportId);
    if (!research || !research.results || research.results.length === 0) {
      throw new Error(`研究报告不存在或无结果: ${reportId}`);
    }
    
    // 如果指定了结果ID，获取特定结果
    // 否则获取最新版本的结果
    let targetResult = research.currentResult;
    if (resultId) {
      targetResult = research.results.find(r => r.id === resultId);
    }
    
    if (!targetResult) {
      throw new Error(`无法找到指定的研究结果`);
    }
    
    return {
      content: targetResult.markdownContent || '',
      data: targetResult.data || {},
      sources: targetResult.sources || [],
      isComplete: targetResult.isComplete,
      resultId: targetResult.id,
      status: targetResult.status
    };
  } catch (error) {
    console.error(`获取最新内容失败:`, error);
    throw error;
  }
}

// GET处理器 - 建立SSE连接并自动开始内容生成
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const encoder = new TextEncoder();
  const reportId = (await params).id || 'unknown';
  
  // 获取请求参数
  const searchParams = request.nextUrl.searchParams;
  const resultId = searchParams.get('resultId') || undefined;
  const lastEventId = request.headers.get('Last-Event-ID') || '0';
  
  try {
    // 创建响应流
    const stream = new ReadableStream({
      async start(controller) {
        // 发送连接成功消息
        controller.enqueue(
          encoder.encode(
            formatSSEMessage('connected', {
              message: `已建立SSE连接: ${reportId}`,
              timestamp: Date.now(),
              lastEventId
            }, reportId)
          )
        );
        
        try {
          // 首先获取当前已有内容
          const initialData = await getLatestContent(reportId, resultId);
          const currentResultId = initialData.resultId;
          
          // 发送初始状态
          controller.enqueue(
            encoder.encode(
              formatSSEMessage('status', { 
                status: initialData.status || "正在处理...",
              }, reportId)
            )
          );
          
          // 如果有已存在的内容，先发送给客户端
          if (initialData.content) {
            controller.enqueue(
              encoder.encode(
                formatSSEMessage('content', { 
                  content: initialData.content
                }, reportId)
              )
            );
          }
          
          // 如果有来源数据，发送给客户端
          if (initialData.sources && initialData.sources.length > 0) {
            controller.enqueue(
              encoder.encode(
                formatSSEMessage('sources', { 
                  sources: initialData.sources
                }, reportId)
              )
            );
          }
          
          // 如果已完成，直接发送完成消息并结束
          if (initialData.isComplete) {
            controller.enqueue(
              encoder.encode(
                formatSSEMessage('complete', {
                  message: "内容生成已完成",
                  resultId: currentResultId
                }, reportId)
              )
            );
            return;
          }
          
          // 设置定时器定期从数据库获取最新内容
          let previousContent = initialData.content;
          let isFinished = false;
          
          // 设置心跳定时器，每15秒发送一次心跳
          const heartbeatIntervalId = setInterval(() => {
            try {
              controller.enqueue(
                encoder.encode(
                  formatSSEMessage('heartbeat', { 
                    timestamp: Date.now() 
                  }, reportId)
                )
              );
            } catch (error) {
              console.error('发送心跳失败:', error);
              clearInterval(heartbeatIntervalId);
            }
          }, 15000); // 每15秒发送一次心跳
          
          const intervalId = setInterval(async () => {
            try {
              // 定期从数据库获取最新内容
              const latestData = await getLatestContent(reportId, currentResultId);
              
              // 如果内容有更新，发送增量更新
              if (latestData.content && latestData.content !== previousContent) {
                // 计算增量内容
                const newContent = latestData.content.substring(previousContent.length);
                if (newContent) {
                  controller.enqueue(
                    encoder.encode(
                      formatSSEMessage('content', { 
                        content: newContent
                      }, reportId)
                    )
                  );
                  previousContent = latestData.content;
                }
              }
              
              // 发送最新状态
              if (latestData.status) {
                controller.enqueue(
                  encoder.encode(
                    formatSSEMessage('status', { 
                      status: latestData.status
                    }, reportId)
                  )
                );
              }
              
              // 如果有新的来源数据，发送给客户端
              if (latestData.sources && latestData.sources.length > 0) {
                controller.enqueue(
                  encoder.encode(
                    formatSSEMessage('sources', { 
                      sources: latestData.sources
                    }, reportId)
                  )
                );
              }

              if (latestData.data) {
                controller.enqueue(
                  encoder.encode(
                    formatSSEMessage('data', { data: latestData.data }, reportId)
                  )
                );
              }
              
              // 如果标记为完成，发送完成消息并关闭连接
              if (latestData.isComplete && !isFinished) {
                isFinished = true;
                controller.enqueue(
                  encoder.encode(
                    formatSSEMessage('complete', {
                      message: "内容生成已完成",
                      resultId: currentResultId
                    }, reportId)
                  )
                );
                clearInterval(intervalId);
                clearInterval(heartbeatIntervalId);
              }
            } catch (error) {
              console.error(`轮询更新失败:`, error);
              // 发生错误但不中断循环，继续尝试获取更新
            }
          }, 1000); // 每秒轮询一次数据库获取更新
          
          // 当stream关闭时清除定时器
          request.signal.addEventListener('abort', () => {
            clearInterval(intervalId);
            clearInterval(heartbeatIntervalId);
          });
        } catch (error) {
          console.error(`处理SSE流失败:`, error);
          controller.enqueue(
            encoder.encode(
              formatSSEMessage('error', {
                message: error instanceof Error ? error.message : '处理内容时发生错误'
              }, reportId)
            )
          );
        }
      }
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      }
    });
  } catch (error) {
    console.error("处理SSE请求失败:", error);
    return new Response(
      JSON.stringify({ 
        error: true, 
        message: error instanceof Error ? error.message : "处理请求时发生错误" 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

// POST处理器 - 触发内容生成
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const reportId = (await params).id || 'unknown';
    
    // 获取请求体数据
    const requestData = await request.json().catch(() => ({}));
    const { version, reset = false } = requestData;
    console.log("接收到POST请求:", { reportId, version, reset });
    
    // 获取研究报告
    const research = await dbService.getResearch(reportId);
    if (!research) {
      throw new Error(`研究报告不存在: ${reportId}`);
    }
    
    // 确定应该使用的结果ID
    let resultId;
    
    // 如果指定了版本号，查找对应版本的结果
    if (version) {
      const targetResult = research.results?.find(r => r.version === Number(version));
      if (targetResult) {
        resultId = targetResult.id;
      }
    } else {
      // 否则使用最新结果
      resultId = research.currentResult?.id;
    }
    
    if (!resultId) {
      throw new Error("无法确定研究结果ID");
    }
    
    // 如果需要重置内容，更新结果状态
    if (reset) {
      await dbService.updateResearchResult(resultId, {
        markdownContent: '',
        isComplete: false,
        status: '准备开始分析...'
      });
    }
    
    // 返回成功响应，将由其他服务触发LLM生成
    return new NextResponse(
      JSON.stringify({
        success: true,
        message: "已触发内容生成",
        reportId,
        resultId
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error("处理POST请求失败:", error);
    return new Response(
      JSON.stringify({ 
        error: true, 
        message: error instanceof Error ? error.message : "处理请求时发生错误" 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

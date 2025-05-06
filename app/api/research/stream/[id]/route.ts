import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/services/db';
import { llmService } from '@/services/llm';

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

// GET处理器 - 建立SSE连接并自动开始内容生成
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const encoder = new TextEncoder();
  const reportId = (await params).id || 'unknown';
  
  try {
    // 获取研究报告信息
    const research = await dbService.getResearch(reportId);
    if (!research) {
      throw new Error(`研究报告不存在: ${reportId}`);
    }
    
    // 获取问题内容，确保安全访问
    const question = research?.questions?.[0]?.question || "气候变化的影响";
    
    // 创建响应流
    const stream = new ReadableStream({
      async start(controller) {
        // 发送连接成功消息
        controller.enqueue(
          encoder.encode(
            formatSSEMessage('connected', {
              message: `已建立SSE连接: ${reportId}`,
              timestamp: Date.now()
            }, reportId)
          )
        );
        
        // 启动状态
        controller.enqueue(
          encoder.encode(
            formatSSEMessage('status', { 
              status: "开始分析问题...",
              progress: 5
            }, reportId)
          )
        );
        
        // 使用LLM服务生成响应
        try {
          // 启动流式响应
          const llmStream = llmService.streamResponse(question);
          
          // 迭代LLM响应流
          for await (const chunk of llmStream) {
            // 直接将LLM服务返回的数据转发给客户端
            controller.enqueue(
              encoder.encode(
                formatSSEMessage(chunk.type, chunk, reportId)
              )
            );
            
          }
          
        } catch (error) {
          console.error(`生成内容失败:`, error);
          controller.enqueue(
            encoder.encode(
              formatSSEMessage('error', {
                message: error instanceof Error ? error.message : '生成内容时发生错误'
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
    console.log("接收到POST请求:", { reportId, requestData });
    
    // 这里可以增加创建或更新研究结果的逻辑
    // 如果需要在触发生成前进行某些准备工作
    
    // 返回成功响应
    return new NextResponse(
      JSON.stringify({
        success: true,
        message: "已触发内容生成",
        reportId
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

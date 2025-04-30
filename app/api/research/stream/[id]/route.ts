import { NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

// 定义类型
type Source = {
  id: string;
  title: string;
  url: string;
  source: string;
  sourceIcon?: string;
};

type RelatedItem = {
  id: string;
  title: string;
  url: string;
  date?: string;
  description?: string;
};

// 读取模拟数据文件
async function readMockFile(filename: string): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), 'app', 'api', 'research', 'stream', '[id]', filename);
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    console.error(`读取${filename}文件失败:`, error);
    return '';
  }
}

// 读取JSON文件并解析
async function readJsonFile<T>(filename: string): Promise<T> {
  try {
    const content = await readMockFile(filename);
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(`解析${filename}文件失败:`, error);
    return [] as unknown as T;
  }
}

// 读取所有模拟数据
async function loadMockData() {
  // 读取Markdown内容并分段
  const reportContent = await readMockFile('mock.md');
  const contentChunks = reportContent
    .split('\n\n')
    .map(chunk => chunk.trim())
    .filter(chunk => chunk.length > 0)
    .map(chunk => `${chunk}\n\n`);

  // 读取数据内容
  const dataContent = await readMockFile('data-mock.md');
  
  // 读取状态更新列表
  const statusUpdates = await readJsonFile<string[]>('status-mock.json');
  
  // 读取来源数据
  const sources = await readJsonFile<Source[]>('sources-mock.json');
  
  // 读取相关研究
  const related = await readJsonFile<RelatedItem[]>('related-mock.json');

  return { contentChunks, dataContent, statusUpdates, sources, related };
}

// 格式化SSE消息
const formatSSEMessage = (event: string, data: unknown): string => {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
};

// GET处理器 - 建立SSE连接并自动开始内容生成
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const encoder = new TextEncoder();
    const reportId = (await params).id || 'unknown';
    console.log(`接收到SSE连接请求: ${reportId}`);
    
    let heartbeatInterval: NodeJS.Timeout;
    
    // 检查URL参数中是否有生成内容的指令
    const { searchParams } = new URL(request.url);
    const shouldGenerateContent = searchParams.get('generate') === 'true';
    
    const stream = new ReadableStream({
      async start(controller) {
        // 发送连接成功消息
        controller.enqueue(
          encoder.encode(
            formatSSEMessage('connected', {
              message: `已建立SSE连接: ${reportId}`,
              timestamp: Date.now()
            })
          )
        );

        // 心跳保持
        heartbeatInterval = setInterval(() => {
          try {
            controller.enqueue(
              encoder.encode(
                formatSSEMessage('ping', { 
                  timestamp: Date.now(),
                  reportId
                })
              )
            );
          } catch (error) {
            // 如果控制器已关闭，清除定时器
            console.log(`心跳发送失败，清理定时器: ${reportId}`, error);
            clearInterval(heartbeatInterval);
          }
        }, 30000);
        
        // 如果需要生成内容，立即开始生成
        if (shouldGenerateContent) {
          try {
            // 从文件加载模拟数据
            const { contentChunks, dataContent, statusUpdates, sources, related } = await loadMockData();
            
            // 发送初始内容
            controller.enqueue(
              encoder.encode(
                formatSSEMessage('start', { reportId, status: statusUpdates[0] || '启动研究分析...' })
              )
            );
            
            console.log(`开始为报告 ${reportId} 生成内容...`);

            // 流式发送内容块，中间夹杂状态更新
            for (let i = 0; i < contentChunks.length; i++) {
              // 更慢的传输速度，模拟真实研究过程
              await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

              try {
                // 发送内容块
                controller.enqueue(
                  encoder.encode(
                    formatSSEMessage('content', {
                      content: contentChunks[i],
                      progress: Math.floor((i + 1) / contentChunks.length * 100)
                    })
                  )
                );
    
                // 每隔几个内容块发送一个状态更新
                if (i % 2 === 0 && i < statusUpdates.length) {
                  await new Promise(resolve => setTimeout(resolve, 800));
                  controller.enqueue(
                    encoder.encode(
                      formatSSEMessage('status', { 
                        status: statusUpdates[i],
                        progress: Math.floor((i + 1) / contentChunks.length * 100)
                      })
                    )
                  );
                }
                
                // 在特定进度发送额外数据
                if (i === Math.floor(contentChunks.length * 0.25)) {
                  await new Promise(resolve => setTimeout(resolve, 1200));
                  controller.enqueue(
                    encoder.encode(
                      formatSSEMessage('sources', { 
                        sources: sources.slice(0, 3),
                        status: "发现初步参考资料..."
                      })
                    )
                  );
                }
                
                if (i === Math.floor(contentChunks.length * 0.5)) {
                  await new Promise(resolve => setTimeout(resolve, 1200));
                  controller.enqueue(
                    encoder.encode(
                      formatSSEMessage('sources', { 
                        sources: sources.slice(3),
                        status: "整合更多信息来源..."
                      })
                    )
                  );
                }
    
                if (i === Math.floor(contentChunks.length * 0.6)) {
                  await new Promise(resolve => setTimeout(resolve, 1200));
                  controller.enqueue(
                    encoder.encode(
                      formatSSEMessage('data', { 
                        data: dataContent,
                        status: "生成数据分析视图..."
                      })
                    )
                  );
                }

                if (i === Math.floor(contentChunks.length * 0.75)) {
                  await new Promise(resolve => setTimeout(resolve, 1500));
                  controller.enqueue(
                    encoder.encode(
                      formatSSEMessage('related', { 
                        related,
                        status: "发现相关研究课题..."
                      })
                    )
                  );
                }
              } catch (error) {
                console.error(`发送内容块失败 (${i}/${contentChunks.length}):`, error);
                break; // 控制器已关闭，停止循环
              }
            }

            // 发送完成消息
            console.log(`报告 ${reportId} 内容生成完成`);
            try {
              controller.enqueue(
                encoder.encode(
                  formatSSEMessage('status', {
                    status: "完成报告生成",
                    progress: 100
                  })
                )
              );
              
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              controller.enqueue(
                encoder.encode(
                  formatSSEMessage('complete', {
                    reportId,
                    status: 'complete',
                    timestamp: Date.now()
                  })
                )
              );
            } catch (error) {
              console.error(`发送完成消息失败:`, error);
              // 已关闭则跳过
            }
          } catch (error) {
            console.error(`报告 ${reportId} 生成失败:`, error);
            try {
              controller.enqueue(
                encoder.encode(
                  formatSSEMessage('error', {
                    message: error instanceof Error ? error.message : '生成报告时发生错误'
                  })
                )
              );
            } catch (enqueueError) {
              console.error(`发送错误消息失败:`, enqueueError);
              // 已关闭则跳过
            }
          }
        }

        // 清理函数
        return () => {
          console.log(`关闭SSE连接: ${reportId}`);
          clearInterval(heartbeatInterval);
        };
      }
    });

    // 监听请求关闭
    request.signal.addEventListener('abort', () => {
      console.log(`客户端断开连接: ${reportId}`);
      clearInterval(heartbeatInterval);
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
    console.error("处理SSE连接请求失败:", error);
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

// POST处理器 - 触发内容生成 (现在只需触发一个重定向到带有 generate=true 参数的GET请求)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id || 'unknown';
    // 获取请求体数据
    const requestData = await request.json().catch(() => ({}));
    console.log("接收到POST请求:", { reportId, requestData });
    
    // 返回一个带有状态码的JSON响应，通知客户端重新连接到GET端点
    return new Response(
      JSON.stringify({
        success: true,
        message: "已触发内容生成",
        instruction: "请使用GET请求访问相同URL并添加generate=true参数"
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json'
        } 
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

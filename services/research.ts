import { Source, RelatedItem, Research, ResearchQuestion  } from '@/types/chat';



export type StreamResponse = {
  promise: Promise<void>;
  abort: () => void;
};

export interface StreamChunk {
  content?: string;
  sources?: Source[];
  related?: RelatedItem[];
  status?: string;
  data?: string;
}

/**
 * 研究服务
 * 提供研究相关的API调用
 */
class ResearchService {
  
  /**
   * 添加研究问题
   * @param question 
   * @returns 
   */
  async addQuestion(question: ResearchQuestion): Promise<string> {
    const response = await fetch('/api/research', {
      method: 'POST',
      body: JSON.stringify(question)
    });
    return response.json();
  }

  async getUserResearches(): Promise<Research[]> {
    const response = await fetch('/api/research/user');
    return response.json();
  }

  /**
   * 获取研究报告
   * 
   */
  async getResearch(researchId: string): Promise<Research> {
    console.log("===== climateService.getResearch 开始 =====");
    const response = await fetch(`/api/research/${researchId}`);
    return response.json();
  }

  /**
   * 流式处理研究问题
   * 使用SSE实现流式响应，接收数据块并通过回调函数返回
   */
  streamResearch(
    researchId: string,
    onChunk?: (chunk: StreamChunk) => void
  ): StreamResponse {
    console.log("===== climateService.streamResearch 开始 =====");
    console.log("请求参数:", JSON.stringify(researchId, null, 2));
    
    // 创建控制器用于中止请求
    const controller = new AbortController();
    // const { signal } = controller;
    
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
        
        
        // 设置事件监听器
        eventSource.addEventListener('ping', (event: MessageEvent) => {
          try {
            // 处理心跳事件，重置超时计时器
            resetHeartbeat();
            // 可以记录日志或更新状态，但通常不需要向用户显示心跳
            console.debug('收到SSE心跳:', event.data);
          } catch (error) {
            console.error('解析ping事件数据失败:', error);
          }
        });
        
        eventSource.addEventListener('start', (event: MessageEvent) => {
          try {
            resetHeartbeat();
            const data = JSON.parse(event.data);
            console.log('收到start事件:', data);
            
            if (onChunk) {
              onChunk({
                status: 'start research',
              });
            }
          } catch (error) {
            console.error('解析start事件数据失败:', error);
          }
        });

        eventSource.addEventListener('status', (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            if (onChunk) {
              onChunk({
                status: data.status,
              });
            }
          } catch (error) {
            console.error('解析status事件数据失败:', error);
          }
        });

        

        eventSource.addEventListener('data', (event: MessageEvent) => {
          try {
            console.log('收到data事件:', event.data);
            const data = JSON.parse(event.data);
            if (data.data) {
              if (onChunk) {
                onChunk({
                  data: data.data,
                });
              }
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
              
              if (onChunk) {
                onChunk({
                  content: data.content,
                });
              }
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
             
              if (onChunk) {
                onChunk({
                  sources: data.sources,
                });
              }
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
              if (onChunk) {
                onChunk({
                  related: data.related,
                });
              }
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
            if (onChunk) {
              onChunk({
                status: 'complete',
              });
            }
            
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
  }
}

export const researchService = new ResearchService(); 
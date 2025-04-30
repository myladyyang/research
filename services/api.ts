/**
 * API服务基类
 * 提供基础的HTTP请求方法
 */

// 基础请求配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.climate-ai.example';
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// 错误类型
export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// 请求选项接口
export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  cache?: RequestCache;
}

// 通用数据类型
export type JsonValue = 
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type QueryParams = Record<string, string | number | boolean | string[] | null | undefined>;

/**
 * API服务类
 * 封装常用的HTTP请求方法
 */
export class ApiService {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  
  constructor(
    baseUrl: string = API_BASE_URL,
    defaultHeaders: Record<string, string> = DEFAULT_HEADERS
  ) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = defaultHeaders;
  }
  
  /**
   * 处理API响应
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || response.statusText || 'API请求失败';
      throw new ApiError(errorMessage, response.status);
    }
    
    // 对于204 No Content响应，直接返回null
    if (response.status === 204) {
      return null as T;
    }
    
    return response.json() as Promise<T>;
  }
  
  /**
   * 创建完整的URL
   */
  private createUrl(endpoint: string, params?: QueryParams): string {
    const baseUrl = this.baseUrl.endsWith('/')
      ? this.baseUrl.slice(0, -1)
      : this.baseUrl;
      
    const path = endpoint.startsWith('/')
      ? endpoint
      : `/${endpoint}`;
      
    let url = `${baseUrl}${path}`;
    
    // 添加URL参数（如果有）
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      
      const queryString = queryParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }
    
    return url;
  }
  
  /**
   * 发送HTTP请求
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: JsonValue | QueryParams,
    options: RequestOptions = {}
  ): Promise<T> {
    const headers = { ...this.defaultHeaders, ...options.headers };
    const config: RequestInit = {
      method,
      headers,
      cache: options.cache || 'default',
    };
    
    let url: string;
    
    // 对于GET和DELETE请求，将数据添加为URL参数
    if (data && (method === 'GET' || method === 'DELETE')) {
      url = this.createUrl(endpoint, data as QueryParams);
    } else {
      url = this.createUrl(endpoint);
      
      // 对于其他请求方法，将数据添加到请求主体
      if (data) {
        config.body = JSON.stringify(data);
      }
    }
    
    // 设置请求超时
    const timeoutPromise = options.timeout
      ? new Promise<never>((_, reject) => {
          setTimeout(() => reject(new ApiError('请求超时', 408)), options.timeout);
        })
      : null;
    
    try {
      // 发送请求，可能带有超时控制
      const responsePromise = fetch(url, config);
      const response = timeoutPromise
        ? await Promise.race([responsePromise, timeoutPromise])
        : await responsePromise;
      
      return this.handleResponse<T>(response as Response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(
        error instanceof Error ? error.message : '网络请求失败',
        0
      );
    }
  }
  
  /**
   * SSE流式请求
   * 用于支持LLM生成的实时流式输出
   */
  streamRequest<T>(
    endpoint: string,
    data?: JsonValue,
    onMessage?: (chunk: T) => void,
    onError?: (error: Error) => void
  ) {
    const url = this.createUrl(endpoint);
    const controller = new AbortController();
    const { signal } = controller;
    
    const promise = new Promise<T>(async (resolve, reject) => {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            ...this.defaultHeaders
          },
          body: data ? JSON.stringify(data) : undefined,
          signal
        });
        
        if (!response.ok) {
          throw new ApiError('Stream request failed', response.status);
        }
        
        if (!response.body) {
          throw new ApiError('Response body is null', 0);
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const fullResult: { content: string; chunks: T[] } = { content: '', chunks: [] };
        
        const processStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n\n').filter(line => line.trim() !== '');
              
              for (const line of lines) {
                if (line.startsWith('data:')) {
                  try {
                    const jsonStr = line.slice(5).trim();
                    if (jsonStr === '[DONE]') break;
                    
                    const jsonData = JSON.parse(jsonStr) as T;
                    fullResult.chunks.push(jsonData);
                    
                    if (typeof jsonData === 'object' && jsonData !== null && 'content' in jsonData) {
                      fullResult.content += (jsonData as { content: string }).content;
                    }
                    
                    if (onMessage) onMessage(jsonData);
                  } catch (e) {
                    console.error('Error parsing SSE data:', e);
                  }
                }
              }
            }
            
            resolve(fullResult as unknown as T);
          } catch (error) {
            if (signal.aborted) {
              reject(new ApiError('Request aborted', 0));
            } else {
              reject(error);
            }
          }
        };
        
        processStream();
        
      } catch (error) {
        if (signal.aborted) {
          reject(new ApiError('Request aborted', 0));
        } else {
          reject(error);
          if (onError) onError(error as Error);
        }
      }
    });
    
    return {
      promise,
      abort: () => controller.abort()
    };
  }
  
  /**
   * GET请求
   */
  async get<T>(endpoint: string, params?: QueryParams, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', endpoint, params, options);
  }
  
  /**
   * POST请求
   */
  async post<T>(endpoint: string, data?: JsonValue, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', endpoint, data, options);
  }
  
  /**
   * PUT请求
   */
  async put<T>(endpoint: string, data?: JsonValue, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', endpoint, data, options);
  }
  
  /**
   * PATCH请求
   */
  async patch<T>(endpoint: string, data?: JsonValue, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', endpoint, data, options);
  }
  
  /**
   * DELETE请求
   */
  async delete<T>(endpoint: string, params?: QueryParams, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', endpoint, params, options);
  }
}

// 导出默认API服务实例
export const api = new ApiService(); 
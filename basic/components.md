# Function reqirements for components

## types

All types definition should be in the `types/xxx.ts` file.

## ChatInput

- [ ] 实现一个输入框，用于输入用户的问题或研究主题
- [ ] 输入框允许用户上传文档，并且在上传之后罗列在输入框的下方
- [ ] 用户可以点击这些文档，然后这些文档会出现在输入框的右侧
- [ ] 语音输入
- [ ] 允许选择模型或者Agent
- [ ] 允许选择知识来源(文献，网页，数据库等)
- [ ] 使用click来确认选择, icon 使用lucid icon， 注意布局，色彩,和间距,还有样式上的统一 hover等效果, 使用 src/globals.css 中的样式，点击menu之外的区域，menu自动关闭
- [ ] emit message to parent component

## FloatingInput

- [ ] 实现一个浮动输入框，用于输入用户的问题或研究主题
- [ ] 输入框允许用户上传文档，并且在上传之后罗列在输入框的下方
- [ ] 用户可以点击这些文档，然后这些文档会出现在输入框的右侧
- [ ] 语音输入
- [ ] 允许选择模型或者Agent
- [ ] 允许选择知识来源(文献，网页，数据库等)
- [ ] 使用click来确认选择, icon 使用lucid icon， 注意布局，色彩,和间距,还有样式上的统一 hover等效果, 使用 src/globals.css 中的样式，点击menu之外的区域，menu自动关闭
- [ ] emit message to parent component


## ResearchReport

- [ ] 实现一个研究报告页面组件，完整显示研究报告的所有内容和交互
- [ ] 接收 message（用户问题/主题）和相关数据作为 props
- [ ] 使用 lucide icon 显示报告图标
- [ ] 使用 src/globals.css 中的样式，风格与首页一致
- [ ] 支持 markdown 格式渲染报告正文
- [ ] 组合多个子组件：FloatingInput、ReportContent、SourceCard、RelatedContent 等
- [ ] 显示面包屑导航（Breadcrumbs），支持自定义路径
- [ ] 显示报告标题、大号字体，居中或左对齐可配置
- [ ] 显示生成时间、数据来源数量等元信息
- [ ] 提供 Tabs 切换（如：报告、数据、来源），支持自定义 tab 内容
- [ ] 显示参考来源列表，支持外链
- [ ] 显示导出、刷新、保存等操作按钮
- [ ] 显示主要数据来源卡片（SourceCard），支持多来源
- [ ] 显示相关研究（RelatedContent），支持跳转
- [ ] 底部集成 FloatingInput，支持后续提问
- [ ] 所有交互和视觉风格与首页保持一致
- [ ] 支持 props 控制各部分内容和行为，便于复用和扩展
- [ ] 支持多轮研究提问，能够根据用户的持续提问动态修正和补充报告内容


# Service

Climate AI 应用的服务层架构提供了数据访问、业务逻辑和状态管理的功能。服务层位于 `services` 目录下，分为以下几个主要模块：


## 通用服务接口设计

所有服务遵循以下设计原则：
- 使用 TypeScript 接口定义清晰的数据结构
- 提供异步方法处理 API 请求
- 支持实际 API 和开发环境下的模拟数据
- 集中在 `services/index.ts` 导出所有服务
- **支持 SSE 流式传输**：对于 LLM 生成的内容，采用 SSE 实现实时流式输出

## ApiService

基础 HTTP 请求服务，封装了网络请求的通用功能：

```typescript
// services/api.ts (核心功能)
export class ApiService {
  // 基础 HTTP 方法封装
  async get<T>(endpoint: string, params?: QueryParams): Promise<T>;
  async post<T>(endpoint: string, data?: JsonValue): Promise<T>;
  async put<T>(endpoint: string, data?: JsonValue): Promise<T>;
  async patch<T>(endpoint: string, data?: JsonValue): Promise<T>;
  async delete<T>(endpoint: string, params?: QueryParams): Promise<T>;
  
  // SSE 流式请求方法
  streamRequest<T>(
    endpoint: string, 
    data?: JsonValue,
    onMessage?: (chunk: T) => void,
    onError?: (error: Error) => void
  ): { 
    promise: Promise<T>,  // 完整响应的 Promise
    abort: () => void     // 中止流的函数
  };
}

// 导出实例
export const api = new ApiService();
```

## SSE 流式传输实现

为支持 LLM 生成的研究报告，实现了 SSE 流式传输：

```typescript
// services/api.ts (SSE 实现)
export class ApiService {
  // ... 其他方法 ...
  
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
        let fullResult: any = { content: '', chunks: [] };
        
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
                      fullResult.content += (jsonData as any).content;
                    }
                    
                    if (onMessage) onMessage(jsonData);
                  } catch (e) {
                    console.error('Error parsing SSE data:', e);
                  }
                }
              }
            }
            
            resolve(fullResult);
          } catch (error) {
            if (signal.aborted) {
              reject(new ApiError('Request aborted', 0));
            } else {
              reject(e);
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
}
```

## ClimateService

气候数据和研究报告服务，提供气候相关的 API 功能，支持 SSE 流式输出：

```typescript
// services/climate.ts (主要功能)
class ClimateService {
  // 报告相关
  async getReport(id: string): Promise<ClimateReport>;
  async searchReports(query: string, options?): Promise<{ reports: ClimateReport[]; total: number }>;
  
  // 流式请求研究问题（SSE）
  streamQuestion(
    request: ResearchQuestionRequest,
    onChunk?: (chunk: {
      content?: string;
      sources?: Source[];
      progress?: number;
      status?: 'processing' | 'complete' | 'error';
    }) => void
  ): {
    promise: Promise<ClimateReport>;
    abort: () => void;
  };
  
  // 非流式请求（兼容旧接口）
  async submitQuestion(request: ResearchQuestionRequest): Promise<ClimateReport>;
  
  // 来源和相关内容
  async getRelatedContent(reportId: string): Promise<RelatedItem[]>;
  async getSources(reportId: string): Promise<Source[]>;
  
  // 气候数据相关
  async getDataCategories(): Promise<ClimateDataCategory[]>;
  async getClimateMetrics(): Promise<ClimateMetric[]>;
  async getTimeSeriesData(metricId: string, timeRange?): Promise<TimeSeriesDataPoint[]>;
  async getChartData(chartId: string): Promise<ClimateChartData>;
  
  // 导出功能
  async exportReport(reportId: string, format: 'pdf' | 'docx' | 'md'): Promise<Blob>;
  
  // 开发环境模拟数据（SSE模拟）
  mockStreamReport(
    question: string,
    onChunk?: (chunk: { content: string; status: string }) => void
  ): {
    promise: Promise<ClimateReport>;
    abort: () => void;
  };
}

export const climateService = new ClimateService();
```

## 流式研究报告实现

流式研究报告的具体实现：

```typescript
// services/climate.ts (SSE 实现)
class ClimateService {
  // ... 其他方法 ...
  
  streamQuestion(
    request: ResearchQuestionRequest,
    onChunk?: (chunk: any) => void
  ) {
    // 构建请求数据
    const requestData = {
      question: request.question,
      history: request.history || [],
      files: request.files || [],
      model: request.model || 'default',
      source: request.source || 'all'
    };
    
    // 开发环境使用模拟数据
    if (process.env.NODE_ENV === 'development') {
      return this.mockStreamReport(request.question, onChunk);
    }
    
    // 生产环境使用真实API
    return api.streamRequest(
      '/research/analyze/stream',
      requestData,
      onChunk
    );
  }
  
  // 模拟流式响应（用于开发环境）
  mockStreamReport(question: string, onChunk?: (chunk: any) => void) {
    const controller = new AbortController();
    const { signal } = controller;
    
    const promise = new Promise<ClimateReport>(async (resolve, reject) => {
      try {
        if (signal.aborted) {
          throw new Error('Stream aborted');
        }
        
        // 生成唯一ID
        const id = `report-${Date.now()}`;
        
        // 创建最终报告对象
        const finalReport: ClimateReport = {
          id,
          title: question,
          content: '',
          markdownContent: `# ${question}\n\n`,
          summary: '',
          date: new Date().toISOString(),
          tags: ['气候变化', '全球变暖', '研究报告'],
          sources: [],
          related: []
        };
        
        // 模拟内容段落
        const contentChunks = [
          `## 研究摘要\n\n这是针对问题"${question}"的研究报告摘要。\n\n`,
          `## 主要发现\n\n`,
          `- 全球气温持续上升，比工业革命前增加了约1.1°C\n`,
          `- 过去十年是有记录以来最热的十年\n`,
          `- 极端天气事件的频率和强度正在增加\n\n`,
          `## 详细分析\n\n`,
          `气候变化是由多种因素引起的，其中最主要的是人类活动导致的温室气体排放增加。`,
          `二氧化碳(CO₂)、甲烷(CH₄)和氧化亚氮(N₂O)等温室气体浓度正在上升到几百万年来前所未有的水平。\n\n`,
          `![全球温室气体排放趋势](https://example.com/chart.png)\n\n`,
          `> 根据最新研究，如果不采取紧急和大规模的减排措施，全球气温可能在本世纪末上升超过3°C。\n\n`,
          // ... 更多内容 ...
        ];
        
        // 模拟源数据
        const sources = [
          { id: "1", title: "IPCC第六次评估报告", url: "https://www.ipcc.ch/report/ar6/", source: "IPCC" },
          { id: "2", title: "全球气候状况报告", url: "https://public.wmo.int/en", source: "WMO" },
          { id: "3", title: "气候变化经济学", url: "https://www.lse.ac.uk/granthaminstitute/", source: "学术期刊" }
        ];
        
        // 模拟相关内容
        const related = [
          { id: "rel1", title: "极端天气事件分析", url: "#" },
          { id: "rel2", title: "全球变暖对海洋生态的影响", url: "#" },
          { id: "rel3", title: "可再生能源发展报告", url: "#" }
        ];
        
        // 模拟流式传输
        for (let i = 0; i < contentChunks.length; i++) {
          if (signal.aborted) {
            throw new Error('Stream aborted');
          }
          
          // 添加延迟，模拟网络延迟和LLM生成时间
          await new Promise(res => setTimeout(res, 300 + Math.random() * 700));
          
          const chunk = contentChunks[i];
          finalReport.markdownContent += chunk;
          finalReport.content += chunk;
          
          // 计算进度百分比
          const progress = Math.floor((i + 1) / contentChunks.length * 100);
          
          // 在约50%进度时添加源
          if (progress >= 50 && finalReport.sources.length === 0) {
            finalReport.sources = sources;
            if (onChunk) onChunk({ 
              content: chunk, 
              sources, 
              progress,
              status: 'processing'
            });
          } 
          // 在约80%进度时添加相关内容
          else if (progress >= 80 && finalReport.related.length === 0) {
            finalReport.related = related;
            if (onChunk) onChunk({ 
              content: chunk, 
              related, 
              progress,
              status: 'processing'
            });
          }
          // 其他情况只更新内容
          else if (onChunk) {
            onChunk({ 
              content: chunk, 
              progress,
              status: 'processing'
            });
          }
        }
        
        // 完成流式传输
        finalReport.summary = `这是关于"${question}"的研究报告摘要。主要包括全球气温持续上升，极端天气事件增加等现象。`;
        finalReport.mainSources = [sources[0]];
        
        if (onChunk) onChunk({ 
          status: 'complete',
          progress: 100
        });
        
        resolve(finalReport);
      } catch (error) {
        reject(error);
      }
    });
    
    return {
      promise,
      abort: () => controller.abort()
    };
  }
}
```

## 服务层的优势

- **关注点分离**：UI 组件专注于展示，服务层处理数据获取和业务逻辑
- **代码重用**：多个组件可以共享相同的服务功能
- **测试便利**：服务层可以独立于 UI 组件进行测试
- **模拟数据**：开发过程中使用模拟数据，无需真实 API
- **类型安全**：TypeScript 类型定义确保数据结构的一致性
- **流式处理**：通过 SSE 支持 LLM 生成的实时流式内容，提升用户体验

# Function and interaction between components

## ChatInput

- [ ] Receive message from parent component
- [ ] Send message to parent component


# page Logic

## main page

When user submit the question(receive message from chatInput), the main page will switch components from chatInput to ResearchReport(send message to ResearchReport)



```tsx
// 使用闭包模式
import { useResearchManager } from '@/hooks/useResearchManager';

function ResearchPage() {
  const research = useResearchManager();
  const [question, setQuestion] = useState('');
  
  const handleSubmit = async () => {
    await research.question.submit(question);
    setQuestion('');
  };
  
  return (
    <div>
      <h1>{research.report.title}</h1>
      
      {research.report.isLoading && <div>加载中...</div>}
      
      <div className="content">
        <ReactMarkdown>{research.report.content}</ReactMarkdown>
      </div>
      
      <div className="sources">
        <h2>参考来源 ({research.sources.count})</h2>
        <ul>
          {research.sources.getMain().map(source => (
            <li key={source.id}>{source.title}</li>
          ))}
        </ul>
      </div>
      
      <div className="related">
        <h2>相关内容 ({research.related.count})</h2>
        <ul>
          {research.related.getItems().map(item => (
            <li key={item.id}>{item.title}</li>
          ))}
        </ul>
      </div>
      
      <div className="question-form">
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          disabled={research.question.isProcessing}
        />
        <button 
          onClick={handleSubmit}
          disabled={research.question.isProcessing}
        >
          提交问题
        </button>
      </div>
      
      <div className="history">
        <h3>历史报告</h3>
        <ul>
          {research.session.getAllReports().map(report => (
            <li 
              key={report.id}
              onClick={() => research.session.switchTo(report.id)}
            >
              {report.question}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

这种封装方式的主要优势：

1. **隐藏复杂性**：使用者不需要了解SSE、流式处理等技术细节
2. **专注于领域语言**：接口使用业务术语（报告、来源、相关内容），而不是技术术语
3. **增强代码可读性**：组件代码更干净，关注点分离更清晰
4. **改善开发体验**：更强的类型提示和自动完成支持
5. **减少重复代码**：常用操作被封装，减少各组件中的重复逻辑
6. **统一错误处理**：在封装层处理常见错误情况，简化使用者的错误处理
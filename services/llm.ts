import { Source, RelatedItem } from '../types/chat';

// 响应块接口
export interface LLMResponseChunk {
  type: 'content' | 'status' | 'sources' | 'related' | 'data' | 'complete';
  content?: string;
  sources?: Source[];
  related?: RelatedItem[];
  data?: string;
  status?: string;
  progress?: number;
  isComplete?: boolean; // 是否完成标识，用于标记sources/related/data是否已完成生成
  done?: boolean;
}

// LLM响应处理函数类型
export type LLMStreamHandler = (chunk: LLMResponseChunk) => void;

// LLM请求选项
export interface LLMRequestOptions {
  model?: string;
  systemPrompt?: string;
  temperature?: number;
}

/**
 * LLM服务 - 处理AI模型调用
 */
export class LLMService {
  private readonly defaultSystemPrompt = "你是一个气候研究专家，请详细分析以下问题并提供科学依据。";
  private readonly defaultModel = "gpt-4-turbo";
  
  /**
   * 生成流式响应
   * @param question 问题文本
   * @param options 请求选项
   * @returns 异步生成器，产生响应内容
   */
  async *streamResponse(
    question: string, 
    options: LLMRequestOptions = {}
  ): AsyncGenerator<LLMResponseChunk> {
    const { 
      model = this.defaultModel,
    } = options;
    
    try {
      console.log(`开始LLM流式请求，模型: ${model}, 问题: ${question.substring(0, 50)}...`);
      
      // 发送初始状态
      yield {
        type: 'status',
        status: "开始分析问题...",
        progress: 5
      };
      
      // 识别主题
      const topics = this.identifyTopics(question);
      
      // 准备相关资源
      const { sources, related, data } = this.generateRelatedResources(topics);
      
      // 进度跟踪
      let progress = 10;
      
      // 使用单独的标志变量跟踪发送状态
      
      // 生成内容流
      let contentBlocks = '';
      const responseGenerator = this.mockResponseGenerator(question, topics);
      
      // 强制发送资源数据，不依赖于内容长度
      // 先发送小部分内容
      for await (const chunk of responseGenerator) {
        // 更新进度
        progress = Math.min(progress + 1, 25);
        
        // 发送内容块
        yield {
          type: 'content',
          content: chunk,
          progress
        };
        
        // 累积内容
        contentBlocks += chunk;
        
        // 在生成一定量内容后停止这个循环
        if (contentBlocks.length > 400) {
          break;
        }
      }
      
      // 强制发送数据源信息
      await new Promise(resolve => setTimeout(resolve, 300));
      progress = 30;
      yield {
        type: 'sources',
        sources,
        status: "发现参考资料...",
        progress: 30,
        isComplete: true
      };
      
      await new Promise(resolve => setTimeout(resolve, 500));
      progress = 45;
      yield {
        type: 'related',
        related,
        status: "发现相关研究...",
        progress: 45,
        isComplete: true
      };
      
      await new Promise(resolve => setTimeout(resolve, 500));
      progress = 60;
      yield {
        type: 'data',
        data,
        status: "生成数据分析...",
        progress: 60,
        isComplete: true
      };
      
      // 继续生成剩余内容
      for await (const chunk of responseGenerator) {
        // 更新进度
        progress = Math.min(progress + 1, 95);
        
        // 发送内容块
        yield {
          type: 'content',
          content: chunk,
          progress
        };
        
        // 随机发送状态更新
        if (Math.random() < 0.05) {
          const statusMessages = [
            "正在分析数据...",
            "整合信息中...",
            "生成关键见解...",
            "检索相关资料...",
            "完善结论中..."
          ];
          const randomStatus = statusMessages[Math.floor(Math.random() * statusMessages.length)];
          
          yield {
            type: 'status',
            status: randomStatus,
            progress
          };
        }
      }
      
      // 发送完成消息
      yield {
        type: 'status',
        status: "完成报告生成",
        progress: 100
      };
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 发送完成标记
      yield {
        type: 'complete',
        status: 'complete',
        progress: 100,
        done: true
      };
      
    } catch (error) {
      console.error("LLM流式请求失败:", error);
      throw error;
    }
  }
  
  /**
   * 实际项目中替换为真实LLM API调用的异步生成器
   */
  private async *callActualLLMAPI(
    question: string, 
    model: string, 
    systemPrompt: string,
    temperature: number
  ): AsyncGenerator<string> {
    // 集成实际的LLM API，例如OpenAI
    try {
      // 注意：此部分为示例代码，实际使用时需替换为真实API调用
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question }
          ],
          temperature,
          stream: true
        })
      });
      
      // 处理流式响应
      const reader = response.body?.getReader();
      if (!reader) throw new Error("无法获取响应流");
      
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices[0]?.delta?.content;
              if (content) yield content;
            } catch (e) {
              console.error('解析LLM响应失败:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error("调用LLM API失败:", error);
      throw error;
    }
  }
  
  /**
   * 识别问题中的主题
   */
  private identifyTopics(question: string): string[] {
    const topics = [];
    
    // 识别主要主题
    if (question.match(/农业|产量|粮食|作物|种植/i)) {
      topics.push('agriculture');
    }
    
    if (question.match(/海平面|沿海|洪水|海啸|海岸/i)) {
      topics.push('sea-level');
    }
    
    if (question.match(/能源|可再生|发电|电力|solar|风能|太阳能/i)) {
      topics.push('energy');
    }
    
    if (question.match(/生物多样性|物种|灭绝|生态系统|森林/i)) {
      topics.push('biodiversity');
    }
    
    if (question.match(/温度|气温|升温|变暖|热浪/i)) {
      topics.push('temperature');
    }
    
    if (question.match(/经济|成本|投资|gdp|发展/i)) {
      topics.push('economy');
    }
    
    // 默认主题
    if (topics.length === 0) {
      topics.push('climate-general');
    }
    
    return topics;
  }
  
  /**
   * 生成相关资源和数据
   */
  generateRelatedResources(topics: string[]): {
    sources: Source[];
    related: RelatedItem[];
    data: string;
  } {
    // 来源数据库
    const allSources = {
      'agriculture': [
        { id: "1", sourceId: "1", title: "气候变化对全球农业生产力的影响", url: "https://example.com/climate-agriculture-1", source: "气候研究期刊" },
        { id: "2", sourceId: "2", title: "温度上升与作物产量关系的元分析", url: "https://example.com/climate-agriculture-2", source: "农业科学期刊" },
        { id: "3", sourceId: "3", title: "气候适应性农业实践指南", url: "https://example.com/climate-agriculture-3", source: "联合国粮农组织" }
      ],
      'sea-level': [
        { id: "1", sourceId: "1", title: "全球海平面上升趋势报告", url: "https://example.com/sea-level-1", source: "气候变化研究所" },
        { id: "2", sourceId: "2", title: "沿海城市面临的气候风险评估", url: "https://example.com/sea-level-2", source: "环境科学期刊" },
        { id: "3", sourceId: "3", title: "IPCC海平面上升专题报告", url: "https://example.com/sea-level-3", source: "政府间气候变化专门委员会" }
      ],
      'energy': [
        { id: "1", sourceId: "1", title: "可再生能源在气候变化缓解中的作用", url: "https://example.com/energy-1", source: "能源政策期刊" },
        { id: "2", sourceId: "2", title: "全球能源转型报告2023", url: "https://example.com/energy-2", source: "国际能源署" },
        { id: "3", sourceId: "3", title: "清洁能源技术进展与趋势", url: "https://example.com/energy-3", source: "可再生能源研究所" }
      ],
      'climate-general': [
        { id: "1", sourceId: "1", title: "IPCC第六次评估报告", url: "https://example.com/ipcc-ar6", source: "政府间气候变化专门委员会" },
        { id: "2", sourceId: "2", title: "全球气候状况2023", url: "https://example.com/climate-state", source: "世界气象组织" },
        { id: "3", sourceId: "3", title: "气候变化科学共识", url: "https://example.com/climate-consensus", source: "科学期刊" }
      ]
    };
    
    // 相关研究数据库
    const allRelated = {
      'agriculture': [
        { id: "rel1", title: "干旱适应型作物研发进展", url: "https://example.com/drought-crops", date: "2023-06-20", description: "概述近年来抗旱作物品种培育的最新研究成果" },
        { id: "rel2", title: "气候智慧型农业实践案例", url: "https://example.com/smart-agriculture", date: "2023-04-15", description: "全球气候智慧型农业的实施案例和成效分析" }
      ],
      'sea-level': [
        { id: "rel1", title: "沿海防护工程最新设计方法", url: "https://example.com/coastal-protection", date: "2023-05-28", description: "应对海平面上升的创新沿海防护工程设计" },
        { id: "rel2", title: "小岛屿国家气候适应策略", url: "https://example.com/island-adaptation", date: "2023-07-10", description: "小岛屿发展中国家应对海平面上升的适应策略研究" }
      ],
      'climate-general': [
        { id: "rel1", title: "碳捕获技术最新进展", url: "https://example.com/carbon-capture", date: "2023-05-18", description: "探讨最新的碳捕获与封存技术及其在减缓气候变化中的应用" },
        { id: "rel2", title: "气候变化与生物多样性", url: "https://example.com/climate-biodiversity", date: "2023-03-22", description: "研究气候变化如何影响全球生物多样性及生态系统" },
        { id: "rel3", title: "极端天气事件频率分析", url: "https://example.com/extreme-weather", date: "2023-07-10", description: "分析全球极端天气事件频率增加与气候变化的关联" }
      ]
    };
    
    // 数据可视化模板
    const dataTemplates = {
      'agriculture': `## 气候变化对农业的影响数据
\`\`\`chart
{
  "type": "line",
  "data": {
    "labels": ["现在", "2030", "2050", "2070", "2100"],
    "datasets": [
      {
        "label": "温带地区产量变化(%)",
        "data": [100, 102, 98, 95, 90]
      },
      {
        "label": "热带地区产量变化(%)",
        "data": [100, 96, 90, 82, 75]
      }
    ]
  }
}
\`\`\`

### 气候变化对不同作物的影响
\`\`\`chart
{
  "type": "bar",
  "data": {
    "labels": ["小麦", "水稻", "玉米", "大豆", "棉花"],
    "datasets": [{
      "label": "产量变化(%)",
      "data": [-7, -3, -10, -8, -5],
      "backgroundColor": "rgba(54, 162, 235, 0.6)"
    }]
  }
}
\`\`\``,
      'sea-level': `## 海平面上升数据分析
\`\`\`chart
{
  "type": "line",
  "data": {
    "labels": ["1980", "2000", "2020", "2040", "2060", "2080", "2100"],
    "datasets": [{
      "label": "全球平均海平面上升(厘米)",
      "data": [0, 6, 15, 28, 45, 65, 90],
      "borderColor": "#36a2eb"
    }]
  }
}
\`\`\`

### 不同沿海城市风险指数
\`\`\`chart
{
  "type": "horizontalBar",
  "data": {
    "labels": ["迈阿密", "上海", "孟买", "阿姆斯特丹", "雅加达", "纽约"],
    "datasets": [{
      "label": "风险指数(1-10)",
      "data": [9.2, 8.7, 8.5, 7.8, 9.0, 7.5],
      "backgroundColor": "rgba(255, 99, 132, 0.6)"
    }]
  }
}
\`\`\``,
      'climate-general': `## 气候变化数据分析

### 全球温度变化趋势
\`\`\`chart
{
  "type": "line",
  "data": {
    "labels": ["1980", "1990", "2000", "2010", "2020", "2030(预测)"],
    "datasets": [{
      "label": "全球温度升高(°C)",
      "data": [0.18, 0.32, 0.48, 0.63, 0.98, 1.5],
      "borderColor": "#ff6384",
      "backgroundColor": "rgba(255, 99, 132, 0.1)"
    }]
  }
}
\`\`\`

### 各地区温室气体排放占比
\`\`\`chart
{
  "type": "pie",
  "data": {
    "labels": ["亚洲", "北美", "欧洲", "非洲", "南美", "大洋洲"],
    "datasets": [{
      "data": [49, 18, 17, 7, 6, 3],
      "backgroundColor": [
        "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"
      ]
    }]
  }
}
\`\`\`

### 气候变化影响指数(1-10)
\`\`\`chart
{
  "type": "bar",
  "data": {
    "labels": ["农业", "水资源", "生态系统", "沿海地区", "公共健康"],
    "datasets": [{
      "label": "影响严重程度",
      "data": [8.5, 7.9, 9.2, 8.8, 7.2],
      "backgroundColor": "rgba(54, 162, 235, 0.6)"
    }]
  }
}
\`\`\``
    };
    
    // 选择资源
    const primaryTopic = topics[0] || 'climate-general';
    
    // 获取主题的资源
    const sources = allSources[primaryTopic as keyof typeof allSources] || allSources['climate-general'];
    
    const related = allRelated[primaryTopic as keyof typeof allRelated] || allRelated['climate-general'];
    
    const data = dataTemplates[primaryTopic as keyof typeof dataTemplates] || dataTemplates['climate-general'];
    
    // 如果有多个主题，添加额外相关资源
    if (topics.length > 1) {
      // 从其他主题中各添加一个来源
      topics.slice(1).forEach(topic => {
        if (allSources[topic as keyof typeof allSources] && allSources[topic as keyof typeof allSources].length > 0) {
          const extraSource = allSources[topic as keyof typeof allSources][0];
          extraSource.id = (sources.length + 1).toString();
          extraSource.sourceId = (sources.length + 1).toString();
          sources.push(extraSource);
        }
        
        if (allRelated[topic as keyof typeof allRelated] && allRelated[topic as keyof typeof allRelated].length > 0) {
          const extraRelated = allRelated[topic as keyof typeof allRelated][0];
          extraRelated.id = `rel${related.length + 1}`;
          related.push(extraRelated);
        }
      });
    }
    
    return { sources, related, data };
  }
  
  /**
   * 模拟LLM响应流生成器
   * 在实际项目中，替换为真实LLM API调用
   */
  private async *mockResponseGenerator(question: string, topics: string[]): AsyncGenerator<string> {
    // 生成开头响应
    let response;
    const primaryTopic = topics[0] || 'climate-general';
    
    // 根据主题生成不同的回答开头
    if (primaryTopic === 'agriculture') {
      response = "## 气候变化对农业产量的影响\n\n气候变化正在显著影响全球农业生产。研究表明，全球气温每升高1°C，全球粮食产量将下降约6%。";
    } else if (primaryTopic === 'sea-level') {
      response = "## 海平面上升对沿海城市的威胁\n\n全球变暖导致的海平面上升正在成为沿海城市面临的重大挑战。按照目前趋势，到2100年全球平均海平面可能上升0.5-1.0米。";
    } else {
      response = "## 气候变化分析\n\n气候变化是当今人类面临的最大环境挑战之一。根据科学共识，当前全球变暖主要由人类活动产生的温室气体排放引起。";
    }
    
    // 将响应拆分成小块，模拟流式传输
    const chunks = response.split(' ').map(word => word + ' ');
    
    // 内容段落
    const paragraphs = [
      "\n\n### 主要影响因素\n\n1. 温室气体排放增加\n2. 全球平均温度上升\n3. 极端天气事件频率增加",
      "\n\n### 科学证据\n\n科学研究表明，自工业革命以来，全球平均温度已上升约1.1°C。这种变暖趋势直接归因于人类活动，特别是化石燃料燃烧产生的二氧化碳排放。最新的气候模型预测，如不采取有力的减排措施，到本世纪末全球平均温度可能比工业化前水平高2.7°C至4.4°C。",
      "\n\n### 应对策略\n\n* 减少碳排放\n* 发展可再生能源\n* 加强国际合作\n* 促进生态系统恢复\n* 提高社会适应能力",
      "\n\n根据最新研究，我们需要采取更积极的措施来应对这一全球性挑战，包括加速碳中和进程、发展气候智慧型技术以及建立更有效的国际合作机制。"
    ];
    
    // 根据主题添加特定内容
    if (primaryTopic === 'agriculture') {
      paragraphs.push("\n\n### 农业适应措施\n\n为应对气候变化对农业的影响，可以采取以下适应措施：\n\n1. 开发抗逆作物品种\n2. 改进灌溉技术\n3. 调整种植结构和时间\n4. 发展保护性农业\n5. 建立农业气象预警系统");
    } else if (primaryTopic === 'sea-level') {
      paragraphs.push("\n\n### 沿海地区应对策略\n\n沿海城市可以通过以下方式降低海平面上升风险：\n\n1. 建设防洪设施和海岸保护工程\n2. 调整城市规划，限制低海拔地区开发\n3. 恢复红树林、海草床和珊瑚礁等自然缓冲系统\n4. 开发更有效的洪水预警系统\n5. 制定长期撤退计划，逐步迁移高风险区域的人口和基础设施");
    }
    
    // 跟踪迭代状态
    let currentWordIndex = 0;
    let currentParagraphIndex = 0;
    
    // 首先生成开头部分
    while (currentWordIndex < chunks.length) {
      // 随机暂停，模拟打字和思考
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 150));
      yield chunks[currentWordIndex++];
    }
    
    // 然后生成段落内容
    while (currentParagraphIndex < paragraphs.length) {
      // 生成一个段落
      await new Promise(resolve => setTimeout(resolve, 1500));
      yield paragraphs[currentParagraphIndex++];
    }
  }
}

// 导出单例
export const llmService = new LLMService();
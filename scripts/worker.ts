import { Worker, Job, WorkerOptions } from 'bullmq';
import IORedis from 'ioredis';
import { ResearchRequest, Source } from '@/types/chat';
import { dbService } from '@/services/db';


// Redis连接配置
const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || '2clabsadmin',
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

// Dify Workflow API 配置
const dify_url = process.env.DIFY_URL || 'http://118.25.139.133:5001';
const dify_api_key = process.env.DIFY_API_KEY || 'app-taAgJy8Dz4CbqeUPhLAm8rNY';

// 队列名称
const QUEUE_NAME = 'research-queue';

// Worker配置
const workerOptions: WorkerOptions = {
  connection,
  concurrency: 3, // 同时处理3个任务
  removeOnComplete: {
    age: 3600, // 保留已完成任务1小时
    count: 1000 // 最多保留1000条记录
  },
  removeOnFail: {
    age: 24 * 3600 // 保留失败任务24小时
  },
  lockDuration: 30000, // 任务锁定30秒
  stalledInterval: 30000, // 检查卡住任务的间隔
};

interface ResearchJobData {
  researchId: string;
  request: ResearchRequest;
  userId: string;
  resultId: string;
}

interface ChartData {
  type: string;
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
  }>;
}

interface Task {
  id: string;
  nodeId: string;
  nodeType: string;
  title: string;
  status: string;
  index: number;
  inputs: any;
  workflowRunId: string;
  predecessorNodeId?: string;
  createdAt: string;
  outputs?: any;
  elapsedTime?: number;
  totalTokens?: number;
  error?: string;
  finishedAt?: string;
}

// 启动Dify工作流并返回工作流ID
async function startDifyWorkflow(question: string, userId: string, jobUpdateCallback?: (content: string, progress: number, status?: string) => Promise<void>, resultId?: string): Promise<{
  content: string;
  chartData: ChartData;
  sources: Source[];
  tasks: Task[];
}> {
  try {
    console.log(`启动Dify工作流，问题: "${question}"`);
    
    // 调用Dify Workflow API，使用流式模式
    const response = await fetch(`${dify_url}/v1/workflows/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dify_api_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: {
          "research_question": question
        },
        response_mode: "streaming", // 使用流式模式
        user: userId || "research-worker"
      })
    });
    
    if (!response.ok) {
      throw new Error(`Dify API错误 (${response.status}): ${await response.text()}`);
    }
    
    if (!response.body) {
      throw new Error('响应体为空');
    }

    // 处理流式响应
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let partialChunk = '';
    
    // 收集最终结果
    let finalContent = '';
    let accumulatedContent = ''; // 用于累积text_chunk内容
    let textChunkCount = 0; // 用于计算进度
    const chartData = createDefaultChartData();
    const sources = createDefaultSources();
    let currentNodeTitle = '准备中'; // 当前节点标题，默认为"准备中"
    let workflowRunId = ''; // 工作流执行ID
    
    // 存储任务节点
    const tasks: Task[] = [];
    
    // 循环读取流数据
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // 解码二进制数据
      const chunk = decoder.decode(value, { stream: true });
      
      // 合并之前未完成的块
      const textToParse = partialChunk + chunk;
      
      // 按照SSE规范解析数据，每个事件块以\n\n分隔
      const eventChunks = textToParse.split('\n\n');
      
      // 保存最后一个可能不完整的块
      partialChunk = eventChunks.pop() || '';
      
      // 处理每个完整的事件块
      for (const eventText of eventChunks) {
        if (!eventText.trim() || !eventText.startsWith('data:')) continue;
        console.log(`收到事件: ${eventText}`);
        try {
          // 解析事件数据
          const jsonText = eventText.replace(/^data:\s*/, '');
          const eventData = JSON.parse(jsonText);
          
          
          // 处理不同类型的事件
          if (eventData.event === 'workflow_started') {
            console.log(`工作流开始: ${eventData.workflow_run_id}`);
            workflowRunId = eventData.workflow_run_id;
            
            if (jobUpdateCallback) {
              await jobUpdateCallback(`# ${question}\n\n正在生成研究内容...\n\n`, 10, '工作流启动');
            }
          }
          else if (eventData.event === 'node_started') {
            // 新增：处理节点开始事件，获取节点标题作为状态
            currentNodeTitle = eventData.data.title || '正在处理';
            console.log(`节点开始: ${currentNodeTitle} (${eventData.data.node_id})`);
            
            // 创建任务节点记录
            const task: Task = {
              id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              nodeId: eventData.data.node_id,
              nodeType: eventData.data.node_type,
              title: currentNodeTitle,
              status: 'started',
              index: eventData.data.index,
              inputs: eventData.data.inputs,
              workflowRunId: workflowRunId,
              predecessorNodeId: eventData.data.predecessor_node_id,
              createdAt: new Date().toISOString()
            };
            
            // 添加到任务列表
            tasks.push(task);
            console.log(`添加任务节点记录: ${task.id} (${currentNodeTitle})`);
            
            // 如果有resultId，尝试更新研究结果中的tasks数组
            if (resultId) {
              try {
                await dbService.updateResearchResult(resultId, {
                  tasks
                });
              } catch (e) {
                console.error('更新任务记录失败:', e);
              }
            }
            
            // 使用节点标题作为状态并更新进度
            if (jobUpdateCallback) {
              await jobUpdateCallback(
                `# ${question}\n\n正在${currentNodeTitle}...\n\n${accumulatedContent}`, 
                Math.min(60, 10 + Math.floor(textChunkCount / 2)), 
                currentNodeTitle
              );
            }
          }
          else if (eventData.event === 'text_chunk' && eventData.data.text) {
            // 累积text_chunk内容
            accumulatedContent += eventData.data.text;
            textChunkCount++;
            
            // 每收到text_chunk都立即更新内容
            const progressContent = `# ${question}\n\n## 研究内容\n\n${accumulatedContent}`;
            // 计算进度，范围在20-80之间
            const progress = Math.min(80, 20 + Math.floor(textChunkCount / 2));
            
            // 打印接收到的内容片段
            console.log(`收到text_chunk ${textChunkCount}:`, eventData.data.text.substring(0, 50) + (eventData.data.text.length > 50 ? '...' : ''));
            
            // 每次都更新，使用当前节点标题作为状态
            if (jobUpdateCallback) {
              console.log(`更新研究内容，当前累积长度: ${accumulatedContent.length}字符，当前节点: ${currentNodeTitle}`);
              await jobUpdateCallback(progressContent, progress, currentNodeTitle);
            }
          }
          else if (eventData.event === 'node_finished') {
            // 从节点输出中提取数据
            if (eventData.data.outputs) {
              if (eventData.data.outputs.research_content || eventData.data.outputs.content) {
                finalContent = eventData.data.outputs.research_content || eventData.data.outputs.content;
              }
              
              if (eventData.data.outputs.chart_data) {
                try {
                  const chartDataOutput = 
                    typeof eventData.data.outputs.chart_data === 'string' 
                      ? JSON.parse(eventData.data.outputs.chart_data) 
                      : eventData.data.outputs.chart_data;
                  
                  Object.assign(chartData, chartDataOutput);
                } catch (e) {
                  console.warn('解析图表数据失败:', e);
                }
              }
              
              if (eventData.data.outputs.sources) {
                try {
                  const sourcesOutput = 
                    typeof eventData.data.outputs.sources === 'string'
                      ? JSON.parse(eventData.data.outputs.sources)
                      : eventData.data.outputs.sources;
                  
                  if (Array.isArray(sourcesOutput) && sourcesOutput.length > 0) {
                    // 转换源数据格式
                    const formattedSources = sourcesOutput.map((src: Record<string, unknown>, index: number) => ({
                      id: (src.id as string) || `${index + 1}`,
                      title: (src.title as string) || `来源 ${index + 1}`,
                      url: (src.url as string) || '#',
                      source: (src.source as string) || 'Unknown',
                      sourceId: (src.sourceId as string) || `source-${index + 1}`
                    }));
                    
                    if (formattedSources.length > 0) {
                      sources.length = 0; // 清空默认来源
                      sources.push(...formattedSources);
                    }
                  }
                } catch (e) {
                  console.warn('解析来源数据失败:', e);
                }
              }
            }
            
            // 更新任务节点记录
            const taskIndex = tasks.findIndex(t => t.nodeId === eventData.data.node_id);
            if (taskIndex !== -1) {
              const task = tasks[taskIndex];
              tasks[taskIndex] = {
                ...task,
                status: eventData.data.status || 'finished',
                outputs: eventData.data.outputs,
                elapsedTime: eventData.data.elapsed_time,
                totalTokens: eventData.data.execution_metadata?.total_tokens,
                error: eventData.data.error,
                finishedAt: new Date().toISOString()
              };
              
              console.log(`更新任务节点记录: ${task.id} (${eventData.data.node_id}) 完成`);
              
              // 如果有resultId，尝试更新研究结果中的tasks数组
              if (resultId) {
                try {
                  await dbService.updateResearchResult(resultId, {
                    tasks
                  });
                } catch (e) {
                  console.error('更新任务记录失败:', e);
                }
              }
            }
            
            // 节点完成后更新状态
            if (jobUpdateCallback) {
              const nodeTitle = eventData.data.title || currentNodeTitle;
              const status = `${nodeTitle}完成`;
              await jobUpdateCallback(finalContent || accumulatedContent, 85, status);
            }
          }
          else if (eventData.event === 'workflow_finished') {
            console.log(`工作流完成: ${eventData.workflow_run_id}, 状态: ${eventData.data.status}`);
            
            // 处理最终输出结果
            if (eventData.data.outputs) {
              if (!finalContent && eventData.data.outputs.research_content) {
                finalContent = eventData.data.outputs.research_content;
              } else if (!finalContent && eventData.data.outputs.content) {
                finalContent = eventData.data.outputs.content;
              } else if (!finalContent && eventData.data.outputs.answer) {
                finalContent = eventData.data.outputs.answer;
              }
            }
            
            // 如果没有获得完整内容但有累积的text_chunk内容
            if (!finalContent && accumulatedContent) {
              console.log('使用累积的text_chunk内容作为最终结果');
              finalContent = `# ${question}\n\n## 研究内容\n\n${accumulatedContent}`;
            } else if (!finalContent) {
              console.log('未能获取任何内容，使用默认内容');
              finalContent = `# ${question}\n\n## 研究概述\n\n由于某些原因，未能获取到研究内容。请稍后再试。`;
            }
            
            // 最终更新进度为90%
            if (jobUpdateCallback && finalContent) {
              await jobUpdateCallback(finalContent, 90, '处理完成');
            }
          }
        } catch (e) {
          console.error('解析事件数据出错:', e, eventText);
        }
      }
    }
    
    return {
      content: finalContent,
      chartData,
      sources,
      tasks
    };
  } catch (error) {
    console.error('启动Dify工作流出错:', error);
    // 出错时返回默认数据
    return {
      content: `# ${question}\n\n## 研究概述\n\n获取研究内容时出错，请稍后再试。\n\n错误信息: ${error instanceof Error ? error.message : '未知错误'}`,
      chartData: createDefaultChartData(),
      sources: createDefaultSources(),
      tasks: []
    };
  }
}

// 从Dify Workflow获取研究内容
async function getResearchFromDify(question: string, userId: string, jobUpdateCallback?: (content: string, progress: number, status?: string) => Promise<void>, resultId?: string): Promise<{
  content: string;
  chartData: ChartData;
  sources: Source[];
  tasks: Task[];
}> {
  // 直接使用流式模式获取研究内容，传入更新回调
  return await startDifyWorkflow(question, userId, jobUpdateCallback, resultId);
}

// 创建默认图表数据
function createDefaultChartData(): ChartData {
  return {
    type: 'line',
    labels: ['2020', '2025', '2030', '2035', '2040', '2045', '2050'],
    datasets: [
      {
        label: '数据集',
        data: [0, 0.5, 1.1, 1.7, 2.2, 2.8, 3.3],
        borderColor: 'rgb(255, 99, 132)',
      }
    ]
  };
}

// 创建默认来源
function createDefaultSources(): Source[] {
  return [
    {
      id: '1',
      title: 'IPCC第六次评估报告',
      url: 'https://www.ipcc.ch/report/ar6/wg1/',
      source: 'IPCC',
      sourceId: 'ipcc-ar6',
    },
    {
      id: '2',
      title: 'NASA全球气候变化：重要迹象',
      url: 'https://climate.nasa.gov/vital-signs/',
      source: 'NASA',
      sourceId: 'nasa-vital-signs',
    }
  ];
}

// 创建worker
const worker = new Worker<ResearchJobData>(
  QUEUE_NAME,
  async (job: Job<ResearchJobData>) => {
    try {
      console.log(`开始处理任务 [${job.id}]:`, job.data);
      const { resultId, request, userId } = job.data;
      
      // 更新任务状态为处理中
      await job.updateProgress({ status: 'processing', progress: 0 });
      
      // 创建实时更新回调函数
      const updateCallback = async (content: string, progress: number, status?: string) => {
        // 更新任务进度和部分内容
        await job.updateProgress({ 
          status: status || 'generating', 
          progress,
          partialContent: content 
        });
        
        // 每次都更新数据库中的部分结果
        console.log(`更新数据库中的研究结果 ID:${resultId}, 内容长度:${content.length}字符, 状态:${status || 'generating'}`);
        console.log(`内容预览: ${content.substring(0, 100)}...`);
        
        await dbService.updateResearchResult(resultId, {
          markdownContent: content,
          isComplete: false,
          status: status || 'generating'
        });
      };
      
      // 从Dify获取研究内容，传入更新回调
      const researchData = await getResearchFromDify(request.title, userId, updateCallback, resultId);

      // 更新最终进度
      await job.updateProgress({ status: 'completed', progress: 100 });

      // 生成研究报告内容
      const result = {
        markdownContent: researchData.content,
        sources: researchData.sources,
        tasks: researchData.tasks,
        data: {
          charts: [researchData.chartData],
          summary: {
            confidenceLevel: 0.95
          }
        },
        isComplete: true,
        status: 'completed'
      };

      // 打印最终内容
      console.log(`最终研究内容长度: ${researchData.content.length}字符`);
      console.log(`最终内容预览:\n${researchData.content.substring(0, 300)}...\n`);
      console.log(`来源数量: ${researchData.sources.length}`);
      console.log(`任务数量: ${researchData.tasks.length}`);

      // 更新数据库中的研究结果
      await dbService.updateResearchResult(resultId, result);

      console.log(`任务完成 [${job.id}]`);
      return { status: 'success', resultId };
    } catch (error) {
      console.error(`任务处理失败 [${job.id}]:`, error);
      throw error;
    }
  },
  workerOptions
);

// 错误处理
worker.on('error', err => {
  console.error('Worker错误:', err);
});

// 任务进度
worker.on('progress', (job, progress) => {
  console.log(`任务进度 [${job.id}]:`, progress);
});

// 任务完成
worker.on('completed', job => {
  console.log(`任务完成 [${job.id}], 结果:`, job.returnvalue);
});

// 任务失败
worker.on('failed', (job, err) => {
  console.error(`任务失败 [${job?.id}]:`, err);
});

// 任务卡住
worker.on('stalled', jobId => {
  console.warn(`任务卡住 [${jobId}]`);
});

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('收到SIGTERM信号，准备关闭worker...');
  await worker.close();
  await connection.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('收到SIGINT信号，准备关闭worker...');
  await worker.close();
  await connection.quit();
  process.exit(0);
});

console.log('研究队列worker已启动，等待任务...'); 
import { Worker, Job, WorkerOptions } from 'bullmq';
import IORedis from 'ioredis';
import { ResearchQuestion, Source } from '@/types/chat';
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
  question: ResearchQuestion;
  userId: string;
  resultId: string;
}

// 模拟数据生成函数
function generateMockData(question: string) {
  // 模拟图表数据
  const chartData = {
    type: 'line',
    labels: ['2020', '2025', '2030', '2035', '2040', '2045', '2050'],
    datasets: [
      {
        label: '全球平均温度变化(°C)',
        data: [0, 0.5, 1.1, 1.7, 2.2, 2.8, 3.3],
        borderColor: 'rgb(255, 99, 132)',
      },
      {
        label: '海平面上升(cm)',
        data: [0, 5, 12, 20, 30, 42, 55],
        borderColor: 'rgb(54, 162, 235)',
      }
    ]
  };

  // 模拟来源数据
  const sources: Source[] = [
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

    },
    {
      id: '3',
      title: '世界气象组织年度报告',
      url: 'https://public.wmo.int/en',
      source: 'WMO',
      sourceId: 'wmo-annual',

    }
  ];

  // 生成报告内容
  const content = `# ${question}

## 研究概述

根据最新的气候科学研究数据，我们对未来气候变化趋势进行了深入分析。主要发现包括：

### 1. 温度变化趋势

- 到2050年，全球平均温度预计将升高3.3°C
- 极端天气事件频率将显著增加
- 热浪和干旱将更加频繁和持久

### 2. 海平面上升

- 预计到2050年海平面将上升55厘米
- 沿海地区面临更大的洪水风险
- 小岛国家尤其容易受到影响

### 3. 生态系统影响

- 生物多样性持续减少
- 珊瑚礁系统面临严重威胁
- 极地冰盖加速融化

## 数据分析

附图显示了温度变化和海平面上升的预测趋势。这些预测基于多个气候模型的综合分析。

## 缓解措施建议

1. 加速可再生能源转型
2. 提高能源使用效率
3. 加强生态系统保护
4. 发展气候适应性策略

## 参考来源

本研究基于IPCC、NASA和WMO等权威机构的最新研究数据和报告。详细来源请见引用列表。`;

  return {
    content,
    chartData,
    sources
  };
}

// 创建worker
const worker = new Worker<ResearchJobData>(
  QUEUE_NAME,
  async (job: Job<ResearchJobData>) => {
    try {
      console.log(`开始处理任务 [${job.id}]:`, job.data);
      const { resultId, question } = job.data;
      
      // 更新任务状态为处理中
      await job.updateProgress({ status: 'processing', progress: 0 });
      
      // 模拟研究处理过程
      let progress = 0;
      const steps = ['收集数据', '分析中', '生成报告'];
      
      for (const step of steps) {
        // 更新进度
        progress += 33;
        await job.updateProgress({ 
          status: step,
          progress: Math.min(progress, 99)  // 确保不超过99%
        });
        
        // 模拟处理时间 - 随机1-3秒
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      }

      // 生成模拟数据
      const mockData = generateMockData(question.question);

      // 更新最终进度
      await job.updateProgress({ status: 'completed', progress: 100 });

      // 生成研究报告内容
      const result = {
        markdownContent: mockData.content,
        sources: mockData.sources,
        data: {
          charts: [mockData.chartData],
          summary: {
            temperatureChange: 3.3,
            seaLevelRise: 55,
            confidenceLevel: 0.95
          }
        },
        isComplete: true,
        status: 'completed'
      };

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
import { Queue } from 'bullmq';
import { QUEUE_NAMES, DEFAULT_QUEUE_OPTIONS } from './config';
import { ResearchQuestion } from '@/types/chat';

export interface ResearchJobData {
  researchId: string;
  question: ResearchQuestion;
  userId: string;
  resultId: string;
}

class ResearchQueueProducer {
  private queue: Queue;

  constructor() {
    this.queue = new Queue(QUEUE_NAMES.RESEARCH, DEFAULT_QUEUE_OPTIONS);
  }

  /**
   * 添加研究任务到队列
   */
  async addResearchJob(data: ResearchJobData) {
    const jobId = `research:${data.researchId}`;
    
    // 添加任务到队列，使用researchId作为jobId以确保唯一性
    const job = await this.queue.add(jobId, data, {
      jobId,
      // 如果存在相同ID的任务，则移除旧任务
      removeOnFail: true,
    });

    return job;
  }

  /**
   * 获取任务状态
   */
  async getJobStatus(researchId: string) {
    const jobId = `research:${researchId}`;
    const job = await this.queue.getJob(jobId);
    
    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = await job.progress();
    
    return {
      id: job.id,
      state,
      progress,
      data: job.data,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason,
    };
  }

  /**
   * 关闭队列连接
   */
  async close() {
    await this.queue.close();
  }
}

// 导出单例实例
export const researchQueueProducer = new ResearchQueueProducer(); 
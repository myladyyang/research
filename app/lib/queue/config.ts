import { QueueOptions } from 'bullmq';

// Redis连接配置
export const REDIS_CONFIG = {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || '2clabsadmin',
  }
};

// 队列名称常量
export const QUEUE_NAMES = {
  RESEARCH: 'research-queue'
} as const;

// 默认队列选项
export const DEFAULT_QUEUE_OPTIONS: QueueOptions = {
  ...REDIS_CONFIG,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  }
}; 
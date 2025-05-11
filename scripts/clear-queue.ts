import { Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import readline from 'readline';

// Redis连接配置 - 与worker.ts保持一致
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

// 队列名称 - 与worker.ts保持一致
const QUEUE_NAME = 'research-queue';

// 创建用户确认界面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function clearQueue(queueName: string): Promise<void> {
  try {
    console.log(`开始清空队列: ${queueName}`);

    // 创建队列引用
    const queue = new Queue(queueName, { connection });
    const queueEvents = new QueueEvents(queueName, { connection });
    
    // 获取队列状态信息
    const counts = await queue.getJobCounts(
      'active', 'completed', 'failed', 'delayed', 'waiting', 'paused'
    );
    
    console.log(`当前队列状态:`, counts);
    
    // 清空所有类型的任务
    const totalJobs = 
      counts.active + 
      counts.completed + 
      counts.failed + 
      counts.delayed + 
      counts.waiting + 
      counts.paused;
    
    if (totalJobs === 0) {
      console.log('队列中没有任务需要清空');
      return;
    }
    
    rl.question(`确认清空 ${totalJobs} 个任务? (y/n): `, async (answer) => {
      if (answer.toLowerCase() === 'y') {
        // 清空所有任务
        await queue.obliterate({ force: true });
        console.log(`队列 ${queueName} 已清空`);

        // 清空Redis中队列相关的键
        const keys = await connection.keys(`bull:${queueName}:*`);
        if (keys.length > 0) {
          console.log(`删除剩余的 ${keys.length} 个Redis键...`);
          await connection.del(...keys);
          console.log('Redis键删除完成');
        }
      } else {
        console.log('操作已取消');
      }
      
      // 关闭连接
      rl.close();
      await queue.close();
      await queueEvents.close();
      await connection.quit();
    });
  } catch (error) {
    console.error('清空队列出错:', error);
    rl.close();
    await connection.quit();
    process.exit(1);
  }
}

// 清空数据库脚本函数
async function clearResearchData(): Promise<void> {
  rl.question('是否同时清空数据库中的研究数据? (y/n): ', async (answer) => {
    if (answer.toLowerCase() === 'y') {
      console.log('请运行 npx prisma db seed 来重置数据库数据');
    }
    
    // 继续清空队列
    await clearQueue(QUEUE_NAME);
  });
}

// 主函数
async function main(): Promise<void> {
  console.log('=== 研究队列清空工具 ===');
  await clearResearchData();
}

// 执行主函数
main().catch((error) => {
  console.error('脚本执行失败:', error);
  process.exit(1);
}); 
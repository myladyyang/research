/* eslint-disable  @typescript-eslint/no-explicit-any */

import {PrismaClient } from '@prisma/client';

// 避免在开发环境下创建多个 PrismaClient 实例
// https://www.prisma.io/docs/guides/development-environment/prevent-prisma-client-hot-reloading

// 添加全局类型声明以避免 TypeScript 错误
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// 在服务器端检查
if (typeof window !== 'undefined') {
  console.error('PrismaClient只能在服务器端使用');
}

// 使用全局变量来保存 PrismaClient 实例
export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// 在非生产环境下，将 prisma 分配给全局变量以防止热重载导致多个实例
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// 从types/chat导入接口
import { ResearchQuestion,  Research, Source, ResearchResult } from '../types/chat';

/**
 * 基础的数据库操作包装器 - 仅服务端使用
 */
export class DbService {
  /**
   * 确保服务端执行
   */
  private ensureServerSide() {
    if (typeof window !== 'undefined') {
      throw new Error('DbService只能在服务器端使用');
    }
  }

  /**
   * 创建新的研究报告
   */
  async createResearch(question: ResearchQuestion, userId?: string) {
    this.ensureServerSide();

    try {
      // 创建事务确保数据一致性
      return prisma.$transaction(async (tx) => {

        // 1. 创建研究报告，直接保存问题为JSON
        const research = await tx.research.create({
          data: {
            title: question.question,
            userId: userId, // 添加用户ID
            // 将问题存储为JSON字段
            question: {
              question: question.question,
              model: question.model,
              files: question.files?.map(file => ({
                id: file.id,
                name: file.name,
                type: file.type,
                url: file.url
              })) || []
            },
            // 初始化其他JSON字段
            related: [],
            files: [],
          },
        });
        
        // 2. 创建初始研究结果
        const result = await tx.researchResult.create({
          data: {
            version: 1,
            researchId: research.id,
            status: '初始化研究...',
            isComplete: false,
            data: {},
            sources: [],
          },
        });
        
        return { research, result };
      });
    } catch (error) {
      console.error("创建研究失败:", error);
      throw error;
    }
  }

  /**
   * 获取研究报告及其关联数据
   */
  async getResearch(id: string): Promise<Research> {
    this.ensureServerSide();
    console.log("获取研究报告 444", id);
    try {
      const research = await prisma.research.findUnique({
        where: { id },
        include: {
          results: {
            orderBy: { version: 'asc' },
          }
        },
      });

      if (!research) {
        throw new Error('Research not found');
      }

      // 转换为前端需要的格式
      const result: Research = {
        id: research.id,
        title: research.title,
        question: research.question as any,
        related: research.related as any,
        files: research.files as any,
        results: research.results.map(r => ({
          id: r.id,
          version: r.version,
          isComplete: r.isComplete,
          markdownContent: r.markdownContent || undefined,
          summary: r.summary || undefined,
          status: r.status || undefined,
          data: r.data as any,
          sources: r.sources as any,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
          researchId: r.researchId
        })),
        // 当前活动的研究结果，选择最新版本
        currentResult: research.results.length > 0 ? 
          (() => {
            const latest = research.results.reduce((prev, curr) => 
              prev.version > curr.version ? prev : curr
            );
            return {
              id: latest.id,
              version: latest.version,
              isComplete: latest.isComplete,
              markdownContent: latest.markdownContent || undefined,
              summary: latest.summary || undefined,
              status: latest.status || undefined,
              data: latest.data as any,
              sources: latest.sources as any,
              createdAt: latest.createdAt.toISOString(),
              updatedAt: latest.updatedAt.toISOString(),
              researchId: latest.researchId
            };
          })() : undefined,
        userId: research.userId || undefined,
        date: research.createdAt.toISOString(), // 非数据库字段，格式化的日期
        createdAt: research.createdAt.toISOString(),
        updatedAt: research.updatedAt.toISOString()
      };

      return result;
    } catch (error) {
      console.error("获取研究报告失败:", error);
      throw error;
    }
  }

  /**
   * 获取单个研究结果
   */
  async getResearchResult(resultId: string): Promise<ResearchResult | null> {
    this.ensureServerSide();
    
    try {
      const result = await prisma.researchResult.findUnique({
        where: { id: resultId }
      });
      
      if (!result) {
        return null;
      }
      
      return {
        id: result.id,
        version: result.version,
        isComplete: result.isComplete,
        markdownContent: result.markdownContent || undefined,
        summary: result.summary || undefined,
        status: result.status || undefined,
        data: result.data as any,
        sources: result.sources as any,
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
        researchId: result.researchId
      };
    } catch (error) {
      console.error("获取研究结果失败:", error);
      return null;
    }
  }

  /**
   * 更新研究结果内容
   */
  async updateResearchResult(resultId: string, data: {
    markdownContent?: string;
    summary?: string;
    data?: Record<string, unknown>;
    sources?: Source[];
    status?: string;
    isComplete?: boolean;
  }) {
    this.ensureServerSide();
    
    try {
      // 将Record<string, unknown>类型转换为Prisma可接受的JSON类型
      const prismaData: any = {};
      
      if (data.markdownContent !== undefined) {
        prismaData.markdownContent = data.markdownContent;
      }
      
      if (data.summary !== undefined) {
        prismaData.summary = data.summary;
      }
      
      if (data.status !== undefined) {
        prismaData.status = data.status;
      }
      
      if (data.isComplete !== undefined) {
        prismaData.isComplete = data.isComplete;
      }
      
      if (data.data) {
        prismaData.data = data.data;
      }
      
      if (data.sources) {
        // 转换Source[]为简单对象数组
        prismaData.sources = data.sources.map(source => ({
          id: source.id,
          sourceId: source.sourceId,
          title: source.title,
          url: source.url,
          source: source.source
        }));
      }
      
      return prisma.researchResult.update({
        where: { id: resultId },
        data: prismaData,
      });
    } catch (error) {
      console.error("更新研究结果失败:", error);
      throw error;
    }
  }

  /**
   * 更新研究状态
   */
  async updateResearchStatus(id: string, data: {
    isComplete?: boolean;
  }) {
    this.ensureServerSide();
    
    try {
      // 将Record<string, unknown>类型转换为Prisma可接受的JSON类型
      const prismaData: any = {};
      
      if (data.isComplete !== undefined) {
        prismaData.isComplete = data.isComplete;
      }
      
      return prisma.research.update({
        where: { id },
        data: prismaData,
      });
    } catch (error) {
      console.error("更新研究状态失败:", error);
      throw error;
    }
  }

  /**
   * 获取用户的所有研究报告
   */
  async getUserResearches(userId: string): Promise<Research[]> {
    this.ensureServerSide();
    
    try {
      const researches = await prisma.research.findMany({
        where: { userId }, // 确保只返回特定用户的研究
        orderBy: { createdAt: 'desc' },
        include: {
          results: {
            orderBy: {
              version: 'desc',
            },
            take: 1,
          }
        },
      });

      return researches.map(research => {
        // 转换为前端需要的格式
        const result: Research = {
          id: research.id,
          title: research.title,
          question: research.question as any,
          related: research.related as any,
          files: research.files as any,
          userId: research.userId || undefined,
          date: research.createdAt.toISOString(),
          createdAt: research.createdAt.toISOString(),
          updatedAt: research.updatedAt.toISOString()
        };

        // 设置当前结果（最新的结果）
        if (research.results.length > 0) {
          const lastResult = research.results[research.results.length - 1];
          result.currentResult = {
            id: lastResult.id,
            version: lastResult.version,
            isComplete: lastResult.isComplete,
            markdownContent: lastResult.markdownContent || undefined,
            summary: lastResult.summary || undefined,
            status: lastResult.status || undefined,
            data: lastResult.data as any,
            sources: lastResult.sources as any,
            createdAt: lastResult.createdAt.toISOString(),
            updatedAt: lastResult.updatedAt.toISOString(),
            researchId: lastResult.researchId
          };
        }

        return result;
      });
    } catch (error) {
      console.error("获取用户研究报告失败:", error);
      throw error;
    }
  }

  /**
   * 获取最近的研究报告
   */
  async getRecentResearches(limit = 10): Promise<Research[]> {
    this.ensureServerSide();
    
    try {
      const researches = await prisma.research.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          results: {
            orderBy: {
              version: 'desc',
            },
            take: 1,
          }
        },
      });

      return researches.map(research => {
        // 转换为前端需要的格式
        const result: Research = {
          id: research.id,
          title: research.title,
          question: research.question as any,
          related: research.related as any,
          files: research.files as any,
          userId: research.userId || undefined,
          date: research.createdAt.toISOString(),
          createdAt: research.createdAt.toISOString(),
          updatedAt: research.updatedAt.toISOString()
        };

        // 设置当前结果（最新的结果）
        if (research.results.length > 0) {
          const lastResult = research.results[research.results.length - 1];
          result.currentResult = {
            id: lastResult.id,
            version: lastResult.version,
            isComplete: lastResult.isComplete,
            markdownContent: lastResult.markdownContent || undefined,
            summary: lastResult.summary || undefined,
            status: lastResult.status || undefined,
            data: lastResult.data as any,
            sources: lastResult.sources as any,
            createdAt: lastResult.createdAt.toISOString(),
            updatedAt: lastResult.updatedAt.toISOString(),
            researchId: lastResult.researchId
          };
        }

        return result;
      });
    } catch (error) {
      console.error("获取最近研究报告失败:", error);
      throw error;
    }
  }

  /**
   * 创建新版本的研究结果
   * @param researchId 研究报告ID
   * @param currentVersion 当前版本号，用于生成新版本
   */
  async createNewVersionResult(researchId: string, currentVersion: number): Promise<ResearchResult> {
    const newVersion = currentVersion + 1;
    
    // 创建新的研究结果
    const newResult: ResearchResult = {
      id: `result-${Date.now()}`,
      version: newVersion,
      isComplete: false,
      status: '启动研究分析...',
      researchId,
      data: {},
      sources: [],
      createdAt: new Date().toISOString()
    };
    
    // 在这里添加实际的数据库插入代码
    console.log(`创建新版本研究结果: ${newResult.id}`, newResult);
    
    // 例如:
    // const savedResult = await db.researchResults.create({
    //   data: newResult
    // });
    // return savedResult;
    
    return newResult;
  }

}

export const dbService = new DbService(); 
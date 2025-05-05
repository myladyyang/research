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
import { ResearchQuestion,  UploadedFile, Research, Source, RelatedItem, ResearchResult, Data } from '../types/chat';

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

    // 创建事务确保数据一致性
    return prisma.$transaction(async (tx) => {
      // 1. 创建研究报告
      const research = await tx.research.create({
        data: {
          title: question.question,
          userId: userId, // 添加用户ID
        },
      });
      
      // 2. 创建问题
      const createdQuestion = await tx.question.create({
        data: {
          content: question.question,
          model: question.model,
          researchId: research.id,
          userId: userId, // 添加用户ID
          files: {
            create: question.files?.map(file => ({
              fileId: file.id,
              name: file.name,
              size: file.size,
              type: file.type,
              url: file.url,
            })) || [],
          },
        },
      });
      
      // 3. 创建初始研究结果
      await tx.researchResult.create({
        data: {
          version: 1,
          researchId: research.id,
          questionId: createdQuestion.id,
          status: '初始化研究...',
        },
      });
      
      return research;
    });
  }

  /**
   * 添加新的跟进问题
   */
  async addFollowupQuestion(researchId: string, question: ResearchQuestion, userId?: string) {
    this.ensureServerSide();
    
    return prisma.$transaction(async (tx) => {
      // 1. 获取该研究的问题数量，用于确定新问题的版本号
      const questionCount = await tx.question.count({
        where: { researchId },
      });
      
      // 2. 创建新问题
      const createdQuestion = await tx.question.create({
        data: {
          content: question.question,
          model: question.model,
          researchId,
          userId: userId, // 添加用户ID
          files: {
            create: question.files?.map(file => ({
              fileId: file.id,
              name: file.name,
              size: file.size,
              type: file.type,
              url: file.url,
            })) || [],
          },
        },
      });
      
      // 3. 创建新的研究结果
      const researchResult = await tx.researchResult.create({
        data: {
          version: questionCount + 1,
          researchId,
          questionId: createdQuestion.id,
          status: '处理跟进问题...',
        },
      });
      
      // 4. 更新研究状态
      await tx.research.update({
        where: { id: researchId },
        data: {
          updatedAt: new Date(),
        },
      });
      
      return { question: createdQuestion, result: researchResult };
    });
  }

  /**
   * 获取研究报告及其关联数据
   */
  async getResearch(id: string): Promise<Research> {
    this.ensureServerSide();
    
    const db_research = await prisma.research.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            files: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        results: {
          orderBy: { version: 'asc' },
        },
        sources: true,
        related: true,
        tags: true,
        File: true,
      },
    });

    if (!db_research) {
      throw new Error('Research not found');
    }

    return {
      id: db_research.id,
      title: db_research.title,
      isComplete: db_research.isComplete,
      date: db_research.createdAt.toISOString(),
      createdAt: db_research.createdAt.toISOString(),
      updatedAt: db_research.updatedAt.toISOString(),
      results: db_research.results.map(r => ({
        id: r.id,
        version: r.version,
        isComplete: r.isComplete,
        markdownContent: r.markdownContent || undefined,
        summary: r.summary || undefined,
        status: r.status || undefined,
        progress: r.progress || undefined,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        questionId: r.questionId,
        researchId: r.researchId
      })),
      questions: db_research.questions.map(q => ({
        id: q.id,
        question: q.content,
        model: q.model || undefined,
        createdAt: q.createdAt.toISOString(),
        updatedAt: q.updatedAt.toISOString(),
        files: q.files.map(f => ({
          id: f.id,
          fileId: f.fileId,
          name: f.name,
          size: f.size,
          type: f.type,
          url: f.url || ''
        }))
      })),
      sources: db_research.sources,
      related: db_research.related,
      tags: db_research.tags.map(t => t.name)
    };
  }

  /**
   * 更新研究结果内容
   */
  async updateResearchResult(resultId: string, data: {
    markdownContent?: string;
    summary?: string;
    status?: string;
    isComplete?: boolean;
    progress?: number;
  }) {
    this.ensureServerSide();
    
    return prisma.researchResult.update({
      where: { id: resultId },
      data,
    });
  }

  /**
   * 更新研究状态
   */
  async updateResearchStatus(id: string, data: {
    isComplete?: boolean;
  }) {
    this.ensureServerSide();
    
    return prisma.research.update({
      where: { id },
      data,
    });
  }

  /**
   * 添加研究报告的来源
   */
  async addResearchSources(researchId: string, sources: Array<{
    sourceId: string;
    title: string;
    url: string;
    source: string;
    sourceIcon?: string;
  }>) {
    this.ensureServerSide();
    
    return prisma.research.update({
      where: { id: researchId },
      data: {
        sources: {
          createMany: {
            data: sources,
            skipDuplicates: true,
          },
        },
      },
    });
  }

  /**
   * 添加相关研究
   */
  async addRelatedResearch(researchId: string, relatedItems: Array<{
    title: string;
    url: string;
    date?: string;
    description?: string;
  }>) {
    this.ensureServerSide();
    
    return prisma.research.update({
      where: { id: researchId },
      data: {
        related: {
          createMany: {
            data: relatedItems,
            skipDuplicates: true,
          },
        },
      },
    });
  }

  /**
   * 添加文件到问题
   */
  async addFilesToQuestion(questionId: string, files: UploadedFile[]) {
    this.ensureServerSide();
    
    return prisma.question.update({
      where: { id: questionId },
      data: {
        files: {
          createMany: {
            data: files.map(file => ({
              fileId: file.id,
              name: file.name,
              size: file.size,
              type: file.type,
              url: file.url,
            })),
            skipDuplicates: true,
          },
        },
      },
    });
  }

  /**
   * 添加文件到研究
   */
  async addFilesToResearch(researchId: string, files: UploadedFile[]) {
    this.ensureServerSide();
    
    return prisma.research.update({
      where: { id: researchId },
      data: {
        File: {
          createMany: {
            data: files.map(file => ({
              fileId: file.id,
              name: file.name,
              size: file.size,
              type: file.type,
              url: file.url,
            })),
            skipDuplicates: true,
          },
        },
      },
    });
  }

  /**
   * 获取问题的所有文件
   */
  async getQuestionFiles(questionId: string) {
    this.ensureServerSide();
    
    return prisma.file.findMany({
      where: { questionId },
    });
  }

  /**
   * 获取研究的所有文件
   */
  async getResearchFiles(researchId: string) {
    this.ensureServerSide();
    
    return prisma.file.findMany({
      where: { researchId },
    });
  }

  /**
   * 删除文件
   */
  async deleteFile(fileId: string) {
    this.ensureServerSide();
    
    return prisma.file.delete({
      where: { id: fileId },
    });
  }

  /**
   * 获取用户的所有研究报告
   */
  async getUserResearches(userId: string): Promise<Research[]> {
    this.ensureServerSide();
    
    const researches = await prisma.research.findMany({
      where: { userId }, // 确保只返回特定用户的研究
      orderBy: { createdAt: 'desc' },
      include: {
        questions: {
          include: {
            files: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        results: {
          include: {
            data: true,
          },
          orderBy: {
            version: 'desc',
          },
          take: 1,
        },
        sources: true,
        related: true,
        tags: true,
        File: true,
      },
    });

    return researches.map(research => {
      // 转换为前端需要的格式
      const result: Research = {
        id: research.id,
        title: research.title,
        isComplete: research.isComplete,
        date: research.createdAt.toISOString(),
        createdAt: research.createdAt.toISOString(),
        updatedAt: research.updatedAt.toISOString(),
        questions: research.questions.map(q => ({
          id: q.id,
          question: q.content,
          model: q.model || undefined,
          createdAt: q.createdAt.toISOString(),
          updatedAt: q.updatedAt.toISOString(),
          files: q.files.map(f => ({
            id: f.id,
            fileId: f.fileId,
            name: f.name,
            size: f.size,
            type: f.type,
            url: f.url || '',
            createdAt: f.createdAt.toISOString(),
            updatedAt: f.updatedAt.toISOString(),
          })),
          version: research.results.find(r => r.questionId === q.id)?.version,
        })),
        sources: research.sources as Source[],
        related: research.related as RelatedItem[],
        tags: research.tags.map(t => t.name),
        files: research.File.map(f => ({
          id: f.id,
          fileId: f.fileId,
          name: f.name,
          size: f.size,
          type: f.type,
          url: f.url || '',
          createdAt: f.createdAt.toISOString(),
          updatedAt: f.updatedAt.toISOString(),
        })),
      };

      // 设置当前问题（最新的问题）
      if (research.questions.length > 0) {
        const lastQuestion = research.questions[research.questions.length - 1];
        result.currentQuestion = {
          id: lastQuestion.id,
          question: lastQuestion.content,
          model: lastQuestion.model || undefined,
          createdAt: lastQuestion.createdAt.toISOString(),
          updatedAt: lastQuestion.updatedAt.toISOString(),
        };
      }

      // 设置当前结果（最新的结果）
      if (research.results.length > 0) {
        const lastResult = research.results[0];
        result.currentResult = {
          id: lastResult.id,
          version: lastResult.version,
          markdownContent: lastResult.markdownContent || undefined,
          summary: lastResult.summary || undefined,
          status: lastResult.status || undefined,
          isComplete: lastResult.isComplete,
          createdAt: lastResult.createdAt.toISOString(),
          updatedAt: lastResult.updatedAt.toISOString(),
          questionId: lastResult.questionId,
          researchId: lastResult.researchId,
        };
      }

      return result;
    });
  }

  /**
   * 获取最近的研究报告
   */
  async getRecentResearches(limit = 10): Promise<Research[]> {
    this.ensureServerSide();
    
    const researches = await prisma.research.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        questions: {
          include: {
            files: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        results: {
          orderBy: {
            version: 'desc',
          },
          take: 1,
        },
        sources: true,
        related: true,
        tags: true,
        File: true,
      },
    });

    return researches.map(research => {
      // 转换为前端需要的格式
      const result: Research = {
        id: research.id,
        title: research.title,
        isComplete: research.isComplete,
        date: research.createdAt.toISOString(),
        createdAt: research.createdAt.toISOString(),
        updatedAt: research.updatedAt.toISOString(),
        questions: research.questions.map(q => ({
          id: q.id,
          question: q.content,
          model: q.model || undefined,
          createdAt: q.createdAt.toISOString(),
          updatedAt: q.updatedAt.toISOString(),
          files: q.files.map(f => ({
            id: f.id,
            fileId: f.fileId,
            name: f.name,
            size: f.size,
            type: f.type,
            url: f.url || '',
            createdAt: f.createdAt.toISOString(),
            updatedAt: f.updatedAt.toISOString(),
          })),
          version: research.results.find(r => r.questionId === q.id)?.version,
        })),
        sources: research.sources as Source[],
        related: research.related as RelatedItem[],
        tags: research.tags.map(t => t.name),
        files: research.File.map(f => ({
          id: f.id,
          fileId: f.fileId,
          name: f.name,
          size: f.size,
          type: f.type,
          url: f.url || '',
          createdAt: f.createdAt.toISOString(),
          updatedAt: f.updatedAt.toISOString(),
        })),
      };

      // 设置当前问题（最新的问题）
      if (research.questions.length > 0) {
        const lastQuestion = research.questions[research.questions.length - 1];
        result.currentQuestion = {
          id: lastQuestion.id,
          question: lastQuestion.content,
          model: lastQuestion.model || undefined,
          createdAt: lastQuestion.createdAt.toISOString(),
          updatedAt: lastQuestion.updatedAt.toISOString(),
        };
      }

      // 设置当前结果（最新的结果）
      if (research.results.length > 0) {
        const lastResult = research.results[0];
        result.currentResult = {
          id: lastResult.id,
          version: lastResult.version,
          markdownContent: lastResult.markdownContent || undefined,
          summary: lastResult.summary || undefined,
          status: lastResult.status || undefined,
          isComplete: lastResult.isComplete,
          createdAt: lastResult.createdAt.toISOString(),
          updatedAt: lastResult.updatedAt.toISOString(),
          questionId: lastResult.questionId,
          researchId: lastResult.researchId,
        };
      }

      return result;
    });
  }

  /**
   * 创建新版本的研究结果
   * @param questionId 问题ID
   * @param researchId 研究报告ID
   * @param currentVersion 当前版本号，用于生成新版本
   */
  async createNewVersionResult(questionId: string, researchId: string, currentVersion: number): Promise<ResearchResult> {
    const newVersion = currentVersion + 1;
    
    // 创建新的研究结果
    const newResult: ResearchResult = {
      id: `result-${Date.now()}`,
      version: newVersion,
      questionId,
      researchId,
      isComplete: false,
      progress: 0,
      createdAt: new Date().toISOString(),
      status: '启动研究分析...'
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

  /**
   * 创建数据可视化内容
   * @param data 数据内容
   * @returns 创建的数据对象
   */
  async addDataToResearchResult(data: {
    content: string;
    dataType: string;
    isComplete: boolean;
    resultId: string;
  }): Promise<Data> {
    try {
      //create data and connect to researchResult
      const result = await prisma.data.create({
        data: {
          content: data.content,
          dataType: data.dataType,
          isComplete: data.isComplete,
          result: {
            connect: { id: data.resultId },
          },
        },
      });
      console.log(`创建数据可视化成功: ${result.id}`);
      return {
        id: result.id,
        content: result.content,
        dataType: result.dataType,
        isComplete: result.isComplete,
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
        resultId: result.resultId,
      };
    } catch (error) {
      console.error("创建数据可视化失败:", error);
      throw error;
    }
  }
}

export const dbService = new DbService(); 
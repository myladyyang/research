import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbService } from '@/services/db';
import { RelatedItem, Source, Research } from '@/types/chat';

/**
 * GET处理器 - 获取研究报告详细数据
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const researchId = params.id;

    if (!researchId) {
      return NextResponse.json(
        { error: "研究ID不能为空" },
        { status: 400 }
      );
    }

    // 获取研究
    const research = await dbService.getResearch(researchId);

    // 检查研究是否存在
    if (!research) {
      return NextResponse.json(
        { error: "研究不存在" },
        { status: 404 }
      );
    }

    // 检查用户是否有权限访问该研究
    if (session?.user?.id && research.userId && research.userId !== session.user.id) {
      return NextResponse.json(
        { error: "没有权限访问此研究" },
        { status: 403 }
      );
    }

    // 转换为前端类型
    const researchData: Research = {
      id: research.id,
      title: research.title,
      date: research.createdAt.toISOString(),
      isComplete: research.isComplete,
      createdAt: research.createdAt.toISOString(),
      updatedAt: research.updatedAt.toISOString(),
      
      // 问题列表
      questions: research.questions.map(q => ({
        id: q.id,
        question: q.content,
        model: q.model || undefined,
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
        createdAt: q.createdAt.toISOString(),
        updatedAt: q.updatedAt.toISOString(),
      })),
      
      // 当前问题（最新的问题）
      currentQuestion: research.questions.length > 0 ? {
        id: research.questions[research.questions.length - 1].id,
        question: research.questions[research.questions.length - 1].content,
        model: research.questions[research.questions.length - 1].model || undefined,
      } : undefined,
      
      // 结果列表
      results: research.results.map(r => ({
        id: r.id,
        version: r.version,
        markdownContent: r.markdownContent || undefined,
        summary: r.summary || undefined,
        data: r.data || undefined,
        status: r.status || undefined,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        questionId: r.questionId,
        researchId: r.researchId,
      })),
      
      // 当前结果（最新的结果）
      currentResult: research.results.length > 0 ? {
        id: research.results[0].id,
        version: research.results[0].version,
        markdownContent: research.results[0].markdownContent || undefined,
        summary: research.results[0].summary || undefined,
        data: research.results[0].data || undefined,
        status: research.results[0].status || undefined,
        createdAt: research.results[0].createdAt.toISOString(),
        questionId: research.results[0].questionId,
      } : undefined,
      
      // 其他关联数据
      sources: research.sources as Source[],
      related: research.related as RelatedItem[],
      tags: research.tags.map(t => t.name),
      files: research.File?.map(f => ({
        id: f.id,
        fileId: f.fileId,
        name: f.name,
        size: f.size,
        type: f.type,
        url: f.url || '',
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString(),
      })) || [],
    };
    
    return NextResponse.json({ research: researchData }, { status: 200 });
  } catch (error) {
    console.error("获取研究失败:", error);
    return NextResponse.json(
      { error: "获取研究失败" },
      { status: 500 }
    );
  }
}

/**
 * PUT处理器 - 更新研究报告内容
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    console.log(`接收到更新研究报告请求: ${reportId}`);
    
    // 解析请求体
    const body = await request.json();
    
    // 验证请求数据
    if (!body || typeof body !== 'object') {
      return new Response(
        JSON.stringify({ error: '缺少有效的更新数据' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 从请求体中获取研究结果ID
    const { resultId, markdownContent, data, summary, status, isComplete } = body;
    
    let updatedResearch;
    let updatedResult;
    
    // 如果提供了resultId，更新研究结果
    if (resultId) {
      updatedResult = await dbService.updateResearchResult(resultId, {
        markdownContent,
        data,
        summary,
        status,
      });
    }
    
    // 如果提供了isComplete，更新研究状态
    if (isComplete !== undefined) {
      updatedResearch = await dbService.updateResearchStatus(reportId, {
        isComplete,
      });
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        researchId: updatedResearch?.id || reportId,
        resultId: updatedResult?.id || resultId
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("更新研究报告失败:", error);
    return new Response(
      JSON.stringify({ 
        error: true, 
        message: error instanceof Error ? error.message : "更新研究报告失败" 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// 添加跟进问题
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const researchId = params.id;

    // 解析请求体
    const data = await request.json();

    // 添加跟进问题
    const result = await dbService.addFollowupQuestion(researchId, data, userId);

    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    console.error("添加问题失败:", error);
    return NextResponse.json(
      { error: "添加问题失败" },
      { status: 500 }
    );
  }
} 
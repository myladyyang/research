import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbService } from '@/services/db';
import { ResearchResult } from '@/types/chat';

/**
 * GET处理器 - 获取研究报告详细数据
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // 如果用户未登录，返回错误
    if (!session?.user) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }
    
    const researchId = params.id;
    
    // 获取研究报告
    const research = await dbService.getResearch(researchId);
    
    // 检查是否存在结果，以及这些结果的完成状态
    if (research && research.results && research.results.length > 0) {
      // 确定当前激活的结果
      // 如果有完成的结果，选择版本号最高的完成结果
      const completedResults = research.results.filter(r => r.isComplete);
      
      if (completedResults.length > 0) {
        // 找到版本号最高的完成结果
        const latestCompletedResult = completedResults.reduce((prev, current) => 
          (prev.version > current.version) ? prev : current
        );
        
        // 设置为当前结果
        research.currentResult = latestCompletedResult;
        research.isComplete = true;
      } else {
        // 如果没有完成的结果，选择版本号最高的未完成结果
        const latestResult = research.results.reduce((prev, current) => 
          (prev.version > current.version) ? prev : current
        );
        
        research.currentResult = latestResult;
        research.isComplete = false;
      }
    } else {
      // 如果没有结果，创建一个初始结果
      const initialResult: ResearchResult = {
        id: `result-${Date.now()}`,
        version: 1,
        questionId: research.questions?.[0]?.id || "",
        researchId: research.id,
        isComplete: false,
        progress: 0,
        createdAt: new Date().toISOString(),
        status: '准备开始研究...'
      };
      
      research.results = [initialResult];
      research.currentResult = initialResult;
      research.isComplete = false;
    }
    
    return NextResponse.json(research, { status: 200 });
  } catch (error) {
    console.error("获取研究报告失败:", error);
    return NextResponse.json(
      { error: "获取研究报告失败" },
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
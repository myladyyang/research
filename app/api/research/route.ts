import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbService } from '@/services/db';
import { ResearchQuestion } from '@/types/chat';

/**
 * POST 处理器 - 创建新的研究报告
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    // 解析请求体
    const body = await request.json() as ResearchQuestion;
    
    // 验证请求数据
    if (!body.question || typeof body.question !== 'string') {
      return new Response(
        JSON.stringify({ error: '缺少有效的问题内容' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('创建研究报告:', body);

    // 创建研究报告记录
    const research = await dbService.createResearch(body, userId);
    
    // 返回研究报告ID
    return new Response(
      JSON.stringify({ id: research.id }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('创建研究报告失败:', error);
    return new Response(
      JSON.stringify({ 
        error: '处理请求时发生错误',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET 处理器 - 获取最近的研究报告列表
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // 如果用户未登录，返回空数组
    if (!session?.user) {
      return NextResponse.json({ research: [] }, { status: 200 });
    }
    
    // 获取用户的研究
    const research = await dbService.getUserResearches(session.user.id);
    
    return NextResponse.json({ research }, { status: 200 });
  } catch (error) {
    console.error("获取研究失败:", error);
    return NextResponse.json(
      { error: "获取研究失败" },
      { status: 500 }
    );
  }
} 
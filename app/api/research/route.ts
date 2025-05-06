import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/services/auth";
import { dbService } from '@/services/db';
import { researchQueueProducer } from '@/lib/queue/producer'
import { ResearchQuestion } from '@/types/chat';

/**
 * POST 处理器 - 创建新的研究报告
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const question = await request.json() as ResearchQuestion;
    
    // 创建初始研究记录
    const { research, result } = await dbService.createResearch(
      question,
      userId,
    );

    // 添加到队列处理
    await researchQueueProducer.addResearchJob({
      researchId: research.id,
      question,
      userId,
      resultId: result.id,
    });

    return NextResponse.json({ id: research.id });
  } catch (error) {
    console.error('创建研究失败:', error);
    return NextResponse.json(
      { error: '创建研究失败' },
      { status: 500 }
    );
  }
}

/**
 * GET 处理器 - 获取最近的研究报告列表
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const researches = await dbService.getUserResearches(userId);
    return NextResponse.json(researches);
  } catch (error) {
    console.error('获取研究列表失败:', error);
    return NextResponse.json(
      { error: '获取研究列表失败' },
      { status: 500 }
    );
  }
} 
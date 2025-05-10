import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/services/auth";
import { dbService } from '@/services/db';
import { researchQueueProducer } from '@/lib/queue/producer'
import type { ResearchQuestion } from '@/types/chat';

interface CreateChatRequest extends ResearchQuestion {
  title: string;
  files?: string[];
}

/**
 * POST 处理器 - 创建新的对话
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const data = await request.json() as CreateChatRequest;
    
    // 创建初始对话记录
    const { research, result } = await dbService.createResearch({
      title: data.title,
      question: data.question,
      mode: "CHAT",
      files: data.files,
      userId,
    });

    // 添加到队列处理
    await researchQueueProducer.addResearchJob({
      researchId: research.id,
      question: data.question,
      mode: "CHAT",
      userId,
      resultId: result.id,
    });

    return NextResponse.json({ id: research.id });
  } catch (error) {
    console.error('创建对话失败:', error);
    return NextResponse.json(
      { error: '创建对话失败' },
      { status: 500 }
    );
  }
}

/**
 * GET 处理器 - 获取最近的对话列表
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const chats = await dbService.getUserResearches(userId, "CHAT");
    return NextResponse.json(chats);
  } catch (error) {
    console.error('获取对话列表失败:', error);
    return NextResponse.json(
      { error: '获取对话列表失败' },
      { status: 500 }
    );
  }
} 
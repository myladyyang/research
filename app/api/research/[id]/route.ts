import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/services/auth";
import { dbService } from '@/services/db';

/**
 * GET处理器 - 获取研究报告详细数据
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("获取研究报告 222");
  try {
    const session = await getServerSession(authOptions);
    
    // 如果用户未登录，返回错误
    if (!session?.user) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }
    
    const researchId = (await params).id;
    
    // 获取研究报告
    console.log("获取研究报告 111", researchId);
    const research = await dbService.getResearch(researchId);
    
    return NextResponse.json(research);
  } catch (error) {
    console.error("获取研究报告失败:", error);
    return NextResponse.json({ error: "获取研究报告失败" }, { status: 500 });
  }
}



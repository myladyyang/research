import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/services/db';
import { RelatedItem } from '@/types/chat';

/**
 * POST处理器 - 添加研究报告相关内容
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const researchId = (await params).id;
    console.log(`接收到添加研究报告相关内容请求: ${researchId}`);
    
    // 解析请求体
    const body = await request.json() as RelatedItem[];
    
    // 验证请求数据
    if (!Array.isArray(body) || body.length === 0) {
      return new Response(
        JSON.stringify({ error: '缺少有效的相关内容数据' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 格式化相关内容数据
    const relatedItems = body.map(item => ({
      title: item.title,
      url: item.url,
      date: item.date || undefined,
      description: item.description || undefined
    }));
    
    // 添加研究报告相关内容
    await dbService.addRelatedResearch(researchId, relatedItems);
    
    return new Response(
      JSON.stringify({ success: true, count: relatedItems.length }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("添加研究报告相关内容失败:", error);
    return new Response(
      JSON.stringify({ 
        error: true, 
        message: error instanceof Error ? error.message : "添加研究报告相关内容失败" 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET处理器 - 获取研究报告相关内容
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const researchId = (await params).id;
    console.log(`接收到获取研究报告相关内容请求: ${researchId}`);
    // 获取研究报告
    const research = await dbService.getResearch(researchId);
    
    // 如果找不到报告，返回404
    if (!research) {
      return new Response(
        JSON.stringify({ error: '找不到请求的研究报告' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 格式化相关内容数据
    const relatedItems = research.related?.map((item: RelatedItem) => ({
      id: item.id,
      title: item.title,
      url: item.url,
      date: item.date,
      description: item.description
    })) || [];
    
    return new NextResponse(
      JSON.stringify(relatedItems),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("获取研究报告相关内容失败:", error);
    return new NextResponse(
      JSON.stringify({ 
        error: true, 
        message: error instanceof Error ? error.message : "获取研究报告相关内容失败" 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 
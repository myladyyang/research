import { NextRequest } from 'next/server';
import { dbService } from '@/services/db';
import { Source } from '@/types/chat';

/**
 * POST处理器 - 添加研究报告来源
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const researchId = (await params).id;
    console.log(`接收到添加研究报告来源请求: ${researchId}`);
    
    // 解析请求体
    const body = await request.json() as Source[];
    
    // 验证请求数据
    if (!Array.isArray(body) || body.length === 0) {
      return new Response(
        JSON.stringify({ error: '缺少有效的来源数据' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 格式化来源数据
    const sources = body.map(source => ({
      sourceId: source.id,
      title: source.title,
      url: source.url,
      source: source.source,
      sourceIcon: typeof source.sourceIcon === 'string' ? source.sourceIcon : undefined
    }));
    
    // 添加研究报告来源
    await dbService.addResearchSources(researchId, sources);
    
    return new Response(
      JSON.stringify({ success: true, count: sources.length }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("添加研究报告来源失败:", error);
    return new Response(
      JSON.stringify({ 
        error: true, 
        message: error instanceof Error ? error.message : "添加研究报告来源失败" 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET处理器 - 获取研究报告来源
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const researchId = (await params).id;
    console.log(`接收到获取研究报告来源请求: ${researchId}`);
    
    // 获取研究报告数据
    const research = await dbService.getResearch(researchId);
    
    // 如果找不到报告，返回404
    if (!research) {
      return new Response(
        JSON.stringify({ error: '找不到请求的研究报告' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 格式化来源数据
    const sources = research.sources?.map((source: Source) => ({
      id: source.id,
      title: source.title,
      url: source.url,
      source: source.source,
      sourceIcon: source.sourceIcon
    })) || [];
    
    return new Response(
      JSON.stringify(sources),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("获取研究报告来源失败:", error);
    return new Response(
      JSON.stringify({ 
        error: true, 
        message: error instanceof Error ? error.message : "获取研究报告来源失败" 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 
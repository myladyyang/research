import { NextRequest } from 'next/server';
import { dbService } from '@/services/db';
import { ResearchQuestion, Research } from '@/types/chat';

/**
 * POST 处理器 - 创建新的研究报告
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json() as ResearchQuestion;
    
    // 验证请求数据
    if (!body.question || typeof body.question !== 'string') {
      return new Response(
        JSON.stringify({ error: '缺少有效的问题内容' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 创建研究报告记录
    const research = await dbService.createResearch(body);
    
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
export async function GET(request: NextRequest) {
  try {
    // 从URL参数中获取limit
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    // 获取最近的研究报告
    const researches = await dbService.getRecentResearches(limit);
    
    // 前端已经使用 types/chat.ts 中定义的 Research 类型
    // dbService.getRecentResearches 方法已经将数据库结果转换为前端需要的格式
    // 因此这里直接返回即可
    return new Response(
      JSON.stringify(researches),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('获取研究报告列表失败:', error);
    return new Response(
      JSON.stringify({ 
        error: '处理请求时发生错误',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 
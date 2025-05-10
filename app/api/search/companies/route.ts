import { NextResponse } from 'next/server';
import type { Company } from '@/hooks/useSearchData';

// 模拟数据，实际应该从数据库获取
const COMPANIES: Company[] = [
  { name: '宁德时代', code: '300750.SZ', industry: '新能源' },
  { name: '比亚迪', code: '002594.SZ', industry: '汽车制造' },
  { name: '隆基绿能', code: '601012.SH', industry: '光伏设备' },
  { name: '中国宝武', code: '600019.SH', industry: '钢铁' },
  { name: '中国石化', code: '600028.SH', industry: '石油化工' },
  { name: '万华化学', code: '600309.SH', industry: '化工' }
];

export async function GET() {
  try {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return NextResponse.json(COMPANIES);
  } catch (error) {
    console.error('获取企业数据失败:', error);
    return NextResponse.json(
      { error: '获取企业数据失败' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import type { Industry } from '@/hooks/useSearchData';

// 模拟数据，实际应该从数据库获取
const INDUSTRIES: Industry[] = [
  { name: '新能源', subIndustries: ['光伏', '风电', '储能'] },
  { name: '光伏设备', subIndustries: ['硅片', '电池片', '组件'] },
  { name: '汽车制造', subIndustries: ['新能源汽车', '传统汽车'] },
  { name: '钢铁', subIndustries: ['特钢', '普钢'] },
  { name: '石油化工', subIndustries: ['炼油', '化工'] },
  { name: '化工', subIndustries: ['基础化工', '精细化工'] }
];

export async function GET() {
  try {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return NextResponse.json(INDUSTRIES);
  } catch (error) {
    console.error('获取行业数据失败:', error);
    return NextResponse.json(
      { error: '获取行业数据失败' },
      { status: 500 }
    );
  }
} 
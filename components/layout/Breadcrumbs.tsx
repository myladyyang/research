"use client";

import { Fragment, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronRightIcon, ChevronLeftIcon, HomeIcon } from 'lucide-react';

// 定义面包屑项接口
interface BreadcrumbItem {
  label: string;
  href?: string;  // 使用可选属性标记
  icon?: ReactNode;
}

interface BreadcrumbsProps {
  showBackButton?: boolean;
  items?: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ showBackButton = true, items, className = '' }: BreadcrumbsProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // 如果是首页，则不显示面包屑
  if (pathname === '/') {
    return null;
  }
  
  // 如果没有提供items，则尝试从路径自动生成
  const breadcrumbItems = items || generateBreadcrumbsFromPath(pathname);
  
  // 处理返回按钮点击
  const handleBackClick = () => {
    router.back();
  };
  
  return (
    <div className={`flex flex-wrap items-center gap-2 mb-4 py-2 ${className}`}>
      {showBackButton && (
        <button 
          onClick={handleBackClick}
          className="mr-2 flex items-center text-sm text-slate-600 hover:text-primary transition-colors"
        >
          <ChevronLeftIcon className="h-3.5 w-3.5 mr-1" />
          <span>返回</span>
        </button>
      )}
      
      <div className="h-4 border-r border-slate-300 mr-2"></div>
      
      <nav className="flex items-center overflow-x-auto">
        <ol className="flex items-center space-x-1 whitespace-nowrap">
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            
            return (
              <Fragment key={index}>
                <li className="flex items-center">
                  {item.href && !isLast ? (
                    <Link 
                      href={item.href}
                      className="flex items-center text-sm text-slate-600 hover:text-primary transition-colors"
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  ) : (
                    <span className={`flex items-center text-sm ${isLast ? 'font-medium text-slate-800' : 'text-slate-600'}`}>
                      {item.icon}
                      <span>{item.label}</span>
                    </span>
                  )}
                </li>
                
                {!isLast && (
                  <li className="text-slate-400">
                    <ChevronRightIcon className="h-3.5 w-3.5" />
                  </li>
                )}
              </Fragment>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}

// 根据路径自动生成面包屑
function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  
  // 首页
  const breadcrumbs = [
    {
      label: '首页',
      href: '/',
      icon: <HomeIcon className="h-3.5 w-3.5 mr-1" />
    }
  ];
  
  // 添加中间路径
  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // 尝试将路径片段转换为可读标签
    let label = segment;
    
    // 识别特殊路径
    if (segment === 'bank') {
      label = '银行';
    } else if (segment === 'stress-test') {
      label = '气候风险压力测试';
    } else if (segment === 'capital') {
      label = '资本规划';
    } else if (segment === 'exposure') {
      label = '风险暴露评估';
    } else if (segment === 'overview') {
      label = '风险概述';
    } else if (segment === 'industry') {
      label = '行业';
    } else if (segment === 'valuation') {
      label = '估值评估';
    } else if (segment === 'decision') {
      label = '投资决策';
    } else if (segment.match(/^\d+$/)) {
      // 数字ID路径用"详情"表示
      label = '分析报告';
    }
    
    // 明确定义href的类型为string
    const itemHref: string = index < segments.length - 1 ? currentPath : '';
    
    breadcrumbs.push({
      label,
      href: itemHref,
      icon: <ChevronRightIcon className="h-3.5 w-3.5" />
    });
  });
  
  return breadcrumbs;
} 
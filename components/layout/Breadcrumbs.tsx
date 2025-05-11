"use client";

import { Fragment, ReactNode, useEffect, useState } from 'react';
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
  className?: string;
}



export function Breadcrumbs({ showBackButton = true, className = '' }: BreadcrumbsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbItem[]>([]);

  useEffect(() => {
    generateBreadcrumbsFromPath(pathname).then(items => setBreadcrumbItems(items));
  }, [pathname]);

  // 如果是首页，则不显示面包屑
  if (pathname === '/') {
    return null;
  }

  
  
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
async function generateBreadcrumbsFromPath(pathname: string): Promise<BreadcrumbItem[]> {
  const segments = pathname.split('/').filter(Boolean);
  
  // 首页始终是第一个面包屑
  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: '首页',
      href: '/',
      icon: <HomeIcon className="h-3.5 w-3.5 mr-1" />
    }
  ];
  
  // 逐段处理路径
  let currentPath = '';
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;
    
    // 处理研究报告路径
    if (segment === 'research') {
      // 添加"研究报告"面包屑
      breadcrumbs.push({
        label: '研究报告',
        href: '/research',
        icon: <Fragment />
      });
      
      // 如果下一段是报告ID，则获取报告标题
      if (i + 1 < segments.length) {
        const reportId = segments[i + 1];
        
        try {
          // 获取研究报告标题
          const response = await fetch(`/api/research/simple/${reportId}`);
          if (response.ok) {
            const reportTitle = await response.json();
            
            // 添加报告标题作为最后一个面包屑
            breadcrumbs.push({
              label: reportTitle || '研究详情',
              href: '',  // 当前页面，无链接
              icon: <Fragment />
            });
          } else {
            // API请求失败，使用默认标题
            breadcrumbs.push({
              label: '研究详情',
              href: '',
              icon: <Fragment />
            });
          }
        } catch (error) {
          console.error('获取研究报告标题失败:', error);
          breadcrumbs.push({
            label: '研究详情',
            href: '',
            icon: <Fragment />
          });
        }
        
        // 跳过下一段处理，因为已经处理过了
        i++;
      }
      
      // 继续处理下一个路径段
      continue;
    }
    
    // 处理个人空间路径
    if (segment === 'myspace') {
      breadcrumbs.push({
        label: '个人空间',
        href: i < segments.length - 1 ? currentPath : '',
        icon: <Fragment />
      });
      continue;
    }
    
    // 处理其他路径段
    breadcrumbs.push({
      label: segment,
      href: i < segments.length - 1 ? currentPath : '',
      icon: <Fragment />
    });
  }
  
  return breadcrumbs;
} 
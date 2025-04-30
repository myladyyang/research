import React from "react";
import Link from "next/link";

interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  href: string;
}

const sidebarItems: SidebarItem[] = [
  {
    id: "home",
    label: "首页",
    icon: "🏠",
    href: "/",
  },
  {
    id: "research",
    label: "研究报告",
    icon: "📊",
    href: "/research",
  },
  {
    id: "dashboard",
    label: "个人空间",
    icon: "📁",
    href: "/dashboard",
  },
  {
    id: "settings",
    label: "设置",
    icon: "⚙️",
    href: "/settings",
  },
];

export function Sidebar() {
  return (
    <div className="p-4 flex flex-col h-full">
      <div className="mb-6">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">导航</h2>
        <nav>
          <ul className="space-y-1">
            {sidebarItems.map((item) => (
              <li key={item.id}>
                <Link 
                  href={item.href} 
                  className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-accent"
                >
                  <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      
      <div className="mt-6">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">最近研究</h2>
        <nav>
          <ul className="space-y-1">
            <li>
              <Link 
                href="/research/climate-change-2023" 
                className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-accent"
              >
                气候变化趋势分析 2023
              </Link>
            </li>
            <li>
              <Link 
                href="/research/renewable-energy" 
                className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-accent"
              >
                可再生能源发展报告
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      
      <div className="mt-auto pt-6">
        <div className="px-3 py-2 text-sm text-muted-foreground">
          © 2023 Climate AI
        </div>
      </div>
    </div>
  );
} 
import React from "react";
import Link from "next/link";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { HomeIcon, ChartBarIcon, FolderIcon, SettingsIcon } from "lucide-react";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
}

const sidebarItems: SidebarItem[] = [
  {
    id: "home",
    label: "首页",
    icon: HomeIcon,
    href: "/",
  },
  {
    id: "research",
    label: "研究报告",
    icon: ChartBarIcon,
    href: "/research",
  },
  {
    id: "myspace",
    label: "个人空间",
    icon: FolderIcon,
    href: "/myspace",
  },
  {
    id: "settings",
    label: "设置",
    icon: SettingsIcon,
    href: "/settings",
  },
];

export function Sidebar() {
  return (
    <ShadcnSidebar className="sidebar" collapsible="offcanvas">
      <SidebarContent className="mt-10">
        <SidebarGroup className="p-4 mb-2">
          <SidebarGroupLabel className="text-sm mt-4 font-medium text-muted-foreground mb-3">导航</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild>
                    <Link 
                      href={item.href} 
                      className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-accent"
                    >
                      <span className="w-5 h-5 flex items-center justify-center">
                        <item.icon className="h-5 w-5" />
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup className="p-4 mt-2">
          <SidebarGroupLabel className="text-sm font-medium text-muted-foreground mb-3">最近研究</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link 
                    href="/research/climate-change-2023" 
                    className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-accent"
                  >
                    气候变化趋势分析 2023
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link 
                    href="/research/renewable-energy" 
                    className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-accent"
                  >
                    可再生能源发展报告
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="mt-auto">
        <div className="px-3 py-2 text-sm text-muted-foreground p-4">
          © 2023 Climate AI
        </div>
      </SidebarFooter>
    </ShadcnSidebar>
  );
} 
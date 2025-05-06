"use client";
import React, { useEffect, useState } from "react";
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
import { useSession } from "next-auth/react";
import { HomeIcon, FolderIcon, SettingsIcon, Loader2Icon } from "lucide-react";
import { Research } from "@/types/chat";





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
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  
  const [recentResearch, setRecentResearch] = useState<Research[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getRecentResearch = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/research/user");
      if (!response.ok) {
        throw new Error('获取研究列表失败');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('获取研究列表失败:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      getRecentResearch().then(setRecentResearch);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

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
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : recentResearch.length > 0 ? (
                recentResearch.map((research) => (
                  <SidebarMenuItem key={research.id}>
                    <SidebarMenuButton asChild>
                      <Link 
                        href={`/research/${research.id}`}
                        className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-accent"
                      >
                        <span className="font-medium">
                          {research.title || '未命名研究'}
                        </span>

                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  暂无研究报告
                </div>
              )}
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
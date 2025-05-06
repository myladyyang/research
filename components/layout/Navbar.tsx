"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ThemeSwitcher } from "@/components/layout/ThemeSwitcher";
import { useSession, signOut } from "next-auth/react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { LayoutDashboardIcon, BellIcon, SettingsIcon, LogOutIcon, LogInIcon, UserPlusIcon } from "lucide-react";
import { Research } from "@/types/chat";

export function Navbar() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  const [myResearch, setMyResearch] = useState<Research[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getMyResearch = async () => {
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
  }

  useEffect(() => {
    if (isAuthenticated) {
      getMyResearch().then(setMyResearch);
    }
  }, [isAuthenticated]);

  return (
    <div className="flex items-center h-full w-full ">
      {/* 左侧 - Logo */}
      <div className="flex-none pl-4">
        <Link href="/" className="font-semibold text-lg">
          <span>Climate AI</span>
        </Link>
      </div>
      
      {/* 中间 - 研究和业务导航 */}
      <div className="flex-1 flex justify-center">
        <NavigationMenu className="md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link href="/" passHref>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <span>首页</span>
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
                
            <NavigationMenuItem>
              <NavigationMenuTrigger>
                <span className="flex items-center gap-2">
                  <LayoutDashboardIcon size={16} />
                  <span>我的空间</span>
                </span>
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="p-4 w-[280px]">
                  {isLoading ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      加载中...
                    </div>
                  ) : myResearch.length > 0 ? (
                    myResearch.map((research) => (
                      <Link 
                        href={`/research/${research.id}`} 
                        key={research.id} 
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <div className="text-sm font-medium leading-none">
                          {research.title || '未命名研究'}
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      暂无研究报告
                    </div>
                  )}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
      
      {/* 右侧 - 个人操作 */}
      <div className="flex-none h-full flex items-center">
        <div className="flex items-center">
          <ThemeSwitcher />
          <button 
            className="p-2 rounded-md hover:bg-accent text-muted-foreground flex items-center justify-center"
            aria-label="通知"
          >
            <BellIcon size={18} />
          </button>
          <button 
            className="p-2 rounded-md hover:bg-accent text-muted-foreground flex items-center justify-center"
            aria-label="设置"
          >
            <SettingsIcon size={18} />
          </button>
        </div>

        {isAuthenticated ? (
          <div className="flex items-center h-full">
            <UserAvatar name={session?.user?.name || session?.user?.email || ""} className="ml-2 mr-2" />
            <span className="text-sm hidden md:inline-block mr-2">{session?.user?.name || session?.user?.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="h-full flex items-center text-sm text-primary hover:underline px-4"
            >
              <LogOutIcon size={16} />
              <span className="hidden sm:inline ml-1">登出</span>
            </button>
          </div>
        ) : (
          <div className="flex h-full items-center">
            <Link href="/login" className="h-full flex items-center text-sm font-medium text-primary hover:underline px-4">
              <LogInIcon size={16} />
              <span className="hidden sm:inline ml-1">登录</span>
            </Link>
            <Link
              href="/register"
              className="h-full flex items-center justify-center text-sm font-medium bg-primary text-white hover:bg-primary/90 px-4 rounded-l-md rounded-r-none"
              style={{ marginRight: '0', position: 'relative', right: '0' }}
            >
              <UserPlusIcon size={16} />
              <span className="hidden sm:inline ml-1">注册</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 
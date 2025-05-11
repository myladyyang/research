"use client";

import React from "react";
import Link from "next/link";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ThemeSwitcher } from "@/components/layout/ThemeSwitcher";
import { useSession, signOut } from "next-auth/react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { 
  LayoutDashboardIcon, 
  BellIcon, 
  SettingsIcon, 
  LogOutIcon, 
  LogInIcon, 
  UserPlusIcon, 
  HomeIcon
} from "lucide-react";

export function Navbar() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

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
        <NavigationMenu className="md:flex" viewport={false}>
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link href="/" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                <span className="flex items-center gap-2">
                  <HomeIcon size={16} />
                  <span>首页</span>
                </span>
              </Link>
            </NavigationMenuItem>
            


                
            <NavigationMenuItem>
              <Link href="/myspace" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                <span className="flex items-center gap-2">
                  <LayoutDashboardIcon size={16} />
                  <span>我的空间</span>
                </span>
              </Link>
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
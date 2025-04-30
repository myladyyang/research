import React from "react";
import Link from "next/link";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ThemeSwitcher } from "@/components/layout/ThemeSwitcher";

interface NavbarProps {
  userName?: string;
}

export function Navbar({ userName = "用户" }: NavbarProps) {
  return (
    <div className="max-w-screen-2xl mx-auto flex justify-between items-center h-full px-4">
      <div className="flex items-center gap-4">
        <Link href="/" className="font-semibold text-lg">
          Climate AI
        </Link>
        <nav className="hidden md:flex ml-6">
          <ul className="flex space-x-1">
            <li>
              <Link 
                href="/" 
                className="px-3 py-2 text-sm rounded-md hover:bg-accent"
              >
                首页
              </Link>
            </li>
            <li>
              <Link 
                href="/research" 
                className="px-3 py-2 text-sm rounded-md hover:bg-accent"
              >
                研究
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard" 
                className="px-3 py-2 text-sm rounded-md hover:bg-accent"
              >
                我的空间
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      
      <div className="flex items-center gap-2">
        <ThemeSwitcher />
        <button 
          className="p-2 text-sm rounded-md hover:bg-accent text-muted-foreground"
          aria-label="通知"
        >
          🔔
        </button>
        <button 
          className="p-2 text-sm rounded-md hover:bg-accent text-muted-foreground"
          aria-label="设置"
        >
          ⚙️
        </button>
        <div className="flex items-center ml-2">
          <UserAvatar name={userName} className="mr-2" />
          <span className="text-sm hidden md:inline-block">{userName}</span>
        </div>
      </div>
    </div>
  );
} 
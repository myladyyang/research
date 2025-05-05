"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // 如果未登录，重定向到登录页
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);
  
  // 加载状态
  if (status === "loading") {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-bold mb-6">加载中...</h1>
        </div>
      </div>
    );
  }
  
  // 如果未登录
  if (status === "unauthenticated" || !session) {
    return null; // 重定向会处理，无需渲染
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-bold mb-6">个人资料</h1>
        
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium mb-2">基本信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">姓名</label>
                <div className="mt-1 py-2">{session.user.name || "未设置"}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600">邮箱</label>
                <div className="mt-1 py-2">{session.user.email}</div>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <h2 className="text-lg font-medium mb-2">账户信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">用户ID</label>
                <div className="mt-1 py-2 text-sm text-gray-600">{session.user.id}</div>
              </div>
            </div>
          </div>
          
          <div className="pt-6 flex justify-start">
            <a 
              href="/profile/edit" 
              className="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              编辑资料
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 
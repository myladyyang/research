import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const isAuthenticated = !!token;

  // 定义需要保护的路由路径
  const protectedPaths = [
    '/api/research',
  ];

  // 检查当前路径是否是受保护的API路径
  const isProtectedApiPath = protectedPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  );

  // 如果是API路由，需要特殊处理返回状态码
  if (!isAuthenticated && isProtectedApiPath) {
    return NextResponse.json(
      { error: "未授权访问" },
      { status: 401 }
    );
  }

  // 如果用户已登录并尝试访问登录/注册页面，重定向到首页
  if (isAuthenticated && (
    req.nextUrl.pathname.startsWith('/login') || 
    req.nextUrl.pathname.startsWith('/register')
  )) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

// 配置匹配的路由
export const config = {
  matcher: [
    '/api/research/:path*',
    '/login',
    '/register',
  ],
};
import { NextResponse } from "next/server";
import { authService } from "@/services/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // 验证请求参数
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    // 注册用户
    const user = await authService.registerUser({
      name,
      email,
      password
    });

    return NextResponse.json(
      { user },
      { status: 201 }
    );
  } catch (error: any) {
    // 处理错误
    console.error("[REGISTER_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "注册失败" },
      { status: 500 }
    );
  }
} 
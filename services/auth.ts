import bcrypt from 'bcryptjs';
import { prisma } from './db';

// 用户注册接口
export interface RegisterUserParams {
  name: string;
  email: string;
  password: string;
}

import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { SessionStrategy } from "next-auth";

export const authOptions =  {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // 查找用户
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          return null;
        }

        // 验证密码
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      }
    })
  ],
  session: {
    strategy: "jwt" as SessionStrategy
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login"
  },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: { session: any, token: any }) {
      // 将用户ID添加到会话中
      session.user.id = token.sub;
      return session;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: { token: any, user: any }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    }
  },
  debug: process.env.NODE_ENV === "development"
};


/**
 * 身份验证服务 - 仅服务端使用
 */
export class AuthService {
  /**
   * 注册新用户
   */
  async registerUser({ name, email, password }: RegisterUserParams) {
    // 检查这是否在服务器端运行
    if (typeof window !== 'undefined') {
      throw new Error('AuthService只能在服务器端使用');
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('该邮箱已被注册');
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      }
    });

    // 返回不包含密码的用户信息
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pwd, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * 验证用户凭据
   */
  async validateUserCredentials(email: string, password: string) {
    // 检查这是否在服务器端运行
    if (typeof window !== 'undefined') {
      throw new Error('AuthService只能在服务器端使用');
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.password) {
      return null;
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    // 返回不包含密码的用户信息
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pwd, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export const authService = new AuthService(); 
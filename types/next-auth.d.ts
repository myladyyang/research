import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

// 同时扩展JWT类型
declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
} 
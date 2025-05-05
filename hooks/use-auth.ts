"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export const useAuth = () => {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  
  const login = async (email: string, password: string) => {
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      
      return { success: !result?.error, error: result?.error };
    } catch (error) {
      console.error("登录失败:", error);
      return { success: false, error: "登录失败" };
    }
  };
  
  const logout = async (callbackUrl: string = "/") => {
    await signOut({ callbackUrl });
  };
  
  const registerAndLogin = async (name: string, email: string, password: string) => {
    try {
      // 注册
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || "注册失败" };
      }
      
      // 注册成功后自动登录
      return await login(email, password);
    } catch (error) {
      console.error("注册失败:", error);
      return { success: false, error: "注册失败" };
    }
  };
  
  const redirectToLogin = () => {
    router.push("/login");
  };
  
  const redirectToDashboard = () => {
    router.push("/dashboard");
  };
  
  return {
    session,
    status,
    isLoading,
    isAuthenticated,
    user: session?.user,
    login,
    logout,
    registerAndLogin,
    redirectToLogin,
    redirectToDashboard,
    updateSession: update,
  };
}; 
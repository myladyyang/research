"use client";

import { useRouter } from "next/navigation";
import { ChatInput } from "@/components/features/ChatInput";
import { Button } from "@/components/ui/Button";
import { UploadedFile } from "@/types/chat";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { ResearchType } from "@/types/chat";

export default function Home() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  const handleChatSubmit = async (
    message: string, 
    files: UploadedFile[]
  ) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(`/api/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: message,
          question: message,
          mode: "CHAT",
          files: files?.map(f => f.name)
        })
      });
      
      if (!response.ok) {
        throw new Error('创建对话失败');
      }
      
      const { id } = await response.json();
      router.push(`/chat/${id}`);
    } catch (error) {
      console.error("提交问题失败:", error);
      alert('创建对话失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResearchSubmit = async (
    message: string, 
    files: UploadedFile[],
    type: ResearchType
  ) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    try {
      // 根据输入内容解析企业或行业信息
      let researchData: {
        companyCode?: string;
        companyName?: string;
        industry?: string;
        industryName?: string;
      } = {};

      switch (type) {
        case "CORPORATE":
          // 假设message格式为: "公司名称 (股票代码)"
          const match = message.match(/^(.+?)\s*(?:\(([^)]+)\))?$/);
          if (match) {
            researchData = {
              companyName: match[1].trim(),
              companyCode: match[2]?.trim(),
            };
          }
          break;
        case "INDUSTRY":
          researchData = {
            industryName: message,
          };
          break;
        default:
          break;
      }

      const response = await fetch(`/api/research/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: "气候风险" + "<" + message + ">",
          mode: "RESEARCH",
          type,
          files: files?.map(f => f.name),
          ...researchData
        })
      });
      
      if (!response.ok) {
        throw new Error('创建研究报告失败');
      }
      
      const { id } = await response.json();
      router.push(`/research/${id}`);
    } catch (error) {
      console.error("提交问题失败:", error);
      alert('创建研究报告失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto pt-6 pb-16">
      {/* 标题区域 */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">Climate AI</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          探索气候数据，获取深度见解，利用AI分析推动气候研究与决策
        </p>
      </div>

      {/* 搜索输入区域 */}
      <div className="mb-10">
        <ChatInput 
          onChatSubmit={handleChatSubmit}
          onResearchSubmit={handleResearchSubmit}
          placeholder="输入您的气候研究主题或问题..."
          className="max-w-2xl mx-auto"
          isLoading={isSubmitting}
        />
      </div>

      {/* 示例问题 */}
      <div className="mb-12">
        <h2 className="text-center text-sm font-medium text-muted-foreground mb-3">
          尝试这些问题
        </h2>
        <div className="flex flex-wrap justify-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleResearchSubmit("宁德时代 (300750.SZ)", [], "CORPORATE")}
            disabled={isSubmitting}
          >
            分析宁德时代气候风险
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleResearchSubmit("新能源", [], "INDUSTRY")}
            disabled={isSubmitting}
          >
            新能源行业分析
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleChatSubmit("中国碳中和政策分析", [])}
            disabled={isSubmitting}
          >
            中国碳中和政策分析
          </Button>
        </div>
      </div>
    </div>
  );
}

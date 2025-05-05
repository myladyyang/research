"use client";

import { useRouter } from "next/navigation";
import { ChatInput } from "@/components/features/ChatInput";
import { WeatherCard, NewsCard } from "@/components/ui/InfoCard";
import { Button } from "@/components/ui/Button";
import { UploadedFile } from "@/types/chat";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 直接调用API创建研究报告
  const handleQuestionSubmit = async (message: string, files?: UploadedFile[], model?: string, source?: string) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {

      // 调用API创建研究报告
      const response = await fetch(`/api/research/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: message,
          model,
          source,
          files: files ? files.map(f => f.name) : undefined
        })
      });
      
      if (!response.ok) {
        throw new Error('创建研究报告失败');
      }
      
      // 导航到研究报告页面
      const {id} = await response.json();
      console.log("tempId", id);
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
          onQuestionSubmit={handleQuestionSubmit}
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
            onClick={() => handleQuestionSubmit("全球气温变化的最新趋势")}
            disabled={isSubmitting}
          >
            全球气温变化的最新趋势
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleQuestionSubmit("可再生能源发展报告")}
            disabled={isSubmitting}
          >
            可再生能源发展报告
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleQuestionSubmit("中国碳中和政策分析")}
            disabled={isSubmitting}
          >
            中国碳中和政策分析
          </Button>
        </div>
      </div>

      {/* 信息卡片区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <WeatherCard
          location="北京"
          temperature={24}
          condition="晴朗"
          icon="☀️"
        />
        <NewsCard
          source="气候观察"
          title="最新研究表明全球海洋温度继续上升"
          date="2023年10月15日"
        />
      </div>
      
    </div>
  );
}

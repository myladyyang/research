"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Research, UploadedFile } from "@/types/chat";
import Link from "next/link";
import { useResearchManager } from "@/hooks/useResearchManager";
import { 
  ChartLineIcon, 
  Loader2Icon, 
  AlertTriangleIcon,
  ArrowRightIcon,
  ClockIcon,
  CheckCircleIcon,
  CircleIcon,
  Building2Icon,
  FactoryIcon
} from "lucide-react";
import { ChatInput } from "@/components/features/ChatInput";
import { ResearchType } from "@/types/chat";

export default function MySpacePage() {
  const { status } = useSession();
  const router = useRouter();
  const researchManager = useResearchManager();
  const [researches, setResearches] = useState<Research[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 如果未登录，重定向到登录页
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // 使用 useCallback 包装获取研究数据的函数，避免重复创建
  const fetchResearches = useCallback(async () => {
    if (status !== "authenticated") return;
    
    try {
      setIsLoading(true);
      const data = await researchManager.api.getUserResearches();
      setResearches(data);
      setError(null);
    } catch (error) {
      console.error("获取研究失败:", error);
      setError("获取研究数据失败");
    } finally {
      setIsLoading(false);
    }
  }, [status, researchManager.api.getUserResearches]);

  // 只在组件挂载和身份验证状态变化时获取数据
  useEffect(() => {
    if (status === "authenticated") {
      fetchResearches();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // 按研究类型分组研究报告
  const corporateResearches = researches.filter(research => {
    return research.type === "CORPORATE" || 
           (research.request && 
            typeof research.request === 'object' && 
            'type' in research.request && 
            research.request.type === "CORPORATE");
  });

  const industryResearches = researches.filter(research => {
    return research.type === "INDUSTRY" || 
           (research.request && 
            typeof research.request === 'object' && 
            'type' in research.request && 
            research.request.type === "INDUSTRY");
  });

  // 未分类的研究报告
  const uncategorizedResearches = researches.filter(research => {
    return !research.type && 
           (!research.request || 
            typeof research.request !== 'object' || 
            !('type' in research.request));
  });

  // 处理研究提交
  const handleResearchSubmit = async (message: string, files: UploadedFile[], type: ResearchType) => {
    console.log("Research 模式:", message, type, files);
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }

    try {
      // 解析企业或行业信息
      let researchData: {
        companyCode?: string;
        companyName?: string;
        industry?: string;
        industryName?: string;
      } = {};

      // 根据类型处理数据
      if (type === "CORPORATE") {
        // 检查是否包含股票代码格式 "公司名称 (股票代码)"
        const match = message.match(/^(.+?)\s*(?:\(([^)]+)\))?$/);
        if (match) {
          researchData = {
            companyName: match[1].trim(),
            companyCode: match[2]?.trim() || undefined,
            industry: "未分类" // 可选，设置默认行业
          };
        } else {
          researchData = {
            companyName: message,
          };
        }
      } else {
        researchData = {
          industryName: message,
        };
      }

      // 创建API请求
      const response = await fetch(`/api/research/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `${type === "CORPORATE" ? "企业" : "行业"}气候风险分析: ${message}`,
          mode: "RESEARCH",
          type: type.toUpperCase(),
          files: files.map(f => ({ id: f.id, name: f.name, size: f.size, type: f.type, url: f.url })),
          ...researchData
        })
      });
      
      if (!response.ok) {
        throw new Error('创建研究报告失败');
      }
      
      const { id } = await response.json();
      
      // 重定向到研究页面
      if (id) {
        router.push(`/research/${id}`);
      } else {
        throw new Error('未获取到有效的研究ID');
      }
    } catch (error) {
      console.error("创建研究失败:", error);
      setError("创建研究失败，请稍后重试");
    }
  };

  // 加载状态
  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center">
          <Loader2Icon className="h-10 w-10 text-primary animate-spin" />
          <h2 className="mt-4 text-lg font-medium text-gray-700">加载中...</h2>
        </div>
      </div>
    );
  }

  // 如果未登录
  if (status === "unauthenticated") {
    return null; // 重定向会处理，无需渲染
  }

  // 渲染研究报告卡片
  const renderResearchCard = (research: Research) => (
    <Link 
      href={`/research/${research.id}`}
      key={research.id} 
      className="bg-white shadow hover:shadow-md rounded-lg transition-shadow flex flex-col h-full"
    >
      <div className="p-5 flex flex-col h-full">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-gray-900 line-clamp-1">{research.title}</h3>
          <span 
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              research.currentResult?.isComplete 
                ? 'bg-green-100 text-green-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {research.currentResult?.isComplete 
              ? <><CheckCircleIcon className="mr-1 h-3 w-3" /> 已完成</>
              : <><CircleIcon className="mr-1 h-3 w-3" /> 进行中</>
            }
          </span>
        </div>
        <div className="mt-2 text-sm text-gray-500 line-clamp-2 flex-grow">
          {research.currentResult?.summary || "暂无摘要"}
        </div>
        <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center text-sm text-gray-500">
            <ClockIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
            <p>{new Date(research.createdAt || '').toLocaleDateString()}</p>
          </div>
          <div className="flex items-center text-sm font-medium text-primary">
            <span>查看详情</span>
            <ArrowRightIcon className="ml-1 h-4 w-4" />
          </div>
        </div>
      </div>
    </Link>
  );

  // 渲染研究报告分类列表
  const renderResearchCategorySection = (
    title: string, 
    icon: React.ReactNode, 
    researchList: Research[], 
    emptyMessage: string
  ) => (
    <div className="mb-8">
      <div className="flex items-center mb-4">
        {icon}
        <h3 className="text-lg font-medium text-gray-900 ml-2">{title}</h3>
      </div>
      
      {researchList.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-gray-500 text-center py-4">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {researchList.map(renderResearchCard)}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-full w-full pb-8">
      {/* 页面标题 */}
      <div className="bg-white border-b">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">我的空间</h1>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        {/* 错误提示 */}
        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <div className="flex items-center">
              <AlertTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* ChatInput 替代新建研究按钮 */}
        <div className="mb-8 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">创建新研究</h2>
          <ChatInput 
            onResearchSubmit={handleResearchSubmit}
            isLoading={false}
            placeholder="输入您想研究的企业或行业..."
            className="w-full"
            enableChatMode={false}
            defaultMode="RESEARCH"
            defaultResearchType="CORPORATE"
          />
        </div>

        {researches.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 mt-8">
            <div className="flex items-center justify-center flex-col py-8">
              <ChartLineIcon className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无研究报告</h3>
              <p className="text-sm text-gray-500 mb-4 max-w-md text-center">
                使用上方的输入框创建研究报告，分析数据，获取洞见
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* 企业研究部分 */}
            {renderResearchCategorySection(
              "企业气候风险研究", 
              <Building2Icon className="h-5 w-5 text-primary" />, 
              corporateResearches,
              "暂无企业研究"
            )}

            {/* 行业研究部分 */}
            {renderResearchCategorySection(
              "行业气候风险研究", 
              <FactoryIcon className="h-5 w-5 text-primary" />, 
              industryResearches,
              "暂无行业研究"
            )}

            {/* 未分类研究部分（如果有的话） */}
            {uncategorizedResearches.length > 0 && renderResearchCategorySection(
              "其他研究", 
              <ChartLineIcon className="h-5 w-5 text-primary" />, 
              uncategorizedResearches,
              "暂无其他研究"
            )}
          </>
        )}
      </div>
    </div>
  );
} 
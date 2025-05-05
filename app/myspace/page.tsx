"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { researchService } from "@/services/research";
import { Research } from "@/types/chat";
import Link from "next/link";
import { 
  ChartLineIcon, 
  BookIcon, 
  FlaskRoundIcon, 
  PlusIcon, 
  Loader2Icon, 
  AlertTriangleIcon,
  ArrowRightIcon,
  ClockIcon,
  CheckCircleIcon,
  CircleIcon
} from "lucide-react";

export default function MySpacePage() {
  const { status } = useSession();
  const router = useRouter();
  const [researches, setResearches] = useState<Research[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 如果未登录，重定向到登录页
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // 获取用户的研究报告
  useEffect(() => {
    async function fetchResearches() {
      try {
        if (status === "authenticated") {
          setIsLoading(true);
          const data = await researchService.getUserResearches();
          setResearches(data);
          setError(null);
        }
      } catch (error) {
        console.error("获取研究失败:", error);
        setError("获取研究数据失败");
      } finally {
        setIsLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchResearches();
    }
  }, [status]);

  // 加载状态
  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <Loader2Icon className="h-12 w-12 text-primary animate-spin" />
          <h2 className="mt-4 text-xl font-medium text-gray-700">加载中...</h2>
        </div>
      </div>
    );
  }

  // 如果未登录
  if (status === "unauthenticated") {
    return null; // 重定向会处理，无需渲染
  }

  return (
    <div className="bg-gray-50 min-h-screen w-full">
      {/* 头部区域 */}
      <div className="bg-white border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">我的空间</h1>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* 错误提示 */}
        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <div className="flex items-center">
              <AlertTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* 研究报告部分 */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <ChartLineIcon className="h-6 w-6 text-primary mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">我的研究报告</h2>
            </div>
            <Link
              href="/research/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              新建研究
            </Link>
          </div>

          {researches.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-center flex-col py-8">
                <ChartLineIcon className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无研究报告</h3>
                <p className="text-sm text-gray-500 mb-4 max-w-md text-center">
                  创建研究报告来分析数据，获取洞见，并分享您的发现
                </p>
                <Link
                  href="/research/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  新建研究
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {researches.map((research) => (
                <Link 
                  href={`/research/${research.id}`}
                  key={research.id} 
                  className="block bg-white shadow hover:shadow-md rounded-lg transition-shadow"
                >
                  <div className="p-5">
                    <div className="flex justify-between">
                      <h3 className="text-lg font-medium text-gray-900">{research.title}</h3>
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          research.isComplete 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {research.isComplete 
                          ? <><CheckCircleIcon className="mr-1 h-3 w-3" /> 已完成</>
                          : <><CircleIcon className="mr-1 h-3 w-3" /> 进行中</>
                        }
                      </span>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <ClockIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      <p>创建于 {new Date(research.createdAt || '').toLocaleDateString()}</p>
                    </div>
                    <div className="mt-4 flex items-center text-sm font-medium text-primary">
                      <span>查看详情</span>
                      <ArrowRightIcon className="ml-1 h-4 w-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 私人知识库部分 */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <BookIcon className="h-6 w-6 text-primary mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">我的知识库</h2>
            </div>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
              <PlusIcon className="h-4 w-4 mr-2" />
              创建知识库
            </button>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-center flex-col py-8">
              <BookIcon className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无知识库</h3>
              <p className="text-sm text-gray-500 mb-4 max-w-md text-center">
                知识库帮助您组织和存储重要信息，提高研究和分析的效率
              </p>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
                <PlusIcon className="h-4 w-4 mr-2" />
                创建知识库
              </button>
            </div>
          </div>
        </div>

        {/* 分析模型部分 */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <FlaskRoundIcon className="h-6 w-6 text-primary mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">我的分析模型</h2>
            </div>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
              <PlusIcon className="h-4 w-4 mr-2" />
              创建模型
            </button>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-center flex-col py-8">
              <FlaskRoundIcon className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无分析模型</h3>
              <p className="text-sm text-gray-500 mb-4 max-w-md text-center">
                使用分析模型处理复杂数据，获取深度洞见和预测
              </p>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
                <PlusIcon className="h-4 w-4 mr-2" />
                创建模型
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
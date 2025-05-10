"use client";

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileTextIcon, 
  RefreshCwIcon,
  BrainIcon,
  SparklesIcon,
  CalendarIcon,
} from 'lucide-react';

interface AIReportGeneratorProps {
  title: string;
  placeholder?: string;
  defaultReport?: {
    summary: string;
    recommendations: string[];
    generatedAt: string;
    status: string;
  };
  onGenerate?: (prompt: string) => void;
  className?: string;
}

export function AIReportGenerator({
  title,
  placeholder = "请输入您的分析需求...",
  defaultReport,
  onGenerate,
  className = ''
}: AIReportGeneratorProps) {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiInputSection, setShowAiInputSection] = useState(false);
  const [report, setReport] = useState(defaultReport || {
    summary: "这是一个AI生成的分析报告。系统将根据您的输入和可用数据生成详细的分析结果。",
    recommendations: [
      "建议将会根据您的具体需求生成",
      "每条建议都基于数据分析和专业知识提供",
      "您可以随时生成新的分析报告",
    ],
    generatedAt: new Date().toLocaleString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(/\//g, '-'),
    status: "示例"
  });
  
  // 模拟AI报告生成
  const handleGenerateReport = () => {
    setIsGeneratingReport(true);
    
    // 如果有外部处理函数，调用它
    if (onGenerate) {
      onGenerate(aiPrompt);
    }
    
    // 模拟API调用延迟
    setTimeout(() => {
      setIsGeneratingReport(false);
      setShowAiInputSection(false);
      
      // 更新报告内容（实际应用中应由API返回）
      setReport({
        summary: `基于您的需求"${aiPrompt.substring(0, 50)}${aiPrompt.length > 50 ? '...' : ''}"，我们进行了全面分析。${
          Math.random() > 0.5 
            ? "根据历史数据和当前趋势，我们建议采取主动措施应对可能的风险。" 
            : "分析显示当前情况相对稳定，但仍需关注长期趋势变化。"
        }`,
        recommendations: [
          "持续监控市场变化，及时调整策略",
          "加强风险评估和压力测试",
          "制定清晰的实施路径和时间表",
          "定期评估执行效果并适时调整"
        ],
        generatedAt: new Date().toLocaleString('zh-CN', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }).replace(/\//g, '-'),
        status: "新生成"
      });
    }, 2000);
  };
  
  return (
    <Card className={`border border-primary/20 shadow-md overflow-hidden mb-8 bg-gradient-to-r from-primary/5 to-blue-50/50 ${className}`}>
      <div className="p-4 bg-primary/10 border-b border-primary/20 flex justify-between items-center">
        <h3 className="font-medium text-slate-800 flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-primary" />
          {title}
        </h3>
        <Badge variant="outline" className="bg-white/80 text-xs">
          <CalendarIcon className="h-3 w-3 mr-1" />
          {report.generatedAt}
        </Badge>
      </div>
      <div className="p-5">
        {showAiInputSection ? (
          <div className="space-y-4">
            <div className="relative">
              <Textarea 
                placeholder={placeholder}
                className="min-h-[120px] bg-white/80 text-sm"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
              <div className="absolute right-3 bottom-3 text-xs text-slate-400">
                AI将分析相关数据
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAiInputSection(false)}
              >
                取消
              </Button>
              
              <Button 
                size="sm"
                className="flex items-center gap-1.5"
                onClick={handleGenerateReport}
                disabled={isGeneratingReport || !aiPrompt.trim()}
              >
                {isGeneratingReport ? (
                  <>
                    <RefreshCwIcon className="h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <BrainIcon className="h-4 w-4" />
                    生成分析报告
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 relative">
              <div className="p-4 bg-white/80 rounded-lg border border-slate-200 text-slate-700">
                <p className="mb-4">{report.summary}</p>
                <ul className="space-y-2 pl-5 list-disc">
                  {report.recommendations.map((rec, index) => (
                    <li key={index} className="text-slate-700">{rec}</li>
                  ))}
                </ul>
              </div>
              <div className="absolute -left-1 top-4 h-[calc(100%-2rem)] w-1 bg-primary/30 rounded-r"></div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Badge variant={report.status === "已批准" ? "default" : "outline"} className="text-xs">
                  {report.status}
                </Badge>
                <span>由AI智能分析生成</span>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs flex items-center gap-1"
                >
                  <FileTextIcon className="h-3.5 w-3.5" />
                  导出PDF
                </Button>
                
                <Button 
                  size="sm"
                  className="text-xs flex items-center gap-1"
                  onClick={() => setShowAiInputSection(true)}
                >
                  <SparklesIcon className="h-3.5 w-3.5" />
                  生成新的分析
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
} 
import { ReactNode } from "react";

export interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
}

export interface SourceOption {
  id: string;
  name: string;
  icon: ReactNode;
}

export interface ModelOption {
  id: string;
  name: string;
  description?: string;
}

export type ResearchType = "CORPORATE" | "INDUSTRY";
export type ChatMode = "CHAT" | "RESEARCH";



export interface FloatingInputProps {
  onSend: (message: string, files?: UploadedFile[], model?: string, source?: string) => void;
  models?: ModelOption[];
  sources?: SourceOption[];
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  floating?: boolean;
}

export interface Source {
  id: string;
  sourceId: string;
  title: string;
  url: string;
  source: string;
  sourceIcon?: string | ReactNode;
  researchId?: string | null;
}

export interface RelatedItem {
  id: string;
  title: string;
  url: string;
  date?: string | null;
  description?: string | null;
  researchId?: string | null;
}

export interface Tag {
  id: string;
  name: string;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}



export interface ResearchReportProps {
  // 必须的属性
  message?: string;
  markdownContent?: string;
  sources?: Source[];
  related?: RelatedItem[];
  breadcrumbs?: BreadcrumbItem[];
  date?: string;
  data?: Record<string, unknown>; // 修改为any类型，对应prisma中的Json类型
  // 状态属性
  isLoading?: boolean;
  isComplete?: boolean;
  isContentComplete?: boolean;
  status?: string;
  // 版本相关
  versions?: number[];
  currentVersion?: number;
  onVersionChange?: (version: number) => void;
  // 回调函数
  onSendFollowup?: (msg: string, files?: UploadedFile[], model?: string, source?: string) => void;
  onExport?: () => void;
  onRefresh?: () => void;
  onSave?: () => void;
}



// 聊天模式的问题
export interface ChatRequest  {
  message: string;
  files?: UploadedFile[];
  version?: number;
  mode: "CHAT";
}

// 研究模式的问题
export interface ResearchRequest {
  title: string;
  files?: UploadedFile[];
  version?: number;
  mode: "RESEARCH";
  type: "CORPORATE" | "INDUSTRY";
  companyCode?: string;
  companyName?: string;
  industry?: string;
  industryName?: string;
  [key: string]: unknown; // 添加字符串索引签名
}

// 统一的问题类型
export type Request = ChatRequest | ResearchRequest;

// 用于存储在数据库中的问题记录
export interface RequestRecord {
  id: string;
  request: Request;
  createdAt: string;
  updatedAt: string;
  userId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  resultId?: string;
}

// 研究结果接口 - 对应ResearchResult模型
export interface ResearchResult {
  id: string;
  version: number;
  markdownContent?: string;
  summary?: string;
  data?: Record<string, unknown>; // 修改为any类型，对应prisma中的Json类型
  sources?: Source[]; // 添加sources字段，对应prisma中的Json类型
  status?: string;
  isComplete: boolean;
  createdAt: string;
  updatedAt?: string;
  researchId?: string | null;
}

// 气候研究接口 - 对应Research模型
export type Research = {
  id: string;
  title: string;
  type?: "CORPORATE" | "INDUSTRY"; // 添加研究类型字段
  mode?: "CHAT" | "RESEARCH"; // 添加研究模式字段
  request?: ResearchRequest | Record<string, unknown>; // 修改为具体类型或Record类型
  related?: RelatedItem[]; // 修改为具体类型数组
  files?: UploadedFile[]; // 修改为具体类型数组
  results?: ResearchResult[]; // 关联的研究结果
  currentResult?: ResearchResult; // 非数据库字段，用于前端显示当前活动的结果
  userId?: string; // 添加userId字段
  date?: string; // 非数据库字段，格式化的日期
  createdAt: string;
  updatedAt: string;
  // 如果是企业研究，存储相关企业信息
  companyCode?: string; // 股票代码
  companyName?: string; // 公司名称
  industry?: string; // 所属行业
  // 如果是行业研究，存储行业信息
  industryName?: string; // 行业名称
  industryCategory?: string; // 行业分类
};


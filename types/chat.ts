import { ReactNode } from "react";

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  url: string;
  size?: string;
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

export const sourceOptions: SourceOption[] = [
  { id: "literature", name: "文献", icon: null }, // 图标将在导入时设置
  { id: "web", name: "网页", icon: null },
  { id: "database", name: "数据库", icon: null },
  { id: "all", name: "全部来源", icon: null },
];

export const modelOptions: ModelOption[] = [
  { id: "default", name: "默认模型", description: "综合能力最强的模型" },
  { id: "expert", name: "专家模型", description: "气候领域专业知识更丰富" },
  { id: "research", name: "研究模型", description: "学术研究文献分析能力强" },
];

export interface ChatInputProps {
  onQuestionSubmit?: (message: string, files?: UploadedFile[], model?: string, source?: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

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

// 用于存储在question JSON字段中的类型
export interface ResearchQuestion {
  question: string;
  files?: UploadedFile[];
  model?: string;
  version?: number;
  id?: string;
  createdAt?: string;
  updatedAt?: string;
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
  question?: ResearchQuestion | Record<string, unknown>; // 修改为具体类型或Record类型
  related?: RelatedItem[]; // 修改为具体类型数组
  files?: UploadedFile[]; // 修改为具体类型数组
  results?: ResearchResult[]; // 关联的研究结果
  currentResult?: ResearchResult; // 非数据库字段，用于前端显示当前活动的结果
  userId?: string; // 添加userId字段
  date?: string; // 非数据库字段，格式化的日期
  createdAt: string;
  updatedAt: string;
};


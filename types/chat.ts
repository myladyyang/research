import { ReactNode } from "react";

export interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
  createdAt?: string;
  updatedAt?: string;
  fileId?: string;
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

// SSE事件类型定义
export type ContentEvent = {
  type: 'content';
  content: string;
};

export type SourcesEvent = {
  type: 'sources';
  sources: Source[];
};

export type RelatedEvent = {
  type: 'related';
  related: RelatedItem[];
};

export type CompleteEvent = {
  type: 'complete';
  reportId?: string;
};

export type PingEvent = {
  type: 'ping';
  message?: string;
  timestamp?: number;
};

export type ErrorEvent = {
  type: 'error';
  message: string;
};

export type ResearchStreamEvent = 
  | ContentEvent 
  | SourcesEvent 
  | RelatedEvent 
  | CompleteEvent
  | PingEvent
  | ErrorEvent;

export interface ResearchReportProps {
  // 必须的属性
  message?: string;
  markdownContent?: string;
  sources?: Source[];
  related?: RelatedItem[];
  breadcrumbs?: BreadcrumbItem[];
  date?: string;
  data?: string;
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

export interface ResearchQuestion {
  question: string;
  files?: UploadedFile[];
  model?: string;
  version?: number; // 问题的版本号
  id?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 研究结果接口
export interface ResearchResult {
  id: string;
  version: number;
  markdownContent?: string;
  summary?: string;
  data?: string;
  status?: string; // 研究的当前状态
  isComplete: boolean; // 是否完成生成
  progress?: number; // 生成进度，0-100
  createdAt: string;
  updatedAt?: string;
  questionId: string;
  researchId?: string | null;
}

// 气候报告接口
export type Research = {
  id: string;
  title: string;
  date: string;
  isComplete?: boolean;
  questions?: ResearchQuestion[]; // 多个问题
  currentQuestion?: ResearchQuestion; // 当前激活的问题
  results?: ResearchResult[]; // 多个研究结果
  currentResult?: ResearchResult; // 当前激活的结果
  sources?: Source[];
  related?: RelatedItem[];
  tags?: string[];
  files?: UploadedFile[];
  createdAt?: string;
  updatedAt?: string;
};


export interface Data {
  id: string;
  content: string;
  dataType: string;
  isComplete: boolean;
  createdAt: string;
  updatedAt: string;
  resultId: string;
}
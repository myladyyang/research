"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Send,
  Paperclip, 
  Mic, 
  FileText,
  X,
  Loader2,
  MessageCircleIcon,
  BookOpenIcon,
  BuildingIcon,
  FactoryIcon,
  SearchIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CornerDownLeftIcon
} from "lucide-react";
import type { UploadedFile, ResearchType, ChatMode } from "@/types/chat";
import { useSearchData } from "@/hooks/useSearchData";
import { Skeleton } from "@/components/ui/skeleton";


type SuggestionType = ResearchType;

interface Suggestion {
  text: string;
  subText?: string;
  type: SuggestionType;
  highlight?: string[];
}

export interface ChatInputProps {
  /** 聊天模式提交回调函数 */
  onChatSubmit?: (
    message: string, 
    files: UploadedFile[]
  ) => void;
  /** 研究模式提交回调函数 */
  onResearchSubmit: (
    message: string, 
    files: UploadedFile[],
    type: ResearchType
  ) => void;
  /** 是否正在加载中 */
  isLoading?: boolean;
  /** 输入框占位符文本 */
  placeholder?: string;
  /** 自定义类名 */
  className?: string;
  /** 是否启用聊天模式 */
  enableChatMode?: boolean;
  /** 默认模式 */
  defaultMode?: ChatMode;
  /** 默认研究类型 */
  defaultResearchType?: ResearchType;
}

export function ChatInput({
  onChatSubmit,
  onResearchSubmit,
  isLoading = false,
  placeholder = "输入您的问题或研究主题...",
  className = "",
  enableChatMode = true,
  defaultMode = "RESEARCH",
  defaultResearchType = "CORPORATE"
}: ChatInputProps) {
  const { companies, industries, isSearchDataLoading, searchError } = useSearchData();
  const [message, setMessage] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>(defaultMode);
  const [researchType, setResearchType] = useState<ResearchType>(defaultResearchType);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isValidInput, setIsValidInput] = useState(false);
  
  const [hoverState, setHoverState] = useState<{
    upload: boolean;
    voice: boolean;
  }>({
    upload: false,
    voice: false
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // 处理键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        if (selectedSuggestionIndex >= 0) {
          e.preventDefault();
          handleSuggestionClick(suggestions[selectedSuggestionIndex].text);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // 搜索建议处理
  useEffect(() => {
    if (chatMode === "CHAT") {
      setIsValidInput(true);
      setSuggestions([]);
      return;
    }

    const query = message.trim().toLowerCase();
    if (!query) {
      setSuggestions([]);
      setIsValidInput(false);
      return;
    }

    if (researchType === "CORPORATE") {
      const matches = companies
        .filter(company => 
          company.name.toLowerCase().includes(query) || 
          company.code.toLowerCase().includes(query)
        )
        .map(company => ({
          text: company.name,
          subText: `${company.code} · ${company.industry}`,
          type: "CORPORATE" as const,
          highlight: [
            company.name.toLowerCase().includes(query) ? company.name : '',
            company.code.toLowerCase().includes(query) ? company.code : ''
          ].filter(Boolean)
        }));
      setSuggestions(matches);
      setIsValidInput(matches.length > 0);
    } else {
      const matches = industries
        .filter(industry => 
          industry.name.toLowerCase().includes(query) ||
          industry.subIndustries.some(sub => sub.toLowerCase().includes(query))
        )
        .map(industry => ({
          text: industry.name,
          subText: industry.subIndustries.join(' · '),
          type: "INDUSTRY" as const,
          highlight: [
            industry.name.toLowerCase().includes(query) ? industry.name : '',
            ...industry.subIndustries.filter(sub => 
              sub.toLowerCase().includes(query)
            )
          ].filter(Boolean)
        }));
      setSuggestions(matches);
      setIsValidInput(matches.length > 0);
    }
  }, [message, researchType, chatMode, companies, industries]);

  // 修改点击处理函数
  const handleSuggestionClick = (text: string) => {
    setMessage(text);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    setIsValidInput(true);
    inputRef.current?.focus();
  };

  // 添加点击外部关闭建议框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 高亮匹配文本
  const highlightText = (text: string, highlights: string[]) => {
    if (!highlights.length) return text;
    
    let result = text;
    highlights.forEach(highlight => {
      if (!highlight) return;
      const regex = new RegExp(`(${highlight})`, 'gi');
      result = result.replace(regex, '<mark class="bg-primary/10 text-primary rounded px-0.5">$1</mark>');
    });
    return result;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading && isValidInput) {
      if (chatMode === "CHAT" && onChatSubmit) {
        onChatSubmit(message, uploadedFiles);
      } else {
        onResearchSubmit(message, uploadedFiles, researchType);
      }
      setMessage("");
      setShowSuggestions(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type,
      url: URL.createObjectURL(file)
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // 重置文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
    if (selectedFile?.id === id) {
      setSelectedFile(null);
      setShowFilePreview(false);
    }
  };

  const handleFileClick = (file: UploadedFile) => {
    setSelectedFile(file);
    setShowFilePreview(true);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleVoiceInput = () => {
    // 模拟语音输入状态切换
    setIsRecording(prev => !prev);
    
    if (isRecording) {
      // 这里实际应用中会将语音转为文本
      setMessage(prev => prev + ' [语音输入的文本]');
      setIsRecording(false);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* 文件预览区域 */}
      <div className="flex flex-wrap gap-2 mb-3">
        {uploadedFiles.map((file) => (
          <div 
            key={file.id} 
            className={`px-3 py-1.5 rounded-md text-xs border flex items-center gap-2 cursor-pointer transition-colors ${
              selectedFile?.id === file.id 
                ? 'bg-primary text-primary-foreground border-primary' 
                : 'bg-secondary text-secondary-foreground border-border hover:border-primary/50'
            }`}
            onClick={() => handleFileClick(file)}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="truncate max-w-[120px]">{file.name}</span>
            <span className="text-xs opacity-70">({file.size})</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                removeFile(file.id);
              }}
              className="ml-1 p-0.5 rounded-full text-xs opacity-70 hover:opacity-100 hover:bg-accent"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* 文件详细预览 */}
      {showFilePreview && selectedFile && (
        <div className="mb-4 p-4 border rounded-lg bg-card shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-medium text-sm">{selectedFile.name}</h4>
            </div>
            <button 
              onClick={() => setShowFilePreview(false)}
              className="p-1 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-accent"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-muted-foreground border-t pt-2">
            {selectedFile.type} · {selectedFile.size}
          </div>
          {/* 这里可以添加文件预览内容 */}
          <div className="mt-3 p-2 bg-muted/50 rounded-md text-sm">
            <p className="text-muted-foreground">文件预览将在此显示...</p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col w-full"
      >
        {/* 输入部分 */}
        <div className="relative flex items-center w-full">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <SearchIcon className="w-4 h-4" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setShowSuggestions(true);
                setSelectedSuggestionIndex(-1);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder={
                chatMode === "RESEARCH" 
                  ? researchType === "CORPORATE"
                    ? "输入公司名称或股票代码..."
                    : "输入行业名称..."
                  : placeholder
              }
              disabled={isLoading}
              className={`w-full pl-10 pr-24 py-3 text-sm border rounded-lg bg-background focus:ring-1 focus:ring-primary outline-none ${
                chatMode === "RESEARCH" && !isValidInput && message.trim() 
                  ? "border-destructive" 
                  : ""
              }`}
              aria-label="聊天输入框"
            />
            
            {/* 搜索建议下拉框 */}
            {showSuggestions && chatMode === "RESEARCH" && (
              <div 
                ref={suggestionsRef}
                className="absolute top-full left-0 w-full mt-1 bg-background border rounded-lg shadow-lg z-10 max-h-[280px] overflow-y-auto"
              >
                <div className="p-1.5">
                  {isSearchDataLoading ? (
                    // 加载状态显示骨架屏
                    Array(5).fill(0).map((_, index) => (
                      <div key={index} className="flex items-start gap-3 px-3 py-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-3/4 mb-2" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))
                  ) : searchError ? (
                    <div className="px-3 py-2 text-sm text-destructive">
                      {searchError}
                    </div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`flex items-start gap-3 w-full px-3 py-2 text-sm rounded-md transition-colors ${
                          index === selectedSuggestionIndex
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent/50"
                        }`}
                        onClick={() => handleSuggestionClick(suggestion.text)}
                        onMouseEnter={() => setSelectedSuggestionIndex(index)}
                      >
                        {suggestion.type === "CORPORATE" ? (
                          <BuildingIcon className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <FactoryIcon className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        )}
                        <div className="flex-1 text-left">
                          <div 
                            dangerouslySetInnerHTML={{ 
                              __html: highlightText(suggestion.text, suggestion.highlight || [])
                            }} 
                          />
                          {suggestion.subText && (
                            <div 
                              className="text-xs text-muted-foreground mt-0.5"
                              dangerouslySetInnerHTML={{ 
                                __html: highlightText(suggestion.subText, suggestion.highlight || [])
                              }}
                            />
                          )}
                        </div>
                        {index === selectedSuggestionIndex && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CornerDownLeftIcon className="w-3 h-3" />
                            <span>选择</span>
                          </div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      未找到匹配的{researchType === "CORPORATE" ? "企业" : "行业"}
                    </div>
                  )}
                </div>
                <div className="px-3 py-2 border-t text-xs text-muted-foreground flex items-center gap-2">
                  <ArrowUpIcon className="w-3 h-3" />
                  <ArrowDownIcon className="w-3 h-3" />
                  <span>使用方向键选择</span>
                  <CornerDownLeftIcon className="w-3 h-3 ml-1" />
                  <span>确认</span>
                </div>
              </div>
            )}
          </div>

          {/* 操作按钮区域 */}
          <div className="absolute right-2 flex items-center gap-1">
            {/* 文件上传按钮 */}
            <button
              type="button"
              className={`p-2 rounded-md transition-colors ${
                uploadedFiles.length > 0 
                  ? 'text-primary' 
                  : hoverState.upload
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
              }`}
              onMouseEnter={() => setHoverState(prev => ({ ...prev, upload: true }))}
              onMouseLeave={() => setHoverState(prev => ({ ...prev, upload: false }))}
              onClick={() => fileInputRef.current?.click()}
              title="上传文件"
              aria-label="上传文件"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              accept=".pdf,.docx,.txt,.csv,.xlsx"
            />
            
            {/* 语音输入按钮 */}
            <button
              type="button"
              className={`p-2 rounded-md transition-colors ${
                isRecording 
                  ? 'text-destructive animate-pulse' 
                  : hoverState.voice
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
              }`}
              onMouseEnter={() => setHoverState(prev => ({ ...prev, voice: true }))}
              onMouseLeave={() => setHoverState(prev => ({ ...prev, voice: false }))}
              onClick={handleVoiceInput}
              title={isRecording ? "停止录音" : "语音输入"}
              aria-label={isRecording ? "停止录音" : "语音输入"}
            >
              <Mic className="w-4 h-4" />
            </button>
            
            {/* 发送按钮 */}
            <button
              type="submit"
              disabled={isLoading || !message.trim() || (chatMode === "RESEARCH" && !isValidInput)}
              className={`p-2 rounded-md transition-colors ${
                isLoading || !message.trim() || (chatMode === "RESEARCH" && !isValidInput)
                  ? 'opacity-50 cursor-not-allowed text-muted-foreground'
                  : 'text-primary hover:bg-accent'
              }`}
              aria-label="发送"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        
        {/* 模式切换区域 */}
        <div className="mt-2 text-xs text-muted-foreground text-center flex justify-center items-center gap-4">
          <span>
            Climate AI 将{
              chatMode === "RESEARCH" 
                ? `为您分析${researchType === "CORPORATE" ? "企业" : "行业"}数据`
                : "为您解答问题"
            }
          </span>
          <div className="flex items-center gap-3">
            {/* 对话/研究模式切换 */}
            {enableChatMode && (
              <div className="flex items-center border rounded-full p-0.5 bg-secondary hover:bg-secondary/80 transition-colors">
                <button 
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs transition-all ${
                    chatMode === "CHAT" 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                      : "hover:bg-accent/50 hover:text-accent-foreground"
                  }`}
                  onClick={() => setChatMode("CHAT")}
                  type="button"
                >
                  <MessageCircleIcon className="w-3 h-3" />
                  <span>对话</span>
                </button>
                <button 
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs transition-all ${
                    chatMode === "RESEARCH" 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                      : "hover:bg-accent/50 hover:text-accent-foreground"
                  }`}
                  onClick={() => setChatMode("RESEARCH")}
                  type="button"
                >
                  <BookOpenIcon className="w-3 h-3" />
                  <span>研究</span>
                </button>
              </div>
            )}

            {/* 研究类型选择 */}
            {(chatMode === "RESEARCH" || !enableChatMode) && (
              <div className="flex items-center gap-3 border-l pl-3">
                <label className={`flex items-center gap-1.5 cursor-pointer group ${
                  researchType === "CORPORATE" 
                    ? "text-primary" 
                    : "text-muted-foreground"
                }`}>
                  <div className={`w-3.5 h-3.5 rounded-full border transition-colors ${
                    researchType === "CORPORATE"
                      ? "border-primary bg-primary/10"
                      : "border-muted-foreground group-hover:border-primary/50"
                  }`}>
                    <div className={`w-full h-full rounded-full transform transition-transform scale-0 ${
                      researchType === "CORPORATE" ? "bg-primary scale-50" : ""
                    }`} />
                  </div>
                  <input
                    type="radio"
                    className="sr-only"
                    checked={researchType === "CORPORATE"}
                    onChange={() => setResearchType("CORPORATE")}
                  />
                  <div className="flex items-center gap-1">
                    <BuildingIcon className="w-3 h-3" />
                    <span>企业</span>
                  </div>
                </label>

                <label className={`flex items-center gap-1.5 cursor-pointer group ${
                  researchType === "INDUSTRY" 
                    ? "text-primary" 
                    : "text-muted-foreground"
                }`}>
                  <div className={`w-3.5 h-3.5 rounded-full border transition-colors ${
                    researchType === "INDUSTRY"
                      ? "border-primary bg-primary/10"
                      : "border-muted-foreground group-hover:border-primary/50"
                  }`}>
                    <div className={`w-full h-full rounded-full transform transition-transform scale-0 ${
                      researchType === "INDUSTRY" ? "bg-primary scale-50" : ""
                    }`} />
                  </div>
                  <input
                    type="radio"
                    className="sr-only"
                    checked={researchType === "INDUSTRY"}
                    onChange={() => setResearchType("INDUSTRY")}
                  />
                  <div className="flex items-center gap-1">
                    <FactoryIcon className="w-3 h-3" />
                    <span>行业</span>
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
} 
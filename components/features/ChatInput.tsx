"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Send,
  Paperclip, 
  Mic, 
  Bot, 
  Search, 
  Book, 
  Globe, 
  Database, 
  FileText,
  X,
  Loader2
} from "lucide-react";
import { 
  ChatInputProps,
  UploadedFile,
  SourceOption,
  sourceOptions,
  modelOptions
} from "@/types/chat";

// 设置图标
const sourceOptionsWithIcons: SourceOption[] = [
  { ...sourceOptions[0], icon: <Book className="w-4 h-4" /> },
  { ...sourceOptions[1], icon: <Globe className="w-4 h-4" /> },
  { ...sourceOptions[2], icon: <Database className="w-4 h-4" /> },
  { ...sourceOptions[3], icon: <Search className="w-4 h-4" /> },
];

export function ChatInput({
  onQuestionSubmit,
  isLoading = false,
  placeholder = "输入您的问题或研究主题...",
  className = "",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedModel, setSelectedModel] = useState("default");
  const [selectedSource, setSelectedSource] = useState("all");
  const [menuState, setMenuState] = useState<{
    model: boolean;
    source: boolean;
  }>({
    model: false,
    source: false
  });
  
  const [hoverState, setHoverState] = useState<{
    model: boolean;
    source: boolean;
    upload: boolean;
    voice: boolean;
  }>({
    model: false,
    source: false,
    upload: false,
    voice: false
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 新增：监听点击外部关闭菜单
  useEffect(() => {
    if (!menuState.model && !menuState.source) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuState({ model: false, source: false });
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuState]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      if (onQuestionSubmit) {
        onQuestionSubmit(message, uploadedFiles, selectedModel, selectedSource);
      }
      setMessage("");
      // 不清除文件，让用户可以基于同一组文件继续提问
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type
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

  // 处理按钮点击，用于打开/关闭菜单
  const toggleMenu = (menu: 'model' | 'source') => {
    // 关闭其他菜单
    if (menu === 'model') {
      setMenuState({
        model: !menuState.model,
        source: false
      });
    } else {
      setMenuState({
        model: false,
        source: !menuState.source
      });
    }
  };

  return (
    <div className={`w-full ${className}`} ref={menuRef}>
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
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className="w-full px-4 py-3 pr-36 text-sm border rounded-lg bg-background focus:ring-1 focus:ring-primary outline-none"
            aria-label="聊天输入框"
          />
          
          {/* 操作按钮区域 */}
          <div className="absolute right-2 flex items-center gap-1">
            {/* 选择模型按钮 */}
            <div className="relative">
              <button
                type="button"
                className={`p-2 rounded-md transition-colors ${
                  menuState.model
                    ? 'bg-primary/10 text-primary'
                    : hoverState.model
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                }`}
                onMouseEnter={() => setHoverState(prev => ({ ...prev, model: true }))}
                onMouseLeave={() => setHoverState(prev => ({ ...prev, model: false }))}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMenu('model');
                }}
                title="选择模型"
                aria-label="选择模型"
              >
                <Bot className="w-4 h-4" />
              </button>
              
              {menuState.model && (
                <div 
                  className="absolute bottom-full right-0 mb-2 w-56 bg-card border rounded-lg shadow-lg z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-2 border-b">
                    <h3 className="text-xs font-medium">选择AI模型</h3>
                  </div>
                  <div className="p-1">
                    {modelOptions.map(model => (
                      <button
                        key={model.id}
                        type="button"
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                          selectedModel === model.id 
                            ? 'bg-primary/10 text-primary' 
                            : 'hover:bg-accent'
                        }`}
                        onClick={() => {
                          setSelectedModel(model.id);
                          setMenuState(prev => ({ ...prev, model: false }));
                        }}
                      >
                        <div>{model.name}</div>
                        {model.description && (
                          <div className="text-xs text-muted-foreground mt-0.5">{model.description}</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* 选择知识来源按钮 */}
            <div className="relative">
              <button
                type="button"
                className={`p-2 rounded-md transition-colors ${
                  menuState.source
                    ? 'bg-primary/10 text-primary'
                    : hoverState.source
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                }`}
                onMouseEnter={() => setHoverState(prev => ({ ...prev, source: true }))}
                onMouseLeave={() => setHoverState(prev => ({ ...prev, source: false }))}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMenu('source');
                }}
                title="选择知识来源"
                aria-label="选择知识来源"
              >
                <Search className="w-4 h-4" />
              </button>
              
              {menuState.source && (
                <div 
                  className="absolute bottom-full right-0 mb-2 w-40 bg-card border rounded-lg shadow-lg z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-2 border-b">
                    <h3 className="text-xs font-medium">选择知识来源</h3>
                  </div>
                  <div className="p-1">
                    {sourceOptionsWithIcons.map(source => (
                      <button
                        key={source.id}
                        type="button"
                        className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2 transition-colors ${
                          selectedSource === source.id 
                            ? 'bg-primary/10 text-primary' 
                            : 'hover:bg-accent'
                        }`}
                        onClick={() => {
                          setSelectedSource(source.id);
                          setMenuState(prev => ({ ...prev, source: false }));
                        }}
                      >
                        <span>{source.icon}</span>
                        <span>{source.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
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
              disabled={isLoading || (!message.trim() && uploadedFiles.length === 0)}
              className={`p-2 rounded-md transition-colors ${
                isLoading || (!message.trim() && uploadedFiles.length === 0)
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
        
        <div className="mt-2 text-xs text-muted-foreground text-center flex justify-center items-center gap-2">
          <span>
            Climate AI 将使用您的查询提供研究见解和数据分析
          </span>
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-secondary text-xs">
              <Bot className="w-3 h-3" />
              <span>{modelOptions.find(m => m.id === selectedModel)?.name || "默认模型"}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-secondary text-xs">
              {sourceOptionsWithIcons.find(s => s.id === selectedSource)?.icon}
              <span>{sourceOptionsWithIcons.find(s => s.id === selectedSource)?.name}</span>
            </span>
          </div>
        </div>
      </form>
    </div>
  );
} 
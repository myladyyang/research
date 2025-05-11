"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Paperclip, 
  Mic, 
  Bot, 
  Search, 
  FileText,
  X,
  Loader2
} from "lucide-react";
import { 
  FloatingInputProps,
  UploadedFile,
} from "@/types/chat";


export function FloatingInput({ 
  onSend, 
  isLoading = false,
  placeholder = "输入后续问题...",
  className = "",
  floating = true
}: FloatingInputProps) {
  const [message, setMessage] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [menuState, setMenuState] = useState<{
    model: boolean;
    source: boolean;
  }>({
    model: false,
    source: false
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 监听点击外部关闭菜单
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

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (message.trim() && !isLoading) {
      onSend(message, uploadedFiles);
      setMessage("");
      // 不清除文件，让用户可以基于同一组文件继续提问
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
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

    setUploadedFiles(prev => [...prev, ...newFiles ]);
    
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
      // 实际应用中会将语音转为文本
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

  const positionClass = floating 
    ? "fixed bottom-6 left-0 right-0 mx-auto w-full" 
    : "relative w-full mt-10";

  return (
    <div className={`${positionClass} max-w-full lg:max-w-6xl px-4 ${className}`} ref={menuRef}>
      {/* 文件预览区域 */}
      <div className="flex flex-wrap gap-2 mb-3">
        {uploadedFiles.map((file) => (
          <div 
            key={file.id} 
            className={`chat-file-preview cursor-pointer ${
              selectedFile?.id === file.id ? 'chat-file-preview-selected' : ''
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
          <div className="mt-3 p-2 bg-muted/50 rounded-md text-sm">
            <p className="text-muted-foreground">文件预览将在此显示...</p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="chat-container p-3 lg:p-4"
      >
        {/* 输入部分 */}
        <div className="chat-input-container">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className="chat-input"
            aria-label="聊天输入框"
          />
          
          {/* 操作按钮区域 */}
          <div className="absolute right-2 flex items-center gap-1">
            {/* 选择模型按钮 */}
            <div className="relative">
              <button
                type="button"
                className={`chat-action-button ${
                  menuState.model
                    ? 'chat-action-button-active'
                    : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMenu('model');
                }}
                title="选择模型"
                aria-label="选择模型"
              >
                <Bot className="w-4 h-4" />
              </button>
              
            </div>
            
            {/* 选择知识来源按钮 */}
            <div className="relative">
              <button
                type="button"
                className={`chat-action-button ${
                  menuState.source
                    ? 'chat-action-button-active'
                    : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMenu('source');
                }}
                title="选择知识来源"
                aria-label="选择知识来源"
              >
                <Search className="w-4 h-4" />
              </button>
              

            </div>
            
            {/* 文件上传按钮 */}
            <button
              type="button"
              className={`chat-action-button ${
                uploadedFiles.length > 0 ? 'text-primary' : ''
              }`}
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
              className={`chat-action-button ${
                isRecording ? 'text-destructive animate-pulse' : ''
              }`}
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
              className={`chat-action-button ${
                isLoading || (!message.trim() && uploadedFiles.length === 0)
                  ? 'opacity-50 cursor-not-allowed'
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
              <span>默认模型</span>
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-secondary text-xs">
              <Search className="w-3 h-3" />
              <span>默认来源</span>
            </span>
          </div>
        </div>
      </form>
    </div>
  );
} 
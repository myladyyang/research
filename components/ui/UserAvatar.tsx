import React from "react";

interface UserAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserAvatar({ name, size = 'md', className = '' }: UserAvatarProps) {
  // 获取用户首字母作为头像
  const initial = name.charAt(0).toUpperCase();
  
  // 根据尺寸设置样式
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };
  
  return (
    <div 
      className={`bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold ${sizeClasses[size]} ${className}`}
    >
      {initial}
    </div>
  );
} 
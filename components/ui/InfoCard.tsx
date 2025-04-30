import React from "react";

interface InfoCardProps {
  title: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function InfoCard({ title, content, icon, className = "" }: InfoCardProps) {
  return (
    <div className={`rounded-lg border bg-card shadow-sm overflow-hidden ${className}`}>
      <div className="px-4 py-3 flex items-center justify-between border-b">
        <h3 className="font-medium text-sm">{title}</h3>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="p-4">
        {content}
      </div>
    </div>
  );
}

// 子组件：天气卡片
interface WeatherCardProps {
  location: string;
  temperature: number;
  condition: string;
  icon: string;
  className?: string;
}

export function WeatherCard({ 
  location, 
  temperature, 
  condition, 
  icon,
  className = "" 
}: WeatherCardProps) {
  return (
    <InfoCard
      title={`天气 · ${location}`}
      icon={<span>🌤️</span>}
      content={
        <div className="flex items-center">
          <div className="text-2xl mr-3">{icon}</div>
          <div>
            <div className="text-xl font-medium">{temperature}°C</div>
            <div className="text-sm text-muted-foreground">{condition}</div>
          </div>
        </div>
      }
      className={className}
    />
  );
}

// 子组件：新闻卡片
interface NewsCardProps {
  source: string;
  title: string;
  date: string;
  className?: string;
}

export function NewsCard({ 
  source, 
  title, 
  date,
  className = "" 
}: NewsCardProps) {
  return (
    <InfoCard
      title={`新闻 · ${source}`}
      icon={<span>📰</span>}
      content={
        <div>
          <h4 className="font-medium mb-2">{title}</h4>
          <div className="text-xs text-muted-foreground">{date}</div>
        </div>
      }
      className={className}
    />
  );
} 
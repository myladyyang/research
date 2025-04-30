# Climate AI 项目实施计划

## 项目概述

Climate AI 是一个基于 Next.js 开发的网络应用，允许用户对我们服务提供的私有数据进行研究并获取见解。该应用将提供聊天界面、AI 生成的分析报告以及个人数据空间管理功能。

## 技术栈

- Next.js (App Router)
- Tailwind CSS
- Shadcn UI
- Clerk (OAuth)
- TypeScript
- React
- Framer Motion (用于动画效果)

## 项目结构

```
/src
  /basic                # doucment and 参考页面
  /app                  # Next.js App Router 结构
    /globals.css        # 全局样式
    /layout.tsx         # 主布局
    /page.tsx           # 首页
    /(routes)           # 各种路由
  /components           # 共享组件
    /ui                 # 通用 UI 组件
    /layout             # 布局组件
    /features           # 功能性组件
  /lib                  # 工具函数和 hooks
  /types                # TypeScript 类型定义
  /styles               # 样式相关
  /hooks                # 自定义 hooks
  /services             # API 服务
```

## 实施任务

| 任务ID | 任务描述 | 相关文件 | 依赖任务 | 状态 | 优先级 |
|--------|----------|----------|----------|------|--------|
| 1 | 项目初始化与基础配置 | package.json, tsconfig.json, tailwind.config.js | - | 已完成 | 高 |
| 2 | 设置全局样式和主题变量 | src/app/globals.css | 1 | 已完成 | 高 |
| 3 | 实现主布局结构 | src/app/layout.tsx | 1, 2 | 已完成 | 高 |
| 4 | 创建侧边栏组件 | src/components/layout/Sidebar.tsx | 2, 3 | 已完成 | 高 |
| 5 | 实现顶部导航栏 | src/components/layout/Navbar.tsx | 2, 3 | 已完成 | 高 |
| 6 | 创建用户头像组件 | src/components/ui/UserAvatar.tsx | 2 | 已完成 | 中 |
| 7 | 实现首页搜索/聊天界面 | src/app/page.tsx, src/components/features/ChatInput.tsx | 3, 4, 5 | 已完成 | 高 |
| 8 | 实现信息卡片组件 | src/components/ui/InfoCard.tsx | 2 | 已完成 | 中 |
| 9 | 创建按钮组件库 | src/components/ui/Button.tsx | 2 | 已完成 | 中 |
| 10 | 实现研究报告页面 | src/app/research/[id]/page.tsx | 3, 4, 5 | 已完成 | 高 |
| 11 | 创建报告内容组件 | src/components/features/ReportContent.tsx | 2, 10 | 已完成 | 高 |
| 12 | 实现来源卡片组件 | src/components/ui/SourceCard.tsx | 2 | 已完成 | 中 |
| 13 | 创建浮动输入框组件 | src/components/features/FloatingInput.tsx | 2, 7 | 已完成 | 中 |
| 14 | 实现相关内容区域 | src/components/features/RelatedContent.tsx | 2, 11 | 已完成 | 低 |
| 15 | 配置 Clerk 身份验证 | src/app/api/auth/[...nextauth].ts, src/components/auth | 1 | 未开始 | 高 |
| 16 | 创建用户空间管理页面 | src/app/dashboard/page.tsx | 3, 4, 5, 15 | 未开始 | 中 |
| 17 | 实现文件上传功能 | src/components/features/FileUpload.tsx | 16 | 未开始 | 中 |
| 18 | 创建数据分析服务 | src/services/analysis.ts | 1 | 未开始 | 中 |
| 19 | 实现聊天功能 API | src/app/api/chat/route.ts | 1, 18 | 未开始 | 高 |
| 20 | 创建 API 调用钩子 | src/hooks/useChat.ts, src/hooks/useAnalysis.ts | 18, 19 | 未开始 | 中 |
| 21 | 实现动画和过渡效果 | src/components/ui/Animations.tsx | 2 | 未开始 | 低 |
| 22 | 创建模式切换组件 | src/components/features/ModeSwitcher.tsx | 2, 7 | 已完成 | 中 |
| 23 | 设置响应式布局 | 所有组件文件 | 2 | 未开始 | 高 |
| 24 | 实现错误处理和加载状态 | src/components/ui/ErrorDisplay.tsx, src/components/ui/LoadingState.tsx | 1 | 已完成 | 中 |
| 25 | 创建面包屑导航组件 | src/components/ui/Breadcrumbs.tsx | 2, 10 | 已完成 | 低 |
| 26 | 添加导出和分享功能 | src/components/features/ShareExport.tsx | 10, 11 | 未开始 | 低 |
| 27 | 实现深色/浅色模式切换 | src/components/layout/ThemeSwitcher.tsx | 2 | 已完成 | 低 |
| 28 | 编写单元测试 | src/\_\_tests\_\_ | 所有组件 | 未开始 | 中 |
| 29 | 进行性能优化 | 所有相关文件 | 所有组件 | 未开始 | 中 |
| 30 | 编写文档和注释 | README.md, 组件文档 | 所有组件 | 未开始 | 中 |

## 实施阶段

### 第一阶段：基础设置与核心组件

- 项目初始化与配置
- 全局样式和主题设置
- 主布局结构实现
- 身份验证集成
- 核心 UI 组件开发

### 第二阶段：主要功能实现

- 首页搜索/聊天界面
- 研究报告页面
- 用户空间管理
- 文件上传功能
- API 服务和钩子

1. **设计一致性**：
   - 遵循设计文档中定义的色彩方案、排版系统和布局原则
   - 确保组件在不同页面间保持一致的视觉和交互体验

2. **代码规范**：
   - 遵循 techrules.md 中的代码风格和结构要求
   - 使用函数式和声明式编程模式
   - 采用 TypeScript 进行类型安全开发

3. **性能考虑**：
   - 尽量使用 React Server Components
   - 最小化 'use client' 指令的使用
   - 对非关键组件使用动态加载
   - 优化 Web Vitals 指标

4. **可访问性**：
   - 确保所有组件符合 Web 内容可访问性指南 (WCAG)
   - 提供适当的键盘导航和屏幕阅读器支持

5. **创新功能**：
   - 实现智能浮动输入界面
   - 创建搜索和研究两种模式的无缝切换
   - 平衡信息密度和界面简洁性 
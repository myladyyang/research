# 气候研究平台数据库设置指南

本文档介绍如何设置和使用 Prisma 数据库系统来管理气候研究平台的数据。

## 数据库模型

系统包含以下主要模型：

1. **User** - 用户
2. **Research** - 研究报告
3. **Question** - 用户提问
4. **Source** - 研究来源
5. **Related** - 相关研究
6. **Tag** - 标签

## 设置步骤

### 1. 安装依赖

首先确保已安装所需的依赖：

```bash
npm install prisma @prisma/client --save-dev
```

### 2. 配置数据库连接

运行设置脚本，配置数据库连接：

```bash
npm run db:setup
```

这将引导您完成以下步骤：
- 选择数据库类型（PostgreSQL, MySQL, SQLite）
- 配置数据库连接参数
- 创建 `.env.local` 文件存储连接字符串

### 3. 初始化数据库

初始化数据库并应用模型：

```bash
npx prisma migrate dev --name init
```

## 数据库操作

### 使用 Prisma Studio 查看和编辑数据

启动 Prisma 的可视化数据库管理工具：

```bash
npm run prisma:studio
```

这将在浏览器中打开一个界面，您可以在其中浏览和编辑数据库中的数据。

### 使用 API 接口

系统提供了以下 API 接口用于管理研究报告数据：

#### 研究报告管理

- `GET /api/research` - 获取研究报告列表
- `POST /api/research` - 创建新的研究报告
- `GET /api/research/:id` - 获取研究报告详情
- `PUT /api/research/:id` - 更新研究报告

#### 来源管理

- `GET /api/research/:id/sources` - 获取研究报告来源
- `POST /api/research/:id/sources` - 添加研究报告来源

#### 相关内容管理

- `GET /api/research/:id/related` - 获取研究报告相关内容
- `POST /api/research/:id/related` - 添加研究报告相关内容

## 数据库更新和维护

### 创建新的迁移

当您修改 `schema.prisma` 文件后，需要创建新的迁移：

```bash
npm run prisma:migrate
```

### 重新生成客户端

当模型变更后，需要重新生成 Prisma 客户端：

```bash
npm run prisma:generate
```

## 故障排除

### 常见错误

1. **数据库连接失败**
   - 检查 `.env.local` 文件中的连接字符串
   - 确保数据库服务已启动
   - 验证用户名和密码是否正确

2. **迁移错误**
   - 检查 Prisma schema 是否有语法错误
   - 可能需要重置数据库：`npx prisma migrate reset`

3. **类型错误**
   - 在修改模型后，确保重新生成客户端：`npm run prisma:generate` 
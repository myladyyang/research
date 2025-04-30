#!/bin/bash

# 安装 Prisma 相关依赖
npm install prisma @prisma/client --save-dev

# 提示用户输入数据库信息
echo "设置数据库连接..."
read -p "数据库类型 (postgresql/mysql/sqlite): " DB_TYPE
DB_TYPE=${DB_TYPE:-postgresql}

if [ "$DB_TYPE" = "sqlite" ]; then
  DATABASE_URL="file:./dev.db"
else
  read -p "数据库用户名: " DB_USER
  read -p "数据库密码: " DB_PASSWORD
  read -p "数据库主机 (默认: localhost): " DB_HOST
  DB_HOST=${DB_HOST:-localhost}
  read -p "数据库端口 (postgresql=5432/mysql=3306): " DB_PORT
  if [ "$DB_TYPE" = "postgresql" ]; then
    DB_PORT=${DB_PORT:-5432}
  else
    DB_PORT=${DB_PORT:-3306}
  fi
  read -p "数据库名称 (默认: climate_ai): " DB_NAME
  DB_NAME=${DB_NAME:-climate_ai}
  
  DATABASE_URL="${DB_TYPE}://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"
fi

# 创建或更新 .env 文件
echo "# 数据库连接URL" > .env.local
echo "DATABASE_URL=\"${DATABASE_URL}\"" >> .env.local
echo "# 开发环境变量" >> .env.local
echo "NODE_ENV=\"development\"" >> .env.local

echo "已创建环境变量文件 .env.local"

# 如果不是sqlite，提示用户创建数据库
if [ "$DB_TYPE" != "sqlite" ]; then
  echo "注意: 请确保数据库 '${DB_NAME}' 已创建，如果未创建，请使用以下命令创建:"
  if [ "$DB_TYPE" = "postgresql" ]; then
    echo "psql -U ${DB_USER} -c \"CREATE DATABASE ${DB_NAME};\""
  else
    echo "mysql -u ${DB_USER} -p -e \"CREATE DATABASE ${DB_NAME};\""
  fi
fi

# 更新 schema.prisma 文件的数据库类型
sed -i.bak "s/provider = \"postgresql\"/provider = \"${DB_TYPE}\"/" prisma/schema.prisma
rm prisma/schema.prisma.bak

# 生成 Prisma 客户端
npx prisma generate

echo "Prisma 设置完成!"
echo "要初始化数据库，请运行: 'npx prisma migrate dev --name init'" 
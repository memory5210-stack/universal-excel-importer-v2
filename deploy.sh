#!/bin/bash

# Vercel 部署脚本
echo "开始部署到 Vercel..."

# 检查是否已安装 vercel CLI
if ! command -v vercel &> /dev/null; then
  echo "正在安装 Vercel CLI..."
  npm install -g vercel
fi

# 登录 Vercel
echo "请登录 Vercel（如果尚未登录）"
vercel login

# 部署
echo "开始部署..."
vercel --prod

echo "部署完成！"
echo ""
echo "下一步："
echo "1. 在 Vercel Dashboard 配置环境变量：DATABASE_URL, DEEPSEEK_API_KEY"
echo "2. 运行数据库迁移：npx prisma db push"
echo "3. 访问部署后的 URL 测试应用"

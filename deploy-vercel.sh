#!/bin/bash
set -e

echo "===== 万能导入 V2 - 一键部署到 Vercel ====="
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
  echo "❌ 未安装 Node.js，请先安装 Node.js"
  exit 1
fi

echo "✅ Node.js 已安装：$(node --version)"

# 安装依赖
echo ""
echo "📦 安装项目依赖..."
npm install

# 安装 Vercel CLI
echo ""
echo "📦 安装 Vercel CLI..."
npm install -g vercel

# 检查是否已登录
echo ""
echo "🔐 检查 Vercel 登录状态..."
if ! vercel whoami &> /dev/null; then
  echo "⚠️  未登录 Vercel，请在浏览器中完成登录..."
  vercel login
fi

echo "✅ 已登录 Vercel，用户：$(vercel whoami)"

# 链接项目
echo ""
echo "🔗 链接到 Vercel 项目..."
if [ ! -f ".vercel/project.json" ]; then
  vercel link --yes --repository https://github.com/memory5210-stack/universal-excel-importer-v2.git
else
  echo "✅ 项目已链接"
fi

# 检查环境变量
echo ""
echo "🔧 检查环境变量配置..."

if [ ! -f ".env.local" ]; then
  echo "⚠️  请配置环境变量："
  echo ""
  echo "1. 创建 Neon 数据库：https://neon.tech"
  echo "2. 复制连接字符串（包含 ?sslmode=require）"
  echo "3. 创建 DeepSeek API Key：https://platform.deepseek.com"
  echo ""
  echo "然后创建 .env.local 文件并填入以下内容："
  echo ""
  echo "DATABASE_URL=postgresql://user:password@host/neondb?sslmode=require"
  echo "DEEPSEEK_API_KEY=sk-your-api-key"
  echo ""
  read -p "是否现在配置环境变量？(y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "请输入 Neon 连接字符串："
    read DATABASE_URL
    
    echo "请输入 DeepSeek API Key："
    read API_KEY
    
    cat > .env.local << EOF
# Neon Database
DATABASE_URL="${DATABASE_URL}"

# DeepSeek API
DEEPSEEK_API_KEY="${API_KEY}"
EOF
    
    echo "✅ 环境变量已保存到 .env.local"
  fi
else
  echo "✅ .env.local 已存在"
fi

# 添加 Vercel 环境变量
echo ""
echo "🔧 配置 Vercel 环境变量..."
vercel env pull

# 生成 Prisma 客户端
echo ""
echo "🔧 生成 Prisma 客户端..."
npx prisma generate

# 部署
echo ""
echo "🚀 部署到 Vercel..."
vercel --prod

echo ""
echo "✅ 部署完成！"
echo ""
echo "下一步操作："
echo "1. 在 Vercel Dashboard 验证环境变量配置"
echo "2. 访问部署后的 URL 测试应用"
echo "3. 在 Vercel 部署日志中执行 'npx prisma db push' 初始化数据库"
echo ""
echo "项目 GitHub: https://github.com/memory5210-stack/universal-excel-importer-v2"
echo "部署的 Vercel URL: 查看上面的输出"

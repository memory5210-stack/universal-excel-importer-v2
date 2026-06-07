# Prisma 7 配置修复说明

## 问题描述

Prisma 7 引入了新的配置方式和 Vercel 部署要求，之前版本使用 `prisma.config.ts` 配置会导致部署失败。

## 修复内容

### 删除的文件
- ❌ `prisma.config.ts` - Prisma 7 在 Vercel 上不需要此文件

### 修改的文件

#### 1. `prisma/schema.prisma`

恢复标准的 datasource 配置：

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

#### 2. `lib/db/client.ts`

使用标准 Prisma Client 初始化方式：

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

## 部署步骤

### 1. 等待 GitHub 同步

代码已推送，等待 30 秒让 Vercel 检测到更新。

### 2. Vercel 自动重新部署

Vercel 会自动触发新的部署，无需手动操作。

### 3. 配置环境变量（如果还未配置）

访问 Vercel Dashboard → 项目 → **Settings** → **Environment Variables**

确保配置：
- `DATABASE_URL` = Neon 连接字符串
- `DEEPSEEK_API_KEY` = API Key

### 4. 初始化数据库

部署成功后，在 Vercel 中初始化数据库：

**方式 A：使用 Vercel CLI（推荐）**

```bash
cd /workspace/universal-import-v2
vercel env pull
npx prisma generate
npx prisma db push
```

**方式 B：访问 Vercel Functions**

部署成功后访问一次应用的 API 端点会自动触发数据库连接。

## 验证清单

- [ ] Vercel 部署成功（绿色勾）
- [ ] 无 Prisma 相关错误
- [ ] 首页可以访问
- [ ] 数据库表已创建（通过 Neon Dashboard 验证）

## 常见问题

### Q: 还是报 Prisma 错误怎么办？

A: 
1. 检查 `prisma.config.ts` 是否已删除
2. 确认 `schema.prisma` 包含 `url = env("DATABASE_URL")`
3. 重新部署：Vercel Dashboard → Deployments → 最新部署 → Redeploy

### Q: 数据库表未创建？

A: 在本地执行：
```bash
vercel env pull
npx prisma db push
```

### Q: 本地开发如何运行？

A: 
```bash
# 1. 创建 .env.local 文件
cp .env.example .env.local

# 2. 填写环境变量
DATABASE_URL=postgresql://...
DEEPSEEK_API_KEY=sk-...

# 3. 运行开发服务器
npm run dev
```

---

**修复已完成，等待 Vercel 自动重新部署即可！** 🚀

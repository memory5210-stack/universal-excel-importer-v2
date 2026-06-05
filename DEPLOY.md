# 部署指南

## 快速部署到 Vercel

### 方法 1：使用 Vercel Dashboard（推荐）

1. **访问 Vercel**
   - 打开 https://vercel.com/new
   - 登录你的 GitHub 账号

2. **导入项目**
   - 点击 "Import Git Repository"
   - 选择 `universal-excel-importer-v2` 仓库
   - 点击 "Import"

3. **配置环境变量**
   在 Vercel Dashboard 的 "Settings" -> "Environment Variables" 中添加：
   
   - `DATABASE_URL`: PostgreSQL 连接字符串
     ```
     postgresql://user:password@host:port/database
     ```
   
   - `DEEPSEEK_API_KEY`: DeepSeek API Key
     ```
     sk-your-api-key-here
     ```

4. **点击 "Deploy"**
   - 首次部署约需 2-3 分钟
   - 部署成功后会获得一个在线 URL

5. **初始化数据库**
   在 Vercel 的 "Settings" -> "Deployment" 中点击最新部署的卡片，然后：
   - 打开 "Deployment Details"
   - 点击 "View Build Logs" 确认无错误
   - 访问部署的 URL 测试应用

### 方法 2：使用 Vercel CLI

```bash
# 1. 登录 Vercel
vercel login

# 2. 链接到现有项目
vercel link --repo

# 3. 部署到生产环境
vercel --prod
```

## 本地测试构建

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入实际的 DATABASE_URL 和 DEEPSEEK_API_KEY

# 3. 生成 Prisma 客户端
npx prisma generate

# 4. 运行开发服务器
npm run dev

# 5. 访问 http://localhost:3000
```

## 数据库迁移

如果需要在本地或生产环境初始化数据库表结构：

```bash
# 本地开发
npx prisma db push

# 或创建 migrations
npx prisma migrate dev
```

## 配置 Neon 数据库

1. 访问 https://neon.tech
2. 创建新项目
3. 复制连接字符串（Connection String）
4. 在 Vercel 中配置为 `DATABASE_URL`

## 配置 DeepSeek API

1. 访问 https://platform.deepseek.com
2. 创建 API Key
3. 在 Vercel 中配置为 `DEEPSEEK_API_KEY`

## 验证部署

部署成功后，验证以下功能：

- [ ] 首页可以正常访问
- [ ] 文件上传功能正常
- [ ] 解析规则管理页面可访问
- [ ] 已导入运单列表可访问
- [ ] 所有 API 端点返回正确响应

## 故障排查

### 构建失败

查看构建日志，常见错误：
- 缺少环境变量：在 Vercel Dashboard 中添加
- Prisma 生成失败：确保 prisma.config.ts 正确配置

### 运行时错误

- 数据库连接失败：检查 `DATABASE_URL` 是否正确
- AI 调用失败：检查 `DEEPSEEK_API_KEY` 是否有有效

### 获取部署日志

```bash
# 查看最近部署的日志
vercel logs

# 查看特定部署的日志
vercel logs <deployment-url>
```

## 性能优化建议

1. **启用边缘函数**：将 API 部署到边缘节点
2. **数据库连接池**：Neon 默认已优化
3. **静态资源缓存**：Next.js 自动处理

## 域名配置（可选）

在 Vercel Dashboard 的 "Domains" 中添加自定义域名。

## 持续集成

每次推送到 GitHub 仓库后，Vercel 会自动：
1. 检测代码变更
2. 运行构建
3. 生成预览部署
4. 主分支（master）自动部署到生产环境

## 回滚部署

如需回滚到之前的版本：

```bash
# 列出所有部署
vercel ls

# 回滚到特定版本
vercel rollback <deployment-url>
```

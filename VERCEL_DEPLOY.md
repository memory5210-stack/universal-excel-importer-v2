# Vercel 部署步骤

## 方法一：通过 Vercel Dashboard（推荐 - 最简单）

### 第 1 步：创建 Neon 数据库

1. 访问 https://neon.tech
2. 点击 "Sign Up" 登录（可用 GitHub 账号）
3. 点击 "Create project" 创建新项目
4. 填写项目名称，例如：`universal-import-db`
5. 等待数据库创建完成
6. 在 Dashboard 中找到 **Connection Pooling** 的连接字符串（Pooler 模式）
7. 复制连接字符串，格式类似：
   ```
   postgresql://username:password@hostname:port/database?sslmode=require
   ```

### 第 2 步：在 Vercel 部署

1. 访问 https://vercel.com/new
2. 登录 Vercel（可用 GitHub 账号）
3. 点击 **"Import Git Repository"**
4. 搜索 `universal-excel-importer-v2`
5. 点击 **"Import"** 导入仓库
6. 在 "Configure Project" 页面，点击 **"Add Environment Variable"** 添加环境变量：

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | 从 Neon 复制的 PostgreSQL 连接字符串 |
   | `DEEPSEEK_API_KEY` | DeepSeek API Key（如：`sk-your-api-key-here`）|
   | `VERCEL_POSTGRES_URL` | 与 DATABASE_URL 相同（Vercel集成需要）|

7. 点击 **"Deploy"** 开始部署
8. 等待 2-3 分钟，看到成功页面后点击 **"Continue to Dashboard"**

### 第 3 步：初始化数据库

1. 在 Vercel Dashboard 中，点击刚部署的项目
2. 点击右下角的 **"..." → "View Deployment Details"**
3. 复制部署的 URL（例如：`https://universal-excel-importer-v2-xxx.vercel.app`）
4. 在本地终端执行：

```bash
cd /workspace/universal-import-v2

# 安装 Vercel CLI（如果未安装）
npm install -g vercel

# 链接到现有项目
vercel link

# 拉取环境变量
vercel env pull

# 初始化数据库（运行迁移）
npx prisma db push
```

或直接访问部署的 URL，应用会自动尝试数据库连接。

### 第 4 步：验证部署

访问部署的 Vercel URL，测试以下功能：
- [ ] 首页可以正常访问
- [ ] 查看解析规则页面
- [ ] 查看已导入运单页面
- [ ] 无控制台报错

---

## 方法二：使用 Vercel CLI（需手动验证）

在终端中依次执行：

```bash
cd /workspace/universal-import-v2

# 1. 登录 Vercel（会在浏览器中打开验证页面）
vercel login

# 2. 链接项目
vercel link

# 3. 添加环境变量
vercel env add DATABASE_URL
# 输入 Neon 的连接字符串后回车

vercel env add DEEPSEEK_API_KEY
# 输入 DeepSeek API Key 后回车

# 4. 部署到生产环境
vercel --prod
```

---

## 获取 Neon 连接字符串（详细截图说明）

1. 登录 https://neon.tech
2. 进入你的项目
3. 在 Dashboard 页面找到 **"Connection Details"**
4. 点击 **"Copy"** 复制连接字符串
5. **重要**：确保连接字符串包含 `?sslmode=require`

示例连接字符串：
```
postgresql://user:Abc123xyz@ep-quiet-mountain-123456.us-east-2.aws.neon.tech/universal-import?sslmode=require
```

---

## 获取 DeepSeek API Key

1. 访问 https://platform.deepseek.com
2. 登录账号
3. 进入 **"API Keys"** 页面
4. 点击 **"Create API Key"**
5. 复制生成的 API Key（以 `sk-` 开头）

---

## 常见问题

### Q: 部署失败怎么办？

A: 在 Vercel Dashboard 中查看部署日志，常见错误：
- 环境变量缺失：确保 `DATABASE_URL` 和 `DEEPSEEK_API_KEY` 已配置
- Prisma 生成失败：检查 schema.prisma 配置
- 数据库连接失败：确认 Neon 连接字符串正确

### Q: 如何查看部署日志？

A: 
1. Vercel Dashboard → 项目 → **"Deployments"**
2. 点击最新部署
3. 查看 **"Build Logs"**

### Q: 如何自定义域名？

A: Vercel Dashboard → 项目 → **"Domains"** → 添加自定义域名

---

## 部署完成后的验证清单

- [ ] Vercel 部署成功，获得在线 URL
- [ ] Neon 数据库创建完成，获得连接字符串
- [ ] 环境变量配置正确
- [ ] 数据库初始化完成（表结构创建）
- [ ] 首页可访问
- [ ] 规则管理页面可访问
- [ ] 运单列表页面可访问
- [ ] 文件上传功能正常

---

**预计部署时间**：10-15 分钟

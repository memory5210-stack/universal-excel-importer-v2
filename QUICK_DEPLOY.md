# 🚀 Vercel 部署 - 快速指南

## ✅ 部署步骤（5 分钟完成）

### 1️⃣ 创建 Neon 数据库

访问 https://neon.tech/import/github

1. 登录后点击右上角 **"New Project"**
2. 填写项目名称：`universal-import-db`
3. 等待 10 秒创建完成
4. 在 **Connection Details** 区域复制连接字符串
5. 保存连接字符串（用于步骤 3）

### 2️⃣ 部署到 Vercel

访问 https://vercel.com/new?utm_source=universal-excel-importer-v2

1. 点击 **"Import Git Repository"**
2. 搜索并选择 `universal-excel-importer-v2`
3. 点击 **"Import"**
4. 在 "Configure Project" 页面配置环境变量（见步骤 3）
5. 点击 **"Deploy"**

### 3️⃣ 配置环境变量

在 Vercel 部署页面点击 **"Add Environment Variable"**：

| Name | Value |
|------|-------|
| `DATABASE_URL` | (步骤 1 复制的 Neon 连接字符串) |
| `DEEPSEEK_API_KEY` | (你的 DeepSeek API Key) |

### 4️⃣ 初始化数据库

部署完成后：

1. 点击 **"Continue to Dashboard"**
2. 访问 **Settings** → **Deployments** → 最新部署 → **View Build Logs**
3. 在本地终端执行：

```bash
cd /workspace/universal-import-v2
vercel link
npx prisma db push
```

### 5️⃣ 访问应用

访问部署的 URL，例如：
`https://universal-excel-importer-v2.vercel.app`

---

## 📋 验证清单

- [ ] Vercel 部署成功（绿色勾）
- [ ] Neon 数据库创建成功
- [ ] 环境变量配置完成
- [ ] 首页可以访问
- [ ] 可以打开「解析规则」页面
- [ ] 可以打开「已导入运单」页面

---

## 🆘 需要帮助？

访问完整部署文档：https://github.com/memory5210-stack/universal-excel-importer-v2/blob/master/VERCEL_DEPLOY.md

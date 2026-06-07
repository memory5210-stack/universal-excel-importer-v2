# Neon PostgreSQL 数据库配置指南

## 什么是 Neon？

Neon 是一个 Serverless PostgreSQL 平台，为 Vercel 等现代云平台优化。特点：
- ⚡ 自动扩展
- 💰 免费额度充足（10GB 存储）
- 🔗 连接池内置
- 🌍 全球节点

## 创建 Neon 数据库

### 步骤 1：注册登录

1. 访问 https://neon.tech
2. 点击 **"Sign In"** 或 **"Sign Up"**
3. 推荐使用 **GitHub** 账号登录

### 步骤 2：创建项目

1. 登录后点击右上角 **"New Project"**
2. 填写项目信息：
   - **Name**: `universal-import-db`
   - **Region**: 选择离您最近的区域（如 `AWS - US East (Ohio)`）
3. 点击 **"Create project"**

### 步骤 3：获取连接字符串

1. 项目创建完成后，进入 Dashboard
2. 在 **"Connection Details"** 区域选择：
   - **Connection type**: `Pooler`（推荐，性能更好）
   - **Format**: `URI`

3. 点击 **"Copy"** 复制连接字符串
   
   格式类似：
   ```
   postgresql://user:name@ep-quiet-mountain-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

4. **重要**：确保连接字符串包含 `?sslmode=require`

### 步骤 4：保存连接字符串

将连接字符串保存到安全位置，稍后需要配置到 Vercel 环境变量。

---

## 配置到 Vercel

### 方法 1：Vercel Dashboard 配置（推荐）

1. 访问 https://vercel.com/dashboard
2. 点击您的项目 `universal-excel-importer-v2`
3. 进入 **Settings** → **Environment Variables**
4. 点击 **"Add Environment Variable"**
5. 添加：
   
   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | (从 Neon 复制的完整连接字符串) |
   | `VERCEL_POSTGRES_URL` | (与 DATABASE_URL 相同) |

6. 选择环境（Development/Preview/Production）
7. 点击 **"Save"**

### 方法 2：Vercel CLI 配置

```bash
cd /workspace/universal-import-v2

# 拉取环境变量
vercel env pull

# 手动编辑 .env.local 文件
# 添加 DATABASE_URL 和 VERCEL_POSTGRES_URL

# 重新部署
vercel --prod
```

---

## 初始化数据库表结构

配置完成后，需要创建数据库表：

### 本地执行迁移

```bash
cd /workspace/universal-import-v2

# 1. 拉取 Vercel 环境变量
vercel env pull

# 2. 生成 Prisma 客户端
npx prisma generate

# 3. 推送数据库结构（创建表）
npx prisma db push
```

### 查看数据库

访问 Neon Dashboard：
- https://neon.tech
- 选择项目
- 点击 **"Tables"** 查看表结构

应该看到两个表：
- `ParsingRule` - 解析规则表
- `Shipment` - 运单数据表

---

## 测试数据库连接

### 方式 1：访问 API 测试

部署后访问：
```
https://your-app.vercel.app/api/shipments
```

如果返回 JSON 数据（可能为空数组），说明数据库连接正常。

### 方式 2：查看 Vercel 部署日志

1. Vercel Dashboard → 项目 → **Deployments**
2. 点击最新部署
3. 查看 **Build Logs**
4. 确认无数据库连接错误

---

## 常见问题

### Q: 连接字符串包含哪些信息？

A: 完整格式：
```
postgresql://[用户名]:[密码]@[主机]/[数据库名]?sslmode=require
```

例：
```
postgresql://user123:abc456@ep-xyz.us-east-2.aws.neon.tech/universal-import?sslmode=require
```

### Q: 找不到 Connection Details？

A: 在 Neon Dashboard 中：
1. 左侧菜单选择项目
2. Dashboard 页面找到 **"Connection Details"** 卡片
3. 右侧点击 **"Copy"**

### Q: 数据库连接失败？

A: 检查以下几点：
1. 连接字符串是否完整复制
2. 是否包含 `?sslmode=require`
3. 环境变量名称是否正确（`DATABASE_URL`）
4. Vercel 部署是否已完成
5. 查看 Vercel 部署日志中的错误信息

### Q: 免费额度够用吗？

A: 完全够用！Neon 免费套餐包含：
- 10GB 存储
- 不限制计算时间
- 自动休眠（节省资源）

对于考试项目绰绰有余。

### Q: 如何删除数据库？

A: Neon Dashboard → Settings → 滚动到最底部 → **"Delete Project"**

---

## Neon + Vercel 最佳实践

1. **使用 Pooler 模式**：连接池优化性能
2. **SSL 强制**：始终包含 `?sslmode=require`
3. **区域选择**：选择与 Vercel 相同的区域（如 US East）
4. **连接字符串安全**：
   - 不要提交到 Git
   - 使用 Vercel 环境变量管理
5. **备份**：定期从 Neon Dashboard 导出数据

---

## 下一步

完成 Neon 数据库配置后：

1. ✅ 在 Vercel 配置环境变量
2. ✅ 执行 `npx prisma db push` 初始化表结构
3. ✅ 访问部署的 URL 测试应用

---

**参考链接**：
- Neon 文档：https://neon.tech/docs
- Prisma + Neon：https://www.prisma.io/docs/guides/database/neon
- Vercel PostgreSQL：https://vercel.com/docs/storage/vercel-postgres

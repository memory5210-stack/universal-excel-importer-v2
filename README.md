# 万能导入 V2 - 智能多格式批量下单系统

通过 AI 大模型实现任意格式文件的智能解析与导入，完成批量下单流程。

## 技术栈

- **前端框架**: Next.js 16 App Router + TypeScript
- **UI 风格**: 鲸天系统 (#0fc6c2 主色调)
- **数据库**: Neon PostgreSQL
- **ORM**: Prisma
- **AI 大模型**: DeepSeek / GPT / Claude
- **部署平台**: Vercel

## 核心功能

### 1. 解析规则配置 + AI 辅助生成（核心考点）

- 设计通用规则引擎，支持配置化解析各种文件格式
- AI 自动分析文件结构并生成解析规则
- 支持手动微调确认
- 规则持久化存储和复用

### 2. 文件导入与解析执行

- 支持 Excel (.xlsx/.xls)、Word (.docx)、PDF 格式
- 拖拽上传和点击上传
- 实时进度条
- 复杂格式兼容：干扰头部、跨行聚合、矩阵转置、多 Sheet、卡片式、复合单元格拆分等

### 3. 数据预览与编辑

- 类 Excel 表格展示
- 表头固定、横向滚动
- 单元格点击编辑
- 实时校验（必填字段、格式错误标红）
- 删除行/新增空行
- 导出 Excel

### 4. 提交下单

- 错误校验（有错误的行不允许提交）
- 上传进度条
- 数据库持久化
- 结果汇总

### 5. 已导入运单列表

- 历史记录查看
- 筛选/搜索（外部编码、收件人姓名、提交时间）
- 分页展示

## 快速开始

### 1. 安装依赖

```bash
cd universal-import-v2
npm install
```

### 2. 配置环境变量

复制 `.env.example` 文件为 `.env.local`，填入配置：

```bash
cp .env.example .env.local
```

编辑 `.env.local`：
- `DATABASE_URL`: PostgreSQL 数据库连接字符串（Neon/Supabase 等）
- `DEEPSEEK_API_KEY`: AI 大模型 API Key

### 3. 初始化数据库

```bash
npx prisma generate
npx prisma db push
```

### 4. 运行开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 部署到 Vercel

### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

### 2. 部署

```bash
vercel
```

### 3. 配置环境变量

在 Vercel Dashboard 中添加环境变量：
- `DATABASE_URL`
- `DEEPSEEK_API_KEY`

### 4. 获取在线地址

部署成功后会提供在线访问 URL

## 支持的复杂格式

| 文件格式 | 结构特征 | 处理方法 |
|---------|---------|---------|
| Excel - 干扰头部 | 前几行是元信息，非表头 | 配置 `skipHeaderRows` |
| Excel - 散落尾部 | 收货人信息在数据区之外 | 配置 `extractFromRow` |
| Excel - 跨行聚合 | 同一单号多行 SKU | 配置 `groupByKey` |
| Excel - 矩阵转置 | SKU×门店矩阵 | 配置 `transposeMatrix` |
| Excel - 多 Sheet | 每个 Sheet 是独立出库单 | 遍历所有 Sheet |
| Excel - 卡片式 | 非标准表格，卡片堆叠 | 配置 `cardBoundary` |
| Excel - 复合单元格 | 单元格内含多行文本 | 配置 `splitCompositeCell` |
| Word - 纯文本 | 段落格式，分隔线划分 | 配置 `cardBoundary` 和正则解析 |
| PDF - 多页多单 | 多个独立签收单 | 配置分隔标记拆分 |

## 规则引擎设计

规则引擎的核心思想是**配置化而非硬编码**。每种新格式只需要配置一条规则即可适配，代码无需改动。

### 规则配置结构示例

```json
{
  "name": "黎明屯配送发货单",
  "fileType": "excel",
  "config": {
    "skipHeaderRows": 3,
    "headerRowIndex": 3,
    "dataStartRow": 4,
    "extractFromRow": {
      "rowIndex": 9,
      "fieldMappings": {
        "receiverName": 5,
        "receiverPhone": 6,
        "receiverAddress": 7
      }
    },
    "fieldMapping": {
      "skuCode": 0,
      "skuName": 1,
      "skuQuantity": 2
    },
    "staticFields": {
      "storeName": "尹三顺自助烤肉（银泰店）"
    }
  }
}
```

## 性能要求

- **1000 条数据 10 秒内完成**（从上传到完整展示）
- **大列表渲染优化**：不卡顿、不崩溃
- **内存管理**：处理大文件时无内存溢出

## 项目结构

```
universal-import-v2/
├── app/
│   ├── api/              # API 路由
│   │   ├── upload/       # 文件上传解析
│   │   └── rules/        # 规则管理
│   ├── rules/            # 规则管理页面
│   ├── shipments/        # 运单列表页面
│   ├── globals.css       # 全局样式
│   ├── layout.tsx        # 根布局
│   └── page.tsx          # 主页面（导入）
├── lib/
│   ├── parser/           # 解析引擎
│   │   └── rule-engine.ts
│   └── types.ts          # 类型定义
├── prisma/
│   └── schema.prisma     # 数据库模型
├── .env.example          # 环境变量示例
├── package.json
└── README.md
```

## 大模型调用说明

### 使用模型：DeepSeek Chat

### Prompt 设计思路

系统设定 AI 为"智能文档解析专家"，要求：
1. 分析文件类型和结构特征
2. 识别表头位置、数据区域
3. 提取字段映射关系
4. 识别复杂处理需求
5. 以 JSON Schema 输出规则配置

### API Key 配置

```bash
# .env.local
DEEPSEEK_API_KEY="sk-your-api-key-here"
```

### 错误处理

- API Key 无效时返回 401
- 超时控制（30 秒）
- 解析失败时提示用户手动配置

## 开发清单

- [x] 项目初始化
- [x] UI 基础框架（鲸天风格）
- [x] 解析规则引擎核心逻辑
- [x] 基本页面结构
- [ ] 完整的文件解析实现
- [ ] AI 辅助规则生成
- [ ] 数据库集成
- [ ] 性能优化
- [ ] 测试用例
- [ ] Vercel 部署

## 考试纪律声明

- UI 原创，不与其他考生作品雷同
- 代码独立开发
- Prompt 自主设计

## License

ISC

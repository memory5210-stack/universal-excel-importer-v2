// 运单数据结构
export interface ShipmentData {
  externalCode?: string;      // 外部编码
  storeName?: string;         // 收货门店 (A 组)
  receiverName?: string;      // 收件人姓名 (B 组)
  receiverPhone?: string;     // 收件人电话 (B 组)
  receiverAddress?: string;   // 收件人地址 (B 组)
  skuCode: string;            // SKU 物品编码
  skuName: string;            // SKU 物品名称
  skuQuantity: number;        // SKU 发货数量
  skuSpecification?: string;  // SKU 规格型号
  remarks?: string;           // 备注
}

// 解析规则配置
export interface ParsingRuleConfig {
  id: string;
  name: string;
  description?: string;
  fileType: 'excel' | 'word' | 'pdf';
  config: {
    // 文件结构配置
    skipHeaderRows?: number;          // 跳过的头部行数
    skipFooterRows?: number;          // 跳过的尾部行数
    headerRowIndex?: number;          // 表头所在行索引
    dataStartRow?: number;            // 数据起始行
    dataEndRow?: number;              // 数据结束行
    
    // 字段映射
    fieldMapping?: {
      externalCode?: string;
      storeName?: string;
      receiverName?: string;
      receiverPhone?: string;
      receiverAddress?: string;
      skuCode?: string;
      skuName?: string;
      skuQuantity?: string;
      skuSpecification?: string;
      remarks?: string;
    };
    
    // 复杂规则
    groupByKey?: string;              // 聚合字段（如外部编码）
    transposeMatrix?: boolean;        // 是否需要矩阵转置
    pivotColumns?: string[];          // 转置的列名
    splitCompositeCell?: boolean;     // 是否拆分复合单元格
    compositeCellPattern?: string;    // 复合单元格拆分模式
    cardBoundary?: string;            // 卡片边界标识
    sheetNames?: string[];            // 指定的 Sheet 名称
    
    // 信息提取规则
    staticFields?: Record<string, string>;  // 静态字段值
    extractFromRow?: {              // 从特定行提取信息
      rowIndex: number;
      fieldMappings: Record<string, number>; // 字段名 -> 列索引
    };
    
    // AI 辅助相关
    aiPrompt?: string;              // AI 预处理的 Prompt
    confidence?: number;            // AI 推测的置信度
  };
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// 解析结果
export interface ParseResult {
  data: ShipmentData[];
  errors?: ParseError[];
  totalRows: number;
  validRows: number;
}

// 解析错误
export interface ParseError {
  row: number;
  field: string;
  message: string;
  value?: any;
}

// 文件上传响应
export interface UploadResponse {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

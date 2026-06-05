/**
 * 智能解析规则引擎
 * 
 * 本引擎支持通过配置化方式解析各种复杂格式的文件，
 * 无需为每种文件格式编写硬编码逻辑。
 */

import type { ParsingRuleConfig, ShipmentData } from '../types';

export class RuleEngine {
  private rule: ParsingRuleConfig['config'];

  constructor(ruleConfig: ParsingRuleConfig['config']) {
    this.rule = ruleConfig;
  }

  /**
   * 解析 Excel 数据
   */
  parseExcel(rawData: any[][]): ShipmentData[] {
    const { config } = this.rule;
    const shipments: ShipmentData[] = [];

    // 1. 跳过头部干扰行
    let dataStart = config.dataStartRow ?? 0;
    let dataEnd = config.dataEndRow ?? rawData.length;

    // 2. 提取表头
    let headers: string[] = [];
    if (config.headerRowIndex !== undefined) {
      headers = rawData[config.headerRowIndex].map(String);
    }

    // 3. 如果配置了从特定行提取信息（如收货人信息在数据区之外）
    const staticFields = this.extractStaticFields(rawData, config);

    // 4. 遍历数据行
    for (let i = dataStart; i < dataEnd; i++) {
      const row = rawData[i];
      
      // 跳过空行或合计行
      if (this.shouldSkipRow(row, i)) continue;

      // 5. 字段映射
      const shipment = this.mapFields(row, headers, config);

      // 6. 应用静态字段（如果动态字段缺失）
      Object.entries(staticFields).forEach(([key, value]) => {
        if (!shipment[key as keyof ShipmentData] && value) {
          shipment[key as keyof ShipmentData] = value as any;
        }
      });

      if (this.isValidShipment(shipment)) {
        shipments.push(shipment);
      }
    }

    // 7. 如果需要矩阵转置
    if (config.transposeMatrix && config.pivotColumns) {
      return this.transposeMatrix(ships, config);
    }

    // 8. 如果需要跨行聚合
    if (config.groupByKey) {
      return this.groupByField(ships, config.groupByKey);
    }

    return shipments;
  }

  /**
   * 解析 Word 文档
   */
  parseWord(text: string): ShipmentData[] {
    const { config } = this.rule;
    
    // 1. 识别分隔符（如"━━━"）
    const delimiter = config.cardBoundary ?? '━━━';
    const blocks = text.split(delimiter).filter(b => b.trim().length > 0);

    const shipments: ShipmentData[] = [];
    
    // 2. 对每个文本块进行解析
    for (const block of blocks) {
      const shipment = this.parseTextBlock(block, config);
      if (shipment) shipments.push(shipment);
    }

    return shipments;
  }

  /**
   * 解析 PDF 文档
   */
  parsePDF(text: string): ShipmentData[] {
    // PDF 的解析逻辑与 Word 类似，但需要额外处理多订单拆分
    const { config } = this.rule;

    // 1. 识别订单分隔标记
    const delimiter = config.cardBoundary ?? '\n\n';
    const blocks = text.split(delimiter).filter(b => b.trim().length > 0);

    const shipments: ShipmentData[] = [];

    // 2. 解析每个订单块
    for (const block of blocks) {
      const orderShipments = this.parseOrderBlock(block, config);
      shipments.push(...orderShipments);
    }

    return shipments;
  }

  /**
   * 字段映射
   */
  private mapFields(
    row: any[],
    headers: string[],
    config: ParsingRuleConfig['config']
  ): ShipmentData {
    const mapping = config.fieldMapping || {};
    const shipment: Partial<ShipmentData> = {};

    // 通过列名映射
    Object.entries(mapping).forEach(([field, column]) => {
      let value: any;

      // 列名可能是索引（数字）或列名（字符串）
      if (typeof column === 'number') {
        value = row[column];
      } else if (headers.length > 0) {
        const index = headers.findIndex(h => h?.toString() === column);
        value = index >= 0 ? row[index] : row[column as any];
      } else {
        value = row[column as any];
      }

      // 类型转换
      if (field === 'skuQuantity' && value) {
        value = parseInt(value) || 0;
      }

      shipment[field as keyof ShipmentData] = value;
    });

    return shipment as ShipmentData;
  }

  /**
   * 提取静态字段（从特定行或配置中）
   */
  private extractStaticFields(
    rawData: any[][],
    config: ParsingRuleConfig['config']
  ): Record<string, string> {
    const staticFields = config.staticFields || {};

    // 从特定行提取
    if (config.extractFromRow) {
      const { rowIndex, fieldMappings } = config.extractFromRow;
      const row = rawData[rowIndex];
      if (row) {
        Object.entries(fieldMappings).forEach(([field, colIndex]) => {
          if (!staticFields[field]) {
            staticFields[field] = row[colIndex]?.toString() || '';
          }
        });
      }
    }

    return staticFields;
  }

  /**
   * 矩阵转置（SKU×门店矩阵 → 多条运单记录）
   */
  private transposeMatrix(
    shipments: ShipmentData[],
    config: ParsingRuleConfig['config']
  ): ShipmentData[] {
    const result: ShipmentData[] = [];
    const { pivotColumns } = config;

    if (!pivotColumns) return shipments;

    // 对每条记录，为每个门店生成一条独立的运单
    for (const shipment of shipments) {
      const storeValues = pivotColumns.map(col => 
        (shipment as any)[col]
      ).filter(Boolean);

      storeValues.forEach(store => {
        const newShipment = { ...shipment };
        newShipment.storeName = store;
        result.push(newShipment);
      });
    }

    return result;
  }

  /**
   * 跨行聚合（按外部编码聚合多个 SKU 行）
   */
  private groupByField(
    shipments: ShipmentData[],
    groupByKey: string
  ): ShipmentData[] {
    const groups = new Map<string, ShipmentData[]>();

    shipments.forEach(shipment => {
      const key = (shipment[groupByKey as keyof ShipmentData] as string) || 'no-group';
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(shipment);
    });

    const result: ShipmentData[] = [];
    
    groups.forEach((items, key) => {
      // 同一组的第一条记录保留收货信息
      const base = { ...items[0] };
      
      // 后续记录只保留 SKU 信息
      for (let i = 1; i < items.length; i++) {
        const newItem = { ...items[i] };
        // 清除重复的收货信息（避免冗余）
        newItem.storeName = undefined;
        newItem.receiverName = undefined;
        newItem.receiverPhone = undefined;
        newItem.receiverAddress = undefined;
        result.push(newItem);
      }
      
      result.push(base);
    });

    return result;
  }

  /**
   * 解析文本块（Word/PDF）
   */
  private parseTextBlock(
    block: string,
    config: ParsingRuleConfig['config']
  ): ShipmentData | null {
    const lines = block.trim().split('\n');
    const shipment: Partial<ShipmentData> = {};

    // 从文本中提取字段（使用简单的键值对匹配）
    for (const line of lines) {
      const match = line.match(/(.*?):\s*(.*)/);
      if (match) {
        const [, key, value] = match;
        if (key.includes('编码')) shipment.skuCode = value;
        else if (key.includes('名称')) shipment.skuName = value;
        else if (key.includes('数量')) shipment.skuQuantity = parseInt(value) || 0;
      }
    }

    return this.isValidShipment(shipment as ShipmentData) ? shipment : null;
  }

  /**
   * 解析订单块（PDF 多订单场景）
   */
  private parseOrderBlock(
    block: string,
    config: ParsingRuleConfig['config']
  ): ShipmentData[] {
    // PDF 中可能有表格格式的文本，需要特殊处理
    return this.parseWord(block);
  }

  /**
   * 判断是否应该跳过某行
   */
  private shouldSkipRow(row: any[], rowIndex: number): boolean {
    // 跳过空行
    if (row.every(cell => !cell || cell.toString().trim() === '')) {
      return true;
    }
    
    // 跳过合计行
    if (row.some(cell => cell?.toString().includes('合计') || cell?.toString().includes('总计'))) {
      return true;
    }

    return false;
  }

  /**
   * 验证运单数据有效性
   */
  private isValidShipment(shipment: ShipmentData): boolean {
    // 必填字段校验
    if (!shipment.skuCode || !shipment.skuName || !shipment.skuQuantity) {
      return false;
    }

    // A 组/B 组二选一校验
    const hasA = !!shipment.storeName;
    const hasB = !!shipment.receiverName || !!shipment.receiverPhone || !!shipment.receiverAddress;

    return hasA || hasB;
  }
}

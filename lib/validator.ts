import type { ShipmentData } from './types';

export interface ValidationError {
  row: number;
  field: keyof ShipmentData;
  message: string;
  type: 'error' | 'warning';
}

/**
 * 验证运单数据
 */
export function validateShipmentData(data: ShipmentData[]): ValidationError[] {
  const errors: ValidationError[] = [];

  data.forEach((row, index) => {
    // A 组和 B 组至少填一组（可选）
    const hasA = !!row.storeName;
    const hasB = !!(row.receiverName || row.receiverPhone || row.receiverAddress);

    // 如果填写了 B 组信息，则三个字段必须同时填写
    if (hasB && !hasA) {
      if (!row.receiverName) {
        errors.push({
          row: index,
          field: 'receiverName',
          message: '收件人姓名不能为空',
          type: 'error'
        });
      }
      if (!row.receiverPhone) {
        errors.push({
          row: index,
          field: 'receiverPhone',
          message: '收件人电话不能为空',
          type: 'error'
        });
      } else if (!/^\d{11}$/.test(row.receiverPhone.replace(/\D/g, ''))) {
        errors.push({
          row: index,
          field: 'receiverPhone',
          message: '电话号码格式不正确（应为 11 位手机号）',
          type: 'error'
        });
      }
      if (!row.receiverAddress) {
        errors.push({
          row: index,
          field: 'receiverAddress',
          message: '收件人地址不能为空',
          type: 'error'
        });
      }
    }

    // 必填字段校验
    if (!row.skuCode) {
      errors.push({
        row: index,
        field: 'skuCode',
        message: 'SKU 编码不能为空',
        type: 'error'
      });
    }

    if (!row.skuName) {
      errors.push({
        row: index,
        field: 'skuName',
        message: 'SKU 名称不能为空',
        type: 'error'
      });
    }

    if (!row.skuQuantity) {
      errors.push({
        row: index,
        field: 'skuQuantity',
        message: '发货数量不能为空',
        type: 'error'
      });
    } else if (row.skuQuantity <= 0) {
      errors.push({
        row: index,
        field: 'skuQuantity',
        message: '发货数量必须为正数',
        type: 'error'
      });
    }
  });

  // 检查同批次内外部编码重复
  const externalCodeMap = new Map<string, number[]>();
  data.forEach((row, index) => {
    if (row.externalCode) {
      if (!externalCodeMap.has(row.externalCode)) {
        externalCodeMap.set(row.externalCode, []);
      }
      externalCodeMap.get(row.externalCode)!.push(index);
    }
  });

  externalCodeMap.forEach((indices, code) => {
    if (indices.length > 1) {
      indices.forEach(index => {
        errors.push({
          row: index,
          field: 'externalCode',
          message: `外部编码 "${code}" 重复（共${indices.length}条）`,
          type: 'error'
        });
      });
    }
  });

  return errors;
}

/**
 * 根据字段名获取错误
 */
export function getFieldErrors(errors: ValidationError[], row: number, field: keyof ShipmentData) {
  return errors.filter(e => e.row === row && e.field === field);
}

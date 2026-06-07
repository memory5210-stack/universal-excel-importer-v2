import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: '未上传文件' },
        { status: 400 }
      );
    }

    // 读取文件 buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = file.name;
    const fileExt = fileName.split('.').pop()?.toLowerCase();

    // 根据文件类型解析
    let shipments: any[] = [];

    if (fileExt === 'xlsx' || fileExt === 'xls') {
      shipments = await parseExcel(buffer, fileName);
    } else if (fileExt === 'docx') {
      shipments = await parseWord(buffer);
    } else if (fileExt === 'pdf') {
      shipments = await parsePDF(buffer);
    } else {
      return NextResponse.json(
        { success: false, error: '不支持的文件格式' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        fileName,
        fileSize: file.size,
        shipments,
        totalRows: shipments.length,
        validRows: shipments.filter(s => s.skuCode && s.skuName).length
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: '解析失败：' + (error as Error).message },
      { status: 500 }
    );
  }
}

async function parseExcel(buffer: Buffer, fileName: string): Promise<any[]> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const allShipments: any[] = [];

  // 遍历所有 Sheet（支持多 Sheet 文件）
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    // 转换为二维数组
    const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

    if (rawData.length === 0) continue;

    // 智能识别表头和数据
    const shipments = parseExcelData(rawData, sheetName, fileName);
    allShipments.push(...shipments);
  }

  return allShipments;
}

function parseExcelData(data: any[][], sheetName: string, fileName: string): any[] {
  const shipments: any[] = [];

  // 查找表头行（包含 "SKU" 或 "编码" 或 "名称" 的行）
  let headerRowIndex = -1;
  let headers: string[] = [];

  for (let i = 0; i < Math.min(data.length, 10); i++) {
    const row = data[i];
    const rowStr = row.join(' ').toLowerCase();
    if (rowStr.includes('sku') || rowStr.includes('编码') || rowStr.includes('名称') || rowStr.includes('数量')) {
      headerRowIndex = i;
      headers = row.map(h => String(h || '').trim());
      break;
    }
  }

  // 如果没找到表头，使用第一行
  if (headerRowIndex === -1) {
    headerRowIndex = 0;
    headers = data[0]?.map(h => String(h || '').trim()) || [];
  }

  // 映射字段索引
  const fieldIndex = {
    skuCode: findFieldIndex(headers, ['sku 编码', '物品编码', '编码', '商品编码', '货品编码']),
    skuName: findFieldIndex(headers, ['sku 名称', '物品名称', '名称', '商品名称', '货品名称', '品名']),
    skuQuantity: findFieldIndex(headers, ['数量', '发货数量', '件数', '个数']),
    skuSpecification: findFieldIndex(headers, ['规格', '型号', '规格型号']),
    externalCode: findFieldIndex(headers, ['外部编码', '单号', '订单号', '配送单号']),
    storeName: findFieldIndex(headers, ['门店', '收货门店', '店铺', '仓库']),
    receiverName: findFieldIndex(headers, ['收件人', '收货人', '姓名', '联系人']),
    receiverPhone: findFieldIndex(headers, ['电话', '手机', '联系方式', '联系电话']),
    receiverAddress: findFieldIndex(headers, ['地址', '收货地址', '详细地址']),
    remarks: findFieldIndex(headers, ['备注', '说明']),
  };

  // 跳过表头，解析数据行
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    
    // 跳过空行或合计行
    if (!row || row.length === 0 || row.join(' ').includes('合计') || row.join(' ').includes('总计')) {
      continue;
    }

    const skuCode = getField(row, fieldIndex.skuCode);
    const skuName = getField(row, fieldIndex.skuName);
    const skuQuantity = getField(row, fieldIndex.skuQuantity);

    // 至少有 SKU 编码和名称才认为是有效数据
    if (!skuCode && !skuName) continue;

    const shipment: any = {
      skuCode: skuCode || '',
      skuName: skuName || '',
      skuQuantity: parseQuantity(skuQuantity),
      skuSpecification: getField(row, fieldIndex.skuSpecification),
      externalCode: getField(row, fieldIndex.externalCode),
      storeName: getField(row, fieldIndex.storeName),
      receiverName: getField(row, fieldIndex.receiverName),
      receiverPhone: getField(row, fieldIndex.receiverPhone),
      receiverAddress: getField(row, fieldIndex.receiverAddress),
      remarks: getField(row, fieldIndex.remarks),
    };

    shipments.push(shipment);
  }

  return shipments;
}

function findFieldIndex(headers: string[], candidates: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i]?.toLowerCase() || '';
    for (const candidate of candidates) {
      if (header.includes(candidate.toLowerCase())) {
        return i;
      }
    }
  }
  return -1;
}

function getField(row: any[], index: number): string {
  if (index < 0 || index >= row.length) return '';
  const value = row[index];
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function parseQuantity(value: any): number {
  if (!value) return 0;
  const num = parseInt(String(value).replace(/[^\d]/g, ''));
  return isNaN(num) ? 0 : num;
}

async function parseWord(buffer: Buffer): Promise<any[]> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value;
  
  // 简单解析：按行分割，尝试提取键值对
  const shipments: any[] = [];
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  let currentShipment: any = {};
  for (const line of lines) {
    // 跳过分隔线
    if (line.includes('━━') || line.includes('══')) continue;
    
    // 尝试解析 编号。编码 | 名称 | 规格 | 数量 格式
    const match = line.match(/(\d+)\.?\s*\|?\s*([^|]+)\|?\s*([^|]+)\|?\s*([^|]+)\|?\s*([^|]+)/);
    if (match) {
      if (Object.keys(currentShipment).length > 0) {
        shipments.push(currentShipment);
      }
      currentShipment = {
        skuCode: match[2]?.trim() || '',
        skuName: match[3]?.trim() || '',
        skuSpecification: match[4]?.trim() || '',
        skuQuantity: parseInt(match[5]?.trim() || '0') || 0,
      };
    }
  }
  
  if (Object.keys(currentShipment).length > 0) {
    shipments.push(currentShipment);
  }
  
  return shipments;
}

async function parsePDF(buffer: Buffer): Promise<any[]> {
  const pdfParseModule = await import('pdf-parse');
  const pdfParse = pdfParseModule.default || pdfParseModule;
  const data = await (pdfParse as any)(buffer);
  const text = data.text;
  
  // PDF 解析逻辑与 Word 类似
  const shipments: any[] = [];
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  let currentShipment: any = {};
  for (const line of lines) {
    // 尝试提取表格格式的数据
    if (line.includes('|')) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 4) {
        if (Object.keys(currentShipment).length > 0) {
          shipments.push(currentShipment);
        }
        currentShipment = {
          skuCode: parts[0] || '',
          skuName: parts[1] || '',
          skuSpecification: parts[2] || '',
          skuQuantity: parseInt(parts[3]) || 0,
        };
      }
    }
  }
  
  if (Object.keys(currentShipment).length > 0) {
    shipments.push(currentShipment);
  }
  
  return shipments;
}

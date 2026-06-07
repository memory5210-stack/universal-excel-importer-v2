import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 调试环境变量
    const envCheck = {
      DATABASE_URL_set: !!process.env.DATABASE_URL,
      DATABASE_URL_length: process.env.DATABASE_URL?.length || 0,
      DATABASE_URL_preview: process.env.DATABASE_URL?.substring(0, 30) + '...',
    };
    
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: '未上传文件' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = file.name;
    const fileExt = fileName.split('.').pop()?.toLowerCase();

    // 动态导入 xlsx
    const XLSX = await import('xlsx');
    
    console.log('开始解析文件:', fileName, '大小:', file.size, '扩展名:', fileExt);

    let shipments: any[] = [];

    if (fileExt === 'xlsx' || fileExt === 'xls') {
      const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
      
      console.log('工作簿 Sheet 数量:', workbook.SheetNames.length);
      console.log('Sheet 名称:', workbook.SheetNames);

      // 遍历所有 Sheet
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
        
        console.log('Sheet:', sheetName, '行数:', rawData.length);
        console.log('前 5 行数据:', rawData.slice(0, 5));

        if (rawData.length === 0) continue;

        // 查找表头行 - 智能检测
        let headerRowIndex = 0;
        let headers: string[] = [];
        let foundHeader = false;

        // 典型表头关键词（中英文）
        const headerKeywords = [
          'sku', '商品', '产品', '货品', '单品',
          '编码', '货号', '款号', 'code',
          '名称', '品名', 'name',
          '数量', '件数', 'qty', 'quantity', 'num',
          '规格', '型号', 'size', 'spec',
          '门店', '店铺', '仓库', 'store', 'warehouse',
          '收货人', '收件人', '客户', '姓名',
          '电话', '手机', 'contact', 'phone',
          '地址', 'address'
        ];

        for (let i = 0; i < Math.min(rawData.length, 15); i++) {
          const row = rawData[i];
          const nonEmptyCount = row.filter((c: any) => c && String(c).trim().length > 0).length;
          
          // 跳过空行或只有 1-2 个值的行
          if (nonEmptyCount < 2) continue;
          
          const rowStr = row.join(' ').toLowerCase();
          
          // 统计匹配到的关键词数量
          const matchCount = headerKeywords.filter(k => rowStr.includes(k)).length;
          
          // 如果匹配到 2 个以上关键词，认为是表头
          if (matchCount >= 2) {
            headerRowIndex = i;
            headers = row.map((h: any) => String(h || '').trim());
            console.log('找到表头在第', i, '行，匹配', matchCount, '个关键词，表头:', headers);
            foundHeader = true;
            break;
          }
          
          // 如果没有找到典型表头，选择非空单元格最多的行
          if (!foundHeader && (i === 0 || nonEmptyCount > headers.length)) {
            headerRowIndex = i;
            headers = row.map((h: any) => String(h || '').trim());
          }
        }

        if (!foundHeader && rawData.length > 0 && headers.length > 0) {
          console.log('使用非空单元格最多的行作为表头 (行', headerRowIndex + '):', headers);
        }

        // 字段映射 - 扩展关键词匹配
        const findIndex = (candidates: string[]) => {
          for (let i = 0; i < headers.length; i++) {
            const header = (headers[i] || '').toLowerCase();
            // 精确匹配或包含匹配
            if (candidates.some(c => header === c || header.includes(c))) {
              return i;
            }
          }
          return -1;
        };

        const fieldIndex = {
          // SKU 编码：匹配包含"编码"、"sku"、"code"、"货号"等的列
          skuCode: findIndex(['sku 编码', '商品编码', '产品编码', '货品编码', '货号', '款号', '编码', 'sku', 'code', '商品 id', 'spu']),
          // SKU 名称：匹配包含"名称"、"品名"、"name"等的列
          skuName: findIndex(['sku 名称', '商品名称', '产品名称', '货品名称', '品名', '名称', 'name', '商品']),
          // 数量：匹配包含"数量"、"qty"、"quantity"等的列
          skuQuantity: findIndex(['数量', '件数', 'qty', 'quantity', 'num', '发货数', '出库数']),
          // 规格：匹配包含"规格"、"型号"、"size"等的列
          skuSpecification: findIndex(['规格', '型号', 'size', 'spec', '单位']),
          // 外部编码：匹配包含"单号"、"订单号"等的列
          externalCode: findIndex(['单号', '订单号', '外部编号', '外部编码', '单据号', '出库单号']),
          // 门店：匹配包含"门店"、"店铺"、"仓库"等的列
          storeName: findIndex(['门店', '店铺', '仓库', '超市', '库房', '店仓', 'store', 'warehouse', '品牌']),
          // 收件人：匹配包含"收货人"、"收件人"、"姓名"等的列
          receiverName: findIndex(['收货人', '收件人', '客户', '顾客', '姓名', '联系人']),
          // 电话：匹配包含"电话"、"手机"、"联系方式"等的列
          receiverPhone: findIndex(['电话', '手机', '联系方式', '手机号', 'phone', 'tel', '联系电话']),
          // 地址：匹配包含"地址"、"收货地址"等的列
          receiverAddress: findIndex(['地址', '收货地址', '详细地址', 'address', '配送地址']),
        };

        console.log('字段索引:', fieldIndex);
        console.log('表头映射分析:');
        console.log('  - headers:', headers);
        console.log('  - skuCode index:', fieldIndex.skuCode, '-> header:', headers[fieldIndex.skuCode]);
        console.log('  - skuName index:', fieldIndex.skuName, '-> header:', headers[fieldIndex.skuName]);
        console.log('  - skuQuantity index:', fieldIndex.skuQuantity, '-> header:', headers[fieldIndex.skuQuantity]);

        // 解析数据行
        let rowCount = 0;
        let skipCount = 0;
        for (let i = headerRowIndex + 1; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length === 0) continue;
          
          const rowStr = row.join(' ');
          if (rowStr.includes('合计') || rowStr.includes('总计')) continue;

          const rowValues = {
            skuCodeRaw: row[fieldIndex.skuCode],
            skuNameRaw: row[fieldIndex.skuName],
            quantityRaw: row[fieldIndex.skuQuantity],
            allValues: row.filter((c: any) => c),
          };
          
          const skuCode = row[fieldIndex.skuCode] || '';
          const skuName = row[fieldIndex.skuName] || '';
          
          if (!skuCode && !skuName && !row.some((c: any) => c)) {
            skipCount++;
            continue;
          }

          const shipment = {
            skuCode: String(skuCode || '').trim(),
            skuName: String(skuName || '').trim(),
            skuQuantity: parseInt(String(row[fieldIndex.skuQuantity] || 0).replace(/[^\d]/g, '')) || 0,
            skuSpecification: String(row[fieldIndex.skuSpecification] || '').trim(),
            externalCode: String(row[fieldIndex.externalCode] || '').trim(),
            storeName: String(row[fieldIndex.storeName] || '').trim(),
            receiverName: String(row[fieldIndex.receiverName] || '').trim(),
            receiverPhone: String(row[fieldIndex.receiverPhone] || '').trim(),
            receiverAddress: String(row[fieldIndex.receiverAddress] || '').trim(),
          };

          if (shipment.skuCode || shipment.skuName) {
            shipments.push(shipment);
            rowCount++;
            if (rowCount <= 3) {
              console.log(`第${rowCount}条数据:`, shipment);
            }
          } else {
            console.log('跳过空行:', { index: i, values: rowValues });
            skipCount++;
          }
        }

        console.log('Sheet:', sheetName, '解析出', rowCount, '条数据，跳过', skipCount, '行');
      }
    } else if (fileExt === 'docx') {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      console.log('Word 文本长度:', result.value?.length);
      
      const lines = result.value.split('\n').filter(l => l.trim().length > 0);
      for (const line of lines) {
        if (line.includes('|')) {
          const parts = line.split('|').map(p => p.trim());
          if (parts.length >= 2) {
            shipments.push({
              skuCode: parts[0] || '',
              skuName: parts[1] || '',
              skuQuantity: parseInt(parts[2] || '0') || 0,
            });
          }
        }
      }
    } else if (fileExt === 'pdf') {
      const pdfParseModule = await import('pdf-parse');
      const pdfParse = pdfParseModule.default || pdfParseModule;
      const data = await pdfParse(buffer);
      console.log('PDF 文本长度:', data.text?.length);
      
      const lines = data.text.split('\n').filter(l => l.trim().length > 0);
      for (const line of lines) {
        if (line.includes('|')) {
          const parts = line.split('|').map(p => p.trim());
          if (parts.length >= 2) {
            shipments.push({
              skuCode: parts[0] || '',
              skuName: parts[1] || '',
              skuQuantity: parseInt(parts[2] || '0') || 0,
            });
          }
        }
      }
    } else {
      return NextResponse.json(
        { success: false, error: '不支持的文件格式' },
        { status: 400 }
      );
    }

    console.log('总共解析出', shipments.length, '条数据');

    return NextResponse.json({
      success: true,
      data: {
        fileName,
        fileSize: file.size,
        shipments,
        totalRows: shipments.length,
        validRows: shipments.filter(s => s.skuCode && s.skuName).length,
        env: envCheck,
        debug: {
          sheetCount: fileExt === 'xlsx' ? '查看控制台日志' : 'N/A',
          fileExt,
        }
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '解析失败：' + (error as Error).message,
        env: envCheck,
      },
      { status: 500 }
    );
  }
}

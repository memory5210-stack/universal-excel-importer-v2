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

      // 智能表头检测
      const headerKeywords = [
        'sku', '商品', '产品', '货品', '货物', '单品', '物料', '物品',
        '编码', '货号', '款号', 'code', 'spu', 'id',
        '名称', '品名', 'name', '品牌',
        '数量', '件数', 'qty', 'quantity', 'num',
        '规格', '型号', 'size', 'spec', '单位',
        '门店', '店铺', '仓库', 'store', 'warehouse', '客户',
        '收货', '收件', '联系', '姓名', '手机', '电话', 'phone',
        '地址', 'address', '配送', '送货'
      ];

      let headerRowIndex = 0;
      let headers: string[] = [];
      let foundHeader = false;

      // 第一轮：找前 10 行中包含关键词最多的行
      for (let i = 0; i < Math.min(rawData.length, 10); i++) {
        const row = rawData[i];
        const validCells = row.filter((c: any) => c && String(c).trim().length > 0);
        
        // 跳过只有 1-2 个单元格的行
        if (validCells.length < 2) continue;
        
        const rowText = validCells.join(' ').toLowerCase();
        const matchCount = headerKeywords.filter(k => rowText.includes(k)).length;
        
        console.log(`行${i}: ${validCells.length}个单元格，匹配${matchCount}个关键词`, validCells.slice(0, 10));
        
        // 匹配到 2 个以上关键词，认为是表头
        if (matchCount >= 2) {
          headerRowIndex = i;
          headers = row.map((h: any) => (h ? String(h).trim() : ''));
          console.log('✓ 找到表头在第', i, '行，匹配', matchCount, '个关键词');
          foundHeader = true;
          
          // 如果匹配到 5 个以上，直接确认
          if (matchCount >= 5) break;
        }
      }

      // 第二轮：如果没找到，使用非空单元格最多的前 3 行
      if (!foundHeader && rawData.length > 0) {
        let maxCells = 0;
        for (let i = 0; i < Math.min(rawData.length, 5); i++) {
          const row = rawData[i];
          const validCells = row.filter((c: any) => c && String(c).trim()).length;
          if (validCells > maxCells) {
            maxCells = validCells;
            headerRowIndex = i;
            headers = row.map((h: any) => (h ? String(h).trim() : ''));
          }
        }
        console.log('使用非空单元格最多的行作为表头（行', headerRowIndex, '）:', headers.slice(0, 10));
      }

        // 字段映射 - 超宽泛关键词匹配
        const findIndex = (candidates: string[]) => {
          for (let i = 0; i < headers.length; i++) {
            const header = (headers[i] || '').toLowerCase();
            // 精确匹配或包含匹配
            if (candidates.some(c => header === c || header.includes(c))) {
              return i;
            }
          }
          // 第二轮：模糊匹配（去除空格、特殊字符后匹配）
          const cleanHeader = header.replace(/[\s_-]/g, '');
          for (let i = 0; i < headers.length; i++) {
            const header = (headers[i] || '').toLowerCase();
            const clean = header.replace(/[\s_-]/g, '');
            if (candidates.some(c => c.replace(/[\s_-]/g, '') === clean || clean.includes(c.replace(/[\s_-]/g, '')))) {
              return i;
            }
          }
          return -1;
        };

        const fieldIndex = {
          // SKU 编码：超宽泛匹配
          skuCode: findIndex([
            'sku 编码', '商品编码', '产品编码', '货品编码', '货物编码',
            '货号', '款号', '编码', 'sku', 'code', '商品 id', 'spu',
            '单品编码', '物料编码', '物品编号', 'goods code', 'item code',
            '产品号', '商品号', '货品号'
          ]),
          // SKU 名称：超宽泛匹配
          skuName: findIndex([
            'sku 名称', '商品名称', '产品名称', '货品名称', '货物名称',
            '品名', '名称', 'name', '商品', '产品', '货品', '物品',
            '单品名称', '物料名称', '品名规格', '商品品名', 'goods name', 'item name',
            '品牌名称', '品牌'
          ]),
          // 数量：超宽泛匹配
          skuQuantity: findIndex([
            '数量', '件数', 'qty', 'quantity', 'num', '发货数', '出库数',
            '发货数量', '出库数量', '订货数量', '订单数量', '销售数量',
            '总数量', '总数', '单品数量', '商品数量', '应发数量', '实发数量',
            '发货件数', '出库件数', '订货件数', '数量 (件)', 'unit', '数量 1'
          ]),
          // 规格：超宽泛匹配
          skuSpecification: findIndex([
            '规格', '型号', 'size', 'spec', '单位', '规格型号',
            '商品规格', '产品型号', '单品规格', '规格 ( unit)', '包装规格',
            '等级', '颜色', '尺码'
          ]),
          // 外部编码：超宽泛匹配
          externalCode: findIndex([
            '单号', '订单号', '外部编号', '外部编码', '单据号', '出库单号',
            '发货单号', '订单编号', '客户单号', '销售单号', '调拨单号',
            '配送单号', '运单号', '订单 id', '单号 1'
          ]),
          // 门店：超宽泛匹配
          storeName: findIndex([
            '门店', '店铺', '仓库', '超市', '库房', '店仓', 'store', 'warehouse',
            '收货门店', '发货门店', '门店名称', '店铺名称', '仓库名称',
            '客户名称', '客户', '订货客户', '销售客户', '档口', '前置仓',
            '渠道', '区域', '城市', '公司', '收货方', '买方'
          ]),
          // 收件人：超宽泛匹配
          receiverName: findIndex([
            '收货人', '收件人', '客户', '顾客', '姓名', '联系人',
            '收货联系人', '收件联系人', '客户姓名', '收货方', '买方姓名',
            '收货人姓名', '收件人姓名', '客户名称'
          ]),
          // 电话：超宽泛匹配
          receiverPhone: findIndex([
            '电话', '手机', '联系方式', '手机号', 'phone', 'tel', '联系电话',
            '收货电话', '收件电话', '客户电话', '手机号码', '电话号码',
            '收货人电话', '收件人电话', '联系人电话', '手机 1', '联系方式 1',
            '收货人手机', '收件人手机'
          ]),
          // 地址：超宽泛匹配
          receiverAddress: findIndex([
            '地址', '收货地址', '详细地址', 'address', '配送地址',
            '收货人地址', '收件人地址', '客户地址', '收货详细地址',
            '送货地址', '配送详细地址', '收货地点', '收货信息'
          ]),
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

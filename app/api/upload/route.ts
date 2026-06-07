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
        console.log('前 3 行数据:', rawData.slice(0, 3));

        if (rawData.length === 0) continue;

        // 查找表头行
        let headerRowIndex = 0;
        let headers: string[] = [];

        for (let i = 0; i < Math.min(rawData.length, 15); i++) {
          const row = rawData[i];
          const rowStr = row.join(' ').toLowerCase();
          
          if (rowStr.includes('sku') || rowStr.includes('编码') || rowStr.includes('名称') || 
              rowStr.includes('数量') || rowStr.includes('单品') || rowStr.includes('货品')) {
            headerRowIndex = i;
            headers = row.map((h: any) => String(h || '').trim());
            console.log('找到表头在第', i, '行，表头:', headers);
            break;
          }
        }

        if (headers.length === 0 && rawData.length > 0) {
          headers = rawData[0].map((h: any) => String(h || '').trim());
          console.log('使用第一行作为表头:', headers);
        }

        // 字段映射
        const findIndex = (candidates: string[]) => {
          for (let i = 0; i < headers.length; i++) {
            const header = headers[i]?.toLowerCase() || '';
            if (candidates.some(c => header.includes(c))) return i;
          }
          return -1;
        };

        const fieldIndex = {
          skuCode: findIndex(['编码', 'sku']),
          skuName: findIndex(['名称', '品名']),
          skuQuantity: findIndex(['数量', '件数']),
          skuSpecification: findIndex(['规格', '型号']),
          externalCode: findIndex(['单号', '编码']),
          storeName: findIndex(['门店', '店铺', '仓库', '超市']),
          receiverName: findIndex(['收货人', '收件人']),
          receiverPhone: findIndex(['电话', '手机']),
          receiverAddress: findIndex(['地址']),
        };

        console.log('字段索引:', fieldIndex);

        // 解析数据行
        let rowCount = 0;
        for (let i = headerRowIndex + 1; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length === 0) continue;
          
          const rowStr = row.join(' ');
          if (rowStr.includes('合计') || rowStr.includes('总计')) continue;

          const skuCode = row[fieldIndex.skuCode] || '';
          const skuName = row[fieldIndex.skuName] || '';
          
          if (!skuCode && !skuName && !row.some((c: any) => c)) continue;

          const shipment: any = {
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
          }
        }

        console.log('Sheet:', sheetName, '解析出', rowCount, '条数据');
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
        debug: {
          sheetCount: fileExt === 'xlsx' ? '查看控制台日志' : 'N/A',
          fileExt,
        }
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

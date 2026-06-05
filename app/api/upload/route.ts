import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import XLSX from 'xlsx';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const ruleId = formData.get('ruleId') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: '未上传文件' },
        { status: 400 }
      );
    }

    // 保存临时文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempPath = join('/tmp', file.name);
    await writeFile(tempPath, buffer);

    // 根据文件类型解析
    let data;
    const fileExt = file.name.split('.').pop()?.toLowerCase();

    if (fileExt === 'xlsx' || fileExt === 'xls') {
      data = await parseExcel(buffer);
    } else if (fileExt === 'docx') {
      data = await parseWord(buffer);
    } else if (fileExt === 'pdf') {
      data = await parsePDF(buffer);
    } else {
      return NextResponse.json(
        { success: false, error: '不支持的文件格式' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        fileName: file.name,
        fileSize: file.size,
        parsedData: data,
        totalRows: data.length
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

async function parseExcel(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  // TODO: 应用解析规则进行数据映射和清洗
  return rawData
    .filter((row: any[]) => row.length > 0)
    .map((row: any[], index: number) => ({
      row: index,
      data: row
    }));
}

async function parseWord(buffer: Buffer) {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value;
  
  // TODO: 使用 AI 解析 Word 文本结构
  return [{
    row: 0,
    data: [text]
  }];
}

async function parsePDF(buffer: Buffer) {
  const data = await pdfParse(buffer);
  const text = data.text;
  
  // TODO: 使用 AI 解析 PDF 结构
  return [{
    row: 0,
    data: [text]
  }];
}

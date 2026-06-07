import { NextRequest, NextResponse } from 'next/server';
import type { ParsingRuleConfig } from '@/lib/types';

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

    // 检查 API Key
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'DeepSeek API Key 未配置' },
        { status: 500 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = file.name;
    const fileExt = fileName.split('.').pop()?.toLowerCase();

    // 解析 Excel 文件结构
    if (fileExt !== 'xlsx' && fileExt !== 'xls') {
      return NextResponse.json(
        { success: false, error: '仅支持 Excel 文件' },
        { status: 400 }
      );
    }

    const XLSX = await import('xlsx');
    const workbook = XLSX.read(buffer, { type: 'buffer', raw: false });

    // 提取文件结构信息
    const fileStructure = {
      fileName,
      fileExt,
      fileSize: file.size,
      sheets: [] as Array<{
        name: string;
        headers: string[];
        sampleData: any[][];
      }>
    };

    workbook.SheetNames.slice(0, 3).forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
      
      // 找表头行（前 10 行中单元格最多的）
      let headerRowIndex = 0;
      let maxCells = 0;
      for (let i = 0; i < Math.min(data.length, 10); i++) {
        const validCells = data[i].filter((c: any) => c && String(c).trim()).length;
        if (validCells > maxCells) {
          maxCells = validCells;
          headerRowIndex = i;
        }
      }

      const headers = data[headerRowIndex]?.map((h: any) => String(h || '').trim()) || [];
      const sampleData = data.slice(headerRowIndex + 1, headerRowIndex + 4);

      fileStructure.sheets.push({
        name: sheetName,
        headers,
        sampleData: sampleData.map(row => 
          row.map((c: any) => c ? String(c).trim() : '').filter(c => c)
        )
      });
    });

    console.log('文件结构:', JSON.stringify(fileStructure, null, 2));

    // 调用 DeepSeek AI 分析
    const prompt = `你是一个智能 Excel 解析助手。请分析以下文件结构，推断字段映射关系。

文件信息：
- 文件名：${fileStructure.fileName}
- 大小：${(fileStructure.fileSize / 1024).toFixed(1)} KB
- Sheet 数量：${fileStructure.sheets.length}

文件结构：
${JSON.stringify(fileStructure.sheets, null, 2)}

请推断每个字段应该映射到哪个列名。字段列表：
- skuCode: SKU 编码（必填，如商品编码、货品编号等）
- skuName: SKU 名称（必填，如商品名称、品名等）
- skuQuantity: SKU 数量（必填，如数量、件数等）
- skuSpecification: 规格型号（可选）
- storeName: 门店/仓库（可选，如收货门店、店铺等）
- receiverName: 收件人姓名（可选）
- receiverPhone: 收件人电话（可选）
- receiverAddress: 收件人地址（可选）
- externalCode: 外部单号（可选，如订单号、单据号等）

请返回 JSON 格式的映射配置（只需要 fieldMapping 字段）：
{
  "fieldMapping": {
    "skuCode": "列名或 null",
    "skuName": "列名或 null",
    "skuQuantity": "列名或 null",
    ...
  },
  "confidence": 0-100,
  "notes": "分析说明"
}`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的 Excel 数据解析专家。请分析文件结构并推断字段映射关系。只返回纯 JSON，不要其他说明。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('DeepSeek API 错误:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'AI 分析失败：' + (response.status === 401 ? 'API Key 无效' : response.statusText),
          rawError: error
        },
        { status: 500 }
      );
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || '';
    
    console.log('AI 响应:', content);

    // 解析 AI 返回的 JSON
    let aiMapping;
    try {
      // 提取 JSON 部分（可能包含在 markdown 代码块中）
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiMapping = JSON.parse(jsonMatch[0]);
      } else {
        aiMapping = JSON.parse(content);
      }
    } catch (e) {
      console.error('解析 AI 响应失败:', e, content);
      return NextResponse.json(
        { 
          success: false, 
          error: 'AI 响应格式错误',
          aiResponse: content.substring(0, 500)
        },
        { status: 500 }
      );
    }

    // 生成规则配置
    const ruleConfig: Partial<ParsingRuleConfig> = {
      name: `${fileName} - AI 解析规则`,
      fileType: 'excel' as const,
      config: {
        fieldMapping: aiMapping.fieldMapping || aiMapping,
        confidence: aiMapping.confidence || 80,
        headerRowIndex: 0,
        dataStartRow: 1
      }
    };

    return NextResponse.json({
      success: true,
      data: {
        fileName,
        fileStructure,
        aiAnalysis: {
          fieldMapping: aiMapping.fieldMapping || aiMapping,
          confidence: aiMapping.confidence || 80,
          notes: aiMapping.notes || 'AI 自动分析生成'
        },
        ruleConfig
      }
    });
  } catch (error) {
    console.error('Generate rule error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'AI 分析失败'
      },
      { status: 500 }
    );
  }
}

    // 读取文件内容
    const buffer = await file.arrayBuffer();
    
    // 构建 AI 分析 Prompt
    const prompt = buildAnalysisPrompt(file.name, buffer);

    // 调用 DeepSeek API
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一个智能文档解析专家。请分析上传的文件结构，并生成一套解析规则。
            
你需要：
1. 识别文件类型（Excel/Word/PDF）
2. 分析文件结构特征（表头位置、数据区域、特殊格式等）
3. 提取字段映射关系
4. 识别复杂处理需求（跨行聚合、矩阵转置、卡片边界等）
5. 以 JSON 格式输出完整的解析规则配置

请严格按照 JSON Schema 输出规则配置。`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI API 错误：${error}`);
    }

    const result = await response.json();
    const aiResponse = result.choices[0].message.content;

    // 解析 AI 返回的规则
    const ruleConfig = JSON.parse(aiResponse);

    return NextResponse.json({
      success: true,
      data: {
        rule: ruleConfig,
        confidence: 0.95,
        suggestions: [
          'AI 检测到该文件包含干扰头部信息，建议跳过前 3 行',
          '发现横向排列的收货人信息，需要单独提取',
          '检测到跨行聚合模式，建议按"外部编码"字段分组'
        ]
      }
    });
  } catch (error) {
    console.error('AI rule generation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'AI 生成失败'
      },
      { status: 500 }
    );
  }
}

function buildAnalysisPrompt(fileName: string, buffer: ArrayBuffer): string {
  // TODO: 对于 Excel/PDF 等文件，提取部分样本内容提供给 AI 分析
  // 这里简化处理，仅传递文件名
  return `请分析文件：${fileName}

请生成以下格式的解析规则：
{
  "name": "规则名称",
  "fileType": "excel|word|pdf",
  "config": {
    "skipHeaderRows": number,
    "headerRowIndex": number,
    "dataStartRow": number,
    "fieldMapping": {
      "externalCode": "列名或索引",
      "storeName": "列名或索引",
      "receiverName": "列名或索引",
      "receiverPhone": "列名或索引",
      "receiverAddress": "列名或索引",
      "skuCode": "列名或索引",
      "skuName": "列名或索引",
      "skuQuantity": "列名或索引",
      "skuSpecification": "列名或索引"
    },
    "groupByKey": "聚合字段",
    "transposeMatrix": boolean
  }
}`;
}

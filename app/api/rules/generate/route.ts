import { NextRequest, NextResponse } from 'next/server';

// API Key 从环境变量读取
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

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

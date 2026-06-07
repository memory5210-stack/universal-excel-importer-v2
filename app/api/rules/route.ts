import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/client';

// 获取所有规则
export async function GET() {
  try {
    const rules = await getPrisma().parsingRule.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { shipments: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: rules.map(rule => ({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        fileType: rule.fileType,
        createdAt: rule.createdAt.toISOString(),
        usageCount: rule._count.shipments
      }))
    });
  } catch (error) {
    console.error('Get rules error:', error);
    return NextResponse.json(
      { success: false, error: '查询规则失败' },
      { status: 500 }
    );
  }
}

// 创建新规则
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, fileType, config } = body;

    if (!name || !fileType) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段' },
        { status: 400 }
      );
    }

    const rule = await getPrisma().parsingRule.create({
      data: {
        name,
        description: description || null,
        fileType,
        config: config || {}
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: rule.id,
        name: rule.name,
        description: rule.description,
        fileType: rule.fileType,
        config: rule.config,
        createdAt: rule.createdAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Create rule error:', error);
    return NextResponse.json(
      { success: false, error: '创建规则失败' },
      { status: 500 }
    );
  }
}

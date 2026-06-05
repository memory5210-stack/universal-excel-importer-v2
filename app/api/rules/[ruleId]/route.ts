import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  try {
    const { ruleId } = await params;
    
    const rule = await prisma.parsingRule.findUnique({
      where: { id: ruleId },
      include: {
        _count: {
          select: { shipments: true }
        }
      }
    });

    if (!rule) {
      return NextResponse.json(
        { success: false, error: '规则不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: rule.id,
        name: rule.name,
        description: rule.description,
        fileType: rule.fileType,
        config: rule.config,
        createdAt: rule.createdAt.toISOString(),
        updatedAt: rule.updatedAt.toISOString(),
        usageCount: rule._count.shipments
      }
    });
  } catch (error) {
    console.error('Get rule error:', error);
    return NextResponse.json(
      { success: false, error: '查询规则失败' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  try {
    const { ruleId } = await params;
    const body = await request.json();
    const { name, description, fileType, config } = body;

    const rule = await prisma.parsingRule.update({
      where: { id: ruleId },
      data: {
        name: name || undefined,
        description: description ?? undefined,
        fileType: fileType as any || undefined,
        config: config || undefined
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
        updatedAt: rule.updatedAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Update rule error:', error);
    return NextResponse.json(
      { success: false, error: '更新规则失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  try {
    const { ruleId } = await params;
    
    await prisma.parsingRule.delete({
      where: { id: ruleId }
    });

    return NextResponse.json({
      success: true,
      message: '规则已删除'
    });
  } catch (error) {
    console.error('Delete rule error:', error);
    return NextResponse.json(
      { success: false, error: '删除规则失败' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/client';
import type { ShipmentData } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shipments, ruleId } = body as { 
      shipments: ShipmentData[];
      ruleId?: string 
    };

    if (!shipments || !Array.isArray(shipments)) {
      return NextResponse.json(
        { success: false, error: '无效的运单数据' },
        { status: 400 }
      );
    }

    // 批量插入数据库
    const created = await getPrisma().shipment.createMany({
      data: shipments.map(shipment => ({
        externalCode: shipment.externalCode || null,
        storeName: shipment.storeName || null,
        receiverName: shipment.receiverName || null,
        receiverPhone: shipment.receiverPhone || null,
        receiverAddress: shipment.receiverAddress || null,
        skuCode: shipment.skuCode,
        skuName: shipment.skuName,
        skuQuantity: shipment.skuQuantity,
        skuSpecification: shipment.skuSpecification || null,
        remarks: shipment.remarks || null,
        parsingRuleId: ruleId || null
      })),
      skipDuplicates: true
    });

    // 获取已创建的运单（排除重复的）
    const createdShipments = await getPrisma().shipment.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 60000) // 最近 1 分钟内创建的
        }
      },
      orderBy: { createdAt: 'desc' },
      take: shipments.length
    });

    return NextResponse.json({
      success: true,
      data: {
        count: createdShipments.length,
        shipments: createdShipments,
        message: `成功提交 ${createdShipments.length} 条运单`
      }
    });
  } catch (error) {
    console.error('Submit shipment error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '提交失败'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search') || '';
    const searchField = searchParams.get('field') || 'all';

    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where = search ? {
      OR: searchField === 'externalCode' ? [{ externalCode: { contains: search } }] :
          searchField === 'receiverName' ? [{ receiverName: { contains: search } }] :
          [
            { externalCode: { contains: search } },
            { receiverName: { contains: search } },
            { storeName: { contains: search } }
          ]
    } : {};

    const [total, shipments] = await Promise.all([
      getPrisma().shipment.count({ where }),
      getPrisma().shipment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        shipments,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('Get shipments error:', error);
    return NextResponse.json(
      { success: false, error: '查询失败' },
      { status: 500 }
    );
  }
}

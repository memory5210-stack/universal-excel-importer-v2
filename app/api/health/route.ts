import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/client';

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL as string;
    
    const prisma = getPrisma();
    
    // 尝试连接数据库
    await prisma.$connect();
    
    // 检查表是否存在
    const tables = await prisma.$queryRawUnsafe<{ tablename: string }[]>(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        tables: tables.map(t => t.tablename),
        tableCount: tables.length,
        hasShipments: tables.some(t => t.tablename === 'shipment'),
        hasParsingRules: tables.some(t => t.tablename === 'parsingrule'),
      },
      env: {
        DATABASE_URL_set: !!dbUrl,
        DATABASE_URL_length: dbUrl?.length || 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      env: {
        DATABASE_URL_set: !!process.env.DATABASE_URL,
        DATABASE_URL_length: process.env.DATABASE_URL?.length || 0,
      },
      database: {
        connected: false,
      },
    }, { status: 500 });
  }
}

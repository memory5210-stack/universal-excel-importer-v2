import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/client';

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL as string;
    console.log('DATABASE_URL exists:', !!dbUrl);
    console.log('DATABASE_URL length:', dbUrl?.length || 0);
    console.log('DATABASE_URL preview:', dbUrl?.substring(0, 30) + '...');
    
    const prisma = getPrisma();
    
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
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      database: {
        connected: false,
      },
    }, { status: 500 });
  }
}

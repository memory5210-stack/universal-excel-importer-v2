import { PrismaClient } from '@prisma/client';

const prismaOptions = {
  datasourceUrl: process.env.DATABASE_URL || ''
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaOptions);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

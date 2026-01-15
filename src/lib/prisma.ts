import { PrismaClient } from '@/app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = global as unknown as {
  prisma_loko: PrismaClient | undefined | null;
};

const createPrismaClient = () => {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
  return new PrismaClient({ adapter });
};

// Singleton pattern for Prisma Client
export const prisma = globalForPrisma.prisma_loko ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma_loko = prisma;

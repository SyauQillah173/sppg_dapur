import { PrismaClient } from '@prisma/client';

export type ExtendedPrismaClient = PrismaClient & {
  mealDistribution: any;
  [key: string]: any;
};

const globalForPrisma = globalThis as unknown as { prisma: ExtendedPrismaClient | undefined };

export const prisma: ExtendedPrismaClient =
  (globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    // Neon: transaksi interaktif default 5 detik sering kehabisan waktu.
    transactionOptions: {
      maxWait: 10_000,
      timeout: 20_000,
    },
  })) as unknown as ExtendedPrismaClient;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
export default prisma;


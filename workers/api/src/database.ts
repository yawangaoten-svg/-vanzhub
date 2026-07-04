import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

export function getPrisma(databaseUrl: string): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
      log: ['error'],
    });
  }
  return prisma;
}

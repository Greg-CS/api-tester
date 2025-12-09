import { PrismaClient } from "../prisma/generated/prisma/client";

let prismaInstance: PrismaClient | null = null;

if (process.env.DATABASE_URL) {
  const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
  };

  if (!globalForPrisma.prisma) {
    // Use accelerateUrl for Prisma Accelerate connections
    globalForPrisma.prisma = new PrismaClient({
      accelerateUrl: process.env.DATABASE_URL,
    });
  }

  prismaInstance = globalForPrisma.prisma;
}

export const prisma = prismaInstance;

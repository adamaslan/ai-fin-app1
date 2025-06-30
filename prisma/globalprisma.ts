// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// Extend global object with proper typing
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create singleton instance with proper error handling and logging
const createPrismaClient = () =>
  new PrismaClient({
    log: process.env.NODE_ENV === "development" 
      ? ["query", "error", "warn"] 
      : ["error"],
    errorFormat: "minimal",
  });

// Use global instance in development to prevent connection exhaustion
// Create new instance in production for better performance
export const prisma = globalThis.__prisma ?? createPrismaClient();

// Only attach to global in development
if (process.env.NODE_ENV === "development") {
  globalThis.__prisma = prisma;
}

// Graceful shutdown handler
export const disconnectPrisma = async () => {
  await prisma.$disconnect();
};
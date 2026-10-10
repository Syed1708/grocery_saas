
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Connects directly to MySQL in Laragon
const adapter = new PrismaMariaDb({
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "",
  database: "grocery_pos_saas",
  connectionLimit: 10,
});

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
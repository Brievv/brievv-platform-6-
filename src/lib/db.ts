import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton. Next.js hot-reloads server modules in dev,
 * which would otherwise exhaust the DB connection pool by creating a
 * new PrismaClient on every reload — so we cache it on `globalThis`.
 */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const db =
  global.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = db;
}

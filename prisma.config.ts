import dotenv from "dotenv";
// Load both .env.local (Next.js) and .env (Prisma)
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
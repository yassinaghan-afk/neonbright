import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Never hardcode credentials — injected at runtime (EasyPanel / CI / local .env).
    url: env("DATABASE_URL"),
  },
});

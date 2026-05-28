import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./backend/src/schema.ts",
  out: "./migrations",
  dialect: "sqlite"
});

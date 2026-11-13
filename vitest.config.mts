import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      // `server-only` di-alias oleh Next saat build; sediakan stub untuk Vitest.
      "server-only": path.resolve(import.meta.dirname, "./tests/stubs/empty.ts"),
    },
  },
});

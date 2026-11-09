import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // `server-only` di-alias oleh Next saat build; sediakan stub untuk Vitest.
      "server-only": path.resolve(__dirname, "./tests/stubs/empty.ts"),
    },
  },
});

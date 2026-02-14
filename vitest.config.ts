import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "node",
    include: ["__tests__/**/*.test.ts", "__tests__/**/*.test.tsx"],
    environmentMatchGlobs: [
      ["**/*.test.tsx", "jsdom"],
    ],
    setupFiles: ["__tests__/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["lib/game/**/*.ts", "app/components/ui/**/*.tsx"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});

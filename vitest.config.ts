import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "node",
    environmentMatchGlobs: [
      ["src/__tests__/word-breakdown.test.tsx", "jsdom"],
      ["src/__tests__/text-input.test.tsx", "jsdom"],
      ["src/__tests__/image-upload.test.tsx", "jsdom"],
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

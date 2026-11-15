/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative asset paths so the static build works from any host path (research R9).
  base: "./",
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});

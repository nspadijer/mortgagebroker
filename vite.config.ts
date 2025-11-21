import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => {
  const isBuild = command === "build";
  return {
    plugins: [react()],
    build: isBuild
      ? {
          outDir: "dist/widget",
          emptyOutDir: true,
          cssCodeSplit: false,
          sourcemap: false,
          rollupOptions: {
            input: resolve(rootDir, "src/widget.tsx"),
            output: {
              entryFileNames: "mortgagebroker-widget.js",
              assetFileNames: "mortgagebroker-widget.[ext]",
              format: "iife"
            }
          }
        }
      : undefined,
    server: {
      host: "localhost",
      port: 5173
    }
  };
});

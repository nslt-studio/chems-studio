import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/main.js"),
      name: "ChemsStudio",
      fileName: "main",
      formats: ["iife"],
    },
    outDir: "dist",
    rollupOptions: {
      output: {
        // Tout dans un seul fichier
        inlineDynamicImports: true,
      },
    },
  },
  server: {
    cors: true,
    host: true,
    allowedHosts: true,
  },
});

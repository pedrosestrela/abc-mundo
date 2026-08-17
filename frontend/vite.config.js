import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8099",
        changeOrigin: true,
      },
    },
  },
  // `vite preview` (used for local QA and verify-all.mjs) does not inherit
  // `server.proxy` -- without this, any /api/* fetch (e.g. Backup &
  // Sincronizar) silently 404s against the preview server instead of
  // reaching the backend.
  preview: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8099",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (/[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return "vendor-react";
            if (id.includes("react-router")) return "vendor-router";
            if (id.includes("i18next")) return "vendor-i18n";
            if (id.includes("chess.js")) return "vendor-chess";
            if (id.includes("three") || id.includes("globe.gl")) return "vendor-three";
            if (id.includes("topojson") || id.includes("world-atlas")) return "vendor-geo";
            return "vendor";
          }
          if (id.includes("/src/i18n/")) return "i18n-resources";
        },
      },
    },
  },
});

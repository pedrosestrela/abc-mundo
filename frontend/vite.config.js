import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves this as a project site (https://<user>.github.io/abc-mundo/),
// so every asset URL needs the "/abc-mundo/" prefix -- set via GH_PAGES=true in
// the Pages deploy workflow. The Fly.io build (still the default) keeps base "/"
// since that container serves the app at its own domain root.
const base = process.env.GH_PAGES === "true" ? "/abc-mundo/" : "/";

export default defineConfig({
  base,
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

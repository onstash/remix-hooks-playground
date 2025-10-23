import { defineConfig } from "vite";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "@remix-run/dom",
  },
  server: {
    port: 44100,
  },
});

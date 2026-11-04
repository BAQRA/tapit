import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const projectRoot = import.meta.dirname;
const webRoot = resolve(projectRoot, "web");

/**
 * One dev server for everything: Vite serves the React dashboards (web/) with hot
 * reload, and the Cloudflare plugin runs the Worker (src/) in the real Workers
 * runtime with the bindings from wrangler.jsonc.
 */
export default defineConfig({
  root: webRoot,
  plugins: [
    react(),
    cloudflare({
      // Both paths are relative to `root` (web/).
      configPath: "../wrangler.jsonc",
      // Keep using the project's existing local database in .wrangler/.
      persistState: { path: "../.wrangler/state" },
    }),
  ],
  // Same port as `wrangler dev`, so test cards written with :8787 keep working.
  // host: true makes it reachable from phones on the same Wi-Fi.
  server: { host: true, port: 8787, strictPort: true },
  preview: { host: true, port: 8787, strictPort: true },
  build: {
    outDir: resolve(projectRoot, "dist"),
    emptyOutDir: true,
  },
  environments: {
    // The browser build: one HTML page per dashboard (the Worker build is configured by the plugin).
    client: {
      build: {
        rolldownOptions: {
          input: {
            index: resolve(webRoot, "index.html"),
            admin: resolve(webRoot, "admin/index.html"),
            owner: resolve(webRoot, "owner/index.html"),
          },
          output: {
            // Readable names for the code both dashboards share (cached across pages).
            codeSplitting: {
              groups: [
                { name: "vendor", test: /node_modules/ },
                { name: "shared", test: /web\/src\/(components|lib|styles)\// },
              ],
            },
          },
        },
      },
    },
  },
});

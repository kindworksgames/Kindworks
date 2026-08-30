import { defineConfig } from "vite";
import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";

function phase8bCandidateServer() {
  return {
    name: "kindworks-phase8b-candidate-server",
    apply: "serve",
    configureServer(server) {
      const root = process.cwd();
      const stagingRoot = resolve(root, "artwork/staging") + sep;
      let packagePromise;
      const loadPackage = () => packagePromise ||= readFile(resolve(root, "artwork/production/phase-8a/vertical-slice-production-package.v1.json"), "utf8").then(JSON.parse);
      server.middlewares.use("/__kindworks-candidate", async (request, response) => {
        try {
          const semanticId = decodeURIComponent(String(request.url || "").replace(/^\//, "").split("?")[0]);
          const definition = (await loadPackage()).assets.find((asset) => asset.semanticId === semanticId);
          if (!definition) { response.statusCode = 404; response.end("Unknown candidate asset ID."); return; }
          const file = resolve(root, definition.expectedFilenames.staging);
          if (!file.startsWith(stagingRoot)) { response.statusCode = 403; response.end("Candidate path is outside staging."); return; }
          const bytes = await readFile(file);
          response.setHeader("Content-Type", "image/png");
          response.setHeader("Cache-Control", "no-store, max-age=0");
          response.end(bytes);
        } catch (error) {
          response.statusCode = error?.code === "ENOENT" ? 404 : 500;
          response.end(error?.code === "ENOENT" ? "Candidate file is not staged." : "Candidate preview failed.");
        }
      });
      server.middlewares.use("/__kindworks-candidate-reference", async (request, response) => {
        try {
          const semanticId = decodeURIComponent(String(request.url || "").replace(/^\//, "").split("?")[0]);
          const associations = JSON.parse(await readFile(resolve(root, "artwork/candidates/reference-associations.v1.json"), "utf8"));
          const relativeFile = associations.references?.[semanticId]?.file;
          const referenceRoot = resolve(root, "artwork/references") + sep;
          const file = relativeFile ? resolve(root, relativeFile) : "";
          if (!file || !file.startsWith(referenceRoot)) { response.statusCode = 404; response.end("No approved reference association."); return; }
          const bytes = await readFile(file);
          response.setHeader("Content-Type", "image/png"); response.setHeader("Cache-Control", "no-store, max-age=0"); response.end(bytes);
        } catch (error) { response.statusCode = error?.code === "ENOENT" ? 404 : 500; response.end("Reference preview failed."); }
      });
    },
  };
}

export default defineConfig({
  plugins: [phase8bCandidateServer()],
  build: {
    target: "es2022",
    sourcemap: false,
    chunkSizeWarningLimit: 4600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/phaser/")) return "phaser-engine";
          if (id.includes("/src/visual/generated/") || id.includes("/src/visual/prefabs/")) return "visual-definitions";
          if (id.endsWith("/src/visual/layouts/sceneLayoutContracts.js")) return "scene-layout-contracts";
          if (id.endsWith("/src/visual/layouts/SceneLayoutRuntime.js")) return "scene-layout-runtime";
          if (id.includes("/src/visual/layouts/")) return "scene-layouts";
          if (id.includes("/src/visual/")) return "visual-pipeline";
          return undefined;
        },
      },
    },
  },
});

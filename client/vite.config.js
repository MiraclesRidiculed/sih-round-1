import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const fieldSurveyServiceWorker = () => ({
  name: "field-survey-service-worker",
  apply: "build",
  generateBundle(_options, bundle) {
    const chunks = Object.values(bundle).filter((output) => output.type === "chunk");
    const entry = chunks.find((chunk) => chunk.isEntry);
    const fieldSurvey = chunks.find((chunk) =>
      chunk.moduleIds.some((moduleId) => moduleId.replace(/\\/g, "/").endsWith("/pages/FieldSurveyPage.jsx"))
    );
    if (!entry || !fieldSurvey) {
      this.error("Unable to locate application entry and field-survey route chunks for offline caching.");
    }

    const requiredFiles = new Set();
    const visitChunk = (chunk) => {
      if (requiredFiles.has(chunk.fileName)) return;
      requiredFiles.add(chunk.fileName);
      for (const dependency of chunk.imports) {
        const importedChunk = bundle[dependency];
        if (importedChunk?.type === "chunk") visitChunk(importedChunk);
      }
      for (const stylesheet of chunk.viteMetadata?.importedCss || []) requiredFiles.add(stylesheet);
    };
    visitChunk(entry);
    visitChunk(fieldSurvey);
    const staticAssets = [...requiredFiles].map((fileName) => `/${fileName}`);
    const precacheUrls = ["/", "/manifest.webmanifest", "/icons/field-survey.svg", ...staticAssets];
    this.emitFile({
      type: "asset",
      fileName: "sw.js",
      source: `const CACHE_NAME = "landstack-field-shell-v1";
const PRECACHE_URLS = ${JSON.stringify(precacheUrls)};
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("landstack-field-shell-") && key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () => (await caches.match("/")) || Response.error()));
    return;
  }
  if (PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
  }
});`
    });
  }
});

export default defineConfig({
  plugins: [react(), fieldSurveyServiceWorker()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true
      }
    }
  }
});

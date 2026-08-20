// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://example.com', // ⚠️ Replace with your production URL when deploying
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
  },
  server: {
    // Allow the sandboxed live-preview host (and any local network host).
    allowedHosts: true,
  },
  vite: {
    build: {
      target: 'es2020',
    },
  },
});

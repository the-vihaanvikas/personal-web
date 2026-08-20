// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages serves this project at https://the-vihaanvikas.github.io/personal-web/,
// so all URLs need the `/personal-web` base path. Override for local dev / other hosts:
//   ASTRO_BASE='' npm run dev        (serve at the root, e.g. for a sandbox preview)
//   ASTRO_BASE='/blog' npm run build (custom subpath)
const base = process.env.ASTRO_BASE ?? '/personal-web';

// https://astro.build/config
export default defineConfig({
  site: 'https://the-vihaanvikas.github.io/personal-web/',
  base,
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

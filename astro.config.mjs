import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { fileURLToPath } from 'node:url';

const SITE = process.env.PUBLIC_SITE_URL ?? 'https://vpscomparehub.com';

export default defineConfig({
  site: SITE,
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
  integrations: [sitemap()],
  vite: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@data': fileURLToPath(new URL('./data', import.meta.url)),
      },
    },
  },
});

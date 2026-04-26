import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const SITE = process.env.PUBLIC_SITE_URL ?? 'https://example.com';

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
        '@': new URL('./src', import.meta.url).pathname,
        '@data': new URL('./data', import.meta.url).pathname,
      },
    },
  },
});

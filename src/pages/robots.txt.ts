import type { APIRoute } from 'astro';
import { loadSite } from '@/lib/data.ts';

export const GET: APIRoute = () => {
  const site = loadSite();
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap-index.xml\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

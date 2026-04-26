import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const ROOT = new URL('../../', import.meta.url).pathname;
export const PROVIDERS_DIR = join(ROOT, 'data', 'providers');

export function readProvider(slug: string): any {
  return JSON.parse(readFileSync(join(PROVIDERS_DIR, `${slug}.json`), 'utf-8'));
}

export function writeProvider(slug: string, data: any): void {
  data.lastUpdated = new Date().toISOString();
  writeFileSync(join(PROVIDERS_DIR, `${slug}.json`), JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`[io] wrote ${slug}.json (${data.plans?.length ?? 0} plans)`);
}

export async function fetchJSON<T = any>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, init);
  if (!r.ok) throw new Error(`fetch ${url} failed: ${r.status} ${r.statusText}`);
  return (await r.json()) as T;
}

export async function fetchText(url: string, init?: RequestInit): Promise<string> {
  const r = await fetch(url, init);
  if (!r.ok) throw new Error(`fetch ${url} failed: ${r.status} ${r.statusText}`);
  return await r.text();
}

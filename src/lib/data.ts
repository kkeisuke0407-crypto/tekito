import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Provider } from './types.ts';

const ROOT = new URL('../../', import.meta.url).pathname;
const DATA_DIR = join(ROOT, 'data');
const PROVIDERS_DIR = join(DATA_DIR, 'providers');

export interface SiteMeta {
  name: string;
  tagline: string;
  description: string;
  url: string;
  language: string;
  locale: string;
  twitter: string;
  defaultOgImage: string;
  googleSiteVerification?: string;
  bingSiteVerification?: string;
  navItems: { label: string; href: string }[];
  footerLinks: { label: string; href: string }[];
}

export interface AffiliateConfig {
  tokens: Record<string, string>;
  envVarMap: Record<string, string>;
}

export function loadSite(): SiteMeta {
  return JSON.parse(readFileSync(join(DATA_DIR, 'site.json'), 'utf-8'));
}

export function loadAffiliate(): AffiliateConfig {
  return JSON.parse(readFileSync(join(DATA_DIR, 'affiliate.json'), 'utf-8'));
}

export function loadProviders(): Provider[] {
  const files = readdirSync(PROVIDERS_DIR).filter((f) => f.endsWith('.json'));
  const providers = files.map((f) => {
    const raw = JSON.parse(readFileSync(join(PROVIDERS_DIR, f), 'utf-8')) as Provider;
    return raw;
  });
  providers.sort((a, b) => a.name.localeCompare(b.name));
  return providers;
}

export function loadProvider(slug: string): Provider | undefined {
  return loadProviders().find((p) => p.slug === slug);
}

export function applyAffiliate(url: string, providerSlug: string): string {
  const aff = loadAffiliate();
  const envName = aff.envVarMap[providerSlug];
  const envValue = envName ? process.env[envName] : undefined;
  if (envValue) {
    return Object.entries(aff.tokens).reduce(
      (acc, [token]) => acc.replace(token, envValue),
      url,
    );
  }
  return Object.entries(aff.tokens).reduce(
    (acc, [token, value]) => (value ? acc.replace(token, value) : acc),
    url,
  );
}

export function cheapestPlan(p: Provider) {
  return p.plans.reduce((min, plan) => (plan.monthlyPrice < min.monthlyPrice ? plan : min), p.plans[0]!);
}

export function pricePerGB(p: Provider) {
  const plan = cheapestPlan(p);
  return plan.monthlyPrice / plan.memoryGB;
}

export function pairs<T>(arr: T[]): [T, T][] {
  const out: [T, T][] = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length; j++) {
      if (i !== j) out.push([arr[i]!, arr[j]!]);
    }
  }
  return out;
}

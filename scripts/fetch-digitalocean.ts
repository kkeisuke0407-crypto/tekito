// DigitalOcean's /v2/sizes endpoint requires an API token. If DO_TOKEN is set
// we refresh the live data; otherwise the seed data is preserved.
import { fetchJSON, readProvider, writeProvider } from './lib/io.ts';

interface DOSize {
  slug: string;
  description: string;
  vcpus: number;
  memory: number; // MB
  disk: number; // GB
  transfer: number; // TB
  price_monthly: number;
  price_hourly: number;
  available: boolean;
  regions: string[];
}

interface DOResp {
  sizes: DOSize[];
}

async function main() {
  const seed = readProvider('digitalocean');
  const token = process.env.DO_TOKEN;
  if (!token) {
    console.log('[digitalocean] DO_TOKEN not set, keeping seed data');
    writeProvider('digitalocean', seed);
    return;
  }
  try {
    const r = await fetchJSON<DOResp>('https://api.digitalocean.com/v2/sizes?per_page=200', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const sizes = r.sizes
      .filter((s) => s.available && s.slug.startsWith('s-'))
      .sort((a, b) => a.price_monthly - b.price_monthly)
      .slice(0, 10);

    seed.plans = sizes.map((s) => ({
      id: s.slug,
      name: s.description || s.slug,
      vcpu: s.vcpus,
      memoryGB: s.memory / 1024,
      storageGB: s.disk,
      storageType: 'SSD' as const,
      bandwidthTB: s.transfer,
      monthlyPrice: s.price_monthly,
      hourlyPrice: s.price_hourly,
      currency: 'USD' as const,
      regions: s.regions.length ? s.regions : ['all'],
      category: 'shared' as const,
    }));
    seed.source = 'api';
    writeProvider('digitalocean', seed);
  } catch (err) {
    console.error('[digitalocean] live fetch failed, keeping seed data:', (err as Error).message);
    writeProvider('digitalocean', seed);
  }
}

main();

// Linode publishes /v4/linode/types without auth. Maps to the same Plan shape.
import { fetchJSON, readProvider, writeProvider } from './lib/io.ts';

interface LinodeType {
  id: string;
  label: string;
  class: string;
  vcpus: number;
  memory: number; // MB
  disk: number; // MB
  transfer: number; // GB
  price: { monthly: number; hourly: number };
  region_prices?: { id: string; monthly: number; hourly: number }[];
}

interface LinodeResp {
  data: LinodeType[];
}

const ALLOWED = new Set(['standard', 'dedicated', 'highmem', 'nanode']);
const MAX_PLANS = 12;

async function main() {
  const seed = readProvider('linode');
  try {
    const r = await fetchJSON<LinodeResp>('https://api.linode.com/v4/linode/types');
    const filtered = r.data
      .filter((t) => ALLOWED.has(t.class) && t.price.monthly > 0)
      .sort((a, b) => a.price.monthly - b.price.monthly)
      .slice(0, MAX_PLANS);

    seed.plans = filtered.map((t) => ({
      id: t.id,
      name: t.label,
      vcpu: t.vcpus,
      memoryGB: Math.round((t.memory / 1024) * 10) / 10,
      storageGB: Math.round(t.disk / 1024),
      storageType: 'SSD' as const,
      bandwidthTB: Math.round((t.transfer / 1000) * 10) / 10,
      monthlyPrice: t.price.monthly,
      hourlyPrice: t.price.hourly,
      currency: 'USD' as const,
      regions: ['all'],
      category:
        t.class === 'dedicated'
          ? ('dedicated' as const)
          : t.class === 'highmem'
            ? ('highmem' as const)
            : ('shared' as const),
    }));
    seed.source = 'api';
    writeProvider('linode', seed);
  } catch (err) {
    console.error('[linode] live fetch failed, keeping seed data:', (err as Error).message);
    writeProvider('linode', seed);
  }
}

main();

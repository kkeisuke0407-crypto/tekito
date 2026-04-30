// Hetzner Cloud server-types listing requires an API token. If HETZNER_TOKEN
// is present we hit the live API; otherwise we just touch the seed file so
// lastUpdated reflects the cron run.
import { fetchJSON, readProvider, writeProvider } from './lib/io.ts';

interface HetznerType {
  id: number;
  name: string;
  cores: number;
  memory: number; // GB
  disk: number; // GB
  cpu_type: string;
  architecture: string;
  prices: { location: string; price_monthly: { gross: string }; included_traffic: number }[];
  deprecated?: boolean;
}

interface HetznerResp {
  server_types: HetznerType[];
}

async function main() {
  const seed = readProvider('hetzner');
  const token = process.env.HETZNER_TOKEN;
  if (!token) {
    console.log('[hetzner] HETZNER_TOKEN not set, keeping seed data');
    writeProvider('hetzner', seed);
    return;
  }
  try {
    const r = await fetchJSON<HetznerResp>('https://api.hetzner.cloud/v1/server_types', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const types = r.server_types.filter((t) => !t.deprecated);
    seed.plans = types.slice(0, 12).map((t) => {
      const cheapest = t.prices.reduce(
        (min, p) =>
          parseFloat(p.price_monthly.gross) < parseFloat(min.price_monthly.gross) ? p : min,
        t.prices[0]!,
      );
      return {
        id: t.name,
        name: `${t.name.toUpperCase()} (${t.cpu_type === 'shared' ? t.architecture : 'dedicated'})`,
        vcpu: t.cores,
        memoryGB: t.memory,
        storageGB: t.disk,
        storageType: 'NVMe' as const,
        bandwidthTB: cheapest.included_traffic / 1024 / 1024 / 1024 / 1024,
        monthlyPrice: parseFloat(cheapest.price_monthly.gross),
        currency: 'USD' as const,
        regions: ['all'],
        category: (t.cpu_type === 'dedicated' ? 'dedicated' : 'shared') as 'dedicated' | 'shared',
      };
    });
    seed.source = 'api';
    writeProvider('hetzner', seed);
  } catch (err) {
    console.error('[hetzner] live fetch failed, keeping seed data:', (err as Error).message);
    writeProvider('hetzner', seed);
  }
}

main();

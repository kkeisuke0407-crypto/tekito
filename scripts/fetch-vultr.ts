// Fetches the Vultr public Plans API (no auth required for the public list)
// and updates data/providers/vultr.json. Falls back to the existing seed file
// if the API is unreachable so daily cron never produces an empty page.
import { fetchJSON, readProvider, writeProvider } from './lib/io.ts';

interface VultrPlan {
  id: string;
  vcpu_count: number;
  ram: number; // MB
  disk: number; // GB
  disk_count: number;
  bandwidth: number; // GB
  monthly_cost: number;
  hourly_cost?: number;
  type: string;
  locations: string[];
}

interface VultrResp {
  plans: VultrPlan[];
  meta: { total: number };
}

const TARGET_TYPES = new Set(['vc2', 'vhf', 'vhp']);
const MAX_PLANS = 10;

async function main() {
  const seed = readProvider('vultr');
  try {
    const r = await fetchJSON<VultrResp>('https://api.vultr.com/v2/plans?per_page=200', {
      headers: { Accept: 'application/json' },
    });
    const filtered = r.plans
      .filter((p) => TARGET_TYPES.has(p.type))
      .sort((a, b) => a.monthly_cost - b.monthly_cost)
      .slice(0, MAX_PLANS);

    seed.plans = filtered.map((p) => ({
      id: p.id,
      name: `${p.type.toUpperCase()} ${p.vcpu_count}C ${p.ram / 1024}GB`,
      vcpu: p.vcpu_count,
      memoryGB: p.ram / 1024,
      storageGB: p.disk * Math.max(1, p.disk_count),
      storageType: 'NVMe' as const,
      bandwidthTB: Math.round((p.bandwidth / 1000) * 10) / 10,
      monthlyPrice: p.monthly_cost,
      hourlyPrice: p.hourly_cost,
      currency: 'USD' as const,
      regions: p.locations.length ? p.locations : ['all'],
      category: p.type === 'vhf' ? 'highcpu' : p.type === 'vhp' ? 'dedicated' : 'shared',
    }));
    seed.source = 'api';
    writeProvider('vultr', seed);
  } catch (err) {
    console.error('[vultr] live fetch failed, keeping seed data:', (err as Error).message);
    writeProvider('vultr', seed);
  }
}

main();

// Runs every fetcher in sequence. Each fetcher is responsible for handling its
// own auth + fallback so partial failures don't break the build.
import { spawnSync } from 'node:child_process';

const FETCHERS = [
  'fetch-vultr.ts',
  'fetch-linode.ts',
  'fetch-hetzner.ts',
  'fetch-digitalocean.ts',
];

let failures = 0;
for (const f of FETCHERS) {
  console.log(`\n=== ${f} ===`);
  const r = spawnSync('npx', ['tsx', `scripts/${f}`], { stdio: 'inherit' });
  if (r.status !== 0) failures++;
}

console.log(`\n[fetch-all] done, ${failures} fetcher(s) returned non-zero (seed data preserved).`);
process.exit(0);

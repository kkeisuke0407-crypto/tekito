// Weekly: pick a still-uncovered topic and ask Claude to draft a markdown
// article. Skips silently if ANTHROPIC_API_KEY is missing so the cron stays
// green even before the user provisions a key.
import Anthropic from '@anthropic-ai/sdk';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './lib/io.ts';

const BLOG_DIR = join(ROOT, 'data', 'blog');
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';

const TOPICS = [
  { slug: 'best-vps-under-5-usd', title: 'Best VPS Under $5/month in 2026' },
  { slug: 'vultr-vs-digitalocean', title: 'Vultr vs DigitalOcean: Which Is Better in 2026?' },
  { slug: 'hetzner-vs-vultr', title: 'Hetzner Cloud vs Vultr: Bandwidth and Price Showdown' },
  { slug: 'cheapest-tokyo-vps', title: 'Cheapest VPS With a Tokyo Data Center' },
  { slug: 'arm-vps-providers', title: 'Which Cloud Providers Offer ARM VPS Plans in 2026?' },
  { slug: 'vps-for-wordpress', title: 'Best VPS for Self-Hosted WordPress in 2026' },
  { slug: 'vps-for-discord-bot', title: 'Cheapest VPS for Running a Discord Bot 24/7' },
  { slug: 'vps-with-ddos-protection', title: 'VPS Providers With Free Anti-DDoS in 2026' },
  { slug: 'eu-vps-gdpr', title: 'GDPR-Compliant EU VPS Hosting Options' },
  { slug: 'vps-vs-shared-hosting', title: 'VPS vs Shared Hosting: When to Switch' },
  { slug: 'cheapest-vps-2gb-ram', title: 'Cheapest VPS With 2GB RAM in 2026' },
  { slug: 'managed-vs-unmanaged-vps', title: 'Managed vs Unmanaged VPS: Which Should You Choose?' },
  { slug: 'cloudways-vs-digitalocean', title: 'Cloudways vs DigitalOcean: Managed Hosting Compared' },
  { slug: 'hetzner-vs-digitalocean', title: 'Hetzner Cloud vs DigitalOcean: Price and Performance' },
  { slug: 'best-vps-singapore', title: 'Best VPS With a Singapore Data Center in 2026' },
  { slug: 'vps-for-nextjs', title: 'Best VPS for Hosting a Next.js App in 2026' },
  { slug: 'vps-for-nodejs', title: 'Best VPS for Node.js Apps: Performance and Price Compared' },
  { slug: 'vps-for-python', title: 'Best VPS for Python Web Apps in 2026' },
  { slug: 'cheapest-vps-nvme', title: 'Cheapest VPS With NVMe SSD Storage in 2026' },
  { slug: 'vps-for-game-server', title: 'Best VPS for Game Servers: Low Latency Options Compared' },
  { slug: 'vps-bandwidth-comparison', title: 'VPS Bandwidth Comparison: Which Provider Gives the Most?' },
  { slug: 'cloudways-review-2026', title: 'Cloudways Review 2026: Is It Worth the Price?' },
  { slug: 'vultr-review-2026', title: 'Vultr Review 2026: Pros, Cons, and Pricing' },
  { slug: 'hetzner-review-2026', title: 'Hetzner Cloud Review 2026: The Best Budget VPS?' },
  { slug: 'linode-vs-digitalocean', title: 'Linode vs DigitalOcean: Which Is Better in 2026?' },
  { slug: 'ovh-vs-hetzner', title: 'OVHcloud vs Hetzner: European VPS Compared' },
  { slug: 'vps-for-email-server', title: 'Best VPS for Running Your Own Email Server' },
  { slug: 'vps-for-vpn', title: 'Best VPS for Hosting a Private VPN in 2026' },
  { slug: 'vps-for-database', title: 'Best VPS for Self-Hosted Databases in 2026' },
  { slug: 'cheapest-vps-4-vcpu', title: 'Cheapest VPS With 4 vCPUs in 2026' },
  { slug: 'vps-uptime-reliability', title: 'VPS Uptime and Reliability: Which Providers Can You Trust?' },
  { slug: 'vps-for-ci-cd', title: 'Best VPS for CI/CD Pipelines and Build Servers' },
  { slug: 'vps-for-docker', title: 'Best VPS for Running Docker Containers in 2026' },
  { slug: 'vps-for-kubernetes', title: 'Cheapest Way to Run Kubernetes on a VPS in 2026' },
  { slug: 'vps-support-comparison', title: 'VPS Provider Support Compared: Who Actually Helps?' },
  { slug: 'vps-for-saas', title: 'Best VPS for Indie SaaS Founders in 2026' },
  { slug: 'vps-for-static-site', title: 'Do You Even Need a VPS for a Static Site? Options Compared' },
  { slug: 'vps-payment-methods', title: 'VPS Providers That Accept Crypto, PayPal, and More' },
  { slug: 'vps-free-trial', title: 'VPS Providers With Free Trials or Credits in 2026' },
  { slug: 'how-to-choose-vps', title: 'How to Choose a VPS: A Developer\'s Practical Guide' },
];

function pickTopic(): (typeof TOPICS)[number] | undefined {
  const existing = existsSync(BLOG_DIR)
    ? new Set(readdirSync(BLOG_DIR).map((f) => f.replace(/\.md$/, '')))
    : new Set<string>();
  return TOPICS.find((t) => !existing.has(t.slug));
}

async function generateOne(client: Anthropic, topic: (typeof TOPICS)[number]): Promise<void> {
  const r = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system:
      'You are a technical writer producing developer-focused VPS comparison articles. ' +
      'Write factually, cite specific specs and prices, avoid marketing fluff. ' +
      'Output Markdown only with no preamble. Include an H1 title at the top.',
    messages: [
      {
        role: 'user',
        content: `Write a 1500-2000 word article titled "${topic.title}". Use markdown headings, comparison tables where useful, a short TL;DR at the top, and a "Bottom line" section at the bottom. Mention concrete plans by name and price (USD/month) where relevant. Do not invent providers - stick to: Vultr, DigitalOcean, Hetzner Cloud, Akamai Linode, OVHcloud, Cloudways. End with a one-line affiliate disclosure note.`,
      },
    ],
  });

  const text = r.content
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('\n');

  const frontmatter = [
    '---',
    `slug: ${topic.slug}`,
    `title: "${topic.title}"`,
    `published: ${new Date().toISOString().slice(0, 10)}`,
    `model: ${MODEL}`,
    '---',
    '',
  ].join('\n');

  writeFileSync(join(BLOG_DIR, `${topic.slug}.md`), frontmatter + text + '\n', 'utf-8');
  console.log(`[articles] wrote ${topic.slug}.md (${text.length} chars)`);
}

async function main() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    console.log('[articles] ANTHROPIC_API_KEY not set, skipping generation');
    return;
  }

  if (!existsSync(BLOG_DIR)) mkdirSync(BLOG_DIR, { recursive: true });

  const count = parseInt(process.env.ARTICLES_PER_RUN ?? '1', 10);
  const client = new Anthropic({ apiKey: key });

  for (let i = 0; i < count; i++) {
    const topic = pickTopic();
    if (!topic) {
      console.log('[articles] all topics covered, nothing to generate');
      break;
    }
    await generateOne(client, topic);
  }
}

main().catch((err) => {
  console.error('[articles] failed:', err);
  process.exit(0);
});

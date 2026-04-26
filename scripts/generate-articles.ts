// Weekly: pick a still-uncovered topic and ask Claude to draft a markdown
// article. Skips silently if ANTHROPIC_API_KEY is missing so the cron stays
// green even before the user provisions a key.
import Anthropic from '@anthropic-ai/sdk';
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './lib/io.ts';

const BLOG_DIR = join(ROOT, 'data', 'blog');
const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001';

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
];

function pickTopic(): (typeof TOPICS)[number] | undefined {
  const existing = existsSync(BLOG_DIR)
    ? new Set(readdirSync(BLOG_DIR).map((f) => f.replace(/\.md$/, '')))
    : new Set<string>();
  return TOPICS.find((t) => !existing.has(t.slug));
}

async function main() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    console.log('[articles] ANTHROPIC_API_KEY not set, skipping generation');
    return;
  }
  const topic = pickTopic();
  if (!topic) {
    console.log('[articles] all topics covered, nothing to generate');
    return;
  }

  const client = new Anthropic({ apiKey: key });
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

main().catch((err) => {
  console.error('[articles] failed:', err);
  process.exit(0);
});

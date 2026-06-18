import { chromium, type Page } from 'playwright';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

type Target = {
  slug: string;
  officeName: string;
  officeType: string;
  area: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  angle: string;
};

type Metrics = {
  seoDifficulty: number | null;
  searchVolume: number | null;
  cpc: number | null;
  competition: number | null;
};

type Opportunity = {
  slug: string;
  officeName: string;
  officeType: string;
  area: string;
  keyword: string;
  source: string;
  metrics: Metrics;
  score: number;
  priority: string;
  intent: string;
  winability: string;
  commercialIntent: string;
  reason: string;
};

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const TARGETS_PATH = process.env.NOTE_TARGETS_PATH || join(ROOT, 'note_articles', 'targets.json');
const OUTPUT_JSON = process.env.GOOGLE_OUTPUT_JSON || join(ROOT, 'note_articles', 'keyword-opportunities.json');
const OUTPUT_CSV = process.env.GOOGLE_OUTPUT_CSV || join(ROOT, 'note_articles', 'keyword-opportunities.csv');
const GENERATED_DIR = process.env.NOTE_OUTPUT_DIR || join(ROOT, 'note_articles', 'generated');
const STATE_PATH = process.env.NOTE_STATE_PATH || join(ROOT, 'note_articles', 'publish-state.json');
const USER_DATA_DIR = process.env.GOOGLE_BROWSER_USER_DATA_DIR || join(ROOT, '.auth', 'google-keyword-browser');
const MAX_TARGETS = Number(process.env.GOOGLE_BROWSER_MAX_TARGETS || 1);
const HEADLESS = process.env.GOOGLE_BROWSER_HEADLESS === 'true';
const CHANNEL = process.env.GOOGLE_BROWSER_CHANNEL;
const DELAY_MS = Number(process.env.GOOGLE_BROWSER_DELAY_MS || 1800);
const USE_SHORT_NAMES = process.env.GOOGLE_BROWSER_USE_SHORT_NAMES === 'true';
const MAX_SUGGESTION_PROBES = Number(process.env.GOOGLE_SUGGESTION_PROBES || 10);

const MODIFIERS = [
  '口コミ',
  'クチコミ',
  '評判',
  '費用',
  '料金',
  '着手金',
  '報酬',
  '分割',
  '支払い',
  '支払い遅れ',
  '高い',
  '怪しい',
  'しつこい',
  '電話',
  '電話番号',
  '迷惑電話',
  '連絡',
  '任意整理',
  '債務整理',
  '過払い金',
  '自己破産',
  '個人再生',
  '無料相談',
  '相談',
  '減額',
  '督促',
  '家族',
  '職場',
  'バレる',
  'バレない',
  '依頼',
  '流れ',
  '期間',
  '解約',
  'キャンセル',
  'デメリット',
  'メリット',
];

const INTENT_WEIGHTS: Record<string, number> = {
  口コミ: 30,
  クチコミ: 30,
  評判: 28,
  費用: 27,
  料金: 27,
  着手金: 25,
  報酬: 23,
  分割: 25,
  支払い: 21,
  支払い遅れ: 22,
  高い: 20,
  怪しい: 23,
  しつこい: 19,
  電話番号: 18,
  電話: 17,
  迷惑電話: 18,
  連絡: 15,
  任意整理: 24,
  債務整理: 20,
  無料相談: 24,
  相談: 20,
  過払い金: 14,
  自己破産: 18,
  個人再生: 18,
  減額: 17,
  督促: 16,
  家族: 17,
  職場: 17,
  バレる: 18,
  バレない: 16,
  依頼: 20,
  流れ: 12,
  期間: 10,
  解約: 12,
  キャンセル: 12,
  デメリット: 12,
  メリット: 8,
};

function readTargets(): Target[] {
  return JSON.parse(readFileSync(TARGETS_PATH, 'utf-8')) as Target[];
}

function normalizeKeyword(keyword: string): string {
  return keyword.replace(/\s+/g, ' ').trim();
}

function stripIntentModifier(keyword: string): string {
  let stripped = normalizeKeyword(keyword);
  for (const modifier of [...MODIFIERS].sort((a, b) => b.length - a.length)) {
    stripped = stripped.replace(new RegExp(`\\s*${modifier}\\s*$`), '').trim();
  }
  return stripped;
}

function shortOfficeNames(officeName: string): string[] {
  const names = new Set<string>([officeName]);
  const stripped = officeName
    .replace(/^弁護士法人/, '')
    .replace(/^司法書士法人/, '')
    .replace(/^司法書士/, '')
    .replace(/法律事務所$/, '')
    .replace(/司法書士事務所$/, '')
    .replace(/法務事務所$/, '')
    .replace(/総合事務所$/, '')
    .trim();
  if (stripped && stripped.length >= 2) names.add(stripped);
  return [...names];
}

function officeKey(value: string): string {
  return stripIntentModifier(value)
    .replace(/\s+/g, '')
    .replace(/^(弁護士法人|司法書士法人|司法書士|弁護士)/, '')
    .replace(/(総合法律事務所|法律事務所|司法書士事務所|法務事務所|総合事務所|事務所)$/, '')
    .trim()
    .toLowerCase();
}

function targetKeys(target: Target): Set<string> {
  const keys = new Set<string>();
  for (const value of [target.officeName, target.primaryKeyword, ...target.secondaryKeywords, ...shortOfficeNames(target.officeName)]) {
    const key = officeKey(value);
    if (key.length >= 2) keys.add(key);
  }
  return keys;
}

function doneTargets(targets: Target[]): { slugs: Set<string>; keys: Set<string> } {
  const slugs = new Set<string>();
  const keys = new Set<string>();
  const targetBySlug = new Map(targets.map((target) => [target.slug, target]));
  const addTarget = (slug: string) => {
    slugs.add(slug);
    const target = targetBySlug.get(slug);
    if (target) for (const key of targetKeys(target)) keys.add(key);
  };

  if (existsSync(GENERATED_DIR)) {
    for (const file of readdirSync(GENERATED_DIR)) {
      if (!file.endsWith('.md')) continue;
      addTarget(file.replace(/\.md$/, ''));
      const text = readFileSync(join(GENERATED_DIR, file), 'utf-8');
      for (const match of text.matchAll(/^(officeName|primaryKeyword):\s*(.+)$/gm)) {
        const key = officeKey(match[2]);
        if (key.length >= 2) keys.add(key);
      }
    }
  }
  if (existsSync(STATE_PATH)) {
    const state = JSON.parse(readFileSync(STATE_PATH, 'utf-8')) as { published?: Record<string, unknown> };
    for (const file of Object.keys(state.published || {})) {
      if (file.endsWith('.md')) addTarget(file.replace(/\.md$/, ''));
    }
  }
  return { slugs, keys };
}

function queryNames(target: Target): string[] {
  const names = new Set<string>([target.officeName]);
  for (const keyword of [target.primaryKeyword, ...target.secondaryKeywords]) {
    const base = stripIntentModifier(keyword);
    if (base.length >= 2) names.add(base);
  }
  if (USE_SHORT_NAMES) {
    for (const name of shortOfficeNames(target.officeName).slice(0, 2)) names.add(name);
  }
  return [...names].slice(0, USE_SHORT_NAMES ? 4 : 3);
}

function targetAliases(target: Target): string[] {
  const aliases = new Set<string>([target.officeName, ...shortOfficeNames(target.officeName), ...queryNames(target)]);
  for (const keyword of [target.primaryKeyword, ...target.secondaryKeywords]) {
    const base = stripIntentModifier(keyword);
    if (base.length >= 2) aliases.add(base);
  }
  return [...aliases].filter((alias) => alias.length >= 2);
}

function detectIntent(keyword: string): string {
  return [...MODIFIERS].sort((a, b) => b.length - a.length).find((modifier) => keyword.includes(modifier)) || '指名';
}

function isDecisionKeyword(keyword: string): boolean {
  return detectIntent(keyword) !== '指名';
}

function belongsToTarget(keyword: string, target: Target): boolean {
  if (targetAliases(target).some((alias) => keyword.includes(alias))) return true;
  const legalAnchors = ['法律事務所', '司法書士', '法務', '債務整理', '任意整理', '過払い', '減額診断'];
  return shortOfficeNames(target.officeName)
    .filter((name) => name !== target.officeName)
    .some((name) => keyword.includes(name) && legalAnchors.some((anchor) => keyword.includes(anchor)));
}

function commercialIntent(intent: string): string {
  if (
    [
      '費用',
      '料金',
      '着手金',
      '報酬',
      '分割',
      '支払い',
      '支払い遅れ',
      '高い',
      '任意整理',
      '債務整理',
      '無料相談',
      '相談',
      '依頼',
      '自己破産',
      '個人再生',
    ].includes(intent)
  ) {
    return '強';
  }
  if (
    ['口コミ', 'クチコミ', '評判', '怪しい', 'しつこい', '迷惑電話', '電話', '電話番号', '家族', '職場', 'バレる', 'バレない', 'デメリット'].includes(
      intent,
    )
  ) {
    return '中';
  }
  return '弱';
}

function noteWinability(source: string): string {
  if (source.includes('suggest')) return 'Googleサジェスト由来';
  if (source.includes('related')) return '関連検索由来';
  if (source.includes('paa')) return '質問意図あり';
  return 'SERP由来';
}

function scoreKeyword(keyword: string, source: string): { score: number; reason: string } {
  const intent = detectIntent(keyword);
  const sourceScore = source.includes('suggest') ? 25 : source.includes('related') ? 20 : source.includes('paa') ? 14 : 10;
  const intentScore = INTENT_WEIGHTS[intent] ?? 5;
  const commercial = commercialIntent(intent);
  const commercialScore = commercial === '強' ? 18 : commercial === '中' ? 10 : 0;
  const exactOfficeBonus = /法律事務所|司法書士|法務/.test(keyword) ? 7 : 0;
  const score = sourceScore + intentScore + commercialScore + exactOfficeBonus;
  return {
    score,
    reason: `source=${source}, intent=${intent}, commercialIntent=${commercial}, noteWinability=${noteWinability(source)}, volume=unknown, difficulty=unknown`,
  };
}

function priority(score: number): string {
  if (score >= 78) return '★★★★★';
  if (score >= 66) return '★★★★☆';
  if (score >= 52) return '★★★☆☆';
  if (score >= 38) return '★★☆☆☆';
  return '★☆☆☆☆';
}

function toOpportunity(target: Target, keyword: string, source: string): Opportunity | null {
  const normalized = normalizeKeyword(keyword);
  if (!normalized || !isDecisionKeyword(normalized)) return null;
  if (!belongsToTarget(normalized, target)) return null;
  const intent = detectIntent(normalized);
  const scored = scoreKeyword(normalized, source);
  return {
    slug: target.slug,
    officeName: target.officeName,
    officeType: target.officeType,
    area: target.area,
    keyword: normalized,
    source,
    metrics: {
      seoDifficulty: null,
      searchVolume: null,
      cpc: null,
      competition: null,
    },
    score: scored.score,
    priority: priority(scored.score),
    intent,
    winability: noteWinability(source),
    commercialIntent: commercialIntent(intent),
    reason: scored.reason,
  };
}

async function gotoGoogle(page: Page, query: string): Promise<void> {
  await page.goto(`https://www.google.co.jp/search?q=${encodeURIComponent(query)}&hl=ja&pws=0&complete=0`, {
    waitUntil: 'domcontentloaded',
    timeout: 45000,
  });
  await page.waitForTimeout(DELAY_MS);
}

async function collectAutocomplete(page: Page, query: string): Promise<string[]> {
  await page.goto('https://www.google.co.jp/?hl=ja', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(800);
  const box = page.locator('textarea[name="q"], input[name="q"]').first();
  await box.fill(query);
  await page.waitForTimeout(DELAY_MS);
  return page.evaluate(() => {
    const candidates = new Set<string>();
    const selectors = [
      'ul[role="listbox"] [role="option"]',
      'li[role="presentation"]',
      '[aria-label*="候補"]',
      '[data-attrid*="Autocomplete"]',
    ];
    for (const selector of selectors) {
      for (const el of document.querySelectorAll(selector)) {
        const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (text && text.length <= 80) candidates.add(text);
      }
    }
    return [...candidates];
  });
}

async function collectSerpKeywords(page: Page, query: string): Promise<Array<{ keyword: string; source: string }>> {
  await gotoGoogle(page, query);
  return page.evaluate(() => {
    const items: Array<{ keyword: string; source: string }> = [];
    const push = (keyword: string, source: string) => {
      const normalized = keyword.replace(/\s+/g, ' ').trim();
      if (normalized && normalized.length <= 90) items.push({ keyword: normalized, source });
    };

    for (const el of document.querySelectorAll('a[href*="/search?q="]')) {
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (text) push(text, 'google-related-link');
    }
    for (const el of document.querySelectorAll('[role="heading"], span, div')) {
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (/^(他の人はこちらも質問|関連性の高い検索|関連する質問)$/.test(text)) continue;
      if (/口コミ|クチコミ|評判|費用|料金|怪しい|電話|任意整理|債務整理|相談/.test(text)) {
        push(text, text.endsWith('？') || text.endsWith('?') ? 'google-paa' : 'google-serp-text');
      }
    }
    return items;
  });
}

function probeQueries(base: string): string[] {
  const probes = [
    base,
    `${base} `,
    `${base} 口`,
    `${base} ク`,
    `${base} 評`,
    `${base} 費`,
    `${base} 怪`,
    `${base} 電`,
    `${base} 任`,
    `${base} 債`,
    `${base} 相`,
  ];
  return probes.slice(0, MAX_SUGGESTION_PROBES);
}

function csvEscape(value: unknown): string {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeOutputs(opportunities: Opportunity[]): void {
  mkdirSync(dirname(OUTPUT_JSON), { recursive: true });
  writeFileSync(OUTPUT_JSON, JSON.stringify(opportunities, null, 2) + '\n', 'utf-8');
  const headers = [
    'priority',
    'score',
    'officeName',
    'keyword',
    'intent',
    'commercialIntent',
    'winability',
    'searchVolume',
    'seoDifficulty',
    'cpc',
    'competition',
    'slug',
    'source',
    'reason',
  ];
  const rows = opportunities.map((item) =>
    [
      item.priority,
      item.score,
      item.officeName,
      item.keyword,
      item.intent,
      item.commercialIntent,
      item.winability,
      item.metrics.searchVolume,
      item.metrics.seoDifficulty,
      item.metrics.cpc,
      item.metrics.competition,
      item.slug,
      item.source,
      item.reason,
    ]
      .map(csvEscape)
      .join(','),
  );
  writeFileSync(OUTPUT_CSV, [headers.join(','), ...rows].join('\n') + '\n', 'utf-8');
}

async function main() {
  mkdirSync(USER_DATA_DIR, { recursive: true });
  const browser = await chromium.launch({
    channel: CHANNEL,
    headless: HEADLESS,
  });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
  });
  const page = context.pages()[0] || (await context.newPage());
  const opportunities = new Map<string, Opportunity>();
  const allTargets = readTargets();
  const done = process.env.NOTE_INCLUDE_DONE_TARGETS === 'true' ? { slugs: new Set<string>(), keys: new Set<string>() } : doneTargets(allTargets);
  const targets = allTargets
    .filter((target) => !done.slugs.has(target.slug) && ![...targetKeys(target)].some((key) => done.keys.has(key)))
    .slice(0, MAX_TARGETS);
  console.log(`[google:browser] target count=${targets.length}, skipped done slugs=${done.slugs.size}, done names=${done.keys.size}`);

  try {
    for (const target of targets) {
      for (const base of queryNames(target)) {
        console.log(`[google:browser] ${target.officeName}: ${base}`);
        for (const query of probeQueries(base)) {
          const suggestions = await collectAutocomplete(page, query).catch(() => []);
          for (const suggestion of suggestions) {
            const opportunity = toOpportunity(target, suggestion, 'google-suggest');
            if (!opportunity) continue;
            const key = `${opportunity.slug}\t${opportunity.keyword}`;
            const existing = opportunities.get(key);
            if (!existing || opportunity.score > existing.score) opportunities.set(key, opportunity);
          }
        }
        const serpItems = await collectSerpKeywords(page, base).catch(() => []);
        for (const item of serpItems) {
          const opportunity = toOpportunity(target, item.keyword, item.source);
          if (!opportunity) continue;
          const key = `${opportunity.slug}\t${opportunity.keyword}`;
          const existing = opportunities.get(key);
          if (!existing || opportunity.score > existing.score) opportunities.set(key, opportunity);
        }
      }
    }
  } finally {
    await context.close();
    await browser.close();
  }

  const sorted = [...opportunities.values()].sort((a, b) => b.score - a.score);
  writeOutputs(sorted);
  console.log(`[google:browser] wrote ${OUTPUT_JSON}`);
  console.log(
    sorted
      .slice(0, 15)
      .map((item) => `${item.priority} ${item.keyword} (${item.winability}, 成約意図:${item.commercialIntent})`)
      .join('\n'),
  );
}

main().catch((err) => {
  console.error('[google:browser] failed:', err);
  process.exit(1);
});

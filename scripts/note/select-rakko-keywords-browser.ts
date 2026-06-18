import { chromium, type Page } from 'playwright';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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
const OUTPUT_JSON = process.env.RAKKO_OUTPUT_JSON || join(ROOT, 'note_articles', 'keyword-opportunities.json');
const OUTPUT_CSV = process.env.RAKKO_OUTPUT_CSV || join(ROOT, 'note_articles', 'keyword-opportunities.csv');
const DOWNLOAD_DIR = process.env.RAKKO_BROWSER_DOWNLOAD_DIR || join(ROOT, 'note_articles', 'rakko-downloads');
const USER_DATA_DIR = process.env.RAKKO_BROWSER_USER_DATA_DIR || join(ROOT, '.auth', 'rakko-browser');
const MAX_TARGETS = Number(process.env.RAKKO_BROWSER_MAX_TARGETS || process.env.RAKKO_MAX_TARGETS || 15);
const HEADLESS = process.env.RAKKO_BROWSER_HEADLESS === 'true';
const CHANNEL = process.env.RAKKO_BROWSER_CHANNEL || 'chrome';
const DELAY_MS = Number(process.env.RAKKO_BROWSER_DELAY_MS || 3000);
const USE_SHORT_NAMES = process.env.RAKKO_BROWSER_USE_SHORT_NAMES === 'true';
const MODES = (process.env.RAKKO_BROWSER_MODES || 'suggestKeywords,relatedKeywords')
  .split(',')
  .map((mode) => mode.trim())
  .filter(Boolean);
const MAX_VOLUME = Number(process.env.RAKKO_MAX_VOLUME || 1000);
const MAX_SEO_DIFFICULTY = Number(process.env.RAKKO_MAX_SEO_DIFFICULTY || 45);

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
  'プール金',
  'デメリット',
  'メリット',
];

const INTENT_WEIGHTS: Record<string, number> = {
  口コミ: 28,
  クチコミ: 28,
  評判: 26,
  費用: 24,
  料金: 24,
  着手金: 23,
  報酬: 22,
  分割: 24,
  支払い: 20,
  支払い遅れ: 21,
  高い: 20,
  怪しい: 22,
  しつこい: 18,
  迷惑電話: 18,
  電話: 16,
  連絡: 14,
  任意整理: 23,
  債務整理: 19,
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
  プール金: 18,
  デメリット: 12,
  メリット: 8,
};

function readTargets(): Target[] {
  return JSON.parse(readFileSync(TARGETS_PATH, 'utf-8')) as Target[];
}

function normalizeKeyword(keyword: string): string {
  return keyword.replace(/\s+/g, ' ').trim();
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

function stripIntentModifier(keyword: string): string {
  let stripped = normalizeKeyword(keyword);
  for (const modifier of [...MODIFIERS].sort((a, b) => b.length - a.length)) {
    stripped = stripped.replace(new RegExp(`\\s*${modifier}\\s*$`), '').trim();
  }
  return stripped;
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

function resultUrl(mode: string, keyword: string): string {
  const q = encodeURIComponent(keyword);
  if (mode === 'relatedKeywords') return `https://rakkokeyword.com/result/relatedKeywords?q=${q}`;
  if (mode === 'otherKeywords') return `https://rakkokeyword.com/result/otherKeywords?q=${q}`;
  return `https://rakkokeyword.com/result/suggestKeywords?q=${q}&mode=google`;
}

async function tryDownloadCsv(page: Page, target: Target, mode: string, keyword: string): Promise<string | null> {
  const outputPath = join(DOWNLOAD_DIR, `${target.slug}-${mode}-${keyword.replace(/[\\/:*?"<>|\s]+/g, '_')}.csv`);
  const button = page.getByRole('button', { name: 'データ出力' });
  if ((await button.count()) !== 1) return null;

  await button.click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(500);

  const csv = page.getByText('CSV', { exact: true });
  if ((await csv.count()) < 1) return null;

  try {
    const downloadPromise = page.waitForEvent('download', { timeout: 8000 });
    await csv.first().click({ timeout: 5000 });
    const download = await downloadPromise;
    await download.saveAs(outputPath);
    return outputPath;
  } catch {
    return null;
  }
}

async function extractRowsFromPage(page: Page): Promise<Array<Record<string, string>>> {
  return page.evaluate(() => {
    const rows = [...document.querySelectorAll('table tbody tr')];
    return rows
      .map((row) => {
        const cells = [...row.querySelectorAll('td')].map((cell) => (cell.textContent || '').replace(/\s+/g, ' ').trim());
        const keyword = cells[1] || cells[0] || '';
        return {
          keyword,
          class: cells[2] || '',
          seoDifficulty: cells[3] || '',
          searchVolume: cells[4] || '',
          cpc: cells[5] || '',
          competition: cells[6] || '',
        };
      })
      .filter((row) => row.keyword && !row.keyword.includes('月額わずか') && !row.keyword.includes('無料登録'));
  });
}

function parseNumber(value: string | undefined): number | null {
  if (!value) return null;
  const normalized = value.replace(/[,％%$]/g, '').trim();
  if (!normalized || normalized === '-' || normalized === '－') return null;
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
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
      'プール金',
    ].includes(intent)
  ) {
    return '強';
  }
  if (
    ['口コミ', 'クチコミ', '評判', '怪しい', 'しつこい', '迷惑電話', '電話', '家族', '職場', 'バレる', 'バレない', 'デメリット'].includes(
      intent,
    )
  ) {
    return '中';
  }
  return '弱';
}

function noteWinability(metrics: Metrics): string {
  const volume = metrics.searchVolume ?? 0;
  const difficulty = metrics.seoDifficulty;
  if (difficulty == null) return volume <= 300 ? 'note向き候補' : '難易度不明';
  if (difficulty <= 30 && volume <= 500) return 'noteで狙いやすい';
  if (difficulty <= MAX_SEO_DIFFICULTY && volume <= MAX_VOLUME) return 'noteで狙える';
  if (difficulty <= 55 && volume <= 2000) return '境界線';
  return '避けたい';
}

function scoreKeyword(keyword: string, metrics: Metrics, source: string): { score: number; reason: string } {
  const volume = metrics.searchVolume ?? 0;
  const difficulty = metrics.seoDifficulty;
  const competition = metrics.competition;
  const intent = detectIntent(keyword);
  const intentScore = INTENT_WEIGHTS[intent] ?? 6;
  const commercial = commercialIntent(intent);
  const commercialScore = commercial === '強' ? 18 : commercial === '中' ? 10 : 0;
  const sourceScore = source.includes('csv') ? 12 : 8;

  let volumeScore = 0;
  if (volume >= 10 && volume <= 300) volumeScore = 32;
  else if (volume > 300 && volume <= MAX_VOLUME) volumeScore = 24;
  else if (volume > 0 && volume < 10) volumeScore = 14;
  else if (volume === 0) volumeScore = 9;

  const difficultyScore = difficulty == null ? 14 : Math.max(0, 30 - Math.max(0, difficulty - 18) * 0.85);
  const competitionScore = competition == null ? 6 : Math.max(0, 10 - Math.max(0, competition - 30) * 0.2);
  const exactOfficeBonus = /法律事務所|司法書士|法務/.test(keyword) ? 5 : 0;
  const score =
    Math.round(
      (intentScore + commercialScore + sourceScore + volumeScore + difficultyScore + competitionScore + exactOfficeBonus) *
        10,
    ) / 10;
  return {
    score,
    reason: `source=${source}, intent=${intent}, commercialIntent=${commercial}, noteWinability=${noteWinability(metrics)}, volume=${volume}, difficulty=${difficulty ?? 'unknown'}, competition=${competition ?? 'unknown'}`,
  };
}

function priority(score: number, metrics: Metrics): string {
  const volume = metrics.searchVolume ?? 0;
  const difficulty = metrics.seoDifficulty;
  if (volume > MAX_VOLUME) return '★☆☆☆☆';
  if (difficulty != null && difficulty > MAX_SEO_DIFFICULTY) return '★☆☆☆☆';
  if (score >= 88) return '★★★★★';
  if (score >= 76) return '★★★★☆';
  if (score >= 62) return '★★★☆☆';
  if (score >= 46) return '★★☆☆☆';
  return '★☆☆☆☆';
}

function toOpportunity(
  target: Target,
  row: Record<string, string>,
  source: string,
): Opportunity | null {
  const keyword = normalizeKeyword(row.keyword);
  if (!keyword || !isDecisionKeyword(keyword)) return null;
  if (!belongsToTarget(keyword, target)) return null;
  const metrics: Metrics = {
    seoDifficulty: parseNumber(row.seoDifficulty),
    searchVolume: parseNumber(row.searchVolume),
    cpc: parseNumber(row.cpc),
    competition: parseNumber(row.competition),
  };
  const intent = detectIntent(keyword);
  const scored = scoreKeyword(keyword, metrics, source);
  return {
    slug: target.slug,
    officeName: target.officeName,
    officeType: target.officeType,
    area: target.area,
    keyword,
    source,
    metrics,
    score: scored.score,
    priority: priority(scored.score, metrics),
    intent,
    winability: noteWinability(metrics),
    commercialIntent: commercialIntent(intent),
    reason: scored.reason,
  };
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
  mkdirSync(DOWNLOAD_DIR, { recursive: true });
  mkdirSync(USER_DATA_DIR, { recursive: true });
  const targets = readTargets().slice(0, MAX_TARGETS);
  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    acceptDownloads: true,
    channel: CHANNEL,
    headless: HEADLESS,
    viewport: { width: 1366, height: 900 },
  });
  const page = context.pages()[0] || (await context.newPage());
  const opportunities = new Map<string, Opportunity>();

  try {
    for (const target of targets) {
      for (const officeName of queryNames(target)) {
        for (const mode of MODES) {
          const url = resultUrl(mode, officeName);
          console.log(`[rakko:browser] ${target.officeName} ${mode} ${officeName}`);
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
          await page.waitForTimeout(DELAY_MS);
          const downloaded = await tryDownloadCsv(page, target, mode, officeName);
          const source = downloaded ? `rakko-browser-csv:${mode}` : `rakko-browser-table:${mode}`;
          const rows = await extractRowsFromPage(page);
          for (const row of rows) {
            const opportunity = toOpportunity(target, row, source);
            if (!opportunity) continue;
            const key = `${opportunity.slug}\t${opportunity.keyword}`;
            const existing = opportunities.get(key);
            if (!existing || opportunity.score > existing.score) opportunities.set(key, opportunity);
          }
        }
      }
    }
  } finally {
    await context.close();
  }

  const sorted = [...opportunities.values()].sort((a, b) => b.score - a.score);
  writeOutputs(sorted);
  console.log(`[rakko:browser] wrote ${OUTPUT_JSON}`);
  console.log(
    sorted
      .slice(0, 10)
      .map((item) => `${item.priority} ${item.keyword} (${item.winability}, 成約意図:${item.commercialIntent})`)
      .join('\n'),
  );
}

main().catch((err) => {
  console.error('[rakko:browser] failed:', err);
  process.exit(1);
});

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
const BASE_URL = process.env.RAKKO_API_BASE_URL || 'https://api.rakkokeyword.com';
const API_KEY = process.env.RAKKO_API_KEY;
const MAX_TARGETS = Number(process.env.RAKKO_MAX_TARGETS || 30);
const EXPAND = process.env.RAKKO_USE_EXPANSION !== 'false';
const USE_OTHER_KEYWORDS = process.env.RAKKO_USE_OTHER_KEYWORDS === 'true';
const EXPAND_LIMIT = Number(process.env.RAKKO_EXPAND_LIMIT || 50);
const MIN_VOLUME = Number(process.env.RAKKO_MIN_VOLUME || 0);
const MAX_VOLUME = Number(process.env.RAKKO_MAX_VOLUME || 1000);
const MAX_SEO_DIFFICULTY = Number(process.env.RAKKO_MAX_SEO_DIFFICULTY || 45);
const POLL_INTERVAL_MS = Number(process.env.RAKKO_POLL_INTERVAL_MS || 10000);
const POLL_TIMEOUT_MS = Number(process.env.RAKKO_POLL_TIMEOUT_MS || 180000);

const MODIFIERS = [
  '口コミ',
  '評判',
  '費用',
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
  '料金',
  '着手金',
  '報酬',
  '分割',
  '支払い',
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
  '連絡こない',
  'デメリット',
  'メリット',
];

const INTENT_WEIGHTS: Record<string, number> = {
  口コミ: 28,
  評判: 26,
  費用: 24,
  料金: 24,
  着手金: 23,
  報酬: 22,
  分割: 24,
  支払い: 20,
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
  連絡こない: 13,
  デメリット: 12,
  メリット: 8,
};

function readTargets(): Target[] {
  return JSON.parse(readFileSync(TARGETS_PATH, 'utf-8')) as Target[];
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

function buildSeedKeywords(target: Target): string[] {
  const keywords = new Set<string>([target.primaryKeyword, ...target.secondaryKeywords]);
  for (const name of shortOfficeNames(target.officeName)) {
    for (const modifier of MODIFIERS) {
      keywords.add(`${name} ${modifier}`);
    }
  }
  return [...keywords].filter(Boolean);
}

function normalizeKeyword(keyword: string): string {
  return keyword.replace(/\s+/g, ' ').trim();
}

async function rakko<T>(path: string, body?: unknown, method = body ? 'POST' : 'GET'): Promise<T> {
  if (!API_KEY) throw new Error('RAKKO_API_KEY is not set');
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok || data.result === false) {
    throw new Error(`Rakko API failed ${method} ${path}: ${res.status} ${text}`);
  }
  return data as T;
}

function itemsFromKeywordApi(data: any): string[] {
  return (data?.data?.items || [])
    .map((item: any) => item.keyword || item.question)
    .filter((keyword: unknown): keyword is string => typeof keyword === 'string' && keyword.trim().length > 0);
}

function isDecisionKeyword(keyword: string): boolean {
  return MODIFIERS.some((modifier) => keyword.includes(modifier));
}

async function expandKeywords(target: Target): Promise<Array<{ keyword: string; source: string }>> {
  if (!EXPAND) return [];
  const keywords = new Map<string, string>();
  for (const name of shortOfficeNames(target.officeName).slice(0, 2)) {
    const [suggest, related, other] = await Promise.all([
      rakko<any>('/v1/suggest-keywords', {
        keyword: name,
        modes: ['google'],
        limit: EXPAND_LIMIT,
        sortBy: 'searchVolume',
        orderBy: 'desc',
      }).catch(() => null),
      rakko<any>('/v1/related-keywords', {
        keyword: name,
        matchType: 'partialMatch',
        limit: EXPAND_LIMIT,
        sortBy: 'searchVolume',
        orderBy: 'desc',
      }).catch(() => null),
      USE_OTHER_KEYWORDS
        ? rakko<any>('/v1/other-keywords', {
            keyword: name,
            sortBy: 'importance',
            orderBy: 'desc',
          }).catch(() => null)
        : Promise.resolve(null),
    ]);
    for (const keyword of itemsFromKeywordApi(suggest)) {
      const normalized = normalizeKeyword(keyword);
      if (isDecisionKeyword(normalized)) keywords.set(normalized, 'rakko-suggest');
    }
    for (const keyword of itemsFromKeywordApi(related)) {
      const normalized = normalizeKeyword(keyword);
      if (isDecisionKeyword(normalized)) keywords.set(normalized, keywords.get(normalized) || 'rakko-related');
    }
    for (const keyword of itemsFromKeywordApi(other)) {
      const normalized = normalizeKeyword(keyword);
      if (isDecisionKeyword(normalized)) keywords.set(normalized, keywords.get(normalized) || 'rakko-other');
    }
  }
  return [...keywords.entries()].map(([keyword, source]) => ({ keyword, source }));
}

async function collectCandidates(targets: Target[]): Promise<Map<string, { target: Target; source: string }>> {
  const candidates = new Map<string, { target: Target; source: string }>();
  for (const target of targets.slice(0, MAX_TARGETS)) {
    for (const item of await expandKeywords(target)) {
      candidates.set(item.keyword, { target, source: item.source });
    }
    for (const keyword of buildSeedKeywords(target)) {
      const normalized = normalizeKeyword(keyword);
      if (!candidates.has(normalized)) candidates.set(normalized, { target, source: 'seed-fallback' });
    }
  }
  return candidates;
}

async function fetchSearchVolume(keywords: string[]): Promise<any[]> {
  const registered = await rakko<any>('/v1/search-volume', {
    keywords,
    seoDifficulty: true,
    dataCompletion: true,
    location: 'Japan',
    language: 'Japanese',
    deduplicate: true,
    aggregationPeriodMonths: 12,
  });
  const requestId = registered?.data?.requestId;
  if (!requestId) throw new Error('Rakko search-volume did not return requestId');

  const started = Date.now();
  while (Date.now() - started < POLL_TIMEOUT_MS) {
    const status = await rakko<any>(`/v1/search-volume/${requestId}/status`, undefined, 'GET');
    if (status?.data?.isCompleted) break;
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  const result = await rakko<any>(`/v1/search-volume/${requestId}/results`, {
    noiseReduction: true,
    sortBy: 'searchVolume',
    orderBy: 'desc',
    limit: 50000,
  });
  return result?.data?.items || [];
}

function detectIntent(keyword: string): string {
  return [...MODIFIERS].sort((a, b) => b.length - a.length).find((modifier) => keyword.includes(modifier)) || '指名';
}

function commercialIntent(intent: string): string {
  if (
    [
      '費用',
      '料金',
      '着手金',
      '報酬',
      '分割',
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
    [
      '口コミ',
      '評判',
      '怪しい',
      'しつこい',
      '迷惑電話',
      '電話',
      '家族',
      '職場',
      'バレる',
      'バレない',
      'デメリット',
    ].includes(intent)
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
  const sourceScore = source.startsWith('rakko-') ? 12 : 0;
  const commercialScore = commercialIntent(intent) === '強' ? 14 : commercialIntent(intent) === '中' ? 8 : 0;

  let volumeScore = 0;
  if (volume >= 10 && volume <= 300) volumeScore = 32;
  else if (volume > 300 && volume <= MAX_VOLUME) volumeScore = 24;
  else if (volume > 0 && volume < 10) volumeScore = 14;
  else if (volume === 0) volumeScore = 7;

  const difficultyScore = difficulty == null ? 12 : Math.max(0, 30 - Math.max(0, difficulty - 18) * 0.85);
  const competitionScore = competition == null ? 6 : Math.max(0, 10 - Math.max(0, competition - 30) * 0.2);
  const exactOfficeBonus = /法律事務所|司法書士|法務/.test(keyword) ? 5 : 0;
  const winPenalty = noteWinability(metrics) === '避けたい' ? -35 : noteWinability(metrics) === '境界線' ? -12 : 0;
  const score =
    Math.round(
      (intentScore +
        volumeScore +
        difficultyScore +
        competitionScore +
        exactOfficeBonus +
        sourceScore +
        commercialScore +
        winPenalty) *
        10,
    ) / 10;
  const reason = `source=${source}, intent=${intent}, commercialIntent=${commercialIntent(intent)}, noteWinability=${noteWinability(metrics)}, volume=${volume}, difficulty=${difficulty ?? 'unknown'}, competition=${competition ?? 'unknown'}`;
  return { score, reason };
}

function priority(score: number, metrics: Metrics): string {
  const volume = metrics.searchVolume ?? 0;
  const difficulty = metrics.seoDifficulty;
  if (volume < MIN_VOLUME || volume > MAX_VOLUME) return '★☆☆☆☆';
  if (difficulty != null && difficulty > MAX_SEO_DIFFICULTY) return '★☆☆☆☆';
  if (score >= 85) return '★★★★★';
  if (score >= 72) return '★★★★☆';
  if (score >= 58) return '★★★☆☆';
  if (score >= 42) return '★★☆☆☆';
  return '★☆☆☆☆';
}

function toOpportunities(items: any[], candidates: Map<string, { target: Target; source: string }>): Opportunity[] {
  return items
    .map((item) => {
      const keyword = normalizeKeyword(item.keyword);
      const match = candidates.get(keyword);
      if (!match) return null;
      const metrics: Metrics = {
        seoDifficulty: item.metrics?.seoDifficulty ?? null,
        searchVolume: item.metrics?.searchVolume ?? null,
        cpc: item.metrics?.cpc ?? null,
        competition: item.metrics?.competition ?? null,
      };
      const scored = scoreKeyword(keyword, metrics, match.source);
      const intent = detectIntent(keyword);
      return {
        slug: match.target.slug,
        officeName: match.target.officeName,
        officeType: match.target.officeType,
        area: match.target.area,
        keyword,
        source: match.source,
        metrics,
        score: scored.score,
        priority: priority(scored.score, metrics),
        intent,
        winability: noteWinability(metrics),
        commercialIntent: commercialIntent(intent),
        reason: scored.reason,
      } satisfies Opportunity;
    })
    .filter((item): item is Opportunity => Boolean(item))
    .sort((a, b) => b.score - a.score);
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
  if (!API_KEY) {
    console.log('[rakko:select] RAKKO_API_KEY is not set. skipping keyword selection.');
    return;
  }
  const targets = readTargets();
  const candidates = await collectCandidates(targets);
  const keywords = [...candidates.keys()];
  if (!keywords.length) {
    console.log('[rakko:select] no candidate keywords');
    return;
  }
  console.log(`[rakko:select] checking ${keywords.length} keywords`);
  const volumeItems = await fetchSearchVolume(keywords);
  const opportunities = toOpportunities(volumeItems, candidates);
  writeOutputs(opportunities);
  const top = opportunities
    .slice(0, 5)
    .map(
      (item) =>
        `${item.priority} ${item.keyword} (${item.metrics.searchVolume ?? 0}, ${item.winability}, 成約意図:${item.commercialIntent})`,
    );
  console.log(`[rakko:select] wrote ${OUTPUT_JSON}`);
  console.log(top.join('\n'));
}

main().catch((err) => {
  console.error('[rakko:select] failed:', err);
  process.exit(1);
});

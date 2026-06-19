import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

type Article = {
  file: string;
  title: string;
  body: string;
  meta: Record<string, string>;
  headings: string[];
};

type PublishState = {
  published: Record<string, { title: string; url?: string; publishedAt: string; mode: string }>;
};

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const OUTPUT_DIR = process.env.NOTE_OUTPUT_DIR || join(ROOT, 'note_articles', 'generated');
const STATE_PATH = process.env.NOTE_STATE_PATH || join(ROOT, 'note_articles', 'publish-state.json');
const INCLUDE_PUBLISHED = process.env.NOTE_QUALITY_INCLUDE_PUBLISHED === 'true';

function readState(): PublishState {
  if (!existsSync(STATE_PATH)) return { published: {} };
  return JSON.parse(readFileSync(STATE_PATH, 'utf-8')) as PublishState;
}

function parseArticle(path: string): Article {
  const file = readFileSync(path, 'utf-8');
  const metaBlock = file.match(/^<!--([\s\S]*?)-->\s*/)?.[1] || '';
  const meta = Object.fromEntries(
    metaBlock
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.includes(':'))
      .map((line) => {
        const [key, ...rest] = line.split(':');
        return [key.trim(), rest.join(':').trim()];
      }),
  );
  const raw = file.replace(/^<!--[\s\S]*?-->\s*/, '').trim();
  const title = raw.match(/^#\s+(.+)$/m)?.[1]?.trim() || '';
  const body = raw.replace(/^#\s+.+\n?/, '').trim();
  const headings = [...body.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1].trim());
  return { file: basename(path), title, body, meta, headings };
}

function compactLength(text: string): number {
  return text.replace(/\s+/g, '').length;
}

function tokens(text: string): Set<string> {
  return new Set(
    text
      .replace(/[。、！？,.!?()[\]「」『』【】]/g, ' ')
      .split(/\s+/)
      .map((item) => item.trim())
      .filter((item) => item.length >= 2),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  const union = new Set([...a, ...b]);
  if (!union.size) return 0;
  let intersection = 0;
  for (const item of a) if (b.has(item)) intersection++;
  return intersection / union.size;
}

function headingSignature(article: Article): string {
  return article.headings.slice(0, 8).join(' > ');
}

function compactKeyword(text: string): string {
  return text.replace(/\s+/g, '');
}

function hasKeywordNaturally(text: string, keyword: string): boolean {
  if (!keyword) return true;
  if (text.includes(keyword)) return true;
  const compactText = compactKeyword(text);
  const compactTarget = compactKeyword(keyword);
  if (compactText.includes(compactTarget)) return true;
  const tokens = keyword.split(/\s+/).filter((token) => token.length >= 2);
  return tokens.length > 1 && tokens.every((token) => compactText.includes(compactKeyword(token)));
}

function validate(article: Article): string[] {
  const errors: string[] = [];
  const primaryKeyword = article.meta.primaryKeyword || '';
  if (article.meta.provider === 'template') errors.push('provider is template');
  if (primaryKeyword && !hasKeywordNaturally(article.title, primaryKeyword)) errors.push('title missing primaryKeyword');
  if (primaryKeyword && !hasKeywordNaturally(article.body.slice(0, 700), primaryKeyword)) errors.push('lead missing primaryKeyword');
  if (compactLength(article.body) < 2400) errors.push('body too short');
  if (
    !/検索意図|先出し回答|結論|まず確認|口コミを見る前|評判を見る前|相談前に確認|依頼前に確認|判断する前|確認したいこと|押さえたいポイント|見積もりで詳細を確認/.test(
      article.body,
    )
  ) {
    errors.push('missing search-intent answer');
  }
  if (!/比較|他の候補|他事務所/.test(article.body)) errors.push('missing comparison angle');
  if (!/費用|料金|着手金|報酬/.test(article.body)) errors.push('missing fee angle');
  if (!/公式サイト|無料相談|相談時/.test(article.body)) errors.push('missing official/free-consultation confirmation');
  if (/YMYL|LLMO|AIO|内部チェック|制作ルール|検索意図への先出し回答/.test(article.body)) {
    errors.push('contains internal/editorial wording');
  }
  return errors;
}

function main() {
  if (!existsSync(OUTPUT_DIR)) {
    console.log('[note:quality] no generated directory');
    return;
  }

  const published = new Set(Object.keys(readState().published));
  const articles = readdirSync(OUTPUT_DIR)
    .filter((file) => file.endsWith('.md'))
    .filter((file) => INCLUDE_PUBLISHED || !published.has(file))
    .map((file) => parseArticle(join(OUTPUT_DIR, file)));

  const failed: string[] = [];
  for (const article of articles) {
    const errors = validate(article);
    if (errors.length) failed.push(`${article.file}: ${errors.join(', ')}`);
  }

  const signatures = new Map<string, string[]>();
  for (const article of articles) {
    const signature = headingSignature(article);
    if (!signature) continue;
    signatures.set(signature, [...(signatures.get(signature) || []), article.file]);
  }
  for (const [signature, files] of signatures.entries()) {
    if (files.length >= 2) {
      failed.push(`duplicate heading structure: ${files.join(', ')} :: ${signature}`);
    }
  }

  for (let i = 0; i < articles.length; i++) {
    for (let j = i + 1; j < articles.length; j++) {
      const score = jaccard(tokens(articles[i].title), tokens(articles[j].title));
      if (score >= 0.75) {
        failed.push(`similar titles (${score.toFixed(2)}): ${articles[i].file} / ${articles[j].file}`);
      }
    }
  }

  if (failed.length) {
    console.error('[note:quality] failed');
    for (const item of failed) console.error(`- ${item}`);
    process.exit(1);
  }

  console.log(`[note:quality] passed ${articles.length} article(s)`);
}

main();

import Anthropic from '@anthropic-ai/sdk';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
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

type KeywordOpportunity = {
  slug: string;
  keyword: string;
  priority: string;
  score: number;
  intent?: string;
  commercialIntent?: string;
  winability?: string;
  metrics?: {
    searchVolume?: number | null;
    seoDifficulty?: number | null;
    cpc?: number | null;
    competition?: number | null;
  };
};

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const TARGETS_PATH = process.env.NOTE_TARGETS_PATH || join(ROOT, 'note_articles', 'targets.json');
const OUTPUT_DIR = process.env.NOTE_OUTPUT_DIR || join(ROOT, 'note_articles', 'generated');
const STATE_PATH = process.env.NOTE_STATE_PATH || join(ROOT, 'note_articles', 'publish-state.json');
const KEYWORD_OPPORTUNITIES_PATH =
  process.env.RAKKO_OUTPUT_JSON || join(ROOT, 'note_articles', 'keyword-opportunities.json');
const COMPARISON_URL = process.env.NOTE_COMPARISON_URL || 'https://vpscomparehub.com/money/';
const PROVIDER = (process.env.AI_PROVIDER || '').toLowerCase();

function readTargets(): Target[] {
  return JSON.parse(readFileSync(TARGETS_PATH, 'utf-8')) as Target[];
}

function existingSlugs(): Set<string> {
  const done = new Set<string>();
  if (existsSync(OUTPUT_DIR)) {
    for (const file of readdirSync(OUTPUT_DIR)) {
      if (file.endsWith('.md')) done.add(file.replace(/\.md$/, ''));
    }
  }
  if (existsSync(STATE_PATH)) {
    const state = JSON.parse(readFileSync(STATE_PATH, 'utf-8')) as { published?: Record<string, unknown> };
    for (const file of Object.keys(state.published || {})) {
      if (file.endsWith('.md')) done.add(file.replace(/\.md$/, ''));
    }
  }
  return done;
}

function stripIntentModifier(keyword: string): string {
  return keyword
    .replace(/\s+/g, ' ')
    .replace(/\s*(口コミ|クチコミ|評判|費用|料金|着手金|報酬|分割|支払い|怪しい|しつこい|電話|任意整理|債務整理|過払い金|自己破産|個人再生|無料相談|相談|デメリット|メリット)\s*$/g, '')
    .trim();
}

function shortOfficeNames(officeName: string): string[] {
  const names = new Set<string>([officeName]);
  const stripped = officeName
    .replace(/^弁護士法人/, '')
    .replace(/^司法書士法人/, '')
    .replace(/^司法書士/, '')
    .replace(/総合法律事務所$/, '')
    .replace(/法律事務所$/, '')
    .replace(/司法書士事務所$/, '')
    .replace(/法務事務所$/, '')
    .replace(/総合事務所$/, '')
    .replace(/事務所$/, '')
    .trim();
  if (stripped.length >= 2) names.add(stripped);
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

function existingTargets(targets: Target[]): { slugs: Set<string>; keys: Set<string> } {
  const slugs = existingSlugs();
  const keys = new Set<string>();
  const targetBySlug = new Map(targets.map((target) => [target.slug, target]));

  for (const slug of slugs) {
    const target = targetBySlug.get(slug);
    if (target) for (const key of targetKeys(target)) keys.add(key);
  }

  if (existsSync(OUTPUT_DIR)) {
    for (const file of readdirSync(OUTPUT_DIR)) {
      if (!file.endsWith('.md')) continue;
      const text = readFileSync(join(OUTPUT_DIR, file), 'utf-8');
      for (const match of text.matchAll(/^(officeName|primaryKeyword):\s*(.+)$/gm)) {
        const key = officeKey(match[2]);
        if (key.length >= 2) keys.add(key);
      }
    }
  }

  return { slugs, keys };
}

function readKeywordOpportunities(): KeywordOpportunity[] {
  if (process.env.NOTE_USE_RAKKO_SELECTION === 'false') return [];
  if (!existsSync(KEYWORD_OPPORTUNITIES_PATH)) return [];
  return JSON.parse(readFileSync(KEYWORD_OPPORTUNITIES_PATH, 'utf-8')) as KeywordOpportunity[];
}

function applyKeywordOpportunity(target: Target, opportunity?: KeywordOpportunity): Target {
  if (!opportunity) return target;
  const secondaryKeywords = [target.primaryKeyword, ...target.secondaryKeywords]
    .filter((keyword) => keyword !== opportunity.keyword)
    .slice(0, 5);
  const metrics = opportunity.metrics || {};
  const volume = metrics.searchVolume == null ? '不明' : String(metrics.searchVolume);
  const difficulty = metrics.seoDifficulty == null ? '不明' : String(metrics.seoDifficulty);
  return {
    ...target,
    primaryKeyword: opportunity.keyword,
    secondaryKeywords,
    angle: `${target.angle}。ラッコキーワードで優先度${opportunity.priority}、検索意図「${opportunity.intent || '不明'}」、成約意図「${opportunity.commercialIntent || '不明'}」、note勝ちやすさ「${opportunity.winability || '不明'}」、月間検索数${volume}、SEO難易度${difficulty}の候補を主軸にする。`,
  };
}

function classifyIntent(keyword: string): string {
  if (/費用|料金|報酬|着手金|成功報酬|分割/.test(keyword)) return 'fee';
  if (/怪しい|やばい|しつこい|迷惑|電話/.test(keyword)) return 'anxiety';
  if (/任意整理|債務整理|自己破産|個人再生|過払い/.test(keyword)) return 'procedure';
  return 'reputation';
}

function intentGuide(target: Target): string {
  const intent = classifyIntent(target.primaryKeyword);
  const guides: Record<string, string> = {
    reputation: `
検索意図タイプ: 口コミ・評判確認
- タイトル例: 「${target.primaryKeyword}は？口コミ・評判を見る前に確認したい費用と注意点」
- 冒頭の答え: 口コミだけで良し悪しを断定せず、費用・対応範囲・連絡配慮・相談時の説明を確認する必要がある、と先に答える
- 必須の独自見出し: 「口コミで確認すべき具体項目」「良い評判を見る時の注意点」「気になる評判を見た時の確認方法」
- 口コミが見つからない場合: 「口コミが少ない場合の判断基準」として書く`,
    fee: `
検索意図タイプ: 費用・料金確認
- タイトル例: 「${target.primaryKeyword}はいくら？任意整理の費用項目と相談前の比較ポイント」
- 冒頭の答え: 費用は債権者数・手続き内容・追加実費で変わるため、公式表示と無料相談時の見積もり確認が必要、と先に答える
- 必須の独自見出し: 「費用で確認する項目」「見積もり時に聞く質問」「安さだけで選ばない理由」
- 口コミは補助扱いにし、主軸は費用比較にする`,
    anxiety: `
検索意図タイプ: 怪しい・しつこい・電話などの不安解消
- タイトル例: 「${target.primaryKeyword}と検索される理由は？相談前に確認したい安全性・連絡方法・費用」
- 冒頭の答え: 検索候補に不安語が出ても事実とは限らないため、公式情報・連絡方法・費用説明・契約前の確認で判断する、と先に答える
- 必須の独自見出し: 「不安語で検索される背景」「契約前に確認したいチェック項目」「電話や連絡が不安な時の伝え方」
- 誹謗中傷・断定は絶対に避ける`,
    procedure: `
検索意図タイプ: 債務整理・任意整理など手続き確認
- タイトル例: 「${target.primaryKeyword}は相談できる？費用・対応範囲・他事務所との比較ポイント」
- 冒頭の答え: 手続きごとに向く相談先や確認事項が異なるため、対応範囲・代理権・費用を比較する必要がある、と先に答える
- 必須の独自見出し: 「対応手続きの確認ポイント」「司法書士と弁護士で確認すべき違い」「相談前に整理する情報」
- 手続き別の注意点を厚めにする`,
  };
  return guides[intent];
}

function pickTarget(targets: Target[]): Target | undefined {
  const forced = process.env.NOTE_TARGET_SLUG;
  const opportunities = readKeywordOpportunities();
  const done = process.env.NOTE_INCLUDE_DONE_TARGETS === 'true' ? { slugs: new Set<string>(), keys: new Set<string>() } : existingTargets(targets);
  if (forced) {
    const target = targets.find((t) => t.slug === forced);
    if (!target) return undefined;
    if (!process.env.NOTE_INCLUDE_DONE_TARGETS && (done.slugs.has(target.slug) || [...targetKeys(target)].some((key) => done.keys.has(key)))) {
      throw new Error(`${forced} is already generated or published. Set NOTE_INCLUDE_DONE_TARGETS=true to force regeneration.`);
    }
    return applyKeywordOpportunity(
      target,
      opportunities.find((item) => item.slug === forced),
    );
  }
  const targetBySlug = new Map(targets.map((target) => [target.slug, target]));
  const isDone = (target: Target): boolean => done.slugs.has(target.slug) || [...targetKeys(target)].some((key) => done.keys.has(key));
  const selected = opportunities.find((item) => {
    const target = targetBySlug.get(item.slug);
    return Boolean(target && !isDone(target));
  });
  if (selected) return applyKeywordOpportunity(targetBySlug.get(selected.slug)!, selected);
  return targets.find((target) => !isDone(target));
}

function buildPrompt(target: Target): string {
  return `以下の条件で、note公開用の債務整理系口コミ・評判記事をMarkdownで作成してください。

対象事務所:
- 事務所名: ${target.officeName}
- 種別: ${target.officeType}
- 対応地域の文脈: ${target.area}
- 主KW: ${target.primaryKeyword}
- 関連KW: ${target.secondaryKeywords.join(' / ')}
- 記事角度: ${target.angle}

目的:
- Google検索で「${target.primaryKeyword}」やその周辺KWを検索した人に、中立的な確認ポイントを提示する
- 記事内から債務整理比較LPへ自然に誘導する

検索意図別の設計:
${intentGuide(target)}

必須条件:
- 2800〜3800字程度
- Markdownのみ
- H1から開始
- H1には主KW「${target.primaryKeyword}」の主要語を自然に含める。スペース区切りKWはそのまま貼らず、助詞を補って日本語として自然なタイトルにする
- リード文の最初の150文字以内にも主KW「${target.primaryKeyword}」を自然に入れる
- 実在しない口コミ・体験談を作らない
- 記事内にアフィリエイトリンクは入れない。比較ページへの導線のみ入れる
- 口コミは「確認する時の見方」「公開口コミで見るべき観点」として扱う
- 誹謗中傷・断定表現を避ける
- 「怪しい」「やばい」系は断定せず、「そう検索される理由」「相談前に確認したい点」として処理する
- 「必ず借金が減る」「絶対バレない」「即日で必ず督促停止」などは禁止
- 「YMYL」「SEO」「LLMO」「AIO」「検索意図」「アフィリエイト」「内部チェック」など制作側・編集側の専門用語を本文に出さない
- 「広告・アフィリエイトを含みます」という免責は入れない
- 債務整理比較LPへのCTAを画像直下、リード直下、口コミセクション後、費用セクション後、記事末に入れる
- 本文はH1の直後に「画像直下CTA」から開始し、その後にリード文を書く。note投稿時はH1がタイトル欄に入り、CTA画像の直下にこのCTAが表示される
- 6記事以上を量産しても重複に見えないように、見出し名・順序・本文表現を検索意図に合わせて変える
- 「サービス概要→良い口コミ→悪い口コミ→メリット→デメリット→費用」の固定順にしない
- 冒頭に「この記事で分かること」ではなく、読者向けに自然な見出し「口コミを見る前に確認したいこと」「評判だけで判断する前に」「相談前に確認したいこと」などを入れる
- 事務所名、種別、地域文脈、主KWから、その記事だけの論点を最低3つ作る
- 公式情報で未確認のことは断定せず「公式サイトまたは無料相談で確認してください」と書く
- 他記事でも使い回せる一般論だけで1つのH2を埋めない。各H2に必ず「${target.officeName}を検討する場合」の観点を入れる
- CTA文言は毎回同じにしすぎず、検索意図に合わせて自然に変える

CTAリンクURL:
${COMPARISON_URL}

基本構成:
1. H1: 主KW「${target.primaryKeyword}」の主要語を含め、検索意図に合う自然な日本語タイトルにする。例: 「借金 裁判 差し押さえの流れ」なら「借金で裁判になると差し押さえ？流れと対処法」
2. 画像直下CTA「相談先を選ぶ前に、他の候補と比較しておく」。H3ではなく太字の通常段落で書く
3. リード文
4. 読者向けに自然な確認見出し。「検索意図への先出し回答」という見出し名は使わない
5. リード直下CTA
6. 主KWの意図に合わせた独自H2を3〜5個
7. 費用・対応範囲・連絡方法の確認パート
8. 他事務所と比較する判断軸
9. よくある質問
10. まとめ
11. 記事末CTA

避けること:
- 「良い口コミがあります」「悪い口コミがあります」など、根拠がない口コミの存在を示す表現
- 全記事で同じH2名を並べること
- 事務所名だけ差し替えたような本文
- 読者の不安をあおる表現
- 「おすすめ」「安心」「安全」などを根拠なく断定する表現

CTAブロックの書き方:
### 相談先を比較してから決めたい方へ
費用・対応範囲・無料相談の有無をまとめて確認できます。
[債務整理の相談先を比較する](${COMPARISON_URL})

画像直下CTAの書き方:
**相談先を選ぶ前に、他の候補と比較しておく**

無料相談・費用・全国対応・分割払い・家族や職場への配慮をまとめて確認できます。
[債務整理に強い相談先を比較する](${COMPARISON_URL})

出力はMarkdown本文のみ。`;
}

function extractTextFromAnthropic(content: any[]): string {
  return content.filter((block) => block.type === 'text').map((block) => block.text).join('\n').trim();
}

async function generateWithAnthropic(prompt: string): Promise<{ text: string; model: string }> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set');
  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest';
  const client = new Anthropic({ apiKey: key });
  const res = await client.messages.create({
    model,
    max_tokens: Number(process.env.NOTE_MAX_TOKENS || 5000),
    system:
      'あなたは債務整理に関する比較記事の編集長です。借金や法律に関わるテーマのため、中立性・安全性・読者利益を最優先にしてください。制作側の専門用語は本文に出さないでください。',
    messages: [{ role: 'user', content: prompt }],
  });
  return { text: extractTextFromAnthropic(res.content as any[]), model };
}

async function generateWithOpenAI(prompt: string): Promise<{ text: string; model: string }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY is not set');
  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: 'system',
          content:
            'あなたは債務整理に関する比較記事の編集長です。借金や法律に関わるテーマのため、中立性・安全性・読者利益を最優先にしてください。制作側の専門用語は本文に出さないでください。',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI API failed: ${res.status} ${await res.text()}`);
  const data: any = await res.json();
  const text =
    data.output_text ||
    data.output?.flatMap((item: any) => item.content || []).map((item: any) => item.text || '').join('\n') ||
    '';
  return { text: text.trim(), model };
}

async function generate(prompt: string): Promise<{ text: string; model: string; provider: string }> {
  if (process.env.NOTE_DRY_RUN === 'true') {
    return {
      provider: 'dry-run',
      model: 'dry-run',
      text: `# テスト記事の口コミ・評判は？費用や相談前の注意点を調査

**相談先を選ぶ前に、他の候補と比較しておく**

無料相談・費用・全国対応・分割払い・家族や職場への配慮をまとめて確認できます。

[債務整理に強い相談先を比較する](${COMPARISON_URL})

これは自動化パイプラインのドライラン記事です。

## 債務整理を検討中なら

[相談先を比較してから選ぶ](${COMPARISON_URL})

## サービス概要

ドライランのため本文生成は行っていません。

## まとめ

本番ではAI_PROVIDER、APIキー、NOTE_COMPARISON_URLを設定して実行してください。
`,
    };
  }
  if (PROVIDER === 'openai') return { ...(await generateWithOpenAI(prompt)), provider: 'openai' };
  if (PROVIDER === 'anthropic') return { ...(await generateWithAnthropic(prompt)), provider: 'anthropic' };
  if (process.env.OPENAI_API_KEY) return { ...(await generateWithOpenAI(prompt)), provider: 'openai' };
  return { ...(await generateWithAnthropic(prompt)), provider: 'anthropic' };
}

function normalizeMarkdown(text: string): string {
  return text.replace(/^```(?:markdown)?\s*/i, '').replace(/```\s*$/i, '').trim() + '\n';
}

async function main() {
  const targets = readTargets();
  const target = pickTarget(targets);
  if (!target) {
    console.log('[note:generate] no remaining target');
    return;
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const prompt = buildPrompt(target);
  const { text, model, provider } = await generate(prompt);
  const md = normalizeMarkdown(text);
  const meta = [
    '<!--',
    `slug: ${target.slug}`,
    `officeName: ${target.officeName}`,
    `primaryKeyword: ${target.primaryKeyword}`,
    `provider: ${provider}`,
    `model: ${model}`,
    `generatedAt: ${new Date().toISOString()}`,
    '-->',
    '',
  ].join('\n');

  const outPath = join(OUTPUT_DIR, `${target.slug}.md`);
  writeFileSync(outPath, meta + md, 'utf-8');
  console.log(`[note:generate] wrote ${outPath}`);
}

main().catch((err) => {
  console.error('[note:generate] failed:', err);
  process.exit(1);
});

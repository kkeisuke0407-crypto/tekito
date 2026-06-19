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
};

type PublishState = {
  published: Record<string, { title: string; url?: string; publishedAt: string; mode: string }>;
};

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const TARGETS_PATH = process.env.NOTE_TARGETS_PATH || join(ROOT, 'note_articles', 'targets.json');
const OUTPUT_DIR = process.env.NOTE_OUTPUT_DIR || join(ROOT, 'note_articles', 'generated');
const STATE_PATH = process.env.NOTE_STATE_PATH || join(ROOT, 'note_articles', 'publish-state.json');
const KEYWORD_OPPORTUNITIES_PATH =
  process.env.GOOGLE_OUTPUT_JSON ||
  process.env.RAKKO_OUTPUT_JSON ||
  join(ROOT, 'note_articles', 'keyword-opportunities.json');
const COMPARISON_URL = process.env.NOTE_COMPARISON_URL || 'https://vpscomparehub.com/money/';
const COUNT = Number(process.env.NOTE_TEMPLATE_COUNT || 5);

// This script exists only for note editor/CTA posting-flow tests.
// Template articles are intentionally blocked from public publish mode by publish-note.ts.
function readTargets(): Target[] {
  return JSON.parse(readFileSync(TARGETS_PATH, 'utf-8')) as Target[];
}

function readState(): PublishState {
  if (!existsSync(STATE_PATH)) return { published: {} };
  return JSON.parse(readFileSync(STATE_PATH, 'utf-8')) as PublishState;
}

function existingSlugs(): Set<string> {
  if (!existsSync(OUTPUT_DIR)) return new Set();
  return new Set(readdirSync(OUTPUT_DIR).filter((file) => file.endsWith('.md')).map((file) => file.replace(/\.md$/, '')));
}

function readOpportunities(): KeywordOpportunity[] {
  if (!existsSync(KEYWORD_OPPORTUNITIES_PATH)) return [];
  return JSON.parse(readFileSync(KEYWORD_OPPORTUNITIES_PATH, 'utf-8')) as KeywordOpportunity[];
}

function pickOpportunity(target: Target, opportunities: KeywordOpportunity[]): KeywordOpportunity | undefined {
  return opportunities.find((item) => item.slug === target.slug);
}

function naturalizeKeyword(keyword: string): string {
  return keyword
    .replace(/借金\s+裁判\s+差し押さえの流れ/g, '借金で裁判になると差し押さえ？流れ')
    .replace(/借金\s+差し押さえ\s+無職/g, '無職で借金の差し押さえが不安な時')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleFor(target: Target, keyword: string): string {
  const titleKeyword = naturalizeKeyword(keyword);
  if (/借金|裁判|差し押さえ|自己破産|生活保護/.test(keyword) && !/口コミ|評判|費用|怪しい|しつこい|電話/.test(keyword)) {
    return `${titleKeyword}と相談前の対処法`;
  }
  if (/費用|料金|報酬|着手金/.test(keyword)) {
    return `${titleKeyword}は？口コミ・評判と相談前の確認ポイントを整理`;
  }
  if (/怪しい|しつこい|迷惑電話|電話/.test(keyword)) {
    return `${titleKeyword}と検索される理由は？口コミ・評判と相談前の注意点`;
  }
  return `${titleKeyword}は？口コミ・評判と費用の確認ポイントを調査`;
}

function article(target: Target, opportunity?: KeywordOpportunity): string {
  const keyword = opportunity?.keyword || target.primaryKeyword;
  const title = titleFor(target, keyword);
  const related = [target.primaryKeyword, ...target.secondaryKeywords]
    .filter((item, index, arr) => item && arr.indexOf(item) === index && item !== keyword)
    .slice(0, 5)
    .join(' / ');
  const intent = opportunity?.intent || '口コミ';
  const commercialIntent = opportunity?.commercialIntent || '中';

  return `# ${title}

**相談先を選ぶ前に、他の候補と比較しておく**

無料相談・費用・全国対応・分割払い・家族や職場への配慮をまとめて確認できます。

[債務整理に強い相談先を比較する](${COMPARISON_URL})

${target.officeName}が気になっている方向けに、${keyword}を調べるときの見方、費用確認、相談前に比べたいポイントを整理します。口コミや検索候補だけで判断せず、自分の借入状況に合う相談先かどうかを確認することが大切です。

## 気になる事務所がある方も、相談先は比較してから選ぶ

債務整理は、相談先によって費用体系、対応できる手続き、連絡方法、分割払いへの対応が異なります。特に${target.officeType}へ相談する場合は、対応できる範囲や代理権の制限も確認しておきたいところです。

- 無料相談の有無
- 任意整理や自己破産など対応できる手続き
- 着手金、報酬、減額報酬、実費
- 分割払いに対応しているか
- 家族や職場への連絡配慮
- 全国対応か、来所が必要か

### 相談先を比較してから決めたい方へ

費用・対応範囲・無料相談の有無をまとめて確認できます。

[債務整理の相談先を比較する](${COMPARISON_URL})

## サービス概要

${target.officeName}は、${target.area}の文脈で検索される${target.officeType}です。債務整理、任意整理、過払い金、自己破産、個人再生などを検討している方が、相談先候補として事務所名を検索することがあります。

ただし、この記事は公式サイトではありません。掲載内容は公開情報と一般的な確認ポイントをもとに整理したもので、法律相談や法的助言ではありません。費用や対応範囲は変更されることがあるため、依頼前には必ず公式情報や無料相談で確認してください。

## ${keyword}で見るべきポイント

${keyword}のような指名検索は、相談前に不安を解消したい人が使いやすいキーワードです。検索意図は「${intent}」、成約に近い度合いは「${commercialIntent}」として扱えます。

確認したいのは、単なる良し悪しではなく、次のような具体的な内容です。

- 説明がわかりやすいか
- 費用の総額や支払い方法が明確か
- デメリットも説明されているか
- 連絡方法への配慮があるか
- 契約を急かされないか
- 自分の借入額や手続き内容に対応できるか

口コミは参考になりますが、相談者の借入額、債権者数、収入、家計状況によって結果は変わります。自分にも同じ結果が出るとは限らないため、最終判断は相談時の説明と見積もりで行いましょう。

### 口コミだけで決める前に

口コミは参考になりますが、費用や対応範囲は事務所ごとに異なります。

[債務整理の相談先を比較する](${COMPARISON_URL})

## 良い口コミ・評判を見るときのポイント

良い口コミを見るときは、抽象的な評価よりも、相談者が何を評価しているのかを確認しましょう。

- 初回相談で費用の説明があった
- 返済計画や手続きの流れが理解しやすかった
- 家族や職場への連絡に配慮してもらえた
- 分割払いの相談ができた
- 不安な点を質問しやすかった

このような具体性がある内容は、相談前の確認項目として役立ちます。ただし、債務整理の結果は個別事情に左右されるため、良い口コミだけで依頼先を決めるのは避けた方が安心です。

## 悪い口コミ・気になる評判を見るときのポイント

悪い口コミや気になる評判を見るときも、内容をそのまま断定的に受け取るのではなく、何に対する不満なのかを分けて考えることが大切です。

- 費用が想定より高かった
- 連絡頻度が合わなかった
- 手続き期間が長く感じた
- 期待していたほど返済額が変わらなかった
- 説明を十分に理解できなかった

これらは事務所の対応だけでなく、借入先との交渉状況や手続き内容によっても変わります。不安がある場合は、相談時に「総額」「追加費用」「連絡方法」「手続き期間」を先に確認しましょう。

## メリット

${target.officeName}を検討するメリットとしては、借金問題を専門家に相談できること、返済状況を第三者と整理できること、任意整理などの選択肢を確認できることが挙げられます。

また、相談先によっては無料相談や分割払いに対応している場合があります。費用が不安な方ほど、複数の相談先を比較し、月々の支払いイメージまで確認してから選ぶことが重要です。

## デメリット・注意点

相談前に注意したいのは、どの事務所でもすべての借金問題に同じように対応できるわけではない点です。

- 司法書士には代理できる範囲に制限がある
- 個人再生や自己破産では弁護士相談が向く場合がある
- 費用は債権者数や手続き内容で変わる
- 口コミだけでは実際の対応品質を判断しにくい
- 追加費用や実費の確認が必要

特に借入額が大きい場合、裁判対応が必要な場合、自己破産や個人再生を本格的に検討している場合は、弁護士事務所も含めて比較しましょう。

## 費用

債務整理の費用は、手続き内容と債権者数によって変わります。相談時には次の項目を確認してください。

| 項目 | 確認ポイント |
|---|---|
| 相談料 | 初回無料か、有料の場合はいくらか |
| 着手金 | 債権者1社あたりの金額 |
| 報酬金 | 手続き完了時に発生する費用 |
| 減額報酬 | 減額できた金額に応じて発生するか |
| 実費 | 郵送費、印紙代、予納金など |
| 分割払い | 月々いくらから支払えるか |
| 追加費用 | 途中で追加される条件があるか |

### 費用を比べてから相談したい方へ

無料相談、分割払い、対応手続きの違いを比較してから選べます。

[費用と相談先を比較する](${COMPARISON_URL})

## 向いている人

${target.officeName}が向いている可能性があるのは、${target.area}で相談先を探している人、口コミや評判を確認してから相談したい人、任意整理や債務整理の費用感を知りたい人です。

一方で、1社だけで即決するよりも、費用・対応範囲・連絡配慮を比べたうえで相談先を選ぶ方が納得しやすくなります。

## 向いていない人

裁判対応の可能性がある人、借入額が大きい人、自己破産や個人再生を本格的に検討している人は、弁護士事務所も含めて比較した方がよい場合があります。

また、費用の総額や追加費用に不安がある場合は、見積もりを確認する前に契約しないことが大切です。

## よくある質問

### ${target.officeName}の口コミだけで相談先を決めても大丈夫ですか？

口コミは参考情報です。費用、対応範囲、連絡方法、デメリット説明を確認したうえで判断しましょう。

### 家族や職場に知られずに相談できますか？

連絡方法や郵送物への配慮を相談できる場合があります。ただし、状況によって完全に知られないとは限らないため、事前確認が必要です。

### 相談すると督促は止まりますか？

専門家が正式に受任し、貸金業者へ受任通知を送付した場合、直接の督促が制限される可能性があります。ただし、状況により異なります。

### 関連キーワードも記事内で扱うべきですか？

関連KWとして、${related || target.secondaryKeywords.join(' / ')} などがあります。本文では不安の背景として自然に扱い、断定や誹謗中傷にならないよう注意します。

## まとめ

${keyword}で検索している方は、相談前に不安や費用感を確認したい段階にいる可能性があります。口コミや評判は参考になりますが、最終的には自分の借入状況に対応できるか、費用はいくらか、連絡方法に配慮があるかを確認することが重要です。

債務整理は、相談先によって費用や対応方針が異なります。まずは複数の相談先を比較し、自分に合うところを選びましょう。

## 他の法律事務所・司法書士事務所も比較したい方へ

「どこへ相談するか迷っている」

「費用や対応エリアも比較したい」

「司法書士と弁護士のどちらに相談すべきか分からない」

そんな方は、債務整理に対応している相談先を比較してから選びましょう。

[比較してから相談先を選ぶ](${COMPARISON_URL})
`;
}

function main() {
  const targets = readTargets();
  const done = existingSlugs();
  const state = readState();
  const published = new Set(Object.keys(state.published).map((file) => file.replace(/\.md$/, '')));
  const opportunities = readOpportunities();
  const selected = targets.filter((target) => !done.has(target.slug) && !published.has(target.slug)).slice(0, COUNT);
  mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const target of selected) {
    const opportunity = pickOpportunity(target, opportunities);
    const md = article(target, opportunity);
    const meta = [
      '<!--',
      `slug: ${target.slug}`,
      `officeName: ${target.officeName}`,
      `primaryKeyword: ${opportunity?.keyword || target.primaryKeyword}`,
      `provider: template`,
      `model: local-template`,
      `generatedAt: ${new Date().toISOString()}`,
      '-->',
      '',
    ].join('\n');
    const outPath = join(OUTPUT_DIR, `${target.slug}.md`);
    writeFileSync(outPath, meta + md.trim() + '\n', 'utf-8');
    console.log(`[note:generate:template] wrote ${outPath}`);
  }

  if (!selected.length) console.log('[note:generate:template] no remaining targets');
}

main();

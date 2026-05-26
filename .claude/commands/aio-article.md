# AIO最適化コラム記事生成スキル

Google AI Overviews・Perplexity・ChatGPT Searchに引用されやすい日本語コラム記事を生成する。

## 使い方

```
/aio-article <テーマ> [カテゴリ: experience|comparison|mental] [cvType: detective|gps|lawyer|uranai|all]
```

例：
```
/aio-article 浮気の証拠がない状態で弁護士に相談してはいけない理由 comparison lawyer
/aio-article GPS追跡を自分でやってみた結果わかったこと experience gps
/aio-article 不倫を疑い始めたとき一番最初にすべきこと comparison all
```

---

## 実行手順

$ARGUMENTS からテーマ・カテゴリ・cvTypeを読み取る。指定がない場合は `comparison` / `all` をデフォルトとする。

以下のルールに従って記事データを生成し、`src/data/detective-columns.js` の `columns` 配列に追加する。

---

## AIO必須ルール（研究データに基づく）

### 1. BLUF構造（最重要）
- **各h2の直下1文目が直接回答**であること。前置き・説明・文脈は不要
- ❌ 「多くの方が疑問に思うことですが、実は〜」
- ✅ 「答えから言うと、〇〇です。理由は〜」
- 全ページの先頭30%にすべての重要な回答を配置する（「デッドゾーン＝中間60%」を避ける）

### 2. 見出しの70%を疑問形にする
- H2・H3の70%以上を「〜とは？」「〜はどうすれば？」「なぜ〜なのか？」形式にする
- ✅ 「探偵と弁護士、どちらに先に相談すべきか？」
- ❌ 「専門家への相談について」

### 3. セクション長の最適化
- H2セクション：100〜300語が最適（AIの引用率が62%最高）
- 段落：50〜150語、最大4文
- 各段落は独立して引用されうる完結した内容にする

### 4. リスト形式を40〜60%に
- 手順→番号付きリスト、選択肢・特徴→箇条書き
- 各bullet pointは独立して引用可能な1つの事実にする
- リストは3〜7項目が最適（長すぎると引用率が下がる）

### 5. 比較はテーブルで
- 比較コンテンツは必ず `col-table-wrap > table.col-table` 形式で構造化
- テーブルはAI引用率+38%

### 6. 数値・具体的データを必ず含める
- 「多い」→「約7割のケースで〜」
- 「高い」→「平均40〜60万円程度」
- 具体的な統計はAI引用率+5.5%

### 7. E-E-A-T信号（著者経験を冒頭で示す）
- col-leadで「事務所で何百件も見てきた」「当時の経験から言うと」を必ず入れる
- エピソードボックス（col-episode）に実体験を1〜2個入れる

### 8. FAQセクションを必ず末尾に追加
- 3〜5個のQ&Aペア、各回答は40〜80語（AIが直接引用できるサイズ）
- FAQはAI引用率+30%

---

## 記事フォーマット（HTML bodyテンプレート）

```html
<p class="col-lead">[著者の実体験・事務所での経験に基づく導入。1〜2文で「なぜこの記事を書くか」。BLUFで結論を示唆する。]</p>

<div class="col-toc">
  <div class="col-toc-title">この記事の内容</div>
  <ol>
    <li><a href="#p1">[疑問形の見出し]</a></li>
    <li><a href="#p2">[疑問形の見出し]</a></li>
    <li><a href="#p3">[疑問形の見出し]</a></li>
    <li><a href="#summary">まとめ・結論</a></li>
    <li><a href="#faq">よくある質問</a></li>
  </ol>
</div>

<h2 id="p1"><span class="col-pattern-icon">✅</span>[疑問形の見出し]</h2>
<p>[BLUF：直接回答を1文目に。50〜150語の段落。]</p>

<div class="col-point">
  <div class="col-point-title">ここがポイント</div>
  <ul>
    <li>[具体的な数値を含む箇条書き]</li>
    <li>[独立して引用可能な事実]</li>
    <li>[独立して引用可能な事実]</li>
  </ul>
</div>

[必要に応じてcol-episode / col-warn / col-checkを追加]

<div class="col-divider-ornament"></div>

<h2 id="p2"><span class="col-pattern-icon">⚠️</span>[疑問形の見出し]</h2>
[同様の構造を繰り返す]

<div class="col-divider-ornament"></div>

<h2 id="summary">結論：[テーマに対する直接回答]</h2>
<div class="col-conclusion">
  <h3>まとめ</h3>
  <p>[テーマへの直接回答を3〜5行で。数値・具体的事実を含む。次のアクションを示す。]</p>
</div>

<div class="col-divider-ornament"></div>

<h2 id="faq">よくある質問</h2>

<div class="col-check">
  <div class="col-check-title">Q：[疑問形の質問]</div>
  <p><strong>A：</strong>[40〜80語の直接回答。前置き不要。]</p>
</div>

<div class="col-check">
  <div class="col-check-title">Q：[疑問形の質問]</div>
  <p><strong>A：</strong>[40〜80語の直接回答。]</p>
</div>

<div class="col-check">
  <div class="col-check-title">Q：[疑問形の質問]</div>
  <p><strong>A：</strong>[40〜80語の直接回答。]</p>
</div>

<p class="col-cta-lead">[関連記事・関連LPへのクロスリンクを含む誘導文。]</p>
```

---

## JSON-LD スキーマ（各記事に追加する）

`src/pages/detective/column/[slug].astro` の head 内にある Article JSON-LD に加えて、
`detective-columns.js` の各記事に `faqSchema` フィールドを追加する：

```js
faqSchema: [
  { q: "質問1", a: "回答1（40〜80語）" },
  { q: "質問2", a: "回答2" },
  { q: "質問3", a: "回答3" },
]
```

`[slug].astro` でこれを読み取り FAQPage JSON-LD として出力する。

---

## columnsデータ構造

```js
{
  slug: '[kebab-case-slug]',
  title: '[記事タイトル（疑問形推奨）]',
  category: 'experience' | 'comparison' | 'mental',
  categoryLabel: '体験談' | '選択肢比較' | 'メンタル',
  published: '2026-MM-DD',
  excerpt: '[120〜160文字の要約。最初の文が直接回答になるように]',
  readingTime: [数値（文字数 ÷ 400 で概算）],
  cvType: 'detective' | 'gps' | 'lawyer' | 'uranai' | 'all',
  faqSchema: [
    { q: "Q1", a: "A1" },
    { q: "Q2", a: "A2" },
    { q: "Q3", a: "A3" },
  ],
  body: `[上記フォーマットに従ったHTML]`
}
```

---

## チェックリスト（生成後に確認）

- [ ] col-leadに著者の実体験が入っているか
- [ ] H2の70%以上が疑問形か
- [ ] 各H2の1文目が直接回答か（BLUF）
- [ ] 各セクションが100〜300語か
- [ ] 比較がある場合はテーブルになっているか
- [ ] 数値・具体的データが含まれているか
- [ ] col-episodeが1〜2個あるか
- [ ] FAQセクションが末尾にあり3〜5問あるか
- [ ] faqSchemaフィールドが追加されているか
- [ ] col-cta-leadに関連ページへのクロスリンクがあるか
- [ ] slugがケバブケースで他と被っていないか

---

## 実行後の作業

1. `src/data/detective-columns.js` の `columns` 配列に新記事を追加
2. `src/pages/detective/column/[slug].astro` に FAQPage JSON-LD 出力を追加（未実装の場合）
3. `node_modules/.bin/astro build` でビルド確認
4. コミット・プッシュ

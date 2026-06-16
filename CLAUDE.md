# CLAUDE.md — Claude Code 向けガイド

このリポジトリは **Claude Code** と **Codex** の両エージェントが編集します。
共通ルールは `AGENTS.md` に記載されています。このファイルは Claude Code 固有の補足です。

---

## Claude の担当領域

```
src/pages/money/          # 債務整理LP（借金スッキリnavi）
src/pages/shindan/        # 診断ページ
src/pages/water-server/   # ウォーターサーバー比較LP（水代見直しナビ）
src/pages/detective/      # 中の人ナビ（浮気・不倫相談、Instagram連動）
public/money/             # 債務整理LP用静的ファイル
public/water-server/      # ウォーターサーバーLP用静的ファイル
  ├── styles.css          # ウォーターサーバーLP スタイル
  └── app.js              # アフィリエイトリンク・トラッキング管理
public/detective/         # 中の人ナビ用静的ファイル
docs/instagram/           # Instagram「@lawyer.nakanohito」運用資料
```

**Codex 担当領域（原則編集しない）:**
`src/pages/providers/`, `src/pages/compare/`, `src/pages/by-spec/`,
`src/pages/by-region/`, `src/pages/blog/`, `data/`, `scripts/`

---

## Instagram 運用（@lawyer.nakanohito / 中の人ナビ）

リール台本作成・数値分析・新企画起案は `docs/instagram/` で完結させる。
**作業開始前に必ず以下を読むこと**：

1. `docs/instagram/HANDOFF.md` — アカウント全前提（バズの法則・効かないパターン・過去ミス・運営者の判断スタイル）
2. `docs/instagram/README.md` — 運用ルール（台本作成の必須手順・ファイル構造）
3. `docs/instagram/analytics/posts-log.md` — 被り・連続出演チェック用

### 台本作成の必須手順（要約）
1. HANDOFF.md と posts-log.md を読む
2. シリーズ物は過去弾の全リストと被りチェック
3. テンプレ（`docs/instagram/templates/`）に沿って書く
4. Web検索で一次情報（判例・統計・法改正）を確認
5. 末尾に画像生成プロンプト統一テンプレを必ず含める
6. 完成台本は `docs/instagram/scripts/YYYYMMDD-slug.md` に保存

### 効かないパターン（やってはいけない）
- 「弁護士」ワードを前面に出すテーマ
- モラハラ・離婚単体など不倫から外れたテーマ
- 手順・テクニック・チェックリスト系
- いいね/コメントで意思表示させる行動強制設計

---

## ウォーターサーバーLP の構成メモ

**ページ:** `/water-server/` → `src/pages/water-server/index.astro`
**運営者情報:** `/water-server/operator/` → `src/pages/water-server/operator.astro`

### アフィリエイトリンク管理

`public/water-server/app.js` の `AFFILIATE_LINKS` オブジェクトで一元管理。
HTMLの `data-affiliate="<key>"` 属性に対してDOMContentLoaded時に自動注入される。

```js
const AFFILIATE_LINKS = {
  oken:           "https://example.com/oken",           // オーケンウォーター
  every_frecious: "https://example.com/every-frecious", // every frecious
  cosmo:          "https://example.com/cosmo-water",    // コスモウォーター
  crecla_putio:   "https://example.com/crecla-putio",   // クリクラ putio
  frecious:       "https://example.com/frecious",       // フレシャス
  urunon:         "https://example.com/urunon",         // うるのん
  humming:        "https://example.com/humming-water"   // ハミングウォーター
};
```

### トラッキング

CTAに `data-track="<name>"` を付けると `track()` 関数が GA4 / dataLayer にイベントを送信する。
track名の命名規則: `<section>_<service>` 例: `card_oken`, `compare_cosmo`, `hero_compare`

### 掲載優先度（EPC順）

1. オーケンウォーター（EPC 408.76）→ featured カード・最優先CTA
2. every frecious（EPC 358.43）
3. コスモウォーター（EPC 353.47）
4. クリクラ putio（EPC 147.12）
5. フレシャス（EPC 73.80）
6. うるのん（EPC 55.85）
7. ハミングウォーター（EPC 28.34）

### 表現ルール（遵守）

**禁止:** 絶対安い / 最安値保証 / 必ず節約 / 赤ちゃんに安全 / 健康になる /
公式No.1 / 根拠不明なランキング1位 / 水で体調改善

**OK:** 月額の見方を整理 / 契約条件を確認 / ボトル交換の手間を比較 /
生活スタイルに合わせて選ぶ / 公式情報を確認

### 料金記載ルール

- 具体的な月額は「公式確認ベース」と注記する
- 解約金・最低利用期間は必ず「公式で最新情報を確認」を促す
- 健康・安全性は断定しない

---

## ブランチ規約

Claude Code が作業するブランチは必ず `claude/` プレフィックスを使う。
例: `claude/water-server-comparison-lp-D0PGQ`

Codex のブランチ（`codex/` プレフィックス）は原則 push・編集しない。

---

## コミット時の注意

- 共有ファイル（`src/styles/global.css`, `src/layouts/Base.astro`）を変更する場合は
  コミットメッセージに `[shared]` を付けて変更範囲を明示する。
- `public/CNAME` は絶対に削除・変更しない（カスタムドメイン設定）。
- `.github/workflows/` の変更は人間の確認を取ること。

---

## よく使うコマンド

```bash
./node_modules/.bin/astro dev    # ローカル確認
./node_modules/.bin/astro build  # ビルド検証（push前に実行推奨）
```

---

**共通ルールの詳細は `AGENTS.md` を参照してください。**
**更新日:** 2026-06-16

# AGENTS.md — AI エージェント共通ガイド

このリポジトリは **Claude Code** と **Codex** の両エージェントが編集します。
作業前にこのファイルを確認し、担当領域・ブランチ規約・コミット規約を守ってください。

---

## プロジェクト概要

| 項目 | 内容 |
|---|---|
| サイト | vpscomparehub.com |
| フレームワーク | Astro（`npm run build` でビルド） |
| デプロイ | GitHub Actions → GitHub Pages（`main` push で自動） |
| 言語混在 | VPS比較系: **英語**、日本語LP系: **日本語** |

---

## ディレクトリと担当割り当て

```
src/pages/
├── index.astro          # VPS比較トップ       → 共有（要調整）
├── providers/           # VPSプロバイダー詳細  → Codex 担当
├── compare/             # VPS比較ページ        → Codex 担当
├── by-spec/             # スペック別           → Codex 担当
├── by-region/           # リージョン別         → Codex 担当
├── blog/                # ブログ記事           → Codex 担当
├── money/               # 債務整理LP           → Claude 担当
├── shindan/             # 診断ページ           → Claude 担当
└── water-server/        # ウォーターサーバーLP → Claude 担当

data/                    # JSONデータ           → Codex 担当
scripts/                 # データ取得スクリプト → Codex 担当
public/
├── water-server/        # 水サーバーLP用静的  → Claude 担当
└── money/               # 債務整理LP用静的    → Claude 担当
src/styles/global.css    # 共通CSS             → 変更前に要相談
src/layouts/Base.astro   # 共通レイアウト      → 変更前に要相談
```

> **ルール：** 相手の担当ディレクトリは原則編集しない。
> 共有ファイル（global.css / Base.astro）を変更する場合はコミットメッセージに `[shared]` を付ける。

---

## ブランチ規約

| エージェント | ブランチ名のプレフィックス | 例 |
|---|---|---|
| Claude Code | `claude/` | `claude/water-server-comparison-lp-D0PGQ` |
| Codex | `codex/` | `codex/fix-provider-pricing-ABC` |
| 共有・人間 | `feat/` `fix/` `chore/` | `feat/add-new-provider` |

- `main` への直接 push は自動デプロイを引き起こすため、意図的な場合のみ行う。
- 互いのブランチには原則 push しない。

---

## コミットメッセージ規約

```
<type>(<scope>): <概要>

[本文（任意）]
```

| type | 用途 |
|---|---|
| `feat` | 新機能・新ページ |
| `fix` | バグ修正・データ誤り修正 |
| `chore` | ビルド・設定・依存関係 |
| `data` | データ更新（料金・スペック等） |
| `style` | CSS・デザイン調整 |

scope 例: `water-server`, `money`, `providers`, `global`

---

## 触ってはいけないファイル（要確認）

- `.github/workflows/` — CI/CD 設定。変更は人間に確認を取る。
- `public/CNAME` — カスタムドメイン設定。絶対に削除・変更しない。
- `data/site.json` — サイト全体のメタ情報。変更は影響範囲が大きい。

---

## ビルド・確認方法

```bash
# 依存インストール（初回のみ）
npm install

# ローカルプレビュー
./node_modules/.bin/astro dev
# → http://localhost:4321/

# 本番ビルド確認
./node_modules/.bin/astro build
# エラーがなければ dist/ が生成される
```

---

## 参照ファイル

- **Claude Code 向け詳細:** `CLAUDE.md`
- **Codex 向け詳細:** このファイル（AGENTS.md）に集約
- **更新日:** 2026-05-01

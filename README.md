# tekito / vpscomparehub.com

Astro-based comparison/affiliate site collection for `vpscomparehub.com`.

The repository now contains multiple案件:

- VPS/cloud hosting comparison site
- Water server comparison LP
- Debt settlement / money trouble LP and article drafts

案件ごとの目的、公開ルート、対象ASP/広告主、編集場所は **[PROJECTS.md](./PROJECTS.md)** にまとめています。

See **[SETUP.md](./SETUP.md)** for the human-side registration steps (domain, affiliate programs, secrets) needed to take it live.

## Stack

- Astro 5 static site generator
- GitHub Actions: `daily-update` (data refresh) + `weekly-articles` (Claude-drafted blog posts) + `deploy` (Pages)
- Provider data in `data/providers/*.json`; Plan / Provider types in `src/lib/types.ts`
- Affiliate referral tokens injected at build time from repo secrets (placeholder fallback in `data/affiliate.json`)

## Quick start

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # output to ./dist
npm run fetch:all    # refresh data from live APIs
```

## Repository layout

```
data/providers/   # one JSON per provider, daily refreshed
data/blog/        # markdown posts, weekly drafted by Claude
scripts/          # fetchers + article generator
src/pages/        # Astro routes
src/lib/          # data loading + affiliate token injection
.github/workflows # cron + deploy
drafts/           # Japanese article/keyword drafts, not directly published
note_articles/    # note用記事下書き
site/money-v2/    # standalone prototype LP, not the main Astro route
```

## Main案件

| 案件 | Main route / folder | Status |
|---|---|---|
| VPS比較 | `/`, `src/pages/providers`, `data/providers` | Public site core |
| ウォーターサーバー比較 | `/water-server/`, `src/pages/water-server`, `public/water-server` | Active LP / ads test target |
| 債務整理比較 | `/money/`, `/shindan/`, `src/pages/money`, `src/pages/shindan` | Existing LP / diagnostic |
| 借金・法律事務所記事案 | `drafts/`, `note_articles/` | Drafts / research assets |

For details and operating notes, start with **[PROJECTS.md](./PROJECTS.md)**.

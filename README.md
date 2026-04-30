# VPS Compare

Daily-refreshed VPS & cloud hosting comparison site. Static-only (Astro -> GitHub Pages), data refreshed from provider APIs by GitHub Actions cron, monetized via affiliate links.

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
```

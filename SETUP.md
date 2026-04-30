# SETUP

This site is a static, daily-refreshed VPS comparison site. Build is fully automated via GitHub Actions; only the human-side registration steps below need manual action.

## What is already done by automation

- Astro static site (Node 22) with provider/comparison/by-spec/by-region pages and JSON-LD structured data.
- Daily cron (`.github/workflows/daily-update.yml`, 03:17 UTC) refreshes `data/providers/*.json` from each provider's API and commits if changed.
- Build & deploy workflow (`.github/workflows/deploy.yml`) ships `dist/` to GitHub Pages on every push to `main`.
- Weekly article drafter (`.github/workflows/weekly-articles.yml`, Mondays 04:13 UTC) writes a new blog post via Claude. Disabled by default; flip the repo variable `ENABLE_BLOG_AUTOMATION=true` to enable.
- Affiliate URLs use placeholder tokens that are replaced at build time from secrets, so you never commit real referral IDs.

## Phase 1 - human setup (do this in order)

### 1. Merge & enable Pages (one-time)

1. Merge this branch (`claude/setup-monetization-automation-z4IJY`) into `main`.
2. In the repo: **Settings -> Pages -> Source: GitHub Actions**.
3. Push any commit to `main` to trigger the first deploy. The site will be live at `https://<user>.github.io/tekito/`.

### 2. Domain (~1,500 yen/year)

Recommended: Cloudflare Registrar (at-cost) or Namecheap. `.com` is fine.

After purchase:
1. In Cloudflare DNS, add `CNAME @ -> <user>.github.io` (or A records to GitHub Pages IPs for apex).
2. In the repo: **Settings -> Pages -> Custom domain**, type the domain. Wait for cert.
3. Set the repo variable `PUBLIC_SITE_URL=https://yourdomain.com` (Settings -> Secrets and variables -> Actions -> Variables -> New repository variable).

### 3. Affiliate accounts (do *after* the site has 5+ provider pages live)

The site already has 6 providers with placeholder referral tokens. Sign up for the programs below in this order (highest payout first):

| Provider | Program | Where to get the ref code | Repo secret name |
|---|---|---|---|
| Cloudways | PartnerStack `https://partners.cloudways.com/` (up to $125/sale) | Affiliate dashboard -> link generator | `PUBLIC_AFF_CLOUDWAYS` |
| DigitalOcean | `https://www.digitalocean.com/partners/affiliate` (Impact) | After Impact approval, generate `m.do.co/c/<ref>` | `PUBLIC_AFF_DIGITALOCEAN` |
| Vultr | `https://www.vultr.com/promo/affiliate/` (direct) | Affiliate dashboard | `PUBLIC_AFF_VULTR` |
| Linode (Akamai) | `https://www.linode.com/partners/` (Impact) | After approval | `PUBLIC_AFF_LINODE` |
| Hetzner | Hetzner Console -> Referral | Console -> Personal -> Referral code | `PUBLIC_AFF_HETZNER` |
| OVHcloud | `https://www.ovhcloud.com/en/partners/` (Impact) | After approval | `PUBLIC_AFF_OVH` |

For each: **Settings -> Secrets and variables -> Actions -> Secrets -> New repository secret** with the names above. Value is just the code/ID, not the full URL. The build will substitute it into every `signupUrl` automatically.

When applying, point each program at the live site URL. Most ASPs require:
- A site already live with original content
- Privacy + affiliate-disclosure pages (already created at `/privacy` and `/disclosure`)
- A real name / address / payout method (PayPal, bank, Wise)

### 4. Tax (US-program payouts) - 5 minutes

Most US affiliate programs (Impact, PartnerStack, ShareASale) request a W-8BEN form during onboarding. Fill it once per ASP. Without it 30% is withheld from your earnings. Japan/US tax treaty rate is 0% on royalties when the form is filed.

### 5. Anthropic API for the weekly article bot

1. Sign up at `console.anthropic.com`. Add 5-10 USD prepaid credit (covers months of weekly articles).
2. Create an API key.
3. Repo: **Settings -> Secrets -> Actions -> New repository secret**:
   - Name: `ANTHROPIC_API_KEY`
   - Value: your `sk-ant-...` key
4. (Optional) Variable `ANTHROPIC_MODEL` defaults to `claude-haiku-4-5-20251001`. Use `claude-sonnet-4-6` for higher quality at ~5x the cost.
5. Set the variable `ENABLE_BLOG_AUTOMATION=true` to start weekly post drafts.

### 6. Provider API tokens (optional, raises data quality)

The seed data is hand-curated and accurate as of `lastUpdated`. To get truly daily live updates from DigitalOcean and Hetzner (Vultr and Linode work without auth), create read-only tokens:

| Provider | Where | Repo secret |
|---|---|---|
| DigitalOcean | API -> Tokens -> New (read scope only) | `DO_TOKEN` |
| Hetzner Cloud | Cloud Console -> Project -> Security -> API Tokens (read) | `HETZNER_TOKEN` |

### 7. SEO / indexing - day 1

After the domain is live:
1. `https://search.google.com/search-console` -> Add property -> verify via DNS TXT (Cloudflare) -> submit `https://yourdomain.com/sitemap-index.xml`.
2. `https://www.bing.com/webmasters/` -> same.

### 8. AdSense - after ~30 articles

Skip this initially. Once `data/blog/` has 30+ posts (about 7 months of weekly automation, or generate manually), apply at `https://adsense.google.com/`. AI content is allowed but the site needs to clearly add value beyond raw data; the comparison + region + spec pages already do this.

## Local development

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # static output in ./dist
npm run fetch:all    # refresh data/providers/*.json from live APIs
```

## Cost ceiling

| Item | Annual cost |
|---|---|
| Domain (.com) | ~1,500 JPY |
| Anthropic API (weekly Haiku 4.5 articles) | ~1,000 JPY |
| GitHub Pages / Actions | 0 |
| Cloudflare DNS | 0 |
| **Total** | **~2,500 JPY** |

Well under the 10,000 JPY budget; remainder is buffer for Sonnet upgrades or paid SEO tools later.

## Adding a new provider

1. Drop a JSON file into `data/providers/<slug>.json` matching the `Provider` schema in `src/lib/types.ts`.
2. (Optional) Add a fetcher in `scripts/fetch-<slug>.ts` and register it in `scripts/fetch-all.ts`.
3. Add the affiliate token to `data/affiliate.json` and the env-var mapping.
4. Push to `main`. Provider page, all comparison pairs, by-region and by-spec are regenerated automatically.

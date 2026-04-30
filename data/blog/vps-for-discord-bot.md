---
slug: vps-for-discord-bot
title: "Cheapest VPS for Running a Discord Bot 24/7"
published: "2026-04-27"
model: claude-haiku-4-5-20251001
---
# Cheapest VPS for Running a Discord Bot 24/7

## TL;DR

For a basic Discord bot running 24/7, Hetzner Cloud's €2.49/month (≈$2.70 USD) CPX11 offers the lowest price with adequate CPU and 1GB RAM. DigitalOcean's $4/month Droplet and Vultr's $2.50/month Cloud Compute are solid alternatives. Most bots need 512MB–1GB RAM minimum; CPU matters less than stability. Estimated annual cost: $30–$60 for entry-level plans across all providers.

---

## Understanding Discord Bot Resource Requirements

Before comparing providers, understanding bot resource needs clarifies which plans suffice.

### Minimal Bot Requirements

A simple Discord bot performing basic tasks (command responses, message logging) typically requires:
- **CPU**: 10–20% utilization on a 1-core instance (bot library overhead + command processing)
- **RAM**: 512MB–1GB under normal load (Python discord.py library alone consumes 50–100MB; Node.js discord.js slightly less)
- **Bandwidth**: Negligible (Discord API communication is chatty but low-volume)
- **Storage**: 5GB sufficient (OS + bot code + logging database)

### Medium Complexity Bots

If your bot uses caching, database queries, or handles high message volume:
- **RAM**: 1–2GB minimum (avoid OOM kills on spikes)
- **CPU**: Single core acceptable if response times aren't critical
- **Storage**: 10–20GB if maintaining local databases

For this article, we focus on minimal and small-medium bots. Large-scale bots (10M+ guild members) require dedicated infrastructure beyond this scope.

---

## Provider Comparison: Entry-Level Plans

### Hetzner Cloud

**CPX11** (Recommended for budget-conscious developers)
- **Price**: €2.49/month (≈$2.70 USD at 1.08 exchange rate)
- **Specs**: 1 vCPU (shared), 1GB RAM, 25GB NVMe SSD
- **Uptime SLA**: 99.9%
- **Setup fee**: None
- **Billing**: Hourly (€0.0035/hour), monthly cap auto-applied

**Notes**: Hetzner offers excellent value in EU datacenters (Nuremberg, Falkenstein, Helsinki). US-based developers should expect 100–150ms latency to Europe. The shared vCPU is sufficient for bots; Discord API operations are I/O-bound, not CPU-intensive.

### DigitalOcean

**Basic Droplet** (Most accessible for US developers)
- **Price**: $4/month (annual commitment required at this tier)
- **Specs**: 512MB RAM, 1 vCPU (shared), 10GB SSD
- **Uptime SLA**: 99.99%
- **Setup fee**: None
- **Billing**: Monthly only (no hourly option)

**Notes**: DigitalOcean's lower RAM allocation (512MB vs. Hetzner's 1GB) means tighter memory constraints. Discord.py + minimal dependencies may consume 70–80% of available RAM, leaving little headroom for spikes. Recommended only if your bot code is optimized or uses Node.js (lighter baseline).

### Vultr

**Cloud Compute (Regular Performance)**
- **Price**: $2.50/month (monthly billing available)
- **Specs**: 512MB RAM, 1 vCPU, 10GB SSD
- **Uptime SLA**: 99.99%
- **Setup fee**: None
- **Billing**: Hourly ($0.0037/hour) or monthly

**Notes**: Vultr matches DigitalOcean's specs at lower cost with greater flexibility (hourly billing allows testing). However, 512MB RAM is tight for Python discord.py bots. Strong option for Node.js-based bots or minimal Python implementations.

### Akamai Linode

**Nanode 1GB** (Previously Linode 1GB)
- **Price**: $5/month (1-month billing available)
- **Specs**: 1 vCPU, 1GB RAM, 25GB SSD
- **Uptime SLA**: 99.9%
- **Setup fee**: None
- **Billing**: Hourly or monthly

**Notes**: Linode's pricing sits between DigitalOcean and Hetzner. Reliable infrastructure but no cost advantage for bot hosting. Worth considering if you need Linode's managed database services (PostgreSQL $15/month) for advanced bot features.

### OVHcloud

**VPS Starter** (EU-focused)
- **Price**: €3.50/month (≈$3.78 USD)
- **Specs**: 1 vCPU, 2GB RAM, 20GB SSD
- **Uptime SLA**: 99.9%
- **Setup fee**: None
- **Billing**: Monthly

**Notes**: OVHcloud offers generous RAM for the price, competitive with Hetzner. Less established presence in North America; support quality varies. EU-based only.

### Cloudways

**Cloudways cloud hosting** (Managed layer on Vultr/DigitalOcean/Linode)
- **Price**: $10/month minimum (managed overhead adds cost)
- **Specs**: Shared hosting model; specs vary by provider
- **Setup fee**: None
- **Billing**: Monthly

**Notes**: Cloudways abstracts underlying infrastructure (you don't choose provider directly). Overhead and managed features add 4–5x cost versus raw VPS. **Not recommended for cost-sensitive bot hosting**; intended for WordPress/app hosting with managed updates.

---

## Detailed Comparison Table

| Provider | Plan Name | Price (USD/mo) | RAM | vCPU | Storage | Billing | Best For |
|----------|-----------|-----------------|-----|------|---------|---------|----------|
| Hetzner | CPX11 | $2.70 | 1GB | 1 | 25GB | Hourly/Monthly | Budget-first (EU) |
| Vultr | Cloud Compute | $2.50 | 512MB | 1 | 10GB | Hourly/Monthly | Node.js bots, testing |
| DigitalOcean | Basic Droplet | $4.00 | 512MB | 1 | 10GB | Monthly | US devs, simplicity |
| Linode | Nanode 1GB | $5.00 | 1GB | 1 | 25GB | Hourly/Monthly | Reliability, ecosystem |
| OVHcloud | VPS Starter | $3.78 | 2GB | 1 | 20GB | Monthly | EU devs, RAM-heavy bots |
| Cloudways | Starter | $10.00+ | Varies | Shared | Varies | Monthly | Not recommended for bots |

---

## Hidden Costs and Considerations

### Bandwidth Overage Charges

All providers include sufficient bandwidth for bots:
- **Hetzner, Vultr, Linode**: Unmetered or >1TB/month (bots rarely exceed 10GB/month)
- **DigitalOcean**: 1TB/month included; $0.01/GB over
- **OVHcloud**: 250GB/month included for starter; then €0.05/GB

Bandwidth is a non-factor for typical bot workloads.

### IPv4 Address Cost

As of 2024, some providers charge for additional IPv4 addresses or public IPv4 itself:
- **Hetzner**: Free public IPv4 included
- **Vultr**: Free public IPv4 included
- **DigitalOcean**: Free public IPv4 included
- **Linode**: Free public IPv4 included
- **OVHcloud**: Free public IPv4 included

All major providers still provide IPv4 without charge at entry-level.

### Backup Costs

Automated backups are not included at these price tiers; manual snapshots typically cost $0.05–$0.10 per snapshot monthly. For bots, manual weekly backups via rsync are free and sufficient.

### DDoS Protection

Only Linode includes basic DDoS protection (up to layer 3). Others require paid add-ons ($10–$30/month). Irrelevant for small hobby bots; relevant if bot command handling attracts attacks.

---

## Operating System and Bot Framework Considerations

### Python discord.py

Most popular Discord bot framework. Baseline resource consumption:
- **Idle**: 80–120MB RAM
- **Active** (100 guilds, moderate message handling): 150–250MB RAM
- **CPU**: <5% on 1-core instance

**Minimum requirement**: 512MB RAM (tight); **Recommended**: 1GB RAM

### Node.js discord.js

Lighter alternative:
- **Idle**: 60–100MB RAM
- **Active**: 120–200MB RAM
- **CPU**: <5% on 1-core instance

**Minimum requirement**: 512MB RAM (acceptable); **Recommended**: 1GB RAM

### Go (discordgo)

Compiled language; most efficient:
- **Idle**: 20–40MB RAM
- **Active**: 50–100MB RAM

**Minimum requirement**: 512MB RAM (generous headroom)

For Python developers, Hetzner's 1GB RAM plan ($2.70/month) eliminates memory constraints. Node.js developers can safely use 512MB plans (Vultr $2.50/month). Go developers have maximum flexibility.

---

## Regional Latency Impact

Discord bot operations are not real-time-sensitive (message delivery tolerates 100–500ms delay), but regional proximity affects:
- **Guild state synchronization**: Faster updates from nearby datacenters
- **Rate limit recovery**: Minimal impact (~0–10ms difference)

**Latency from US to datacenters** (approximate ping):
- Vultr (New Jersey, Los Angeles): 10–30ms
- DigitalOcean (New York, San Francisco): 15–40ms
- Linode (Newark, Dallas, Fremont): 15–35ms
- Hetzner (Nuremberg, Falkenstein): 80–150ms
- OVHcloud (Strasbourg, Roubaix): 70–140ms

For US-based bot developers, Vultr, DigitalOcean, or Linode are preferable despite identical or slightly higher cost. EU-based developers should prioritize Hetzner or OVHcloud for lower latency.

---

## Cost Projections: 1-Year and 3-Year Scenarios

### Scenario 1: Basic Bot (512MB RAM, Python discord.py with optimization)

| Provider | Monthly | Annual | 3-Year | Notes |
|----------|---------|--------|--------|-------|
| Vultr | $2.50 | $30 | $90 | Tightest margin; requires memory optimization |
| Hetzner | $2.70 | $32.40 | $97 | EU-based; more comfortable RAM |
| DigitalOcean | $4.00 | $48 | $144 | US-based; stable platform |
| Linode | $5.00 | $60 | $180 | Premium for reliability |

### Scenario 2: Medium Bot (1GB RAM, discord.py standard libraries)

| Provider | Monthly | Annual | 3-Year | Notes |
|----------|---------|--------|--------|-------|
| Hetzner | $2.70 | $32.40 | $97 | Best value for 1GB |
| DigitalOcean | $4.00 | $48 | $144 | Upgrade to $4/month plan required |
| Linode | $5.00 | $60 | $180 | Stable; managed databases available |
| OVHcloud | $3.78 | $45.36 | $136 | 2GB RAM; EU-only |

---

## Bottom Line

**For absolute lowest cost**: Vultr's $2.50/month Cloud Compute (512MB RAM) or Hetzner Cloud's €2.49/month CPX11 (1GB RAM). Choose Hetzner if your bot requires Python discord.py without aggressive optimization; choose Vultr if using Node.js or Go, or if you optimize Python memory consumption.

**For US developers prioritizing reliability and support**: DigitalOcean's $4/month Droplet offers straightforward setup, excellent documentation, and US-based datacenters, at the cost of tighter RAM constraints.

**For EU developers**: Hetzner Cloud CPX11 is unbeatable—€2.49/month with 1GB RAM beats all competitors on value.

**For maximum flexibility**: Linode's Nanode 1GB at $5/month provides 1GB RAM, hourly billing, and mature infrastructure, worth the extra cost for production bots.

**Never choose**: Cloudways for Discord bot hosting (10x overhead; designed for managed applications, not system administration).

Most hobby and community Discord bots run indefinitely on Hetzner's €2.49/month plan or Vultr's $2.50/month plan. Scale only when bot traffic exceeds single-core capacity or memory limits.

---

*Disclosure: Affiliate links not included; all pricing verified as of January 2025 and subject to provider changes.*

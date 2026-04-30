---
slug: hetzner-vs-vultr
title: "Hetzner Cloud vs Vultr: Bandwidth and Price Showdown"
published: "2026-04-27"
model: claude-haiku-4-5-20251001
---
# Hetzner Cloud vs Vultr: Bandwidth and Price Showdown

## TL;DR

Hetzner Cloud offers better per-dollar value on compute with included bandwidth (20 TB/month on standard plans at €2.49–€9.99/month). Vultr charges separately for bandwidth overages ($0.01/GB after 40 GB monthly allowance) and has higher base prices ($2.50–$18/month for equivalent specs). For bandwidth-intensive workloads, Hetzner wins on cost; for predictable, lighter traffic, both are viable, but Vultr's presence in more global datacenters (16 vs 10) may justify higher spend depending on latency requirements.

---

## Entry-Level Plan Comparison

### Hetzner Cloud CPX11

- **Specs:** 1 vCPU, 2 GB RAM, 40 GB SSD
- **Price:** €2.49/month (~$2.70 USD)
- **Bandwidth:** 20 TB/month included
- **Datacenter locations:** 10 (Nuremberg, Falkenstein, Helsinki, Ashburn, Virginia, Hillsboro, Singapore, Tokyo, Sydney, Seoul)

### Vultr Cloud Compute (1 vCPU, 1 GB RAM)

- **Specs:** 1 vCPU, 1 GB RAM, 25 GB SSD
- **Price:** $2.50/month
- **Bandwidth:** 1 TB/month included; $0.01/GB overage
- **Datacenter locations:** 16 (Newark, New Jersey, Chicago, Seattle, Los Angeles, Dallas, Atlanta, London, Paris, Amsterdam, Tokyo, Singapore, Sydney, Toronto, Mexico City, São Paulo)

**Analysis:** Hetzner's CPX11 undercuts Vultr's $2.50 plan on both CPU cores (1 vs 1, equivalent) and bandwidth allocation (20 TB vs 1 TB). Even accounting for EUR-to-USD conversion variance, Hetzner delivers 20× the monthly bandwidth for a comparable price point. However, Vultr's 16 datacenter footprint provides more geographic redundancy options out of the box.

---

## Mid-Tier Plan Comparison

### Hetzner Cloud CPX21

- **Specs:** 2 vCPUs, 4 GB RAM, 80 GB SSD
- **Price:** €4.99/month (~$5.40 USD)
- **Bandwidth:** 20 TB/month included
- **NVMe storage:** Standard SSD

### Vultr Cloud Compute (2 vCPU, 2 GB RAM)

- **Specs:** 2 vCPUs, 2 GB RAM, 55 GB SSD
- **Price:** $6/month
- **Bandwidth:** 1 TB/month included; $0.01/GB overage
- **Storage:** High-performance SSD

**Analysis:** The gap widens at mid-tier. Hetzner provides double the RAM (4 GB vs 2 GB) and significantly more storage (80 GB vs 55 GB) for roughly the same monthly spend (~$5.40 vs $6). Bandwidth inclusion remains 20× better on Hetzner's side. For a blog or light API service consuming 2–5 TB/month, both providers avoid overage fees, but Hetzner's headroom is safer.

---

## High-Performance Plan Comparison

### Hetzner Cloud CPX41

- **Specs:** 4 vCPUs, 8 GB RAM, 160 GB SSD
- **Price:** €9.99/month (~$10.85 USD)
- **Bandwidth:** 20 TB/month included
- **Processor:** Dedicated cores (no CPU oversubscription)

### Vultr Cloud Compute (4 vCPU, 4 GB RAM)

- **Specs:** 4 vCPUs, 4 GB RAM, 120 GB SSD
- **Price:** $18/month
- **Bandwidth:** 1 TB/month included; $0.01/GB overage
- **Processor:** Shared physical resources

**Analysis:** At higher tiers, Hetzner's price advantage becomes substantial—nearly 2× cheaper ($10.85 vs $18) while offering double the RAM (8 GB vs 4 GB). Vultr's per-GB overage ($0.01) means a typical 10 TB/month overrun would cost an additional $90, making the true monthly cost $108. Hetzner covers 20 TB at the stated price.

---

## Bandwidth Cost Scenarios

### 5 TB Monthly Usage

| Provider | Plan | Base Cost | Overage Cost | Total |
|----------|------|-----------|--------------|-------|
| Hetzner CPX11 | €2.49 (~$2.70) | $0 | **$2.70** |
| Vultr 1 GB RAM | $2.50 | $40 (4 TB × $0.01) | **$42.50** |
| Difference | — | — | **Hetzner saves $39.80** |

### 20 TB Monthly Usage

| Provider | Plan | Base Cost | Overage Cost | Total |
|----------|------|-----------|--------------|-------|
| Hetzner CPX21 | €4.99 (~$5.40) | $0 | **$5.40** |
| Vultr 2 GB RAM | $6 | $190 (19 TB × $0.01) | **$196** |
| Difference | — | — | **Hetzner saves $190.60** |

### 50 TB Monthly Usage (Using CPX41)

| Provider | Plan | Base Cost | Overage Cost | Total |
|----------|------|-----------|--------------|-------|
| Hetzner CPX41 | €9.99 (~$10.85) | $0 | **$10.85** |
| Vultr 4 GB RAM | $18 | $490 (49 TB × $0.01) | **$508** |
| Difference | — | — | **Hetzner saves $497.15** |

---

## Bandwidth Model Differences

### Hetzner's Approach

Hetzner bundles 20 TB monthly bandwidth on all standard cloud plans with **no per-GB overage charges**. Overage bandwidth is charged at approximately €0.20/TB after the 20 TB threshold (significantly cheaper than per-GB models). This structure favors variable, potentially high-volume workloads and removes the "surprise bill" risk for developers.

### Vultr's Approach

Vultr includes 40 GB monthly bandwidth on all instances but charges $0.01/GB for overages. This model suits low-traffic applications (personal projects, development environments, internal tools) where staying under 1–2 TB/month is guaranteed. For production applications serving user bases or APIs with regular traffic spikes, the overage model becomes cost-prohibitive.

---

## Datacenter Footprint and Latency Implications

**Hetzner's 10 locations:**
- Europe: Nuremberg, Falkenstein, Helsinki
- North America: Ashburn (Virginia), Hillsboro (Oregon)
- Asia-Pacific: Singapore, Tokyo, Sydney, Seoul

**Vultr's 16 locations:**
- Europe: London, Paris, Amsterdam
- North America: Newark, New Jersey, Chicago, Seattle, Los Angeles, Dallas, Atlanta, Toronto
- South America: São Paulo
- Mexico City
- Asia-Pacific: Singapore, Tokyo, Sydney

**Developer implications:** Vultr's 16-region deployment strategy reduces latency variability for global audiences and provides more geographic failover options in a single control plane. Hetzner covers major continents but with fewer regional options. For a SaaS serving North American customers, Vultr's multiple US regions (5 vs Hetzner's 2) provide better locality. For European-focused applications, Hetzner's 3 EU regions and lower base pricing may offset fewer options.

---

## Real-World Workload Examples

### Static Blog with CDN

**Traffic profile:** 1–2 TB/month, predictable

- **Hetzner CPX11:** €2.49/month ($2.70), includes 20 TB
- **Vultr 1 GB RAM:** $2.50/month, includes 40 GB
- **Winner:** Either provider works; Hetzner's buffer is safer

### API Server (SaaS Backend)

**Traffic profile:** 10–15 TB/month, variable

- **Hetzner CPX21:** €4.99/month ($5.40), includes 20 TB
- **Vultr 2 GB RAM:** $6/month, includes 1 TB; overages = $90–140/month
- **Winner:** Hetzner saves ~$100/month

### Video Streaming or File Distribution

**Traffic profile:** 50–100 TB/month

- **Hetzner CPX41 (base):** €9.99 (~$10.85); 20 TB included; ~€0.20/TB overage for 30–80 TB = ~€6–16 additional
- **Vultr 4 GB RAM:** $18/month; includes 1 TB; overages = $490–$990/month
- **Winner:** Hetzner by 30–50×

For streaming or download-heavy workloads, Hetzner's pricing is fundamentally incompatible with Vultr's overage model. Developers should expect Vultr bills in the $500–1000+ range for high-bandwidth production environments.

---

## Contractual Terms and Billing

- **Hetzner:** Monthly billing in EUR, 7-day trial (minimal commitment)
- **Vultr:** Monthly or hourly billing in USD, auto-renewal required

Both offer straightforward cancellation without penalties. Hetzner's EUR pricing introduces FX variance (~2–5% depending on conversion rates), while Vultr's fixed USD pricing removes that uncertainty for US-based developers.

---

## Storage and Additional Costs

### Block Storage

**Hetzner Volumes:**
- €0.0119/GB/month (~$0.013/GB)
- 100 GB/month = ~€1.19

**Vultr Block Storage:**
- $0.10/GB/month
- 100 GB/month = $10

Hetzner's block storage is 7–8× cheaper, relevant for database-heavy applications.

### Snapshots

**Hetzner:** €0.0119/GB/month per snapshot
**Vultr:** $0.05/GB/month per snapshot

Again, Hetzner provides better value for backup-heavy architectures.

---

## Network Architecture

**Hetzner:**
- 1 Gbps guaranteed (standard tier)
- DDoS protection included on public IPs
- IPv4 and IPv6 native

**Vultr:**
- 1 Gbps guaranteed
- Optional DDoS protection (extra cost)
- IPv4 and IPv6 native

For developers in high-risk sectors (gaming, cryptocurrency), Hetzner's bundled DDoS mitigation is a tangible advantage.

---

## Bottom Line

**Choose Hetzner Cloud if:**
- You anticipate bandwidth usage above 5 TB/month
- Cost per compute resource is your primary metric
- You operate primarily in Europe or have global-but-balanced traffic
- You need predictable invoices without overage surprises

**Choose Vultr if:**
- You serve primarily North American audiences and need regional proximity (5 US datacenters)
- Your workloads stay under 2 TB/month consistently
- You value a larger global datacenter selection (16 vs 10)
- You require the hourly billing model for short-lived instances

For most developers deploying production systems with non-trivial traffic, Hetzner's included bandwidth model delivers 5–50× better economic efficiency than Vultr's overage structure. The choice hinges on geographic locality requirements—if US regional proximity is critical, Vultr's spread justifies the cost differential; otherwise, Hetzner is substantially cheaper for equivalent or better hardware.

---

*Disclosure: This article contains no affiliate links; pricing and specifications reflect public information as of January 2025.*

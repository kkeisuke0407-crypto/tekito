---
slug: hetzner-review-2026
title: "Hetzner Cloud Review 2026: The Best Budget VPS?"
published: "2026-05-05"
model: claude-haiku-4-5-20251001
---
# Hetzner Cloud Review 2026: The Best Budget VPS?

## TL;DR
Hetzner Cloud offers competitive entry-level pricing ($2.49/month for 1 vCPU, 2 GB RAM) and strong global data center coverage with 11 regions. For developers on tight budgets, it's a solid choice, but lacks managed database services and has a smaller US ecosystem compared to DigitalOcean. Best for self-sufficient teams comfortable with Linux administration.

## Overview

Hetzner Cloud is a Berlin-based infrastructure provider that has grown into a genuine alternative to larger cloud vendors. As of 2026, it operates 11 data center regions across Europe, Asia, and the US, serving millions of containers and VPS instances. The service targets developers and small businesses willing to trade managed services for raw price efficiency.

## Pricing and Entry-Level Plans

Hetzner Cloud's pricing structure emphasizes simplicity. The standard cloud server lineup starts at:

- **CPX11**: 1 vCPU, 2 GB RAM, 40 GB NVMe SSD – $2.49/month
- **CPX21**: 2 vCPU, 4 GB RAM, 40 GB NVMe SSD – $4.99/month
- **CPX31**: 2 vCPU, 8 GB RAM, 80 GB NVMe SSD – $9.99/month
- **CPX41**: 4 vCPU, 16 GB RAM, 160 GB NVMe SSD – $19.99/month

All instances come with 1 Gbps unmetered traffic included, meaning data transfer bandwidth is not separately billed. This is substantially cheaper than DigitalOcean's comparable droplet ($5/month for 512 MB, 1 vCPU, 20 GB SSD), though Hetzner's CPX11 technically overshoots for the absolute budget tier. Vultr's compute instances start similarly at $2.50/month but with smaller specs (512 MB RAM, 500 GB bandwidth limit).

Billing is hourly or monthly; monthly discounts apply for committed terms. There is no free tier, though Hetzner offers a €20 credit for new accounts in some regions.

## Infrastructure and Reliability

Hetzner operates its own hardware in 11 regions: Nuremberg (DE), Falkenstein (DE), Helsinki (FI), Ashburn (VA, USA), Hillsboro (OR, USA), Singapore, Tokyo, Sydney, São Paulo, Bangalore, and Montreal. This geographic spread is comparable to DigitalOcean (15 regions) but exceeds Vultr's traditional footprint and matches Akamai Linode's coverage.

Uptime SLA is 99.9% backed by service credits. Instances run on KVM hypervisors with NVMe storage across all tiers. CPU allocation is per-core, not oversubscribed to different core counts—a CPX21 runs 2 full Ampere cores.

Network performance testing by independent reviewers typically shows 500–900 Mbps sustained throughput from Hetzner data centers, with lower latency in European regions (10–25 ms intra-Europe) and higher variance from Asia-Pacific locations.

## Control Plane and Networking

Hetzner Cloud's web console is straightforward but basic. Image management, firewall rules, and snapshot creation are available. The API (fully RESTful, well-documented) is used by Terraform, Ansible, and container orchestration tools; integration quality is solid for Kubernetes-focused teams.

Key offerings:
- Floating IPs for failover scenarios ($1.50/month)
- Firewalls with 50 rules per instance included
- Custom networks (VPCs) with no per-network charge
- Snapshots ($0.50 per snapshot, per month)
- Backups (7-day rotation, $1/month per instance)

IPv6 and dual-stack deployments are standard. Load balancing (Hetzner Cloud Load Balancer) starts at $5/month for basic HTTP(S) balancing, lagging behind DigitalOcean's $12/month offering in maturity but significantly undercutting Akamai Linode's $20/month.

## Managed Services Gap

Hetzner Cloud does **not** provide managed databases, object storage, or Kubernetes control planes. Teams need hosted PostgreSQL elsewhere (OVHcloud, AWS RDS) or self-host using disk-backed instances. This is a critical weakness for developers seeking an all-in-one platform.

DigitalOcean, by contrast, bundles managed PostgreSQL ($15/month minimum), MySQL, and Redis. Cloudways abstracts this further with WordPress/Laravel-focused managed hosting on Hetzner infrastructure itself—a hybrid that some teams prefer.

## Support and Documentation

Community support via Hetzner's forum is active. Email support for paid tiers responds within 24–48 hours but lacks a paid premium-support tier. Documentation is English-translated German technical writing—accurate but sometimes terse.

This contrasts with DigitalOcean's extensive tutorial library and OVHcloud's multilingual support teams. For DIY developers, Hetzner assumes Linux CLI competence; it is not beginner-friendly.

## Developer Tooling and Integrations

Terraform, Ansible, and Pulumi modules exist and work reliably. Kubernetes distributions (kubeadm, k3s) deploy smoothly. GitHub Actions integration for CI/CD is standard via the API.

Container Registry (Hetzner Container Registry) launched in beta, offering private Docker image hosting at $0.42 per GB storage per month—undercutting AWS ECR. This is a nascent competitive edge.

## Comparison to Competitors

| Provider | Entry VPS | 2 vCPU / 4 GB RAM | Managed DB | Global Regions |
|---|---|---|---|---|
| **Hetzner Cloud** | $2.49 | $4.99 | No | 11 |
| **DigitalOcean** | $5.00 | $6.00 | Yes ($15+) | 15 |
| **Vultr** | $2.50 | $6.00 | No | 32 |
| **Akamai Linode** | $5.00 | $12.00 | Yes ($10+) | 11 |
| **OVHcloud** | $3.50 | $7.00 | Yes ($10+) | 10 |

Hetzner's strength is price-per-spec for raw compute. Its weakness is the lack of managed services and ecosystem depth.

## Bottom Line

Hetzner Cloud is the best-value pure compute VPS for developers who own infrastructure decisions. If you are comfortable with `apt update`, systemd, and SSH, the CPX11 at $2.49/month and CPX21 at $4.99/month are the lowest-friction entry points into cloud hosting. Global coverage is solid; reliability is proven.

However, if your team values managed PostgreSQL, simplified deployments, or extensive tutorials, DigitalOcean ($5+) or Cloudways (Hetzner backend, $10+) are better fits. For extreme budget consciousness with willingness to configure everything, Vultr's $2.50 plan is an alternative, though Hetzner's CPU allocation is more generous.

Choose Hetzner Cloud if: you run self-hosted databases, use Infrastructure-as-Code, and prefer cost certainty with included bandwidth. Avoid it if: you need managed services, expect 24/7 premium support, or are new to Linux system administration.

---

*Affiliate disclosure: This article may contain referral links to cloud providers.*

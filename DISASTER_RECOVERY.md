# Disaster Recovery & Business Continuity Plan
**Suvarna ERP - Enterprise Financial SaaS**

This document outlines the disaster recovery (DR) and business continuity (BC) strategies for the Suvarna ERP SaaS platform. As a financial system of record for gold loans and lending, data integrity, availability, and durability are the absolute highest priorities.

## 1. Architecture Overview
Suvarna ERP is built on:
- **Compute:** Next.js 15 (App Router) on Vercel / serverless infrastructure.
- **Database:** PostgreSQL (via Supabase) with Prisma ORM.
- **Auth:** Supabase Auth (Row Level Security enabled).
- **Blob Storage:** Vercel Blob / Supabase Storage (for KYC documents).

## 2. Data Backup Strategy

### 2.1 Database Backups (Supabase)
- **Point-in-Time Recovery (PITR):** Enabled for 7 days (Enterprise Plan allows up to 28 days).
- **Daily Logical Backups:** `pg_dump` is executed daily and stored in immutable, geo-redundant storage (e.g., AWS S3 with Object Lock or GCP Cloud Storage with Retention Policies).
- **Transaction Logs (WAL):** Archived every 1 minute to ensure near-zero Recovery Point Objective (RPO).

### 2.2 Application State
- The application is entirely stateless. Compute nodes can be recreated instantly via Vercel deployments from GitHub.

## 3. Disaster Scenarios & Playbooks

### Scenario A: Database Corruption or Accidental Data Deletion
*Trigger:* A bug, malicious actor, or accidental manual query deletes or corrupts financial ledgers.
*RTO (Recovery Time Objective):* 15-30 minutes.
*RPO (Recovery Point Objective):* < 1 minute (via PITR).

**Playbook:**
1. Halt all application traffic immediately (Enable Maintenance Mode in Vercel or Route53).
2. Use Supabase Dashboard to initiate Point-in-Time Recovery to the exact minute *before* the corruption occurred.
3. Validate database integrity using custom SQL scripts (checking `LedgerEntry` sums against `Loan.principalAmount`).
4. Restore application traffic.

### Scenario B: Regional Provider Outage (Supabase / AWS Region Down)
*Trigger:* The primary cloud region hosting the database goes completely offline.
*RTO:* 4 hours.
*RPO:* < 24 hours (based on last cross-region logical backup).

**Playbook:**
1. Provision a new Supabase project in an available fallback region (e.g., from `ap-south-1` to `ap-southeast-1`).
2. Restore the latest daily `pg_dump` backup.
3. Update Vercel environment variables (`DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) to point to the new cluster.
4. Redeploy Next.js application to flush any cached connections.
5. Notify customers of the RPO gap and initiate manual reconciliation if necessary.

### Scenario C: Vercel Outage
*Trigger:* Vercel edge network or build pipeline is down.
*RTO:* 1-2 hours.

**Playbook:**
1. Clone the GitHub repository locally.
2. Build a Docker image using the standard `Dockerfile` (requires writing a generic Next.js Dockerfile if not present).
3. Deploy the Docker image to a fallback container service (e.g., AWS AppRunner, Google Cloud Run, or Render).
4. Update DNS (Cloudflare/Route53) to point away from Vercel to the fallback load balancer.

## 4. Key Metrics & Service Level Objectives (SLOs)
- **Availability Target:** 99.99% (Maximum 52.6 minutes of downtime per year).
- **RPO (Standard Operations):** 1 minute.
- **RTO (Standard Operations):** 30 minutes.

## 5. Security & Idempotency Guarantees
In the event of a network partition or mid-flight failure, all financial mutations in Suvarna ERP use idempotency keys. 
- If a client retries a transaction after a timeout, the `idempotencyKey` prevents duplicate ledger entries.
- Soft deletes are globally enforced via Prisma middleware; data is never physically deleted, preventing accidental irreversible loss.

## 6. Incident Response Team
- **L1 Support:** Triage and verification.
- **L2 Engineering:** Database inspection and immediate hotfixes.
- **L3 Architecture (CTO):** Authorization for major failovers or PITR initiation.

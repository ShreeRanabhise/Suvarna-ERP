# Suvarna GoldLoan ERP

A multi-tenant SaaS application for managing Gold Loan shops in India.

## Setup Instructions

### 1. Prerequisites
- Node.js 18+
- PostgreSQL Database (Supabase recommended)
- Supabase Project

### 2. Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase credentials:
```bash
cp .env.example .env
```
Ensure you have set `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### 3. Database & Prisma Setup
Install dependencies and push the schema to the database:
```bash
npm install
npx prisma db push
npx prisma generate
```

Seed the database with default Super Admin and test shops:
```bash
npx tsx prisma/seed.ts
```

### 4. Supabase RLS & Storage
Run the SQL queries found in `supabase.sql` inside your Supabase project's SQL Editor. This will:
1. Enable Row Level Security (RLS) on all tables.
2. Create tenant isolation policies.
3. Create the `kyc-documents` storage bucket with correct permissions.

### 5. Run Locally
```bash
npm run dev
```
Navigate to `http://localhost:3000`.

## Deployment Guide (Vercel + Supabase)

1. **Push code to GitHub.**
2. **Import project into Vercel.**
3. **Environment Variables**: Add all variables from your `.env` file into the Vercel project settings.
4. **Build Command**: Vercel automatically detects Next.js. The `postinstall` script in `package.json` will run `prisma generate`.
5. **Cron Jobs**: Vercel will automatically read `vercel.json` and set up the daily cron job for `/api/cron/reminders`. Ensure you add `CRON_SECRET` to your environment variables to secure the endpoint.

## Architecture Highlights
- **Multi-Tenancy**: Data is isolated using `shopId` and enforced via both Prisma middleware (application level) and Supabase RLS (database level).
- **Audit Logs**: Every critical action (`CREATE_LOAN`, `RECORD_PAYMENT`) is logged with the user ID and shop ID.
- **Role-Based Access**: Supabase Auth combined with Next.js Middleware protects routes based on `SUPER_ADMIN`, `OWNER`, or `STAFF` roles.

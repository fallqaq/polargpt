# Deployment

## Recommended Topology

- Frontend + server runtime: Vercel
- Database + storage: Supabase
- Model API: Gemini

## Environment Split

- Local: `.env`
- Preview: Vercel Preview + Supabase Dev
- Production: Vercel Production + Supabase Prod

## Before You Deploy

1. Install dependencies with `npm install`.
2. Generate an admin password hash:

```bash
npm run hash:admin -- "your-admin-password"
```

3. Generate a session secret:

```bash
npm run generate:session-secret
```

4. Copy `.env.example` into `.env` and fill the values.
5. Validate your local deployment settings:

```bash
npm run preview:doctor
npm run deploy:check
```

6. Run the local release checks:

```bash
npm run preview:ready
```

If you prefer the long form, `npm run preview:ready` runs `deploy:check`, `typecheck`, `test`, and `build` in sequence and stops on the first failure.

## Vercel Setup

1. Push the repo to your Git provider.
2. Import the repo into Vercel.
3. Keep the framework preset on Nuxt.
4. Add all required environment variables for Preview and Production.
5. Confirm Vercel detects Node `24.x` from `package.json`.

### Required Vercel Environment Variables

- `ADMIN_PASSWORD_HASH`
- `SESSION_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `APP_BASE_URL`

### `APP_BASE_URL` Rules

- Local can be `http://localhost:3000`
- Preview should be the Preview deployment URL
- Production should be the final HTTPS custom domain

## Supabase Setup

1. Create a dev project and a prod project.
2. Run the SQL migration in each project.
3. Confirm the `chat-attachments` bucket exists and remains private.
4. Store `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel server environment variables only.

### Migration Options

- Dashboard-first:
  Open the SQL Editor in Supabase and run [`supabase/migrations/202603200001_polar_gpt_init.sql`](/Users/huangyiteng/Desktop/web-ai/supabase/migrations/202603200001_polar_gpt_init.sql).
- CLI-first:
  Use `npx supabase login`, `npx supabase link`, then `npx supabase db push`.

## Release Sequence

1. Merge to a feature branch and let Vercel generate a Preview deployment.
2. Run the smoke checklist in [`docs/operations.md`](/Users/huangyiteng/Desktop/web-ai/docs/operations.md).
3. Verify chat send, history search, rename, delete, and attachment download.
4. Promote the change by merging to `main`.
5. Re-run the same smoke checklist in Production.

## Domain Binding

1. Add the production domain in Vercel Project Settings -> Domains.
2. Configure DNS records exactly as Vercel shows.
3. Wait for the certificate to become active.
4. Update `APP_BASE_URL` in the Production environment to the final HTTPS domain.
5. Trigger a new Production deployment.

## Health Check

- Public health endpoint: `GET /api/health`
- Expected response shape:

```json
{
  "ok": true,
  "app": "polarGPT",
  "environment": "production",
  "timestamp": "2026-03-20T00:00:00.000Z"
}
```

Use this endpoint immediately after Preview and Production deploys to confirm the runtime is up before running manual chat smoke tests.

## Rollback

- If a deployment fails or the app is broken, use Vercel to redeploy the previous successful deployment.
- If a schema change causes the issue, restore the Supabase database from backup or apply a corrective migration; do not edit production tables manually without recording the change.
- After rollback, rerun `GET /api/health` and the smoke checklist in [`docs/operations.md`](/Users/huangyiteng/Desktop/web-ai/docs/operations.md).

## CLI Policy

- No global CLI is required.
- If CLI access is needed, use `npx vercel`, `npm exec vercel`, `npx supabase`, or `npm exec supabase`.

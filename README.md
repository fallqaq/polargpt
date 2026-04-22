# PolarGPT

PolarGPT is a multi-user AI chat console built with Nuxt 4, Supabase, and configurable Gemini/DeepSeek model providers. It delivers a focused ChatGPT-style workflow with email registration, per-user conversation history, and image/document uploads behind a server-managed session layer.

If you are new to deployment, start with the Chinese step-by-step Preview guide in [`docs/preview-onboarding.zh-CN.md`](/Users/huangyiteng/Desktop/web-ai/docs/preview-onboarding.zh-CN.md).

## Stack

- Frontend: Nuxt 4 + Vue 3
- Backend runtime: Nuxt Nitro server routes
- Database and storage: Supabase Postgres + private Storage bucket
- Model providers: DeepSeek via the OpenAI-compatible SDK and Gemini via `@google/genai`
- Package manager: `npm` only

## What ships in v1

- Email registration and sign-in with a signed cookie session
- Chat workspace with history sidebar
- Per-user conversation, message, and attachment isolation
- Conversation search across title and summary
- Rename and hard-delete conversations
- Upload support for `pdf`, `txt`, `md` on DeepSeek and `png`, `jpg`, `jpeg`, `webp`, `pdf`, `txt`, `md` on Gemini
- Server-only Supabase access with private signed attachment downloads
- Detailed project docs in [`docs/`](/Users/huangyiteng/Desktop/web-ai/docs)

## Local Setup

1. Use Node `24.x`.
2. Install dependencies:

```bash
npm install
```

3. Generate a session secret:

```bash
npm run generate:session-secret
```

4. Copy `.env.example` to `.env` and fill every required variable.
5. Validate deployment-critical settings:

```bash
npm run deploy:check
```

6. Apply the SQL migrations in [`supabase/migrations/202603200001_polar_gpt_init.sql`](/Users/huangyiteng/Desktop/web-ai/supabase/migrations/202603200001_polar_gpt_init.sql), [`supabase/migrations/202603210001_polar_gpt_conversation_search_indexes.sql`](/Users/huangyiteng/web-ai/supabase/migrations/202603210001_polar_gpt_conversation_search_indexes.sql), [`supabase/migrations/202604210001_add_attachment_extracted_text.sql`](/Users/huangyiteng/web-ai/supabase/migrations/202604210001_add_attachment_extracted_text.sql), and [`supabase/migrations/202604210002_polar_gpt_multi_user_auth.sql`](/Users/huangyiteng/web-ai/supabase/migrations/202604210002_polar_gpt_multi_user_auth.sql).
7. Start the app:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## Environment Variables

| Name | Purpose |
| --- | --- |
| `SESSION_SECRET` | HMAC secret for the signed user session cookie |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase key for DB and Storage |
| `SUPABASE_ANON_KEY` | Used by the server-side password login flow |
| `AI_PROVIDER` | Active provider, defaults to `deepseek`; set to `gemini` to restore Gemini-first behavior |
| `DEEPSEEK_API_KEY` | DeepSeek API key, required when `AI_PROVIDER=deepseek` |
| `DEEPSEEK_MODEL` | Model name, defaults to `deepseek-chat` |
| `GEMINI_API_KEY` | Gemini API key |
| `GEMINI_MODEL` | Model name, defaults to `gemini-2.5-flash` |
| `APP_BASE_URL` | Base URL for deployed environment |

## Scripts

- `npm run dev`: start the local Nuxt dev server
- `npm run build`: build a production bundle
- `npm run preview`: preview the built server locally
- `npm run preview:doctor`: inspect local blockers before GitHub/Supabase/Vercel setup
- `npm run preview:ready`: run the full local pre-release checklist in sequence
- `npm run typecheck`: run Nuxt/Vue type checking
- `npm run test`: run Vitest with coverage
- `npm run test:watch`: run Vitest in watch mode
- `npm run generate:session-secret`: generate a strong `SESSION_SECRET`
- `npm run deploy:check -- [.env-file]`: validate deployment env vars and basic formatting

## Supabase Setup

- Run the SQL migrations in order, including the multi-user auth migration [`supabase/migrations/202604210002_polar_gpt_multi_user_auth.sql`](/Users/huangyiteng/web-ai/supabase/migrations/202604210002_polar_gpt_multi_user_auth.sql).
- Confirm a private bucket named `chat-attachments` exists.
- Keep all business access on the server with the service role key.
- Keep the Supabase Email provider enabled so server-side password login can work.
- Do not expose public URLs for uploaded files; the server signs short-lived download URLs when conversation details are fetched.

## Deployment

The recommended path is Vercel for Nuxt and Supabase for data/storage.

- Preview deployments use a Supabase dev project.
- Production uses a separate Supabase prod project.
- Vercel should read Node `24.x` from `package.json`.
- If you need a CLI, use `npx vercel` or `npm exec vercel`; do not install it globally.
- Use `GET /api/health` for a lightweight post-deploy health check.

See [`docs/deployment.md`](/Users/huangyiteng/Desktop/web-ai/docs/deployment.md) for the full rollout sequence.

## Documentation Map

- Architecture: [`docs/architecture.md`](/Users/huangyiteng/Desktop/web-ai/docs/architecture.md)
- API reference: [`docs/api.md`](/Users/huangyiteng/Desktop/web-ai/docs/api.md)
- Data model: [`docs/data-model.md`](/Users/huangyiteng/Desktop/web-ai/docs/data-model.md)
- Deployment: [`docs/deployment.md`](/Users/huangyiteng/Desktop/web-ai/docs/deployment.md)
- Operations: [`docs/operations.md`](/Users/huangyiteng/Desktop/web-ai/docs/operations.md)
- Beginner Preview guide: [`docs/preview-onboarding.zh-CN.md`](/Users/huangyiteng/Desktop/web-ai/docs/preview-onboarding.zh-CN.md)

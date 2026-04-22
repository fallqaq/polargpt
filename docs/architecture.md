# Architecture

## Overview

PolarGPT is structured as a Nuxt 4 SSR app with a clear backend-for-frontend boundary:

- `app/` handles all UI, routing, and client-side orchestration.
- `server/api/auth/*` handles registration, login, and logout.
- `server/api/admin/*` exposes the authenticated chat HTTP surface.
- `server/services/*` holds the business logic for auth, conversations, attachments, and provider-specific model calls.
- `shared/*` stores contracts and utilities used by both client and server.

## Request Flow

1. A user opens `/login` and chooses either registration or sign-in with email and password.
2. `POST /api/auth/register` creates a Supabase Auth user with confirmed email, optionally claims legacy chat rows for the first registered user, and sets a signed app session cookie plus a readable client hint cookie.
3. `POST /api/auth/login` verifies the email/password pair through Supabase Auth and sets the same app session cookie.
4. Initial page protection happens in `server/middleware/page-auth.ts`.
5. API protection happens in `server/middleware/admin-auth.ts`.
6. Chat and history UI call the auth/chat APIs only; the browser never connects to Supabase directly.
7. Conversation pages now load incrementally: the shell fetches summaries first, then the latest message page for the active conversation.
8. Message submission stores attachments in Supabase Storage, prepares provider-specific attachment context, persists database rows, and finally requests the assistant answer from the active model provider.
9. Attachment download URLs are signed on demand instead of being embedded in every conversation payload.

## Data Boundaries

- Supabase service role access exists only on the server.
- Model provider API access exists only on the server.
- Storage downloads are signed on demand and short-lived.
- Shared types in `shared/types/chat.ts` define the client-facing response contracts.

## Security Notes

- The session cookie is `HttpOnly`, `SameSite=Lax`, and `Secure` in production.
- The readable hint cookie only improves client-side navigation and does not grant access.
- Business tables and storage are meant to stay behind RLS with no client policies in v1.
- Conversations, messages, and attachments are filtered by `user_id` on every server-side read/write path.

## Future Extension Path

- Add password reset and optional email verification flows.
- If needed later, replace the custom session cookie with direct browser Supabase Auth session handling.
- Introduce SSE or streaming server routes without changing the current database model.

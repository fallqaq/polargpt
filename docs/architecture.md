# Architecture

## Overview

polarGPT is structured as a Nuxt 4 SSR app with a clear backend-for-frontend boundary:

- `app/` handles all UI, routing, and client-side orchestration.
- `server/api/admin/*` exposes the admin-only HTTP surface.
- `server/services/*` holds the business logic for auth, conversations, attachments, and Gemini calls.
- `shared/*` stores contracts and utilities used by both client and server.

## Request Flow

1. The administrator opens `/login` and submits the password.
2. `POST /api/admin/session/login` verifies the bcrypt hash and sets a signed session cookie plus a readable client hint cookie.
3. Initial page protection happens in `server/middleware/page-auth.ts`.
4. API protection happens in `server/middleware/admin-auth.ts`.
5. Chat and history UI call the admin API only; the browser never connects to Supabase directly.
6. Conversation pages now load incrementally: the shell fetches summaries first, then the latest message page for the active conversation.
7. Message submission stores attachments in Supabase Storage, registers them with Gemini, persists database rows, and finally requests the assistant answer from Gemini.
8. Attachment download URLs are signed on demand instead of being embedded in every conversation payload.

## Data Boundaries

- Supabase service role access exists only on the server.
- Gemini API access exists only on the server.
- Storage downloads are signed on demand and short-lived.
- Shared types in `shared/types/chat.ts` define the client-facing response contracts.

## Security Notes

- The session cookie is `HttpOnly`, `SameSite=Lax`, and `Secure` in production.
- The readable hint cookie only improves client-side navigation and does not grant access.
- Business tables and storage are meant to stay behind RLS with no client policies in v1.
- The current model supports exactly one administrator and no multi-tenant isolation.

## Future Extension Path

- Replace the password gate with Supabase Auth later.
- Add `owner_id` to conversations, messages, and attachments when multi-user support starts.
- Introduce SSE or streaming server routes without changing the current database model.

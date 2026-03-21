# Operations

## Day-One Checks

- `npm run deploy:check`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## Local Troubleshooting

- If login fails, regenerate `ADMIN_PASSWORD_HASH` and verify `.env`.
- If conversation loading fails, check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- If message generation fails, check `GEMINI_API_KEY`, `GEMINI_MODEL`, and the server logs.
- If attachments fail, verify the private bucket exists and the upload size stays within the configured limits.

## Logging

- Application errors currently log through `server/utils/logger.ts`.
- Every request now emits a structured `request.metrics` log with `requestId`, route, stage timings, payload size, and counts.
- Hot API responses also expose `x-request-id` for log correlation.
- Use Vercel runtime logs for request failures.
- Use Supabase logs for database and storage errors.

## Health Checks

- Runtime health endpoint: `GET /api/health`
- Use it right after each Preview or Production deployment.
- A healthy deployment should return HTTP `200` with `"ok": true`.

## Smoke Test Checklist

1. Open `/api/health` and confirm the deployment is healthy.
2. Open `/login`.
3. Sign in with the admin password.
4. Create a new conversation.
5. Send a text-only message.
6. Upload an image and confirm it appears in the transcript.
7. Upload a PDF or Markdown file and confirm the request succeeds.
8. Rename the conversation.
9. Search for the conversation from the sidebar.
10. Open an attachment download link.
11. Delete the conversation and confirm it disappears from the sidebar.

## Ongoing Maintenance

- Rotate `SESSION_SECRET` and `ADMIN_PASSWORD_HASH` when admin credentials change.
- Rotate `GEMINI_API_KEY` if the provider key changes.
- Review package updates regularly, especially Nuxt, Supabase SDK, and `@google/genai`.
- If you later add formal auth, preserve the current data model and layer auth on top.

# Operations

## Day-One Checks

- `npm run deploy:check`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## Local Troubleshooting

- If login or registration fails, verify `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, and that the Supabase Email provider is enabled.
- If conversation loading fails, check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- If message generation fails, check `AI_PROVIDER`, the matching provider API key/model variables, and the server logs.
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
3. Register a new account with email and password, then confirm you land in `/chat`.
4. Sign out and sign back in with the same credentials.
5. Create a new conversation.
6. Send a text-only message.
7. If `AI_PROVIDER=gemini`, upload an image and confirm it appears in the transcript.
8. Upload a PDF or Markdown file and confirm the request succeeds.
9. Rename the conversation.
10. Search for the conversation from the sidebar.
11. Open an attachment download link.
12. Delete the conversation and confirm it disappears from the sidebar.

## Ongoing Maintenance

- Rotate `SESSION_SECRET` when cookie-signing credentials change.
- Manage user passwords and accounts through Supabase Auth if credentials change.
- Rotate the active provider API key if it changes.
- Review package updates regularly, especially Nuxt, Supabase SDK, `@google/genai`, `openai`, and `unpdf`.
- If you later add browser-native auth, preserve the current `user_id` ownership model.

# API Reference

All endpoints below are under the same Nuxt server and return JSON unless noted otherwise.

## Health

### `GET /api/health`

Public runtime health endpoint for Preview and Production checks.

Example response:

```json
{
  "ok": true,
  "app": "polarGPT",
  "environment": "production",
  "timestamp": "2026-03-20T00:00:00.000Z"
}
```

## Session

### `POST /api/admin/session/login`

Request body:

```json
{
  "password": "admin-password"
}
```

Response:

```json
{
  "ok": true
}
```

### `POST /api/admin/session/logout`

Response:

```json
{
  "ok": true
}
```

## Conversations

### `GET /api/admin/conversations?q=`

Returns the sidebar conversation list. Search only matches conversation `title` and `summary`.

### `POST /api/admin/conversations`

Creates an empty conversation with the initial title `New conversation`.

### `GET /api/admin/conversations/:id`

Returns conversation metadata, all messages, attachment metadata, and short-lived signed download URLs.

### `PATCH /api/admin/conversations/:id`

Request body:

```json
{
  "title": "New conversation title"
}
```

### `DELETE /api/admin/conversations/:id`

Hard-deletes the conversation, its messages, attachment metadata, Supabase objects, and Gemini file references.

## Messages

### `POST /api/admin/conversations/:id/messages`

Content type: `multipart/form-data`

Fields:

- `text`: optional message text
- `files[]`: zero or more attachments

Rules:

- At least one of `text` or `files[]` must be provided
- Maximum `4` attachments per message
- Images up to `10MB`
- Documents up to `20MB`

Response:

- Full `ConversationDetailResponse` for the updated conversation

## Response Contracts

See the shared source of truth in [`shared/types/chat.ts`](/Users/huangyiteng/Desktop/web-ai/shared/types/chat.ts).

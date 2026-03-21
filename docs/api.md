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

### `GET /api/admin/conversations/:id?before=&limit=`

Returns conversation metadata plus the latest page of messages. The default page size is `50`.

Attachments now include metadata only. Signed download URLs are fetched separately.

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

- Updated conversation summary
- `appendedMessages` containing only the newly created user and assistant turns

### `GET /api/admin/conversations/:id/messages?before=&limit=`

Loads older messages for an existing conversation page using the earliest loaded `message.id` as the `before` cursor.

## Attachments

### `POST /api/admin/attachments/urls`

Request body:

```json
{
  "attachmentIds": ["attachment-id-1", "attachment-id-2"]
}
```

Returns short-lived signed download URLs for the requested attachments only.

## Response Contracts

See the shared source of truth in [`shared/types/chat.ts`](/Users/huangyiteng/Desktop/web-ai/shared/types/chat.ts).

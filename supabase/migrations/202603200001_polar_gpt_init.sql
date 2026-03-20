create extension if not exists pgcrypto;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_message_at timestamptz
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null default '',
  model text,
  status text not null check (status in ('completed', 'error')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  kind text not null check (kind in ('image', 'document')),
  original_name text not null,
  mime_type text not null,
  size_bytes integer not null,
  storage_path text not null unique,
  gemini_file_name text,
  gemini_file_uri text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists conversations_last_message_at_idx
  on public.conversations (last_message_at desc nulls last);

create index if not exists messages_conversation_id_created_at_idx
  on public.messages (conversation_id, created_at asc);

create index if not exists attachments_message_id_created_at_idx
  on public.attachments (message_id, created_at asc);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.attachments enable row level security;

-- `storage.objects` is managed by Supabase. Attempting to alter ownership or
-- RLS state from the SQL editor can fail with `must be owner of table objects`.
-- This app uses a private bucket plus the server-side service role, so we keep
-- our migration away from direct `storage.objects` table alterations.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-attachments',
  'chat-attachments',
  false,
  20971520,
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/markdown',
    'text/x-markdown'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

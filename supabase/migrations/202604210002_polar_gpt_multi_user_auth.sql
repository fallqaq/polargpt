alter table public.conversations
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.messages
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.attachments
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists conversations_user_id_last_message_at_idx
  on public.conversations (user_id, last_message_at desc nulls last, updated_at desc);

create index if not exists messages_user_id_conversation_id_created_at_idx
  on public.messages (user_id, conversation_id, created_at asc);

create index if not exists attachments_user_id_message_id_created_at_idx
  on public.attachments (user_id, message_id, created_at asc);

create or replace function public.claim_legacy_chat_records(claim_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if claim_user_id is null then
    raise exception 'claim_user_id is required';
  end if;

  perform pg_advisory_xact_lock(2026042101);

  if exists (select 1 from public.conversations where user_id is not null limit 1)
    or exists (select 1 from public.messages where user_id is not null limit 1)
    or exists (select 1 from public.attachments where user_id is not null limit 1) then
    return false;
  end if;

  update public.conversations
  set user_id = claim_user_id
  where user_id is null;

  update public.messages
  set user_id = claim_user_id
  where user_id is null;

  update public.attachments
  set user_id = claim_user_id
  where user_id is null;

  return true;
end;
$$;

revoke all on function public.claim_legacy_chat_records(uuid) from public;
grant execute on function public.claim_legacy_chat_records(uuid) to service_role;

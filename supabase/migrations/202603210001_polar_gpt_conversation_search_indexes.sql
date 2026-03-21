create extension if not exists pg_trgm;

create index if not exists conversations_title_trgm_idx
  on public.conversations using gin (title gin_trgm_ops);

create index if not exists conversations_summary_trgm_idx
  on public.conversations using gin (summary gin_trgm_ops);

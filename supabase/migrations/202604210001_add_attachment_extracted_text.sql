alter table public.attachments
  add column if not exists extracted_text text;

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  source_key text not null,
  external_id text not null,
  url text,
  title text,
  author text,
  published_at timestamptz,
  meta jsonb default '{}'::jsonb,
  raw_content text,
  created_at timestamptz default now(),
  unique (source_key, external_id)
);

create table if not exists public.item_tags (
  item_id uuid references public.items(id) on delete cascade,
  tag text,
  primary key (item_id, tag)
);

alter table public.items enable row level security;
do $$ begin
  begin
    create policy "read_items_all" on public.items for select using (true);
  exception when duplicate_object then null;
  end;
end $$;

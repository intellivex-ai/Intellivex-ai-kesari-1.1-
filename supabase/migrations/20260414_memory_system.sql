-- ── Enable pgvector ────────────────────────────────────────────────────────
create extension if not exists vector;

-- ── Memories table ──────────────────────────────────────────────────────────
create table if not exists public.memories (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null,
  chat_id    uuid references public.chats(id) on delete cascade,
  content    text not null,
  embedding  vector(1536),  -- text-embedding-3-small dimension
  created_at timestamptz default now()
);

-- Index for fast cosine similarity search
create index if not exists memories_embedding_idx
  on public.memories using ivfflat (embedding vector_cosine_ops)
  with (lists = 50);

-- User index for filtering
create index if not exists memories_user_idx on public.memories (user_id);

-- ── RLS policies ─────────────────────────────────────────────────────────────
alter table public.memories enable row level security;

-- Service role bypasses RLS, so the API can insert/select freely.
-- Users can only see their own memories if queried directly.
create policy "memories_user_select" on public.memories
  for select using (user_id = auth.uid()::text);

-- ── Semantic similarity search function ──────────────────────────────────────
create or replace function match_memories(
  query_embedding  vector(1536),
  match_threshold  float,
  match_count      int,
  filter_user_id   text
)
returns table (
  id         uuid,
  content    text,
  similarity float
)
language sql stable
as $$
  select
    m.id,
    m.content,
    1 - (m.embedding <=> query_embedding) as similarity
  from public.memories m
  where
    m.user_id = filter_user_id
    and 1 - (m.embedding <=> query_embedding) > match_threshold
  order by m.embedding <=> query_embedding
  limit match_count;
$$;

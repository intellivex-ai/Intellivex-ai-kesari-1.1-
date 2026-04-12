-- ============================================================
-- Intellivex AI — Supabase Database Schema
-- Run this in your Supabase project → SQL Editor → New query
-- ============================================================

-- ── Users ─────────────────────────────────────────────────────────────────────
-- Stores Clerk user IDs (no personal data stored here)
create table if not exists public.users (
  id          text primary key,           -- Clerk user ID (user_xxx...)
  created_at  timestamptz not null default now()
);

-- ── Chats ─────────────────────────────────────────────────────────────────────
create table if not exists public.chats (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null references public.users(id) on delete cascade,
  title       text not null default 'New chat',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index for fast per-user chat listing
create index if not exists chats_user_id_idx on public.chats(user_id, updated_at desc);

-- ── Messages ──────────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  chat_id     uuid not null references public.chats(id) on delete cascade,
  role        text not null check (role in ('user', 'assistant', 'system')),
  content     text not null,
  created_at  timestamptz not null default now()
);

-- Index for fast per-chat message retrieval (ordered by time)
create index if not exists messages_chat_id_idx on public.messages(chat_id, created_at asc);

-- ── Row Level Security ────────────────────────────────────────────────────────
-- We rely on service_role key in API routes for all DB access,
-- so RLS can stay disabled for now. Enable later with Clerk JWT integration.
-- (API routes enforce ownership via user_id checks before any query)

-- Optionally enable RLS (commented out — enable manually when ready):
-- alter table public.chats enable row level security;
-- alter table public.messages enable row level security;

-- ── Helpful view: chat with message count ─────────────────────────────────────
create or replace view public.chats_with_count as
select
  c.*,
  count(m.id) as message_count
from public.chats c
left join public.messages m on m.chat_id = c.id
group by c.id;

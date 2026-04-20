-- Enable utilities
create extension if not exists pgcrypto;

-- Profiles linked to Supabase auth users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'analyst', 'admin')),
  is_verified_analyst boolean not null default false,
  invite_code_used text,
  rank text not null default 'Novice',
  xp integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analyst_invite_codes (
  code text primary key,
  is_active boolean not null default true,
  max_uses integer,
  used_count integer not null default 0,
  expires_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.economic_events (
  event_key text primary key,
  market text not null check (market in ('forex', 'crypto', 'commodities')),
  event_date timestamptz not null,
  currency text not null,
  event_title text not null,
  impact text not null check (impact in ('high', 'medium', 'low')),
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.verified_perspectives (
  id uuid primary key default gen_random_uuid(),
  event_key text not null references public.economic_events(event_key) on delete cascade,
  market text not null check (market in ('forex', 'crypto', 'commodities')),
  event_date date not null,
  currency text not null,
  event_title text not null,
  impact text not null check (impact in ('high', 'medium', 'low')),
  analyst_id uuid not null references public.profiles(id) on delete cascade,
  analyst_name text not null,
  analyst_desk text,
  bias text not null check (bias in ('bullish', 'bearish', 'neutral')),
  confidence integer not null check (confidence between 0 and 100),
  thesis text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(event_key, analyst_id)
);

create table if not exists public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category text not null default 'general',
  content text not null,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forum_threads(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academy_progress (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  xp integer not null default 0,
  completed_lessons integer not null default 0,
  streak_days integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  target_type text,
  target_id text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_verified_perspectives_event_key on public.verified_perspectives(event_key);
create index if not exists idx_verified_perspectives_updated_at on public.verified_perspectives(updated_at desc);
create index if not exists idx_forum_threads_created_at on public.forum_threads(created_at desc);
create index if not exists idx_forum_replies_thread_id on public.forum_replies(thread_id);

-- Keep timestamps fresh
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_economic_events_updated_at on public.economic_events;
create trigger trg_economic_events_updated_at before update on public.economic_events
for each row execute function public.set_updated_at();

drop trigger if exists trg_verified_perspectives_updated_at on public.verified_perspectives;
create trigger trg_verified_perspectives_updated_at before update on public.verified_perspectives
for each row execute function public.set_updated_at();

drop trigger if exists trg_forum_threads_updated_at on public.forum_threads;
create trigger trg_forum_threads_updated_at before update on public.forum_threads
for each row execute function public.set_updated_at();

drop trigger if exists trg_forum_replies_updated_at on public.forum_replies;
create trigger trg_forum_replies_updated_at before update on public.forum_replies
for each row execute function public.set_updated_at();

-- Auto-create profile for new users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row level security
alter table public.profiles enable row level security;
alter table public.analyst_invite_codes enable row level security;
alter table public.economic_events enable row level security;
alter table public.verified_perspectives enable row level security;
alter table public.forum_threads enable row level security;
alter table public.forum_replies enable row level security;
alter table public.academy_progress enable row level security;
alter table public.admin_audit_logs enable row level security;

-- Profiles
create policy "profiles_public_read" on public.profiles
for select using (true);

create policy "profiles_self_update" on public.profiles
for update using (auth.uid() = id)
with check (auth.uid() = id);

-- Invite codes
create policy "invite_codes_admin_read" on public.analyst_invite_codes
for select using (
  exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  )
);

-- Economic events
create policy "economic_events_public_read" on public.economic_events
for select using (true);

-- Perspectives
create policy "verified_perspectives_public_read" on public.verified_perspectives
for select using (true);

create policy "verified_perspectives_analyst_insert" on public.verified_perspectives
for insert with check (
  analyst_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_verified_analyst = true
  )
);

create policy "verified_perspectives_owner_update" on public.verified_perspectives
for update using (analyst_id = auth.uid())
with check (analyst_id = auth.uid());

-- Forum
create policy "forum_threads_public_read" on public.forum_threads
for select using (true);

create policy "forum_threads_owner_insert" on public.forum_threads
for insert with check (author_id = auth.uid());

create policy "forum_threads_owner_update" on public.forum_threads
for update using (author_id = auth.uid())
with check (author_id = auth.uid());

create policy "forum_replies_public_read" on public.forum_replies
for select using (true);

create policy "forum_replies_owner_insert" on public.forum_replies
for insert with check (author_id = auth.uid());

create policy "forum_replies_owner_update" on public.forum_replies
for update using (author_id = auth.uid())
with check (author_id = auth.uid());

-- Academy progress
create policy "academy_progress_self_read" on public.academy_progress
for select using (user_id = auth.uid());

create policy "academy_progress_self_insert" on public.academy_progress
for insert with check (user_id = auth.uid());

create policy "academy_progress_self_update" on public.academy_progress
for update using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Audit logs
create policy "admin_audit_logs_admin_read" on public.admin_audit_logs
for select using (
  exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "admin_audit_logs_admin_insert" on public.admin_audit_logs
for insert with check (
  exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  )
);

-- Consensus view
create or replace view public.perspective_consensus as
select
  event_key,
  count(*)::int as count,
  round(avg(confidence))::int as average_confidence,
  (
    select bias
    from (
      select bias, count(*) as c
      from public.verified_perspectives v2
      where v2.event_key = v1.event_key
      group by bias
      order by c desc, bias asc
      limit 1
    ) b
  ) as dominant_bias
from public.verified_perspectives v1
group by event_key;

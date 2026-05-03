-- Admin notifications
create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  audience text not null check (audience in ('all', 'analysts', 'admins')),
  type text not null check (type in ('info', 'warning', 'critical')),
  sent_by uuid references public.profiles(id),
  sent_at timestamptz not null default now()
);

-- Forum complaints
create table if not exists public.forum_complaints (
  id uuid primary key default gen_random_uuid(),
  reported_user_id uuid not null references public.profiles(id) on delete cascade,
  reported_by_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  summary text not null,
  detail text not null,
  severity text not null check (severity in ('low', 'medium', 'high')),
  status text not null default 'open' check (status in ('open', 'under_review', 'resolved', 'dismissed')),
  thread_id uuid references public.forum_threads(id) on delete set null,
  thread_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Invite redemptions for analytics
create table if not exists public.invite_redemptions (
  id uuid primary key default gen_random_uuid(),
  code text not null references public.analyst_invite_codes(code) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  invite_type text not null check (invite_type in ('analyst', 'admin')),
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_notifications_sent_at on public.admin_notifications(sent_at desc);
create index if not exists idx_forum_complaints_created_at on public.forum_complaints(created_at desc);
create index if not exists idx_forum_complaints_status on public.forum_complaints(status);
create index if not exists idx_invite_redemptions_created_at on public.invite_redemptions(created_at desc);

alter table public.admin_notifications enable row level security;
alter table public.forum_complaints enable row level security;
alter table public.invite_redemptions enable row level security;

-- Admin notifications policies
create policy "admin_notifications_admin_read"
  on public.admin_notifications
  for select
  using (
    exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "admin_notifications_admin_insert"
  on public.admin_notifications
  for insert
  with check (
    exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Forum complaints policies
create policy "forum_complaints_admin_read"
  on public.forum_complaints
  for select
  using (
    exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "forum_complaints_admin_update"
  on public.forum_complaints
  for update
  using (
    exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "forum_complaints_user_insert"
  on public.forum_complaints
  for insert
  with check (
    reported_by_id = auth.uid()
  );

-- Invite redemptions policies
create policy "invite_redemptions_admin_read"
  on public.invite_redemptions
  for select
  using (
    exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "invite_redemptions_user_insert"
  on public.invite_redemptions
  for insert
  with check (
    user_id = auth.uid()
  );

-- Updated-at trigger
drop trigger if exists trg_forum_complaints_updated_at on public.forum_complaints;
create trigger trg_forum_complaints_updated_at before update on public.forum_complaints
for each row execute function public.set_updated_at();

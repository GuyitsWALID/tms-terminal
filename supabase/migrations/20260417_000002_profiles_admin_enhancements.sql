alter table public.profiles
  add column if not exists bio text,
  add column if not exists timezone text,
  add column if not exists specialization text,
  add column if not exists favorite_market text check (favorite_market in ('forex', 'crypto', 'commodities')),
  add column if not exists is_active boolean not null default true;

-- Admin-only profile updates for team management
create policy "profiles_admin_update"
on public.profiles
for update
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

-- Admin read for full user/team management view
create policy "profiles_admin_read"
on public.profiles
for select
using (
  auth.uid() = id
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

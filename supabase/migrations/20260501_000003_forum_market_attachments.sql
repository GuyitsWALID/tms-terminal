alter table public.forum_threads
  add column if not exists market text not null default 'forex' check (market in ('forex', 'crypto', 'stocks')),
  add column if not exists image_url text;

alter table public.forum_replies
  add column if not exists image_url text;

update public.forum_threads set market = 'forex' where market is null;

create index if not exists idx_forum_threads_market on public.forum_threads(market);

-- Storage bucket for forum attachments
insert into storage.buckets (id, name, public)
values ('forum-media', 'forum-media', true)
on conflict (id) do nothing;

-- Storage policies
create policy "forum_media_read" on storage.objects
for select
using (bucket_id = 'forum-media');

create policy "forum_media_insert" on storage.objects
for insert
with check (bucket_id = 'forum-media' and auth.role() = 'authenticated');

-- Update forum thread insert policy to verified analysts/admins only
drop policy if exists "forum_threads_owner_insert" on public.forum_threads;

create policy "forum_threads_va_insert" on public.forum_threads
for insert
with check (
  author_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (p.is_verified_analyst = true or p.role = 'admin')
  )
);

-- Replies: any authenticated user can reply (author_id must match)
drop policy if exists "forum_replies_owner_insert" on public.forum_replies;

create policy "forum_replies_user_insert" on public.forum_replies
for insert
with check (author_id = auth.uid());

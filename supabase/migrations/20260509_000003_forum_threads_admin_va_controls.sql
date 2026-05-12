alter table public.forum_threads
  add column if not exists is_archived boolean not null default false;

create index if not exists idx_forum_threads_is_archived on public.forum_threads(is_archived);

drop policy if exists "forum_complaints_va_read_own_threads" on public.forum_complaints;
create policy "forum_complaints_va_read_own_threads"
on public.forum_complaints
for select
using (
  exists (
    select 1
    from public.forum_threads t
    join public.profiles p on p.id = auth.uid()
    where t.id = forum_complaints.thread_id
      and t.author_id = auth.uid()
      and (p.is_verified_analyst = true or p.role = 'analyst' or p.role = 'admin')
  )
);

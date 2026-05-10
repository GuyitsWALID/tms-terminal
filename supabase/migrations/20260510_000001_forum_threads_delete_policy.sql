drop policy if exists "forum_threads_owner_delete" on public.forum_threads;
create policy "forum_threads_owner_delete"
on public.forum_threads
for delete
using (
  author_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

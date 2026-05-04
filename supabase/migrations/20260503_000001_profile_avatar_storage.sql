insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_read" on storage.objects
for select
using (bucket_id = 'avatars');

create policy "avatars_insert" on storage.objects
for insert
with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "avatars_update" on storage.objects
for update
using (bucket_id = 'avatars' and auth.role() = 'authenticated')
with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

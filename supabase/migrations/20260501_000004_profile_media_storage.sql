insert into storage.buckets (id, name, public)
values ('profile-media', 'profile-media', true)
on conflict (id) do nothing;

create policy "profile_media_read" on storage.objects
for select
using (bucket_id = 'profile-media');

create policy "profile_media_insert" on storage.objects
for insert
with check (bucket_id = 'profile-media' and auth.role() = 'authenticated');

create policy "profile_media_update" on storage.objects
for update
using (bucket_id = 'profile-media' and auth.role() = 'authenticated')
with check (bucket_id = 'profile-media' and auth.role() = 'authenticated');

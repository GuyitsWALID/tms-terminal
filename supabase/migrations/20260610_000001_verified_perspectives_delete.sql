create policy "verified_perspectives_owner_delete" on public.verified_perspectives
for delete using (
  analyst_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_verified_analyst = true
  )
);

create policy "economic_events_analyst_insert" on public.economic_events
for insert
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (p.is_verified_analyst = true or p.role = 'admin')
  )
);

create policy "economic_events_analyst_update" on public.economic_events
for update
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (p.is_verified_analyst = true or p.role = 'admin')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (p.is_verified_analyst = true or p.role = 'admin')
  )
);

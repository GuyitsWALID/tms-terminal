alter table public.analyst_invite_codes
add column if not exists invite_type text not null default 'analyst';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'analyst_invite_codes_invite_type_check'
  ) then
    alter table public.analyst_invite_codes
    add constraint analyst_invite_codes_invite_type_check
    check (invite_type in ('analyst', 'admin'));
  end if;
end
$$;

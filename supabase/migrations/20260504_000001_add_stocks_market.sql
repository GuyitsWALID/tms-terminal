alter table public.economic_events
  drop constraint if exists economic_events_market_check;

alter table public.economic_events
  add constraint economic_events_market_check
  check (market in ('forex', 'crypto', 'commodities', 'stocks'));

alter table public.verified_perspectives
  drop constraint if exists verified_perspectives_market_check;

alter table public.verified_perspectives
  add constraint verified_perspectives_market_check
  check (market in ('forex', 'crypto', 'commodities', 'stocks'));

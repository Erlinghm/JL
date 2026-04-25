create or replace function public.sync_listing_auction_statuses()
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  changed_count integer := 0;
  step_count integer := 0;
begin
  update public."Listing"
  set
    "status" = 'ENDED'::public."ListingStatus",
    "updatedAt" = now()
  where
    "status" in (
      'PUBLISHED'::public."ListingStatus",
      'UPCOMING'::public."ListingStatus",
      'ACTIVE'::public."ListingStatus"
    )
    and "auctionEndAt" <= now();

  get diagnostics step_count = row_count;
  changed_count := changed_count + step_count;

  update public."Listing"
  set
    "status" = 'ACTIVE'::public."ListingStatus",
    "updatedAt" = now()
  where
    "status" in (
      'PUBLISHED'::public."ListingStatus",
      'UPCOMING'::public."ListingStatus"
    )
    and "auctionStartAt" <= now()
    and "auctionEndAt" > now();

  get diagnostics step_count = row_count;
  changed_count := changed_count + step_count;

  update public."Listing"
  set
    "status" = 'UPCOMING'::public."ListingStatus",
    "updatedAt" = now()
  where
    "status" in (
      'PUBLISHED'::public."ListingStatus",
      'ACTIVE'::public."ListingStatus"
    )
    and "auctionStartAt" > now();

  get diagnostics step_count = row_count;
  changed_count := changed_count + step_count;

  return changed_count;
end;
$$;

select public.sync_listing_auction_statuses();

do $$
begin
  create extension if not exists pg_cron;
exception
  when insufficient_privilege or undefined_file then
    raise notice 'pg_cron could not be enabled automatically; enable Supabase Cron and schedule public.sync_listing_auction_statuses manually.';
end
$$;

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'cron') then
    perform cron.unschedule(jobid)
    from cron.job
    where jobname = 'sync-listing-auction-statuses';

    perform cron.schedule(
      'sync-listing-auction-statuses',
      '* * * * *',
      'select public.sync_listing_auction_statuses();'
    );
  end if;
end
$$;

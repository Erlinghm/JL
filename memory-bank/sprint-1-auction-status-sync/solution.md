# Solution: Derive, sync, and enforce auction status

Treat the auction time window as the source of truth for active bidding, and
use stored status as synchronized state rather than the only authority.

## Implementation

The fix has three layers:

- `models/Farm.js` derives an effective listing status from `auctionStartAt`,
  `auctionEndAt`, and closed terminal statuses.
- `models/Farm.js` runs `syncAuctionStatuses()` before listing reads and inside
  the bid transaction so stale rows are corrected opportunistically.
- `routes/farms.js` rejects bid POSTs unless the rendered farm status is
  `aktiv`, and `updateBid()` rejects expired listings inside the transaction.

## Database automation

The migration creates `public.sync_listing_auction_statuses()`. The function
updates schedulable listings as follows:

- Past `auctionEndAt` becomes `ENDED`.
- Current auction windows become `ACTIVE`.
- Future auction windows become `UPCOMING`.

The Supabase migration also schedules the function through Supabase Cron with
the job name `sync-listing-auction-statuses` and the schedule `* * * * *`.
This gives minute-level automatic status updates in the live database.

## UI behavior

The auction list uses the effective status returned by `models/Farm.js`.
Expired listings render as `avsluttet`, and the card date label changes from
`Avsluttes` to `Avsluttet`.

The auction detail page already hides the bid form unless `farm.status` is
`aktiv`. Because the adapter now derives stale active rows as `avsluttet`, the
detail page no longer exposes bidding for ended auctions.

## Verification

Run the test suite after changes:

```bash
npm test
```

The database migration was applied against the configured Supabase database.
The verification query called `public.sync_listing_auction_statuses()` and
confirmed the cron job exists, is active, and uses the expected schedule.

## Cautions

- Keep Prisma and Supabase migration trees aligned for future database changes.
- Do not rely only on UI checks for bid eligibility. Keep the transactional
  guard in `updateBid()` so direct POST requests cannot bypass the rule.
- If Supabase Cron is unavailable in a future environment, the application
  still derives effective status and opportunistically syncs rows on reads and
  bids.

# Problem: Ended auctions can still behave as active

Auctions can remain visibly active after their configured end time if the
persisted listing status is stale.

## Context

The auction UI reads listing data through `models/Farm.js`, which adapts the
normalized Prisma `Listing` model into the legacy auction-shaped view model.
Before this fix, the adapter trusted the stored `Listing.status` value when it
returned `farm.status` to routes and EJS templates.

## Symptoms

- `/auksjoner` can show a listing as `aktiv` even when `auctionEndAt` is in the
  past.
- The auction detail page can render the bid form for an expired listing.
- A direct `POST /auksjoner/:id/bid` request can submit a bid unless the server
  checks the effective auction window.
- Supabase does not automatically change `Listing.status` from `ACTIVE` to
  `ENDED` unless the application or database has explicit synchronization
  logic.

## Root cause

`Listing.status` is a stored state, but auction availability also depends on
time. If no process updates the stored status exactly when `auctionEndAt`
passes, the database row can become stale.

## Source files

- `models/Farm.js`
- `routes/farms.js`
- `views/auctions.ejs`
- `prisma/migrations/20260424120000_sync_auction_status_cron/migration.sql`
- `supabase/migrations/20260424120000_sync_auction_status_cron.sql`

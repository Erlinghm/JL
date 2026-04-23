# Solution: Update `models/Farm.js` before changing route/view contracts

Keep `models/Farm.js` as the compatibility layer between normalized database
records and legacy auction UI expectations.

## Implementation rule

If a Prisma schema or query changes, update `models/Farm.js` first so routes and
templates continue to receive the expected legacy shape.

## Shadow user behavior

Admin and seed flows can create listings or bids without a real authenticated
user. In those cases, `models/Farm.js` creates shadow users with
`@jordleie.invalid` emails on purpose.

## What not to do

- Do not bypass `models/Farm.js` for route/view work unless every consumer is
  migrated away from the legacy shape.
- Do not teach EJS templates directly about normalized Prisma internals as a
  partial migration.
- Do not remove the shadow-user pattern without replacing the admin and seed
  behavior that depends on it.

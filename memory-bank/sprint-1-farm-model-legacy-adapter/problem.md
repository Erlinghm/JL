# Problem: Normalized Prisma data must still feed the old auction UI

The Prisma schema models a broader, normalized marketplace, but the current
routes and EJS templates still expect an older auction-shaped farm view model.

## Context

`models/Farm.js` is intentionally an adapter layer. It maps normalized Prisma
records into fields that existing routes and templates already consume.

## Symptoms

- Templates expect fields such as `fylke`, `currentBid`, `fieldPolygon`, and
  `soilComposition`.
- Routes still work with auction-oriented concepts.
- The Prisma schema contains marketplace models that are not fully wired into
  the route layer yet.

## Source documents

- `CLAUDE.md`
- `graphify-out/GRAPH_REPORT.md`

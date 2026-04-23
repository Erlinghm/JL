# Problem: Broad repo walks waste time and can miss architecture relationships

The repository has Graphify artifacts that summarize code relationships.
Ignoring them can cause agents to rediscover known structure slowly or follow
stale assumptions.

## Context

`graphify-out/GRAPH_REPORT.md` records core abstractions, communities,
hyperedges, surprising connections, and knowledge gaps for this repository as
of April 21, 2026.

## Useful findings

- Auth, app construction, farm model adaptation, and Railway deployment are
  central concepts.
- `models/Farm.js` and `lib/auth.js` have non-obvious relationships to seed,
  shadow users, and test doubles.
- The Railway setup docs are semantically related and cover the same handoff.

## Source documents

- `CLAUDE.md`
- `graphify-out/GRAPH_REPORT.md`

# Problem: Move the app to Supabase PostgreSQL

The project needed to run against Supabase PostgreSQL instead of relying on the
old SQLite-oriented database path. Railway production also needed the same
database behavior as local development.

## Context

Jordleie.no is an Express 4 and EJS app backed by Prisma. The source Markdown
describes a completed migration where the app, seed flow, and Prisma schema
were changed to use PostgreSQL.

## Symptoms

- Production could not be treated as ready until the app used PostgreSQL.
- Data access needed async Prisma patterns instead of older local database
  assumptions.
- Seed data had to be inserted into Supabase PostgreSQL and visible in the UI.

## Source documents

- `DEV_CHECKLIST.md`
- `HANDOFF_SUMMARY.md`
- `RAILWAY_SUPABASE_HANDOFF.md`
- `CLAUDE.md`

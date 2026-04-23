# Problem: Schema changes can drift between migration systems

The project has both Prisma migrations and Supabase SQL migrations. Updating
only one tree can leave local, CI, and Supabase workflows out of sync.

## Context

The source notes say the Supabase migrations mirror the Prisma migration
history for schema and auth changes.

## Risk

If only one migration tree changes:

- Prisma-generated clients can disagree with the live database.
- Supabase workflows can miss schema or auth trigger changes.
- Future agents can diagnose the wrong schema state.

## Source documents

- `CLAUDE.md`

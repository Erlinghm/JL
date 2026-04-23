# Solution: Keep Prisma and Supabase migrations aligned

When schema or auth SQL changes, update both migration paths as part of the
same task.

## Required practice

- Put Prisma migration changes under `prisma/migrations/`.
- Mirror required SQL changes under `supabase/migrations/`.
- Regenerate Prisma Client when schema changes require it.
- Verify against the actual database before relying on generated assumptions.

## Commands

Use the existing scripts instead of inventing new workflows:

```bash
npm run db:generate
npm run db:migrate
npm run build
```

`npm run build` runs `prisma generate && prisma migrate deploy`, so it touches
the configured database. Use it only when the target database is intentional.

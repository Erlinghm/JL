# Problem: Railway production needed the Supabase database connection

The production Railway service needed environment variables that pointed the
Express app at Supabase PostgreSQL.

## Context

The source handoff documents describe Railway as waiting on deployment
configuration after the code and database migration work was completed.

## Symptoms

- Railway production could deploy without being connected to the database.
- The production auction pages could be blank or fail if `DATABASE_URL` was
  missing or incorrect.
- The Railway team needed a short, repeatable setup path.

## Source documents

- `QUICK_RAILWAY_SETUP.md`
- `RAILWAY_SETUP.md`
- `RAILWAY_SUPABASE_HANDOFF.md`
- `HANDOFF_SUMMARY.md`

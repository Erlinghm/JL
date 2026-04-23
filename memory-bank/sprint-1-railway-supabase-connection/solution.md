# Solution: Configure Railway environment variables

The handoff solution is to configure the Railway service with the database and
runtime variables, then let Railway redeploy the app.

## Required variables

Set these in Railway under the service settings:

```text
DATABASE_URL=<redacted Supabase PostgreSQL session-pooler URL>
PORT=3000
NODE_ENV=production
```

The source docs used a Supabase Session Pooler endpoint for IPv4 compatibility.
Do not copy raw credentials into new docs or code.

## Verification

After Railway redeploys, check:

- The deployment has a successful status in Railway.
- Logs include the app startup message.
- The production home page loads.
- `/auksjoner` shows the farm list.
- `/auksjoner/1` shows an individual farm page.
- `/auksjoner?fylke=Østfold` filters by region.

## Success criteria

Production is connected when the app loads without database errors and the
auction pages display seeded farm data.

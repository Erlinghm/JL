# Problem: Railway deployment can fail in predictable ways

The Railway handoff docs record several likely production failure modes after
adding environment variables.

## Common failures

- The app cannot reach the database server.
- Railway logs report module installation or missing module errors.
- The app appears to load but shows no farm data.
- Port-related errors appear during deployment.

## Source documents

- `QUICK_RAILWAY_SETUP.md`
- `RAILWAY_SETUP.md`
- `RAILWAY_SUPABASE_HANDOFF.md`
- `HANDOFF_SUMMARY.md`

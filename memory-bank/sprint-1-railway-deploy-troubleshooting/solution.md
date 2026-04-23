# Solution: Use the Railway failure checklist

Start with Railway logs, then narrow the issue by failure type.

## Database connection failures

- Verify `DATABASE_URL` exists in Railway variables.
- Confirm the value points to the intended Supabase project.
- Confirm the Supabase project is running.
- Test the connection with `psql` only when you have the real secret URL from a
  safe source.

## Missing module failures

- Confirm `package-lock.json` is committed.
- Check that `npm install` ran during the Railway build.
- Review Railway build logs for dependency installation errors.

## Port failures

- Keep `PORT=3000` in Railway variables.
- Do not hard-code assumptions beyond the environment variable path already used
  by the app.

## No data in production

- Confirm production points to the same intended Supabase database.
- Verify the farm data exists in Supabase.
- Check Railway logs for SQL or Prisma errors.

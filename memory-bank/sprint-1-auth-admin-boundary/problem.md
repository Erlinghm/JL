# Problem: Auth and admin access are easy to misunderstand

The project uses Supabase Auth for authentication, but local database state is
authoritative for admin access. Mixing these concepts can accidentally grant or
remove admin permissions.

## Context

The app uses cookie-based Supabase auth through `lib/auth.js`. The source notes
explicitly warn against returning to session-based auth or granting admin access
from Supabase metadata.

## Risky assumptions

- Assuming `req.session` is the active auth path.
- Assuming `User.role === ADMIN` grants app admin access.
- Assuming Supabase `user_metadata` grants app admin access.
- Overwriting local `User.isAdmin` during auth synchronization.

## Source documents

- `CLAUDE.md`
- `graphify-out/GRAPH_REPORT.md`

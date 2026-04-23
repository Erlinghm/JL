# Solution: Keep authentication and authorization separated

Use Supabase for login state, and use local `User.isAdmin` for app-level admin
authorization.

## Rules to preserve

- Use `lib/auth.js` as the auth boundary.
- Read and refresh `jl-access-token` and `jl-refresh-token` cookies.
- Use `auth.requireAuth`, `auth.requireAdmin`, and `auth.safeRedirect`.
- Keep local users synchronized from Supabase auth users.
- Preserve existing local `User.isAdmin` values during synchronization.

## What not to do

- Do not reintroduce `req.session` auth.
- Do not grant admin access from `User.role`.
- Do not grant admin access from Supabase `user_metadata`.
- Do not bypass the auth helper functions with ad hoc route checks.

## Verification

When changing auth code, test both ordinary user paths and admin routes. Admin
routes must only allow users whose local `User.isAdmin` value is `true`.

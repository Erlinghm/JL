# CLAUDE.md

This file provides guidance to Claude Code when working with code in this
repository.

## Critical context

This repo is a server-rendered Node.js app, not a monorepo and not a frontend
build pipeline. Prefer reading the source over the `README.md`; the README is
currently just a placeholder.

- Always use Graphify first for repository orientation when `graphify-out/`
  exists. Start with `graphify-out/GRAPH_REPORT.md`, use
  `graphify-out/graph.html` for interactive exploration, and treat
  `graphify-out/graph.json` as the raw graph artifact.
- Use Graphify to map modules, communities, hubs, and surprising connections
  before doing broad repo walks. Verify any Graphify inference against the
  actual source before making code changes.
- If Graphify output predates structural cleanup, rerun it before trusting
  legacy nodes or stale edges.
- Always use Context7 first for library, framework, API, and MCP-related
  documentation when that tool is available in the session.
- Project-configured MCP servers:
  - `supabase` via `.mcp.json`:
    `https://mcp.supabase.com/mcp?project_ref=hznuymitdvsviftpcwos`
- `.claude/settings.local.json` enables all project MCP servers, explicitly
  enables `supabase`, and pre-approves `mcp__supabase__list_tables`,
  `mcp__supabase__execute_sql`, and `mcp__supabase__get_logs`.

## Project overview

Jordleie.no is an Express 4 + EJS marketplace for renting farmland in Norway.
The current UI surface covers landing/static pages, Supabase-backed auth,
profile editing, create-listing UI, public auctions, farm detail pages,
bidding, admin CRUD, and contact submissions.

- Runtime stack: Node.js, Express, EJS, vanilla JS, Leaflet, Prisma,
  PostgreSQL, Supabase Auth.
- Module system: CommonJS only.
- Data model status: the Prisma schema already models a broader marketplace
  than the current UI exposes. `Conversation`, `Message`, `Lease`,
  `UserVerification`, and related enums exist in the schema but are not yet
  wired into the route layer.
- Non-obvious architecture: `models/Farm.js` is an adapter layer that maps the
  normalized Prisma schema back into the older auction-shaped view model that
  routes and EJS templates still expect.
- Non-obvious auth decision: admin access comes from local `User.isAdmin`,
  not from `User.role === ADMIN`, not from Supabase `user_metadata`, and not
  from the current session alone.
- Non-obvious data behavior: when admin or seed flows create listings or bids
  without a real authenticated user ID, `models/Farm.js` creates shadow users
  with `@jordleie.invalid` emails on purpose.

## Architecture map

These files are the real entry points and boundaries that matter.

- `app.js`: composition root. Builds the Express app via `createApp()` and
  starts the HTTP server via `startServer()`.
- `routes/index.js`: landing/static pages, contact form, login/signup/logout,
  email confirmation, profile editing, and the create-listing page shell.
- `routes/farms.js`: public auction list/detail routes, listing creation, and
  bid submission.
- `routes/admin.js`: admin login, dashboard, and CRUD for listings.
- `lib/auth.js`: Supabase SSR-style auth wrapper. Reads and refreshes
  `jl-access-token` and `jl-refresh-token` cookies, syncs the local `User`
  row, and exposes `requireAuth`, `requireAdmin`, and `safeRedirect`.
- `models/Farm.js`: Prisma-backed listing model. Converts normalized records
  into the legacy UI shape with fields like `fylke`, `currentBid`,
  `fieldPolygon`, and `soilComposition`.
- `prisma/schema.prisma`: main schema definition. `prisma/client.js` is the
  runtime Prisma singleton.
- `prisma/migrations/*`: Prisma migration history used by `prisma migrate`.
- `supabase/migrations/*.sql`: mirrored SQL migrations for Supabase workflows.
  These currently track the same schema/auth changes as the Prisma migrations.
- `views/`: EJS templates. User-facing copy and routes are primarily
  Norwegian.
- `public/js/main.js`: all client-side behavior: Leaflet maps, polygon draw,
  countdown timers, address geocoding, filter auto-submit, tab switching, and
  nav highlighting.
- `test/`: Node built-in test runner suite. Tests rely on dependency injection
  through `createApp`, `createIndexRouter`, `createFarmRouter`,
  `createAdminRouter`, and `createAuth`.
- `docs/database-schema.drawio`: database diagram source.

## Auth and database notes

The auth/database boundary is easy to misunderstand, so keep these rules in
mind when changing it.

- Supabase Auth is configured in `lib/auth.js`; runtime auth is cookie-based
  and there is no session middleware path in active use.
- Local users are synchronized from `auth.users` through the
  `sync_supabase_auth_user()` trigger in the migration history.
- The current migration set enables RLS on `User` and `UserProfile`.
- The latest `sync_supabase_auth_user()` definition preserves existing local
  `User.isAdmin` instead of overwriting it from Supabase metadata.
- `lib/auth.js` still accepts fallback env names such as
  `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_ANON_KEY`, and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Common commands

Use the existing npm scripts rather than guessing.

- `npm run dev`: start the development server with `nodemon`.
- `npm start`: start the app with `node app.js`.
- `npm test`: run the Node built-in test suite.
- `npm run test:coverage`: run tests with experimental coverage output.
- `npm run build`: run `prisma generate && prisma migrate deploy`. This
  touches the database and is not a frontend asset build.
- `npm run seed`: destructive demo reseed. Clears marketplace tables and
  contact submissions, then inserts sample data.
- `npm run db:generate`: regenerate Prisma client.
- `npm run db:migrate`: run `prisma migrate dev`.
- `npm run db:studio`: open Prisma Studio.

## Environment and deployment

The app depends on database and Supabase configuration even though the repo
does not provide a full setup guide in the README.

- Required database env: `DATABASE_URL`.
- Prisma schema also expects `DIRECT_URL`.
- Supabase auth env: `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`.
- Email confirmation URLs use `APP_URL` or `SITE_URL` when present.
- Runtime env: `PORT`, `NODE_ENV`.
- `.env` is gitignored.
- Railway handoff docs in the repo root are operational notes only. They
  contain live-looking connection strings; treat them as sensitive and do not
  copy them into code, tests, or new docs.

## Code conventions

Follow the existing patterns instead of introducing new abstractions.

- Keep CommonJS (`require`, `module.exports`); do not introduce TypeScript or
  ESM incrementally.
- Prefer factory functions with injected dependencies for new app code. The
  repo already uses this pattern for app/router/auth construction to keep
  tests cheap.
- Preserve the legacy auction view contract at the route/view boundary. If you
  change Prisma schema access, update `models/Farm.js` first rather than
  teaching templates about normalized internals.
- Keep user-facing routes, labels, and messages in Norwegian. Internal code is
  mostly English.
- Use `auth.requireAuth`, `auth.requireAdmin`, and `auth.safeRedirect` instead
  of ad hoc auth checks.
- Preserve email normalization to lowercase and trimmed values.
- Keep frontend work in EJS, `public/css/*.css`, and `public/js/main.js`.
  There is no React/Vite/Next layer here.
- Tests use `node:test` and `node:assert/strict`, not Jest or Vitest.

## What to avoid

These are the sharp edges and stale paths in the repo.

- Do not reintroduce `req.session`-based auth. Legacy session patterns are not
  part of the active auth flow.
- Do not use `User.role` or Supabase `user_metadata` to grant admin access.
  Only `User.isAdmin === true` is authoritative in app logic.
- Do not bypass `models/Farm.js` for route/view work unless you are also
  migrating every consumer away from the legacy farm/listing shape.
- Do not edit only one migration tree. If schema/auth SQL changes, keep
  `prisma/migrations` and `supabase/migrations` aligned.
- Do not run `npm run seed` against any shared or production database.
- Do not reintroduce the old raw SQLite path. The app uses Prisma +
  PostgreSQL through `prisma/client.js`.

## Token-saving context

These facts save a full repo walk on most tasks.

- Repository graph artifacts live in `graphify-out/`.
- Main server entry point: `app.js`.
- Main DB schema: `prisma/schema.prisma`.
- Auth implementation: `lib/auth.js`.
- Public auction pages live under `/auksjoner`.
- Profile page is `/min-bruker`; create-listing page shell is `/lag-annonse`.
- Listing creation form posts directly to `POST /auksjoner`; there is no
  separate JSON API layer.
- Admin area lives under `/admin`.
- Cookie names for auth: `jl-access-token` and `jl-refresh-token`.
- `views/partials/head.ejs` loads Google Instrument Sans, Leaflet, and
  Leaflet.draw globally.
- `public/js/main.js` calls external geocoding through Nominatim on address
  blur for the listing form map.
- Launch configs exist in `.claude/launch.json` for `npm run dev` and
  `npm start`.
